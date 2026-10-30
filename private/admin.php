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
    <title>Админ-панель — ПАСТУХ</title>
    <link
      rel="icon"
      href="/assets/mark.svg"
    />
    <link
      rel="stylesheet"
      href="/styles.css"
    />
    <link
      rel="stylesheet"
      href="/news.css?v=20261030-date"
    />
    <script
      src="/admin.js?v=20261030-date"
      defer
    ></script>
  </head>
  <body class="admin-page">
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
      <nav
        class="admin-nav"
        aria-label="Навигация администратора"
      >
        <a href="/news.html">
          Открыть новости ↗
        </a>
        <button
          type="button"
          class="secondary"
          id="settings-button"
        >
          Настройки входа
        </button>
        <button
          type="button"
          class="secondary"
          id="logout"
        >
          Выйти
        </button>
      </nav>
    </header>
    <main class="news-main">
      <section class="news-intro">
        <p class="eyebrow">
          <span class="dot"></span>
          ПАСТУХ / АДМИНИСТРИРОВАНИЕ
        </p>
        <h1>
          Управление
          <br />
          новостями.
        </h1>
        <div class="news-intro-bottom">
          <p class="intro">
            Публикуйте обновления,
            добавляйте фото и видео.
            <br />
            Все изменения сразу появляются
            во вкладке «Новости».
          </p>
          <button
            id="new-post"
            class="button"
            hidden
          >
            Добавить новость
            <span>+</span>
          </button>
        </div>
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
    </main>
    <dialog
      id="editor"
      aria-labelledby="editor-title"
    >
      <form id="post-form">
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
    <footer>
      <a
        class="brand"
        href="/"
      >
        <img
          src="/assets/mark.svg"
          width="28"
          height="28"
          alt=""
        />
        ПАСТУХ
      </a>
      <p>
        Технологии для тех, кто растёт.
      </p>
      <a href="/">На главную ↗</a>
      <span>© 2026</span>
    </footer>
  </body>
</html>
