<?php
ini_set('display_errors', '0');
// PHP 7.4+; Apache executes this file.
define('PASTUKH', true);
require __DIR__ . '/private/core.php';
require __DIR__ . '/private/auth.php';
require __DIR__ . '/private/news.php';
require __DIR__ . '/private/media.php';
require __DIR__ . '/private/project.php';
header('Content-Type: application/json; '
  . 'charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
try {
  bootstrap();
  $a = $_GET['action'] ?? '';
  $m = $_SERVER['REQUEST_METHOD'];
  if ($a === 'news') news_action($m);
  if ($a === 'project') project_action($m);
  if ($a === 'uploads') upload_action($m);
  if ($a === 'media') media_action($m);
  $auth = ['login', 'logout',
    'credentials', 'setup'];
  if (in_array($a, $auth, true)) {
    auth_action($a, $m);
  }
  fail('Не найдено', 404);
} catch (Throwable $error) {
  error_log($error->getMessage());
  fail('Ошибка сервера. Проверьте журнал '
    . 'Apache и права на папку .pastukh.',
    500);
}
