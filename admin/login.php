<?php
ini_set('display_errors', '0');
define('PASTUKH', true);
require __DIR__ . '/../private/core.php';
header('Cache-Control: no-store');
try {
  bootstrap();
  if (admin()) {
    header('Location: /admin/index.php',
      true, 303);
    exit;
  }
  if (!read('account')) {
    require __DIR__ . '/../private/setup.php';
    exit;
  }
  require __DIR__ . '/../private/login.php';
} catch (Throwable $error) {
  http_response_code(500);
  echo 'Проверьте права записи в .pastukh';
  error_log($error->getMessage());
}
