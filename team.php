<?php
define('PASTUKH', true);
require __DIR__ . '/private/core.php';
header('Content-Type: application/json');
header('Cache-Control: no-store');
try {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Метод не поддерживается', 405);
  }
  csrf();
  bootstrap();
  $d = input();
  $mail = trim(text_value($d, 'email', 254));
  $body = trim(text_value($d, 'body', 8000));
  if (!filter_var($mail, FILTER_VALIDATE_EMAIL)
      || $body === ''
      || !preg_match('/^.{1,2000}$/usD', $body)) {
    fail('Проверьте почту и текст вопроса.');
  }
  $items = read('questions') ?? [];
  $ip = hash('sha256', $_SERVER['REMOTE_ADDR']);
  foreach ($items as $q) {
    if ($q['ip'] === $ip
        && $q['time'] > time() - 60) {
      fail('Повторите через минуту.', 429);
    }
  }
  if (count($items) >= 500) {
    fail('Приём вопросов временно закрыт.', 503);
  }
  array_unshift($items, [
    'id' => uuid(), 'ip' => $ip,
    'time' => time(), 'email' => $mail,
    'body' => $body
  ]);
  save('questions', $items);
  answer(['ok' => true]);
} catch (Throwable $e) {
  fail('Не удалось сохранить сообщение.', 500);
}
