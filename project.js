(() => {
  'use strict';
  const container = document.querySelector(
    '#published-project',
  );
  function element(tag, text, className) {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (className) item.className = className;
    return item;
  }
  function safeLink(value) {
    try {
      const url = new URL(value,
        window.location.origin);
      return url.protocol === 'https:'
        || (url.origin === location.origin
          && value.startsWith('/')
          && !value.startsWith('//'))
        || value.startsWith('#');
    } catch {
      return false;
    }
  }
  async function loadPublished() {
    if (!container) return;
    try {
      const response = await fetch(
        '/api.php?action=project',
      );
      if (!response.ok) return;
      const data = await response.json();
      for (const block of data.blocks || []) {
        if (block.status !== 'published') {
          continue;
        }
        const section = element('section',
          null, 'section published-block');
        section.id = 'project-' + block.id;
        const heading = element('div');
        heading.append(element('p',
          'ПАСТУХ / О ПРОЕКТЕ', 'eyebrow'));
        heading.append(element('h2',
          block.title));
        const content = element('div');
        content.append(element('p',
          block.body, 'published-body'));
        const gallery = element('div',
          null, 'project-gallery');
        for (const media of block.media || []) {
          const figure = element('figure');
          const asset = element(
            media.type === 'video'
              ? 'video' : 'img',
          );
          asset.src = '/api.php?action=media&id='
            + encodeURIComponent(media.id);
          if (media.type === 'video') {
            asset.controls = true;
            asset.preload = 'metadata';
          } else {
            asset.alt = media.name || block.title;
            asset.loading = 'lazy';
          }
          figure.append(asset);
          if (media.name) {
            figure.append(element('figcaption',
              media.name));
          }
          gallery.append(figure);
        }
        content.append(gallery);
        const links = element('div',
          null, 'project-links');
        for (const link of block.links || []) {
          if (!safeLink(link.url)) continue;
          const anchor = element('a',
            link.label + ' ↗');
          anchor.href = link.url;
          anchor.rel = 'noopener noreferrer';
          links.append(anchor);
        }
        content.append(links);
        section.append(heading, content);
        container.append(section);
      }
      container.hidden =
        !container.children.length;
    } catch {
      // Optional editorial sections stay absent.
      // No unpublished fallback is embedded here.
    }
  }
  document.querySelectorAll(
    '[data-pilot-contact]',
  ).forEach(link => {
    link.addEventListener('click', () => {
      const field = document.querySelector(
        '#ask-team textarea',
      );
      if (!field.value.trim()) {
        field.value = 'Хотим обсудить участие '
          + 'хозяйства в испытаниях ПАСТУХа.\n'
          + 'Хозяйство: \n'
          + 'С кем связаться: \n'
          + 'Задача, которую хотим проверить: ';
      }
      field.focus({ preventScroll: true });
    });
  });
  loadPublished();
})();
