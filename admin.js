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
        new Date(
          post.date,
        ).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      );
    time.dateTime = post.date;
    n.append(
      time,
      el('h2', post.title),
      el('p', post.body, 'post-body'),
    );
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
    const d = await api('/api.php?action=news');
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
  $('#editor-title').textContent = post
    ? 'Редактировать новость'
    : 'Новая публикация';
  $('#save').textContent = post
    ? 'Сохранить изменения'
    : 'Опубликовать ↗';
  $('#form-message').textContent = '';
  attachments();
  dialog.showModal();
}
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
form.onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  busy = true;
  form
    .querySelectorAll(
      'button,input,textarea',
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
      'Сохраняем публикацию…';
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
        'button,input,textarea',
      )
      .forEach(
        (n) => (n.disabled = false),
      );
  }
};
load();
const settings = document.querySelector(
    '#settings',
  ),
  settingsForm = document.querySelector(
    '#settings-form',
  ),
  settingsMessage =
    document.querySelector(
      '#settings-message',
    );
let changingCredentials = false;
document.querySelector(
  '#settings-button',
).onclick = async () => {
  settingsForm.reset();
  settingsMessage.textContent =
    'Загружаем настройки…';
  settings.showModal();
  try {
    const data = await api(
      '/api.php?action=credentials',
    );
    settingsForm.elements.username.value =
      data.username;
    settingsMessage.textContent = '';
  } catch (e) {
    settingsMessage.textContent =
      e.message;
  }
};
document.querySelector(
  '#close-settings',
).onclick = () => {
  if (!changingCredentials)
    settings.close();
};
settings.addEventListener(
  'cancel',
  (e) => {
    if (changingCredentials)
      e.preventDefault();
  },
);
settingsForm.onsubmit = async (e) => {
  e.preventDefault();
  if (changingCredentials) return;
  const f = settingsForm.elements;
  if (
    f.password.value !==
    f.confirmation.value
  ) {
    settingsMessage.textContent =
      'Новые пароли не совпадаю' +
      'т.';
    return;
  }
  changingCredentials = true;
  document.querySelector(
    '#save-settings',
  ).disabled = true;
  settingsMessage.textContent =
    'Сохраняем…';
  try {
    await api('/api.php?action=credentials', {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        username: f.username.value,
        currentPassword:
          f.currentPassword.value,
        password: f.password.value,
      }),
    });
    f.currentPassword.value = '';
    f.password.value = '';
    f.confirmation.value = '';
    settingsMessage.textContent =
      'Данные изменены. Использ' +
      'уйте новый логин и парол' +
      'ь при следующем входе.';
  } catch (err) {
    settingsMessage.textContent =
      err.message;
  } finally {
    changingCredentials = false;
    document.querySelector(
      '#save-settings',
    ).disabled = false;
  }
};
document.querySelector(
  '#logout',
).onclick = async (e) => {
  e.currentTarget.disabled = true;
  try {
    await api('/api.php?action=logout', {
      method: 'POST',
    });
    window.location.replace(
      '/admin/login.php',
    );
  } catch (err) {
    document.querySelector(
      '#message',
    ).textContent = err.message;
    document.querySelector(
      '#logout',
    ).disabled = false;
  }
};
