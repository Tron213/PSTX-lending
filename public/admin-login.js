const form = document.querySelector(
    '#login-form',
  ),
  message = document.querySelector(
    '#login-message',
  ),
  button = document.querySelector(
    '#login-button',
  );
document.querySelector(
  '#show-password',
).onclick = (e) => {
  const input = form.elements.password,
    show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  e.currentTarget.textContent = show
    ? 'Скрыть'
    : 'Показать';
  e.currentTarget.setAttribute(
    'aria-pressed',
    String(show),
  );
  e.currentTarget.setAttribute(
    'aria-label',
    show
      ? 'Скрыть пароль'
      : 'Показать пароль',
  );
};
form.onsubmit = async (e) => {
  e.preventDefault();
  if (button.disabled) return;
  button.disabled = true;
  message.textContent = 'Выполняем вход…';
  try {
    const r = await fetch(
      '/api/admin/login',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          username:
            form.elements.username.value.trim(),
          password:
            form.elements.password.value,
        }),
      },
    );
    const data = await r.json();
    if (!r.ok)
      throw Error(
        data.error || 'Не удалось войти',
      );
    window.location.replace('/admin');
  } catch (err) {
    message.textContent = err.message;
    button.disabled = false;
  }
};
