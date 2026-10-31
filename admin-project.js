(() => {
  'use strict';
  const root = document.querySelector(
    '#project-editor',
  );
  if (!root) return;
  const form = root.querySelector(
    '#project-content-form',
  );
  const container = root.querySelector(
    '#project-blocks',
  );
  const loading = root.querySelector(
    '#project-load-state',
  );
  const retry = root.querySelector(
    '#project-retry',
  );
  const save = root.querySelector(
    '#project-save',
  );
  const message = root.querySelector(
    '#project-save-state',
  );
  const url = '/api.php?action=project';
  const uploadUrl = '/api.php?action=uploads';
  const mediaUrl = '/api.php?action=media&id=';
  const types = [
    'image/jpeg', 'image/png', 'image/webp',
    'image/gif', 'video/mp4', 'video/webm',
    'video/quicktime',
  ];
  const help = {
    passport: 'Полное название, назначение, '
      + 'текущая стадия и дата обновления. '
      + 'Университет и акселератор укажите '
      + 'после сверки с карточкой проекта.',
    team: 'Имена, роли и вклад участников. '
      + 'Согласуйте публикацию с командой. '
      + 'Добавьте публичную страницу '
      + 'университета или команды.',
    prototype: 'Что собрано и работает '
      + 'сейчас? Опишите один полный цикл '
      + 'измерения. Добавьте ссылки на '
      + 'реальные фото или видео стенда.',
    trials: 'Цель → условия → показание '
      + 'системы → контрольное измерение '
      + '→ расхождение → вывод. Если '
      + 'испытаний ещё нет, опишите план. '
      + 'Отдельные записи можно вести '
      + 'в существующих новостях.',
    pilot: 'Для каких хозяйств и животных '
      + 'подходит пилот? Что устанавливает '
      + 'команда, что нужно от фермы, '
      + 'как долго собираются данные '
      + 'и какой отчёт получит хозяйство?',
    materials: 'Описание проекта, '
      + 'презентация и подтверждённые '
      + 'технические параметры. '
      + 'Добавьте ссылки на материалы.',
    faq: 'Как сопоставляется RFID-метка? '
      + 'Что происходит без интернета? '
      + 'Как проверяется ошибочное '
      + 'измерение? Давайте только '
      + 'подтверждённые ответы.',
    capabilities: 'Разделите возможности: '
      + 'Реализовано / Проходит проверку / '
      + 'Запланировано. Отдельно укажите '
      + 'статус взвешивания, передачи '
      + 'данных, учёта и аналитики.',
  };
  let busy = false;
  let dirty = false;
  let records = [];
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function field(label, control) {
    const wrapper = node('label', label);
    wrapper.append(control);
    return wrapper;
  }
  function input(value, max) {
    const control = node('input');
    control.type = 'text';
    control.value = value || '';
    control.maxLength = max;
    return control;
  }
  function linkRow(link = {}) {
    const row = node('div', null,
      'project-link-row');
    const label = input(link.label, 80);
    const address = input(link.url, 2000);
    address.placeholder = 'https://…';
    address.spellcheck = false;
    const remove = node('button',
      'Убрать ссылку', 'secondary');
    remove.type = 'button';
    remove.onclick = () => {
      row.remove();
      changed();
    };
    row.append(field('Подпись', label),
      field('Адрес', address), remove);
    row.controls = { label, address };
    return row;
  }
  function changed() {
    dirty = true;
    message.textContent =
      'Есть несохранённые изменения';
  }
  function releasePending(pending) {
    if (pending.url) {
      URL.revokeObjectURL(pending.url);
      pending.url = null;
    }
  }
  function mediaElement(item, source) {
    const asset = node(item.type === 'video'
      ? 'video' : 'img');
    asset.src = source;
    if (item.type === 'video') {
      asset.controls = true;
      asset.preload = 'metadata';
      asset.playsInline = true;
      asset.setAttribute('aria-label', item.name);
    } else {
      asset.alt = item.name;
      asset.loading = 'lazy';
    }
    return asset;
  }
  function renderMedia(record) {
    record.attachments.replaceChildren();
    const all = [
      ...record.media.map(item => ({
        item, source: mediaUrl + item.id,
        saved: true,
      })),
      ...record.pending.map(pending => ({
        item: {
          name: pending.file.name,
          type: pending.file.type
            .startsWith('video/')
            ? 'video' : 'image',
        },
        source: pending.url, pending,
      })),
    ];
    for (const entry of all) {
      const figure = node('figure', null,
        'project-media-item');
      const caption = node('figcaption');
      const remove = node('button',
        'Убрать вложение', 'secondary');
      remove.type = 'button';
      remove.disabled = busy;
      remove.onclick = () => {
        if (entry.saved) {
          record.media = record.media.filter(
            m => m.id !== entry.item.id,
          );
        } else {
          releasePending(entry.pending);
          record.pending = record.pending.filter(
            p => p !== entry.pending,
          );
        }
        renderMedia(record);
        updatePreview(record);
        changed();
      };
      caption.append(node('span',
        entry.item.name), node('small',
        entry.saved ? 'Загружено'
          : 'Загрузится при сохранении'));
      figure.append(mediaElement(entry.item,
        entry.source), caption, remove);
      record.attachments.append(figure);
    }
  }
  function chooseMedia(record, picker) {
    const files = [...picker.files];
    picker.value = '';
    const count = record.media.length
      + record.pending.length + files.length;
    if (count > 6) {
      record.mediaState.textContent =
        'В разделе допустимо до 6 вложений';
      return;
    }
    for (const file of files) {
      const max = file.type.startsWith('image/')
        ? 10 : 50;
      if (!types.includes(file.type)
          || !file.size
          || file.size > max * 1024 * 1024) {
        record.mediaState.textContent =
          'Проверьте формат и размер: '
          + file.name;
        return;
      }
    }
    for (const file of files) {
      record.pending.push({ file,
        url: URL.createObjectURL(file) });
    }
    record.mediaState.textContent = files.length
      ? 'Файлы выбраны. Сохраните разделы.' : '';
    renderMedia(record);
    updatePreview(record);
    if (files.length) changed();
  }
  function readRecord(record) {
    const links = [];
    for (const row of record.links.children) {
      const { label, address } = row.controls;
      if (!label.value.trim()
          && !address.value.trim()) continue;
      links.push({
        label: label.value.trim(),
        url: address.value.trim(),
      });
    }
    return {
      id: record.id,
      title: record.title.value.trim(),
      body: record.body.value.trim(),
      status: record.status.value,
      links,
      media: record.media,
    };
  }
  function updatePreview(record) {
    const block = readRecord(record);
    record.preview.replaceChildren();
    record.preview.append(node('p',
      block.status === 'published'
        ? 'Будет опубликовано после сохранения'
        : 'Черновик · только в админке',
      'project-preview-status'));
    record.preview.append(node('h4',
      block.title || 'Без заголовка'));
    record.preview.append(node('p',
      block.body || 'Описание ещё не заполнено',
      'project-preview-body'));
    for (const link of block.links) {
      record.preview.append(node('p',
        (link.label || 'Без подписи')
          + ': ' + link.url,
        'project-preview-url'));
    }
    const gallery = node('div', null,
      'project-media-grid');
    for (const item of record.media) {
      gallery.append(mediaElement(item,
        mediaUrl + item.id));
    }
    for (const pending of record.pending) {
      gallery.append(mediaElement({
        type: pending.file.type
          .startsWith('video/')
          ? 'video' : 'image',
        name: pending.file.name,
      }, pending.url));
    }
    record.preview.append(gallery);
  }
  function render(blocks) {
    for (const record of records) {
      record.pending.forEach(releasePending);
    }
    container.replaceChildren();
    records = [];
    for (const block of blocks) {
      const card = node('details', null,
        'project-edit-card');
      const summary = node('summary');
      const name = node('span', block.title
        || block.id);
      const badge = node('span',
        block.status === 'published'
          ? 'Опубликован' : 'Черновик',
        'project-status-badge');
      summary.append(name, badge);
      const body = node('div', null,
        'project-edit-fields');
      const hint = node('p', help[block.id],
        'project-editor-hint');
      const title = input(block.title, 160);
      const text = node('textarea');
      text.rows = 7;
      text.maxLength = 5000;
      text.value = block.body || '';
      const status = node('select');
      for (const item of [
        ['draft', 'Черновик · только админка'],
        ['published', 'Опубликовать на сайте'],
      ]) {
        const option = node('option', item[1]);
        option.value = item[0];
        status.append(option);
      }
      status.value = block.status;
      const links = node('div', null,
        'project-edit-links');
      for (const link of block.links || []) {
        links.append(linkRow(link));
      }
      const add = node('button',
        'Добавить ссылку', 'secondary');
      add.type = 'button';
      add.onclick = () => {
        if (links.children.length >= 6) {
          message.textContent =
            'В разделе допустимо до 6 ссылок';
          return;
        }
        const row = linkRow();
        links.append(row);
        row.controls.label.focus();
        changed();
      };
      const previewPanel = node('details', null,
        'project-preview-panel');
      const preview = node('div', null,
        'project-preview');
      previewPanel.append(node('summary',
        'Предпросмотр раздела'), preview);
      const picker = node('input');
      picker.type = 'file';
      picker.multiple = true;
      picker.accept = types.join(',');
      const attachments = node('div', null,
        'project-media-grid');
      const mediaState = node('p', null,
        'project-editor-hint');
      mediaState.setAttribute('role', 'status');
      mediaState.setAttribute('aria-live',
        'polite');
      const record = {
        id: block.id, title, body: text,
        status, links, preview,
        media: block.media || [], pending: [],
        attachments, mediaState,
      };
      picker.onchange = () => {
        chooseMedia(record, picker);
      };
      previewPanel.ontoggle = () => {
        if (previewPanel.open) {
          updatePreview(record);
        }
      };
      status.onchange = () => {
        badge.textContent = status.value
          === 'published'
          ? 'К публикации' : 'Черновик';
      };
      body.addEventListener('input', () => {
        if (previewPanel.open) {
          updatePreview(record);
        }
      });
      body.append(hint,
        field('Заголовок', title),
        field('Описание', text),
        field('Видимость после сохранения',
          status),
        node('p', 'До 6 ссылок. Используйте '
          + 'HTTPS-адреса публичных материалов '
          + 'или путь /assets/… на сайте.',
          'project-editor-hint'),
        links, add,
        field('Фотографии и видео', picker),
        node('p', 'До 6 файлов: фото до 10 МБ, '
          + 'видео до 50 МБ. Снятые вложения '
          + 'перестают быть частью раздела '
          + 'после сохранения.',
          'project-editor-hint'),
        mediaState, attachments, previewPanel);
      renderMedia(record);
      card.append(summary, body);
      container.append(card);
      records.push(record);
    }
    form.hidden = false;
  }
  async function request(path, options) {
    const response = await fetch(path, {
      credentials: 'same-origin', ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error
        || 'Не удалось сохранить разделы');
    }
    return data;
  }
  async function uploadPending() {
    const total = records.reduce((sum, record) =>
      sum + record.pending.length, 0);
    let count = 0;
    for (const record of records) {
      while (record.pending.length) {
        const pending = record.pending[0];
        message.textContent = 'Загрузка файла '
          + (count + 1) + ' из ' + total + '…';
        const data = await request(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': pending.file.type,
          },
          body: pending.file,
        });
        record.media.push({ id: data.id,
          type: data.type,
          name: pending.file.name.slice(0, 250),
        });
        record.pending.shift();
        releasePending(pending);
        renderMedia(record);
        updatePreview(record);
        count += 1;
      }
      record.mediaState.textContent = '';
    }
  }
  async function load() {
    retry.hidden = true;
    loading.textContent = 'Загрузка разделов…';
    try {
      const data = await request(url
        + '&scope=admin', { cache: 'no-store' });
      render(data.blocks);
      loading.textContent = '';
      dirty = false;
    } catch (error) {
      loading.textContent = error.message;
      retry.hidden = false;
    }
  }
  form.addEventListener('input', changed);
  form.addEventListener('change', changed);
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const blocks = records.map(readRecord);
    for (const block of blocks) {
      if (block.status === 'published'
          && (!block.title || !block.body)) {
        message.textContent =
          'Для публикации заполните заголовок '
          + 'и описание: ' + block.id;
        return;
      }
    }
    busy = true;
    save.disabled = true;
    // Prevent edits being lost while saving.
    const controls = [...form.querySelectorAll(
      'input,textarea,select,button',
    )];
    controls.forEach(c => { c.disabled = true; });
    message.textContent = 'Сохранение…';
    try {
      await uploadPending();
      message.textContent = 'Сохранение разделов…';
      const data = await request(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks: records.map(readRecord),
        }),
      });
      render(data.blocks);
      dirty = false;
      message.textContent = 'Сохранено. '
        + 'Опубликованные разделы доступны '
        + 'на сайте, черновики — в админке.';
    } catch (error) {
      message.textContent = error.message;
    } finally {
      controls.forEach(c => {
        c.disabled = false;
      });
      save.disabled = false;
      busy = false;
      for (const record of records) {
        renderMedia(record);
      }
    }
  };
  window.addEventListener('beforeunload',
    event => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    });
  retry.onclick = load;
  load();
})();
