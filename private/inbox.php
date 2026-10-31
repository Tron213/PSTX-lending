<?php
if (!defined('PASTUKH') || !admin()) exit;
?>
<details class="admin-help" id="inbox">
  <summary>
    Вопросы команде (<?= count($items) ?>)
  </summary>
  <?php if (!$items): ?>
    <p>Новых вопросов пока нет.</p>
  <?php endif; ?>
  <?php foreach ($items as $q): ?>
    <article class="news-card">
    <a href="mailto:<?= qescape($q['email']) ?>">
        <?= qescape($q['email']) ?>
      </a>
      <p class="post-body"><?=
        qescape($q['body'])
      ?></p>
      <form method="post">
        <button class="secondary" name="done"
          value="<?= qescape($q['id']) ?>">
          Убрать из входящих
        </button>
      </form>
    </article>
  <?php endforeach; ?>
</details>
