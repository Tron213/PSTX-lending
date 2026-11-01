<?php
if (!defined('PASTUKH')) {
  http_response_code(404);
  exit;
}
require __DIR__ . '/questions.php';
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
    <title>Админ-панель — ПАСТУХ</title>
    <link rel="stylesheet" href="/design.css?v=unified-20261101" />
    <link
      rel="icon"
      href="/assets/mark.svg"
    />
    <?php if ($adminView === 'news'): ?>
    <script src="/admin.js?v=unified-20261101" defer></script>
    <?php endif; ?>
    <script src="/admin-shell.js?v=unified-20261101" defer></script>
    <?php if ($adminView === 'roadmap'): ?>
    <script src="/admin-roadmap.js?v=unified-20261101" defer></script>
    <?php endif; ?>
    <link rel="stylesheet"
      href="/admin-project.css?v=unified-20261101" />
    <script src="/admin-project.js?v=unified-20261101"
      defer></script>
    <script src="/site.js?v=unified-20261101"></script>
    <link rel="stylesheet" href="/admin-theme.css?v=unified-20261101" />
</head>
  <body class="admin-page">
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
    <main id="main" class="page-main admin-main">
      <div class="workspace-bar">
        <nav class="workspace-nav" aria-label="Разделы админки">
          <a href="/admin/index.php" <?= $adminView === 'news' ? 'aria-current="page"' : '' ?>>Новости</a>
          <a href="/admin/roadmap.php" <?= $adminView === 'roadmap' ? 'aria-current="page"' : '' ?>>Путь проекта</a>
          <a href="/admin/content.php" <?= $adminView === 'content' ? 'aria-current="page"' : '' ?>>Материалы сайта</a>
          <a href="/admin/index.php#inbox">Обращения</a>
        </nav>
        <div class="workspace-actions">
          <button type="button" class="secondary" id="settings-button">Настройки входа</button>
          <button type="button" class="secondary" id="logout">Выйти</button>
        </div>
      </div>
      <section class="page-heading admin-heading">
        <p class="eyebrow">ПАСТУХ / КОМАНДА</p>
        <?php if ($adminView === 'roadmap'): ?>
          <h1>Путь<br /><span class="accent-text">проекта.</span></h1>
          <p class="lead">Задумки, работа и результаты — от идеи к готовому продукту.</p>
        <?php elseif ($adminView === 'content'): ?>
          <h1>Материалы<br /><span class="accent-text">сайта.</span></h1>
          <p class="lead">Описания разделов, фотографии, видео и ссылки для посетителей.</p>
        <?php else: ?>
          <h1>Новости<br /><span class="accent-text">проекта.</span></h1>
          <p class="lead">Создавайте публикации, сохраняйте черновики и делитесь обновлениями команды.</p>
        <?php endif; ?>
      </section>
      <p id="shell-message" role="status"></p>
      <?php if ($adminView === 'roadmap'):
        require __DIR__ . '/roadmap-panel.php';
      elseif ($adminView === 'content'):
        require __DIR__ . '/project-editor.php';
        require __DIR__ . '/concept-notes.php';
      else: ?>
      <section class="admin-news-tools" id="news-admin">
        <button id="new-post" class="button" type="button" hidden>Добавить новость +</button>
        <a class="text-link" href="/news.html">Открыть публичные новости ↗</a>
      </section>
      <details class="admin-help">
        <summary>
          Как добавить или изменить
          новость
        </summary>
        <ol>
          <li>
            Нажмите «Добавить новость»,
            введите заголовок и текст.
          </li>
          <li>
            Прикрепите до 6 фотографий или
            видео и нажмите
            «Опубликовать».
          </li>
          <li>
            Для изменений нажмите
            «Редактировать» под нужной
            новостью. Можно изменить
            текст, убрать вложения или
            загрузить новые.
          </li>
          <li>
            Нажмите «Сохранить изменения».
            Чтобы убрать всю публикацию,
            выберите «Удалить» и
            подтвердите.
          </li>
        </ol>
        <p>
          Вход выполняется по логину и
          паролю администратора. Изменить
          их можно кнопкой «Настройки
          входа». Кнопка «Выйти» завершает
          текущий сеанс.
        </p>
      </details>
      <div class="news-toolbar">
        <span>НОВОСТИ ПРОЕКТА</span>
        <span id="count"></span>
      </div>
      <p
        id="message"
        role="status"
        aria-live="polite"
      ></p>
      <section
        id="feed"
        class="news-feed"
        aria-label="Публикации"
      ></section>
      <?php require __DIR__ . '/inbox.php'; ?>
      <?php endif; ?>
    </main>
    <?php if ($adminView === 'news'): ?>
    <dialog
      id="editor"
      aria-labelledby="editor-title"
    >
      <form id="post-form" novalidate>
        <div class="editor-top">
          <p class="eyebrow">
            ПАСТУХ / РЕДАКТОР
          </p>
          <button
            type="button"
            id="close-editor"
            class="secondary"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <h2 id="editor-title">
          Новая публикация
        </h2>
        <label>
          Заголовок
          <input
            name="title"
            required
            maxlength="160"
            placeholder="Что нового в проекте?"
          />
        </label>
        <label>
          Текст
          <textarea
            name="body"
            rows="7"
            required
            maxlength="20000"
           placeholder="Расскажите об обновлении…"
          ></textarea>
        </label>
        <?php
        require __DIR__ . '/trial-fields.php';
        ?>
        <label>
          Фотографии и видео
          <input
            id="files"
            type="file"
            accept="
              image/jpeg,image/png,image/webp,
              image/gif,video/mp4,video/webm,
              video/quicktime
            "
            multiple
          />
        </label>
        <p class="hint">
          До 6 файлов: фото до 10 МБ,
          видео до 50 МБ. Для видео
          рекомендуем MP4.
        </p>
        <div id="attachments"></div>
        <p
          id="form-message"
          role="status"
          aria-live="polite"
        ></p>
        <div class="form-actions">
          <button
            class="button"
            id="save"
            type="submit"
          >
            Опубликовать ↗
          </button>
          <button
            class="secondary"
            type="button"
            id="cancel"
          >
            Отмена
          </button>
        </div>
      </form>
    </dialog>
    <?php endif; ?>
    <dialog
      id="settings"
      aria-labelledby="settings-title"
    >
      <form id="settings-form">
        <div class="editor-top">
          <p class="eyebrow">
            ПАСТУХ / НАСТРОЙКИ ВХОДА
          </p>
          <button
            type="button"
            class="secondary"
            id="close-settings"
            aria-label="Закрыть настройки"
          >
            ×
          </button>
        </div>
        <h2 id="settings-title">
          Логин и пароль
        </h2>
        <label>
          Логин
          <input
            name="username"
            autocomplete="username"
            required
            pattern="[a-zA-Z0-9_.\-]{3,64}"
            minlength="3"
            maxlength="64"
            autocapitalize="none"
            spellcheck="false"
          />
        </label>
        <label>
          Текущий пароль
          <input
            name="currentPassword"
            type="password"
            autocomplete="current-password"
            required
            maxlength="256"
          />
        </label>
        <label>
          Новый пароль
          <input
            name="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="10"
            maxlength="128"
          />
        </label>
        <label>
          Повторите новый пароль
          <input
            name="confirmation"
            type="password"
            autocomplete="new-password"
            required
            minlength="10"
            maxlength="128"
          />
        </label>
        <p class="hint">
          Логин: от 3 символов, латиница,
          цифры, точка, дефис или
          подчёркивание. Пароль: от 10
          символов. После сохранения
          остальные сеансы будут
          завершены. Для изменения только
          логина укажите прежний пароль
          как новый.
        </p>
        <p
          id="settings-message"
          role="status"
          aria-live="polite"
        ></p>
        <button
          type="submit"
          class="button"
          id="save-settings"
        >
          Сохранить данные
        </button>
      </form>
    </dialog>
    <footer class="site-footer">
  <a class="brand" href="/">ПАСТУХ</a>
  <p>Проект технологий для животноводства.</p>
  <a href="/admin/index.php">Для команды ↗</a>
</footer>
  </body>
</html>
