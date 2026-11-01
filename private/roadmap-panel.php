<?php
if (!defined('PASTUKH') || !admin()) exit;
?>
<section id="roadmap-editor">
  <h2 class="panel-title">Задумки и этапы</h2>
  <p class="callout">«Задумка» — предлагаемое направление;
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
