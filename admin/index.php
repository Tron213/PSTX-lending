<?php
ini_set('display_errors', '0');
define('PASTUKH', true);
require __DIR__ . '/../private/core.php';
header('Cache-Control: no-store');
try {
  bootstrap();
  if (!admin()) {
    header('Location: /admin/login.php',
      true, 303);
    exit;
  }
  require __DIR__ . '/../private/admin.php';
} catch (Throwable $error) {
  http_response_code(500);
  echo 'Проверьте права записи в .pastukh';
  error_log($error->getMessage());
}
