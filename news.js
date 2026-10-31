const $ = (s) =>
  document.querySelector(s);
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
function renderFilters() {
  const nav = el('nav', null, 'news-filters');
  nav.setAttribute('aria-label', 'Новости и путь проекта');
  for (const [label, href] of [
    ['Новости', '/news.html'],
    ['Выполнено', '/roadmap.html?state=done'],
    ['В разработке', '/roadmap.html?state=development'],
  ]) {
    const link = el('a', label, 'secondary');
    link.href = href;
    if (href === '/news.html') link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
  $('#feed').before(nav);
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
    const n = el('div', null, 'empty');
    n.append(
      el(
        'p',
        'ДНЕВНИК ПРОЕКТА',
        'eyebrow',
      ),
      el(
        'h2',
        'Здесь начинается новая и' +
          'стория.',
      ),
      el(
        'p',
        canEdit
          ? 'Добавьте первую новость ' +
              '— расскажите об обновлен' +
              'ии, покажите фото или ви' +
              'део.'
          : 'Здесь появятся новости и' +
              ' материалы о развитии пр' +
              'оекта.',
      ),
    );
    feed.append(n);
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
        'Опубликовано: ' + new Date(
          post.date,
        ).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Yekaterinburg',
        }),
      );
    n.id = 'post-' + post.id;
    time.dateTime = post.date;
    n.append(
      el('span', kindLabel(post.kind),
        'post-status-badge'),
      time,
      el('h2', post.title),
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
    feed.append(n);
  }
}
async function load() {
  try {
    const d = await api('/api.php?action=news');
    posts = d.posts;
    canEdit = false;
    $('#message').textContent = '';
    render();
    const id = location.hash.slice(1);
    document.getElementById(id)?.scrollIntoView();
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
$('.menu-toggle').onclick = () => {
  const open =
    $('#nav').classList.toggle('open');
  $('.menu-toggle').setAttribute(
    'aria-expanded',
    String(open),
  );
};
renderFilters();
load();
