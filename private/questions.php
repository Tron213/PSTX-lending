<?php
if (!defined('PASTUKH') || !admin()) exit;
$items = read('questions') ?? [];
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && isset($_POST['done'])) {
  csrf();
  $id = $_POST['done'];
  $items = array_values(array_filter(
    $items, function ($q) use ($id) {
      return $q['id'] !== $id;
    }
  ));
  save('questions', $items);
  header('Location: /admin/index.php#inbox',
    true, 303);
  exit;
}
function qescape($s) {
  return htmlspecialchars($s, ENT_QUOTES,
    'UTF-8');
}
