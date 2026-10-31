<?php
if (!defined('PASTUKH') || !admin()) exit;
?>
<section id="roadmap-editor">
  <p class="eyebrow">ПАСТУХ / ПУТЬ ПРОЕКТА</p>
  <h1>От идеи к готовому продукту</h1>
  <p class="intro">Панели задумок и этапов работы.
    Каждый этап содержит подробное описание,
    критерий готовности и результат.
    Это план развития проекта.</p>
  <p>«Задумка» — предлагаемое направление;
    «В разработке» — команда работает над этапом;
    «Выполнено» — получен и описан результат.
    Видимость на сайте задаётся отдельно.</p>
  <p>Начальные панели описывают возможный путь.
    Их статусы нужно подтвердить команде.
    Скрытые этапы доступны только в админке.</p>
  <a class="text-link" href="/roadmap.html">
    Открыть публичный путь проекта ↗
  </a>
  <p id="roadmap-message" role="status"
    aria-live="polite">Загрузка этапов…</p>
  <button type="button" id="roadmap-retry"
    class="secondary" hidden>Повторить</button>
  <form id="roadmap-form" hidden>
    <div id="roadmap-panels"></div>
    <div class="path-toolbar">
      <button type="button" id="roadmap-add"
        class="secondary">Добавить задумку</button>
      <button class="button" type="submit">
        Сохранить путь проекта
      </button>
    </div>
  </form>
</section>
