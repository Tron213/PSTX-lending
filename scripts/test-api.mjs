import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from
  'node:timers/promises';

// All PHP files and records are copied into
// a disposable fixture. Production .pastukh
// is never opened or copied by this test.
const root = fileURLToPath(
  new URL('../', import.meta.url));
const phpArg = process.argv.indexOf('--php');
const php = phpArg >= 0
  ? process.argv[phpArg + 1]
  : process.env.PHP_BINARY || 'php';
if (!php) throw Error('Pass --php <binary>');
const tmpRoot = path.resolve(os.tmpdir());
const fixture = await fs.mkdtemp(
  path.join(tmpRoot, 'pastukh-api-test-'));
let server;
let startupError;
let serverLog = '';
let cookie = '';
let checks = 0;

function check(ok, name) {
  assert.ok(ok, name);
  checks++;
  console.log('PASS ' + name);
}

async function copyPhp(folder) {
  const source = path.join(root, folder);
  for (const item of await fs.readdir(
    source, { withFileTypes: true })) {
    const relative = path.join(folder,
      item.name);
    if (item.isDirectory()) {
      await copyPhp(relative);
    } else if (item.name.endsWith('.php')) {
      const target = path.join(fixture,
        relative);
      await fs.mkdir(path.dirname(target),
        { recursive: true });
      await fs.copyFile(path.join(root,
        relative), target);
    }
  }
}

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve, reject) => {
    listener.close(error => error
      ? reject(error) : resolve());
  });
  return port;
}

try {
  await fs.copyFile(path.join(root, 'api.php'),
    path.join(fixture, 'api.php'));
  await copyPhp('private');
  await copyPhp('admin');
  const router = path.join(fixture,
    'preview-router.php');
  await fs.copyFile(path.join(root,
    'scripts/preview-router.php'), router);
  const sessions = path.join(fixture,
    'sessions');
  await fs.mkdir(sessions);
  const port = await freePort();
  const origin = 'http://127.0.0.1:' + port;
  server = spawn(php, [
    '-d', 'session.save_path=' + sessions,
    '-d', 'display_errors=0',
    '-S', '127.0.0.1:' + port,
    '-t', fixture,
    router,
  ], { windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'] });
  server.once('error', error => {
    startupError = error;
  });
  const recordLog = chunk => {
    serverLog = (serverLog + chunk.toString())
      .slice(-12000);
  };
  server.stdout.on('data', recordLog);
  server.stderr.on('data', recordLog);

  async function request(action, options = {}) {
    const headers = { ...options.headers };
    if (options.admin && cookie) {
      headers.Cookie = cookie;
    }
    if (options.origin !== false) {
      headers.Origin = origin;
    }
    let body = options.raw;
    if (options.data !== undefined) {
      headers['Content-Type'] =
        'application/json';
      body = JSON.stringify(options.data);
    }
    const response = await fetch(origin
      + '/api.php?action=' + action, {
      method: options.method || 'GET',
      headers, body,
      signal: AbortSignal.timeout(10000),
    });
    if (options.admin) {
      const updated = response.headers
        .getSetCookie?.() || [];
      for (const value of updated) {
        if (value.startsWith(
          'pastukh_session=')) {
          cookie = value.split(';')[0];
        }
      }
    }
    const bytes = Buffer.from(
      await response.arrayBuffer());
    const text = bytes.toString('utf8');
    let data;
    if (response.headers.get('content-type')
      ?.includes('application/json')) {
      data = JSON.parse(text);
    }
    return { status: response.status,
      headers: response.headers, bytes,
      text, data };
  }

  let ready = false;
  for (let attempt = 0; attempt < 60;
    attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) {
      throw Error('PHP exited before startup');
    }
    try {
      const result = await request('news');
      ready = result.status === 200;
      if (ready) break;
    } catch {}
    await delay(100);
  }
  check(ready, 'Isolated PHP API starts');
  const store = path.join(fixture, '.pastukh');
  await fs.writeFile(path.join(store,
    'private-marker.txt'), 'PRIVATE-MARKER');
  const hiddenFile = await fetch(origin
    + '/.pastukh/private-marker.txt');
  check(hiddenFile.status === 404,
    'Preview router hides private storage');
  const privateFile = await fetch(origin
    + '/private/project.php');
  check(privateFile.status === 404,
    'Preview router blocks private source paths');
  const prefix = '<?php exit; ?>\n';
  const setupFile = await fs.readFile(
    path.join(store, 'setup-key.php'), 'utf8');
  const token = JSON.parse(setupFile.slice(
    prefix.length)).token;
  const account = await request('setup', {
    method: 'POST', admin: true, data: {
      token, username: 'api_test',
      password: randomUUID() + randomUUID(),
    },
  });
  check(account.status === 200 && cookie,
    'Fixture administrator signs in');
  const adminPage = await fetch(origin
    + '/admin/index.php', {
    headers: { Cookie: cookie },
  });
  const adminHtml = await adminPage.text();
  check(adminPage.status === 200
    && !adminHtml.includes('id="project-editor"')
    && !adminHtml.includes('id="herd"')
    && !adminHtml.includes('admin-herd.js')
    && adminHtml.includes('id="save-draft"'),
  'News workspace is separate from project planning');
  const pathPage = await fetch(origin
    + '/admin/roadmap.php', { headers: { Cookie: cookie } });
  const pathHtml = await pathPage.text();
  check(pathPage.status === 200
    && pathHtml.includes('id="roadmap-editor"')
    && !pathHtml.includes('id="post-form"')
    && !pathHtml.includes('src="/admin.js'),
  'Roadmap has its own admin page without news editor');
  const contentPage = await fetch(origin
    + '/admin/content.php', { headers: { Cookie: cookie } });
  check(contentPage.status === 200
    && (await contentPage.text()).includes('id="project-editor"'),
  'Existing editorial content remains editable separately');
  const guestPage = await fetch(origin
    + '/admin/index.php', { redirect: 'manual' });
  check(guestPage.status === 303
    && guestPage.headers.get('location')
      === '/admin/login.php',
  'Guest cannot load admin workspace HTML');

  for (const action of [
    'news&scope=admin',
    'project&scope=admin',
    'roadmap&scope=admin',
  ]) {
    check((await request(action)).status
      === 401, 'Guest blocked: ' + action);
  }
  const emptyProject = await request('project');
  check(emptyProject.data.blocks.length === 0,
    'Empty draft sections stay private');
  const sections = (await request(
    'project&scope=admin', { admin: true }))
    .data.blocks;
  check(sections.length === 8,
    'Administrator receives eight templates');

  const blank = { title: '', body: '',
    media: [], status: 'draft', kind: 'news' };
  check((await request('news', {
    method: 'POST', admin: true,
    origin: false, data: blank,
  })).status === 403,
  'News mutation requires matching Origin');
  check((await request('project', {
    method: 'PUT', admin: true,
    origin: false, data: { blocks: sections },
  })).status === 403,
  'Project mutation requires matching Origin');

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1'
    + 'HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkA'
    + 'AAAASUVORK5CYII=', 'base64');
  const upload = await request('uploads', {
    method: 'POST', admin: true, raw: png,
    headers: { 'Content-Type': 'image/png' },
  });
  check(upload.status === 200 && upload.data.id,
    'Administrator uploads test attachment');
  const media = [{ ...upload.data,
    name: 'Isolated test image' }];
  const news = { title: 'Private sentinel',
    body: 'DRAFT_ONLY_SENTINEL',
    media, status: 'draft', kind: 'news' };
  const saved = await request('news', {
    method: 'POST', admin: true, data: news,
  });
  check(saved.status === 200,
    'Draft with attachment is saved');
  const postId = saved.data.post.id;
  news.id = postId;
  const mediaAction = 'media&id=' + upload.data.id;
  check(!(await request('news')).text.includes(
    'DRAFT_ONLY_SENTINEL'),
  'Guest listing excludes draft content');
  check((await request('news&id=' + postId))
    .status === 404,
  'Guest cannot retrieve draft by ID');
  check((await request(mediaAction)).status
    === 404, 'Draft attachment is private');
  check((await request(mediaAction,
    { admin: true })).bytes.equals(png),
  'Administrator previews draft attachment');
  const savedBlank = await request('news', {
    method: 'POST', admin: true, data: blank,
  });
  check(savedBlank.status === 200,
    'Completely empty draft is allowed');
  check((await request('news', {
    method: 'POST', admin: true,
    data: { ...blank, status: 'published' },
  })).status === 400,
  'Empty publication is rejected');
  news.status = 'published';
  check((await request('news', {
    method: 'POST', admin: true, data: news,
  })).status === 200,
  'Filled news can be published');
  check((await request('news')).text.includes(
    'DRAFT_ONLY_SENTINEL'),
  'Published news appears to guest');
  check((await request(mediaAction)).bytes
    .equals(png), 'Published attachment is public');
  news.status = 'draft';
  await request('news', { method: 'POST',
    admin: true, data: news });
  check((await request(mediaAction)).status
    === 404, 'Unpublishing hides attachment');

  const oldId = randomUUID();
  await fs.writeFile(path.join(store,
    'posts', oldId + '.php'), prefix
      + JSON.stringify({ id: oldId,
        title: 'Legacy news', body: 'Legacy body',
        date: '2026-01-01T12:00:00Z', media: [] }));
  check((await request('news')).data.posts
    .some(post => post.id === oldId),
  'Legacy news without status remains public');
  const trial = { title: 'Trial record',
    body: 'Observed conditions are documented.',
    media: [], kind: 'trial', status: 'published',
    trial: { goal: 'Check repeatability',
      conditions: 'Test fixture' } };
  check((await request('news', { method: 'POST',
    admin: true, data: trial })).status === 400,
  'Trial result requires observations and conclusion');
  trial.kind = 'trial-plan';
  trial.trial.next = 'Collect control measurements';
  const plan = await request('news', {
    method: 'POST', admin: true, data: trial });
  check(plan.status === 200
    && plan.data.post.trial.reading === '',
  'Trial plan publishes without invented results');

  const draftSections = structuredClone(sections);
  draftSections[1].body =
    'PRIVATE_TEAM_SENTINEL '.repeat(3);
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: draftSections },
  })).status === 200,
  'Unfinished project section saves privately');
  check(!(await request('project')).text
    .includes('PRIVATE_TEAM_SENTINEL'),
  'Guest response excludes private project text');
  const unsafe = structuredClone(draftSections);
  unsafe[1].links = [{ label: 'Unsafe',
    url: 'javascript:alert(1)' }];
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: unsafe },
  })).status === 400,
  'Unsafe section URL is rejected');
  const projectUpload = await request('uploads', {
    method: 'POST', admin: true, raw: png,
    headers: { 'Content-Type': 'image/png' },
  });
  check(projectUpload.status === 200,
    'Project attachment uploads independently');
  const projectMediaAction = 'media&id='
    + projectUpload.data.id;
  draftSections[1].media = [{
    ...projectUpload.data,
    name: 'Private project image',
  }];
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: draftSections },
  })).status === 200,
  'Draft project section keeps attachment');
  check((await request(projectMediaAction))
    .status === 404,
  'Guest cannot fetch draft project attachment');
  check((await request(projectMediaAction,
    { admin: true })).bytes.equals(png),
  'Administrator previews project attachment');
  check(!(await request('project')).text.includes(
    projectUpload.data.id),
  'Guest project response hides draft media ID');
  const fakeMedia = structuredClone(draftSections);
  fakeMedia[1].media[0].id = randomUUID();
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: fakeMedia },
  })).status === 400,
  'Project rejects nonexistent media reference');
  const repeated = structuredClone(draftSections);
  repeated[1].media.push(repeated[1].media[0]);
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: repeated },
  })).status === 400,
  'Project rejects duplicate media reference');
  const unsafeNewsLink = structuredClone(
    draftSections);
  unsafeNewsLink[1].links = [{ label: 'Unsafe',
    url: '/news.html?kind=trial&redirect=evil' }];
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: unsafeNewsLink },
  })).status === 400,
  'Project rejects arbitrary local URL query');
  draftSections[1].links = [{ label: 'Plan',
    url: '/news.html?kind=trial-plan#post-'
      + postId }];
  draftSections[1].status = 'published';
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: draftSections },
  })).status === 200,
  'Project permits trial link with post anchor');
  check((await request('project')).data.blocks
    .some(block => block.id === 'team'),
  'Published project section is visible');
  check((await request(projectMediaAction)).bytes
    .equals(png),
  'Published project media is public without news');
  check((await request('project')).data.blocks
    .find(block => block.id === 'team').media[0]
    .id === projectUpload.data.id,
  'Published section contains media descriptor');
  draftSections[1].status = 'draft';
  await request('project', { method: 'PUT',
    admin: true, data: { blocks: draftSections } });
  check(!(await request('project')).text
    .includes('PRIVATE_TEAM_SENTINEL'),
  'Unpublishing removes project text from API');
  check((await request(projectMediaAction))
    .status === 404,
  'Unpublishing project hides its attachment');
  const legacySections = structuredClone(
    draftSections);
  for (const block of legacySections) {
    delete block.media;
  }
  await fs.writeFile(path.join(store,
    'project-content.php'), prefix
      + JSON.stringify({ blocks: legacySections }));
  const legacyProject = await request(
    'project&scope=admin', { admin: true });
  check(legacyProject.status === 200
    && legacyProject.data.blocks.every(block =>
      Array.isArray(block.media)
      && block.media.length === 0),
  'Legacy project blocks default to empty media');
  check((await request('project', {
    method: 'PUT', admin: true,
    data: { blocks: legacySections },
  })).status === 200,
  'Legacy request without media still saves');

  const legacyHerd = path.join(store,
    'herd.php');
  const legacyRecord = prefix + JSON.stringify({
    animals: [{ tag: 'OLD_PRIVATE_RECORD' }],
  });
  await fs.writeFile(legacyHerd, legacyRecord);
  for (const admin of [false, true]) {
    for (const action of ['herd', 'herd-export']) {
      const response = await request(action,
        { admin });
      check(response.status === 404
        && !response.text.includes(
          'OLD_PRIVATE_RECORD'),
      'No animal API: ' + action
        + (admin ? ' (admin)' : ' (guest)'));
    }
    const response = await request('herd', {
      method: 'POST', admin,
      data: { operation: 'animal',
        tag: 'SHOULD_NOT_BE_SAVED' },
    });
    check(response.status === 404,
      'Removed animal API accepts no writes'
        + (admin ? ' (admin)' : ' (guest)'));
  }
  check(await fs.readFile(legacyHerd, 'utf8')
    === legacyRecord,
  'Existing private animal data stays untouched');
  const initialPath = await request('roadmap&scope=admin', { admin: true });
  check(initialPath.data.stages.length === 8
    && initialPath.data.stages.every(s => s.state === 'idea'
      && !s.visible && s.description.length > 100),
  'Roadmap begins with detailed private ideas, not invented progress');
  check((await request('roadmap')).data.stages.length === 0,
    'Unconfirmed ideas stay private');
  const pathData = structuredClone(initialPath.data);
  pathData.stages[0].description = 'PRIVATE_PATH_SENTINEL';
  check((await request('roadmap', { method: 'PUT', data: pathData }))
    .status === 401, 'Guest cannot change roadmap');
  check((await request('roadmap', { method: 'PUT', admin: true,
    origin: false, data: pathData })).status === 403,
  'Roadmap changes require matching Origin');
  let pathSaved = await request('roadmap', { method: 'PUT',
    admin: true, data: pathData });
  check(pathSaved.status === 200
    && !(await request('roadmap')).text.includes('PRIVATE_PATH_SENTINEL'),
  'Hidden idea descriptions are excluded server-side');
  check((await request('roadmap', { method: 'PUT', admin: true,
    data: pathData })).status === 409,
  'Outdated editor cannot overwrite newer roadmap');
  pathData.revision = pathSaved.data.revision;
  pathData.stages[1].state = 'done';
  check((await request('roadmap', { method: 'PUT', admin: true,
    data: pathData })).status === 400,
  'Completed stage requires an actual result');
  pathData.stages[1].result = 'Confirmed result of this isolated test';
  pathData.stages[1].visible = true;
  pathData.stages[2].state = 'development';
  pathData.stages[2].visible = true;
  pathData.stages.reverse();
  pathSaved = await request('roadmap', { method: 'PUT', admin: true,
    data: pathData });
  const publicPath = (await request('roadmap')).data.stages;
  check(pathSaved.status === 200 && publicPath.length === 2
    && publicPath[0].state === 'development'
    && publicPath[1].state === 'done',
  'Public project path follows admin order and visibility');
  check((await request('roadmap&state=done')).data.stages.length === 1
    && (await request('roadmap&state=development')).data.stages.length === 1,
  'Done and development filters use real stage states');
  pathData.revision = pathSaved.data.revision;
  pathData.stages.forEach(s => { s.visible = false; });
  await request('roadmap', { method: 'PUT', admin: true, data: pathData });
  check((await request('roadmap')).data.stages.length === 0,
    'Unpublishing stages removes them from public path');
  console.log(checks + ' API checks passed.');
} catch (error) {
  console.error(error.message);
  if (serverLog.includes('PHP Fatal error')) {
    console.error('PHP fatal error in fixture.');
  }
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise(resolve => {
      server.once('exit', resolve);
    });
    server.kill();
    await Promise.race([stopped, delay(3000)]);
  }
  const resolved = path.resolve(fixture);
  const relative = path.relative(tmpRoot,
    resolved);
  if (relative && !relative.startsWith('..')
    && !path.isAbsolute(relative)
    && path.basename(resolved).startsWith(
      'pastukh-api-test-')) {
    await fs.rm(resolved,
      { recursive: true, force: true });
  } else {
    throw Error('Refusing unsafe fixture cleanup');
  }
}
