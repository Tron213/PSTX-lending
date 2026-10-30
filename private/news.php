<?php
if (!defined('PASTUKH')) exit;
function news_action($method) {
  if ($method === 'GET') {
    $posts = [];
    foreach (glob(STORE . 'posts/*.php')
        ?: [] as $file) {
      $id = basename($file, '.php');
      $post = read('posts/' . $id);
      if ($post) $posts[] = $post;
    }
    usort($posts, function ($a, $b) {
      return strcmp($b['date'], $a['date']);
    });
    answer(['posts' => $posts,
      'canEdit' => admin()]);
  }
  require_admin();
  csrf();
  if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!valid_id($id)) fail('Неверный ID');
    $file = STORE . 'posts/' . $id . '.php';
    if (is_file($file)) unlink($file);
    answer(['ok' => true]);
  }
  if ($method !== 'POST') {
    fail('Метод не поддерживается', 405);
  }
  $d = input();
  $title = trim(text_value($d, 'title', 640));
  $body = trim(text_value($d, 'body', 80000));
  $media = $d['media'] ?? null;
  if ($title === '' || $body === ''
      || !is_array($media)
      || count($media) > 6) {
    fail('Проверьте текст и вложения');
  }
  $clean = [];
  foreach ($media as $m) {
    if (!is_array($m)
        || !valid_id($m['id'] ?? null)) {
      fail('Неверное вложение');
    }
    $meta = read('media/' . $m['id']);
    if (!$meta) fail('Файл не найден');
    $clean[] = [
      'id' => $m['id'],
      'type' => $meta['type'],
      'name' => text_value($m, 'name', 1000)
    ];
  }
  $id = $d['id'] ?? null;
  $date = gmdate('Y-m-d\TH:i:s\Z');
  if ($id) {
    if (!valid_id($id)) fail('Неверный ID');
    $old = read('posts/' . $id);
    if (!$old) fail('Новость удалена', 404);
    $date = $old['date'];
  } else {
    $id = uuid();
  }
  $post = [
    'id' => $id, 'date' => $date,
    'title' => $title, 'body' => $body,
    'media' => $clean
  ];
  save('posts/' . $id, $post);
  answer(['post' => $post]);
}
