(() => {
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
      '#shell-message',
    ).textContent = err.message;
    document.querySelector(
      '#logout',
    ).disabled = false;
  }
};

})();
