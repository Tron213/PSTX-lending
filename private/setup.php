<?php
if (!defined('PASTUKH')) {
  http_response_code(404);
  exit;
}
?>
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1"
    />
    <title>
      Вход администратора — ПАСТУХ
    </title>
    <link
      rel="icon"
      href="/assets/mark.svg"
    />
    <link
      rel="stylesheet"
      href="/styles.css?v=redesign1"
    />
    <link
      rel="stylesheet"
      href="/news.css"
    />
    <script
      src="/admin-setup.js"
      defer
    ></script>
    <script src="/site.js?v=redesign1"></script>
    <link rel="stylesheet" href="/admin-theme.css?v=redesign1" />
  </head>
  <body>
    <header class="header">
      <a
        class="brand"
        href="/"
      >
        <img
          src="/assets/mark.svg"
          width="34"
          height="34"
          alt=""
        />
        ПАСТУХ
      </a>
      <a href="/news.html">К новостям ↗</a>
    </header>
    <main class="login-card">
      <p class="eyebrow">
        ПАСТУХ / ВХОД АДМИНИСТРАТОРА
      </p>
      <h1>Первый запуск.</h1>
      <p>
        Создайте администратора. Ключ настройки
        лежит на сервере в файле
        .pastukh/setup-key.php. Откройте его
        через SSH или файловый менеджер
        и скопируйте значение token.
      </p>
      <form id="login-form">
        <label for="token">Ключ настройки</label>
        <input
          id="token"
          name="token"
          type="password"
          autocomplete="off"
          required
        />
        <label for="username">
          Логин
        </label>
        <input
          id="username"
          name="username"
          autocomplete="username"
          maxlength="64"
          minlength="3"
          pattern="[a-zA-Z0-9_.\-]{3,64}"
          required
          autofocus
          autocapitalize="none"
          spellcheck="false"
        />
        <label for="password">
          Пароль
        </label>
        <div class="password-field">
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            minlength="10"
            maxlength="128"
            required
          />
          <button
            type="button"
            class="secondary"
            id="show-password"
            aria-label="Показать пароль"
            aria-pressed="false"
          >
            Показать
          </button>
        </div>
        <p
          id="login-message"
          role="status"
          aria-live="polite"
        ></p>
        <button
          class="button"
          type="submit"
          id="login-button"
        >
          Создать администратора ↗
        </button>
      </form>
      <p class="hint">
        Пароль — минимум 10 символов.
        Сохраните его перед отправкой формы.
        После настройки эта форма отключится.
      </p>
    </main>
  </body>
</html>
