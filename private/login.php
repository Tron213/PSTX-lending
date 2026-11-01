<?php
if (!defined('PASTUKH')) {
  http_response_code(404);
  exit;
}
?>
<!doctype html>
<html lang="ru">
  <head>
    <meta name="theme-color" content="#f5f4ef" />
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
    <script
      src="/admin-login.js"
      defer
    ></script>
    <script src="/site.js?v=unified-20261101"></script>
    <link rel="stylesheet" href="/admin-theme.css?v=unified-20261101" />
    <link rel="stylesheet" href="/design.css?v=unified-20261101" />
</head>
  <body>
    <a class="skip" href="#main">Перейти к содержанию</a>
    <header class="header">
  <a class="brand" href="/" aria-label="ПАСТУХ — главная">
    <img src="/assets/mark.svg" width="34" height="34" alt="" />ПАСТУХ
  </a>
  <nav id="nav" aria-label="Разделы сайта">
    <a href="/">Главная</a>
    <a href="/about.html">О проекте</a>
    <a href="/demo.html">Пример приложения</a>
    <a href="/roadmap.html">Путь проекта</a>
    <a href="/news.html">Новости</a>
    <a href="/contact.html">Контакты</a>
  </nav>
  <div class="header-controls">
    <button class="theme-toggle" type="button" aria-label="Переключить тему">Тема</button>
    <button class="menu-toggle" type="button" aria-controls="nav" aria-expanded="false" aria-label="Открыть меню">☰</button>
  </div>
</header>
    <main id="main" class="login-card">
      <p class="eyebrow">
        ПАСТУХ / ВХОД АДМИНИСТРАТОРА
      </p>
      <h1>С возвращением.</h1>
      <p>
        Войдите, чтобы публиковать новости
        и управлять материалами проекта.
      </p>
      <form id="login-form">
        <label for="username">
          Логин
        </label>
        <input
          id="username"
          name="username"
          autocomplete="username"
          maxlength="64"
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
            autocomplete="current-password"
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
          Войти в админ-панель ↗
        </button>
      </form>
      <p class="hint">
        Сеанс действует 8 часов. Логин и
        пароль можно изменить в настройках
        админ-панели.
      </p>
    </main>
  <footer class="site-footer">
  <a class="brand" href="/">ПАСТУХ</a>
  <p>Проект технологий для животноводства.</p>
  <a href="/admin/index.php">Для команды ↗</a>
</footer>
</body>
</html>
