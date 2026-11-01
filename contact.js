(() => {
  const form = document.querySelector('#ask-team');
  if (!form) return;
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const status = document.querySelector('#ask-status');
    button.disabled = true;
    status.textContent = 'Отправляем…';
    try {
      const response = await fetch('/team.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      form.reset();
      status.textContent = 'Сообщение сохранено. Команда увидит его в своих обращениях.';
    } catch (error) {
      status.textContent = error.message || 'Не удалось отправить сообщение. Повторите позже.';
    } finally { button.disabled = false; }
  };
})();
