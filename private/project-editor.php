<?php
if (!defined('PASTUKH') || !admin()) exit;
?>
<section id="project-editor"
  class="project-editor"
  aria-labelledby="project-editor-title">
  <h2 id="project-editor-title">
    Разделы сайта
  </h2>
  <details class="editor-guidance"><summary>Как публиковать материалы</summary>
  <p class="project-editor-intro">
    Задумки и этапы развития редактируются
    на отдельной вкладке «Путь проекта».
    Здесь находятся описательные материалы сайта.
  </p>
  <p class="project-editor-intro">
    Заполняйте разделы по мере готовности.
    Черновики доступны только после входа
    в админку. Публикуйте сведения, которые
    команда проверила и готова показать.
  </p>
  <p class="project-editor-intro">
    Чтобы снять раздел с сайта, выберите
    «Черновик» и сохраните изменения.
    Новостей и обращений это не касается.
  </p>
  <p class="project-editor-intro">
    До 6 фотографий или видео в разделе:
    фото до 10 МБ, видео до 50 МБ.
    Черновые вложения доступны только
    администратору. Удаление из раздела
    убирает ссылку, сохраняя сам файл.
  </p>
  </details>
  <div id="project-load-state"
    role="status" aria-live="polite">
    Загрузка разделов…
  </div>
  <button type="button"
    id="project-retry"
    class="secondary" hidden>
    Повторить загрузку
  </button>
  <form id="project-content-form" hidden>
    <div id="project-blocks"></div>
    <div class="project-save-bar">
      <button type="submit"
        id="project-save" class="button">
        Сохранить разделы
      </button>
      <span id="project-save-state"
        role="status" aria-live="polite">
      </span>
    </div>
  </form>
</section>
