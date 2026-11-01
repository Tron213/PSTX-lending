(() => {
  const legacy = {
    '#about': '/about.html', '#project': '/about.html',
    '#system': '/about.html#technology', '#materials': '/about.html#materials',
    '#analytics': '/demo.html', '#roadmap': '/roadmap.html',
    '#contact': '/contact.html', '#latest': '/news.html',
    '#farm-workflow': '/about.html#technology',
  };
  if (['/', '/index.html'].includes(location.pathname) && legacy[location.hash]) {
    location.replace(legacy[location.hash]);
    return;
  }
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('pastukh-theme'); } catch {}
  function apply(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#101a17' : '#f5f4ef');
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.textContent = theme === 'dark' ? '☀ Светлая' : '☾ Тёмная';
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute('aria-label', theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему');
    });
  }
  apply(['dark', 'light'].includes(saved) ? saved : preference.matches ? 'dark' : 'light');
  preference.addEventListener('change', event => {
    if (!saved) apply(event.matches ? 'dark' : 'light');
  });
  function init() {
    const header = document.querySelector('.header');
    if (header && !header.querySelector('.theme-toggle')) {
      const theme = document.createElement('button');
      theme.type = 'button'; theme.className = 'theme-toggle';
      header.append(theme);
    }
    apply(root.dataset.theme);
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.onclick = () => {
        saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('pastukh-theme', saved); } catch {}
        apply(saved);
      };
    });
    const menu = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#nav');
    if (menu && nav) {
      const close = () => {
        nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-label', 'Открыть меню');
      };
      menu.onclick = () => {
        const open = nav.classList.toggle('open');
        menu.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      };
      nav.querySelectorAll('a').forEach(link => { link.addEventListener('click', close); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
      window.addEventListener('resize', () => { if (innerWidth > 900) close(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
