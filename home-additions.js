(() => {
  const by = id => document.getElementById(id);
  async function latest() {
    const note = by('latest-note');
    try {
      const url = '/api.php?action=news';
      const r = await fetch(url);
      if (!r.ok) throw Error();
      const [post] = (await r.json()).posts;
      if (!post) {
        note.textContent = 'Новостей пока нет.';
        return;
      }
      by('latest-title').textContent = post.title;
      const chars = Array.from(post.body);
      by('latest-body').textContent =
        chars.slice(0, 180).join('').trimEnd()
        + (chars.length > 180 ? '…' : '');
      const date = by('latest-date');
      date.dateTime = post.date;
      date.textContent = new Intl.DateTimeFormat(
        'ru-RU', {
          dateStyle: 'long',
          timeZone: 'Asia/Yekaterinburg'
        }).format(new Date(post.date));
      by('latest-link').href =
        '/news.html#post-' + post.id;
      const photo = post.media.find(
        m => m.type === 'image'
      );
      if (photo) {
        const img = by('latest-photo');
        img.src = '/api.php?action=media&id='
          + encodeURIComponent(photo.id);
        img.loading = 'lazy';
        img.hidden = false;
      }
      by('latest-card').hidden = false;
    } catch {
      note.textContent =
        'Не удалось загрузить новость.';
    }
  }
  latest();
  const form = by('ask-team');
  form.onsubmit = async e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const status = by('ask-status');
    btn.disabled = true;
    status.textContent = 'Отправляем…';
    try {
      const data = new FormData(form);
      const r = await fetch('/team.php', {
        method: 'POST',
        body: JSON.stringify(
          Object.fromEntries(data)
        )
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error);
      form.reset();
      status.textContent = 'Команда получила'
        + ' ваше сообщение.';
    } catch (err) {
      status.textContent = err.message ||
        'Не удалось отправить сообщение.';
    } finally {
      btn.disabled = false;
    }
  };
})();
