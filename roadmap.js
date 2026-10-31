(() => {
  const list = document.querySelector('#path-stages');
  const preview = document.querySelector('#path-preview');
  if (!list && !preview) return;
  const labels = { idea: 'Задумка',
    development: 'В разработке', done: 'Выполнено' };
  const node = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  async function load() {
    const message = document.querySelector(
      list ? '#path-message' : '#path-preview-note');
    try {
      const response = await fetch('/api.php?action=roadmap', {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      const state = new URLSearchParams(location.search).get('state') || '';
      const selected = ['', 'done', 'development'].includes(state) ? state : '';
      document.querySelectorAll('.path-filters a').forEach(a => {
        if (a.dataset.state === selected) a.setAttribute('aria-current', 'page');
      });
      const filtered = data.stages.filter(s => !list || !selected || s.state === selected);
      message.textContent = filtered.length ? ''
        : selected ? 'В этой категории пока нет опубликованных этапов.'
          : 'Команда готовит описание этапов. Здесь появится путь от идеи к готовому продукту.';
      if (list) {
        const done = data.stages.filter(s => s.state === 'done').length;
        document.querySelector('#path-summary').textContent = data.stages.length
          ? 'Опубликовано этапов: ' + data.stages.length + '. Выполнено: ' + done + '.' : '';
      }
      filtered.slice(0, list ? 32 : 3).forEach(stage => {
        const card = node(list ? 'li' : 'article', null, 'path-stage');
        card.dataset.state = stage.state;
        const order = data.stages.findIndex(s => s.id === stage.id) + 1;
        card.append(node('span', 'ЭТАП ' + order + ' · ' + labels[stage.state], 'path-badge'));
        card.append(node(list ? 'h2' : 'h3', stage.title));
        card.append(node('p', stage.description));
        if (list) {
          const details = node('dl');
          for (const [key, label] of [
            ['criterion', 'Критерий готовности'],
            ['result', 'Что выполнено'], ['next', 'Следующий шаг'],
          ]) {
            if (stage[key]) details.append(node('dt', label), node('dd', stage[key]));
          }
          card.append(details);
        }
        (list || preview).append(card);
      });
    } catch {
      message.textContent = 'Не удалось загрузить путь проекта.';
      const retry = node('button', 'Повторить', 'secondary');
      retry.type = 'button';
      retry.onclick = () => { retry.remove(); load(); };
      message.append(' ', retry);
    }
  }
  load();
})();
