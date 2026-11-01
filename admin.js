let editingData = null;
const $ = (s) =>
    document.querySelector(s),
  form = $('#post-form'),
  dialog = $('#editor');
let posts = [],
  canEdit = false,
  editing = null,
  media = [],
  pending = [],
  busy = false;
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const trialLabels = {
  goal: 'Цель проверки',
  conditions: 'Условия и методика',
  reading: 'Показание / результат',
  reference: 'Контроль и расхождение',
  conclusion: 'Вывод и ограничения',
  next: 'Следующий шаг',
};
const kindLabel = (kind) => ({
  news: 'Новость',
  trial: 'Материал проекта',
  'trial-plan': 'Материал проекта',
}[kind] || 'Новость');
function appendTrial(node, post) {
  if (!post.trial || post.kind === 'news')
    return;
  const list = el('dl', null, 'trial-summary');
  for (const [key, label] of
    Object.entries(trialLabels)) {
    if (!post.trial[key]) continue;
    list.append(el('dt', label),
      el('dd', post.trial[key]));
  }
  node.append(list);
}
async function api(url, options) {
  const r = await fetch(url, options);
  const data = await r.json();
  if (!r.ok)
    throw Error(
      data.error ||
        'Не удалось выполнить зап' +
          'рос',
    );
  return data;
}
function render() {
  const feed = $('#feed');
  feed.replaceChildren();
  $('#count').textContent = posts.length
    ? String(posts.length).padStart(
        2,
        '0',
      )
    : '';
  if (!posts.length) {
    const empty = el('div', null, 'empty');
    empty.append(el('h2', 'Публикаций пока нет'),
      el('p', canEdit ? 'Создайте первую новость кнопкой «Добавить новость».'
        : 'Новые публикации команды появятся здесь.'));
    feed.append(empty);
    return;
  }
  for (const post of posts) {
    const n = el(
        'article',
        null,
        'news-card',
      ),
      time = el(
        'time',
        (post.status === 'draft'
          ? 'Черновик от ' : 'Опубликовано: ')
          + new Date(
          post.date,
        ).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Yekaterinburg',
        }),
      );
    time.dateTime = post.date;
    const metadata = el('div', null, 'post-meta');
    metadata.append(
      el('span', kindLabel(post.kind)
        + (post.status === 'draft'
          ? ' · Только администратору'
          : ' · Опубликовано'),
        'post-status-badge'),
      time,
    );
    n.append(metadata,
      el('h2', post.title || 'Без заголовка'),
      el('p', post.body, 'post-body'),
    );
    appendTrial(n, post);
    const gallery = el(
      'div',
      null,
      'post-media',
    );
    for (const m of post.media) {
      const asset = el(
        m.type === 'video'
          ? 'video'
          : 'img',
      );
      asset.src =
        '/api.php?action=media&id=' + m.id;
      if (m.type === 'video') {
        asset.controls = true;
        asset.preload = 'metadata';
        asset.playsInline = true;
        asset.setAttribute(
          'aria-label',
          m.name,
        );
      } else {
        asset.alt = m.name;
        asset.loading = 'lazy';
      }
      gallery.append(asset);
    }
    n.append(gallery);
    if (canEdit) {
      const actions = el(
          'div',
          null,
          'post-actions',
        ),
        edit = el(
          'button',
          'Редактировать',
          'secondary',
        ),
        del = el(
          'button',
          'Удалить',
          'secondary',
        );
      edit.onclick = () =>
        openEditor(post);
      del.onclick = async () => {
        if (
          !confirm(
            'Удалить новость «' +
              post.title +
              '»?',
          )
        )
          return;
        del.disabled = true;
        try {
          await api(
            '/api.php?action=news&id=' + post.id,
            { method: 'DELETE' },
          );
          await load();
        } catch (e) {
          $('#message').textContent =
            e.message;
          del.disabled = false;
        }
      };
      actions.append(edit, del);
      n.append(actions);
    }
    feed.append(n);
  }
}
async function load() {
  try {
    const d = await api(
      '/api.php?action=news&scope=admin');
    posts = d.posts;
    canEdit = d.canEdit;
    if (!canEdit) {
      window.location.replace(
        '/admin/login.php',
      );
      return;
    }
    $('#new-post').hidden = !canEdit;
    $('#message').textContent = '';
    render();
  } catch (e) {
    $('#message').replaceChildren(
      document.createTextNode(
        'Не удалось загрузить нов' +
          'ости. ',
      ),
    );
    const retry = el(
      'button',
      'Повторить',
      'secondary',
    );
    retry.onclick = load;
    $('#message').append(retry);
  }
}
function attachments() {
  const list = $('#attachments');
  list.replaceChildren();
  [
    ...media.map((m, i) => ({
      name: m.name,
      remove: () => media.splice(i, 1),
    })),
    ...pending.map((f, i) => ({
      name: f.name,
      remove: () => pending.splice(i, 1),
    })),
  ].forEach((m) => {
    const row = el(
        'div',
        null,
        'attachment',
      ),
      remove = el(
        'button',
        'Убрать',
        'secondary',
      );
    remove.type = 'button';
    remove.onclick = () => {
      if (busy) return;
      m.remove();
      attachments();
    };
    row.append(
      el('span', m.name),
      remove,
    );
    list.append(row);
  });
}
function openEditor(post) {
  editingData = post || null;
  editing = post?.id || null;
  form.reset();
  media = post
    ? post.media.map((m) => ({ ...m }))
    : [];
  pending = [];
  form.elements.title.value =
    post?.title || '';
  form.elements.body.value =
    post?.body || '';
  $('#post-status').textContent =
    post?.status === 'published'
      || (post && !post.status)
      ? 'Опубликовано. Сохранение черновиком '
        + 'снимет запись с публичного сайта.'
      : 'Черновик виден только администратору.';
  $('#editor-title').textContent = post
    ? 'Редактировать новость'
    : 'Новая публикация';
  $('#save').textContent =
    post?.status === 'published'
      || (post && !post.status)
      ? 'Сохранить публикацию'
      : 'Опубликовать ↗';
  $('#form-message').textContent = '';
  attachments();
  dialog.showModal();
}
form.noValidate = true;
$('#new-post').onclick = () =>
  openEditor();
const close = () => {
  if (!busy) dialog.close();
};
$('#close-editor').onclick = close;
$('#cancel').onclick = close;
dialog.addEventListener('cancel', (e) => {
  if (busy) e.preventDefault();
});
$('#files').onchange = () => {
  const files = Array.from(
    $('#files').files,
  );
  $('#files').value = '';
  const valid = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  if (
    files.length +
      pending.length +
      media.length >
    6
  ) {
    $('#form-message').textContent =
      'Можно прикрепить до 6 фа' +
      'йлов.';
    return;
  }
  if (
    files.some(
      (f) =>
        !valid.includes(f.type) ||
        !f.size ||
        f.size >
          (f.type.startsWith('image/')
            ? 10
            : 50) *
            1024 *
            1024,
    )
  ) {
    $('#form-message').textContent =
      'Проверьте форматы и разм' +
      'еры файлов: фото до 10 М' +
      'Б, видео до 50 МБ.';
    return;
  }
  pending.push(...files);
  $('#form-message').textContent = '';
  attachments();
};
async function savePost(status) {
  if (busy) return;
  if (status === 'published') {
    if (!form.reportValidity()) return;
  }
  busy = true;
  form
    .querySelectorAll(
      'button,input,textarea,select',
    )
    .forEach((n) => (n.disabled = true));
  try {
    while (pending.length) {
      const file = pending[0];
      $('#form-message').textContent =
        'Загружаем: ' + file.name;
      const m = await api(
        '/api.php?action=uploads',
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        },
      );
      media.push({
        ...m,
        name: file.name.slice(0, 250),
      });
      pending.shift();
    }
    $('#form-message').textContent =
      status === 'draft'
        ? 'Сохраняем черновик…'
        : 'Сохраняем публикацию…';
    await api('/api.php?action=news', {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        id: editing,
        title: form.elements.title.value,
        body: form.elements.body.value,
        status,
        kind: editingData?.kind || 'news',
        trial: editingData?.trial || {},
        media,
      }),
    });
    dialog.close();
    await load();
  } catch (e) {
    $('#form-message').textContent =
      e.message +
      ('. Можно повторить сохран' +
        'ение.');
    attachments();
  } finally {
    busy = false;
    form
      .querySelectorAll(
        'button,input,textarea,select',
      )
      .forEach(
        (n) => (n.disabled = false),
      );
  }
}
form.onsubmit = (e) => {
  e.preventDefault();
  savePost('published');
};
$('#save-draft').onclick = () =>
  savePost('draft');
load();
