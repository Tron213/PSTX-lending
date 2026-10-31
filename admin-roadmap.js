(() => {
  const form = document.querySelector('#roadmap-form');
  if (!form) return;
  const panels = document.querySelector('#roadmap-panels');
  const message = document.querySelector('#roadmap-message');
  const retry = document.querySelector('#roadmap-retry');
  const labels = { idea: 'Задумка',
    development: 'В разработке', done: 'Выполнено' };
  let revision = 'initial', dirty = false, busy = false;
  let records = [];
  const node = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  function changed() {
    dirty = true;
    message.textContent = 'Есть несохранённые изменения';
  }
  function values() {
    return [...panels.children].map(panel => {
      const record = records.find(r => r.panel === panel);
      const data = { id: record.id };
      for (const [key, control] of Object.entries(record.fields)) {
        data[key] = control.type === 'checkbox'
          ? control.checked : control.value.trim();
      }
      return data;
    });
  }
  function renumber() {
    [...panels.children].forEach((p, i) => {
      p.querySelector('.path-number').textContent =
        String(i + 1).padStart(2, '0');
      p.querySelector('[data-move="up"]').disabled = i === 0;
      p.querySelector('[data-move="down"]').disabled =
        i === panels.children.length - 1;
    });
  }
  function addPanel(stage, open = false) {
    const panel = node('details', null, 'path-panel');
    panel.open = open;
    const summary = node('summary');
    const number = node('span', '', 'path-number');
    const title = node('strong', stage.title);
    const badge = node('span', labels[stage.state], 'path-badge');
    summary.append(number, title, badge);
    const body = node('div', null, 'path-panel-body');
    const fields = {};
    for (const [key, label, max] of [
      ['title', 'Название задумки / этапа', 160],
      ['description', 'Подробное описание задумки', 6000],
      ['criterion', 'Критерий готовности', 2000],
      ['result', 'Что выполнено / полученный результат', 2000],
      ['next', 'Следующий шаг', 2000],
    ]) {
      const wrapper = node('label', label);
      const control = node(key === 'title' ? 'input' : 'textarea');
      control.value = stage[key] || '';
      control.maxLength = max;
      if (key !== 'title') control.rows = key === 'description' ? 6 : 3;
      control.required = ['title', 'description'].includes(key);
      wrapper.append(control);
      body.append(wrapper);
      fields[key] = control;
    }
    const stateLabel = node('label', 'Состояние этапа');
    const state = node('select');
    for (const [value, label] of Object.entries(labels)) {
      const option = node('option', label);
      option.value = value;
      state.append(option);
    }
    state.value = stage.state;
    fields.state = state;
    stateLabel.append(state);
    const visibleLabel = node('label', null, 'path-check');
    const visible = node('input');
    visible.type = 'checkbox';
    visible.checked = stage.visible;
    fields.visible = visible;
    visibleLabel.append(visible, document.createTextNode(
      'Показывать этап на сайте'));
    body.append(stateLabel, visibleLabel);
    const actions = node('div', null, 'path-toolbar');
    for (const [direction, text] of [['up', '↑ Выше'], ['down', '↓ Ниже']]) {
      const button = node('button', text, 'secondary');
      button.type = 'button';
      button.dataset.move = direction;
      button.onclick = () => {
        if (busy) return;
        if (direction === 'up' && panel.previousElementSibling) {
          panels.insertBefore(panel, panel.previousElementSibling);
        } else if (direction === 'down' && panel.nextElementSibling) {
          panels.insertBefore(panel.nextElementSibling, panel);
        }
        renumber(); changed();
      };
      actions.append(button);
    }
    const remove = node('button', 'Убрать этап', 'secondary');
    remove.type = 'button';
    remove.onclick = () => {
      if (busy || !confirm('Убрать этап из пути проекта? Изменение применится после сохранения.')) return;
      panel.remove();
      records = records.filter(r => r.panel !== panel);
      renumber(); changed();
    };
    actions.append(remove);
    body.append(actions);
    panel.append(summary, body);
    fields.title.oninput = () => {
      title.textContent = fields.title.value || 'Новая задумка';
    };
    state.onchange = () => { badge.textContent = labels[state.value]; };
    records.push({ panel, fields, id: stage.id });
    panels.append(panel);
    renumber();
  }
  function render(data) {
    panels.replaceChildren(); records = [];
    data.stages.forEach((s, i) => addPanel(s, i === 0));
    revision = data.revision;
    form.hidden = false;
  }
  async function request(options = {}) {
    const response = await fetch('/api.php?action=roadmap&scope=admin', {
      cache: 'no-store', ...options,
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Не удалось загрузить план');
    return result;
  }
  async function load() {
    retry.hidden = true;
    try {
      render(await request());
      dirty = false;
      message.textContent = 'Задумки не публикуются как новости. Отмечайте готовность и видимость каждого этапа.';
    } catch (error) {
      message.textContent = error.message;
      retry.hidden = false;
    }
  }
  document.querySelector('#roadmap-add').onclick = () => {
    if (busy) return;
    if (panels.children.length >= 32) {
      message.textContent = 'Допустимо до 32 этапов'; return;
    }
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    const id = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
      hex.slice(16, 20), hex.slice(20)].join('-');
    addPanel({ id, title: 'Новая задумка', description: '',
      criterion: '', result: '', next: '', state: 'idea', visible: false }, true);
    changed();
    panels.lastElementChild.querySelector('input').focus();
  };
  form.addEventListener('input', changed);
  form.addEventListener('change', changed);
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy) return;
    const stages = values();
    if (stages.some(s => !s.description || !s.title
        || (s.state === 'done' && !s.result))) {
      message.textContent = 'Заполните название и описание каждого этапа. Для «Выполнено» нужен результат.';
      return;
    }
    busy = true;
    const controls = [...form.querySelectorAll('button,input,textarea,select')];
    controls.forEach(c => { c.disabled = true; });
    message.textContent = 'Сохраняем путь проекта…';
    try {
      const data = await request({ method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages, revision }) });
      render(data); dirty = false;
      message.textContent = 'Путь проекта сохранён. На сайте видны только отмеченные этапы.';
    } catch (error) { message.textContent = error.message; }
    finally {
      busy = false;
      controls.forEach(c => { c.disabled = false; });
      renumber();
    }
  };
  window.addEventListener('beforeunload', event => {
    if (!dirty) return;
    event.preventDefault(); event.returnValue = '';
  });
  retry.onclick = load;
  load();
})();
