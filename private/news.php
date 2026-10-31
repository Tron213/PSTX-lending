<?php
if (!defined('PASTUKH')) exit;
function news_published($post) {
  return ($post['status'] ?? 'published')
    === 'published';
}
function news_media_public($id) {
  foreach (glob(STORE . 'posts/*.php')
      ?: [] as $file) {
    $post = read('posts/'
      . basename($file, '.php'));
    if (!$post || !news_published($post)) {
      continue;
    }
    foreach ($post['media'] ?? [] as $m) {
      if (($m['id'] ?? '') === $id) {
        return true;
      }
    }
  }
  return false;
}
function news_trial($data, $kind, $status) {
  $keys = ['goal', 'conditions', 'reading',
    'reference', 'conclusion', 'next'];
  $data = $data ?? [];
  if (!is_array($data)) {
    fail('Неверный формат испытания');
  }
  $trial = [];
  foreach ($keys as $key) {
    $trial[$key] = trim(text_value(
      $data + [$key => ''], $key, 8000
    ));
  }
  if ($status !== 'published'
      || $kind === 'news') return $trial;
  $required = $kind === 'trial-plan'
    ? ['goal', 'conditions', 'next']
    : ['goal', 'conditions', 'reading',
      'conclusion'];
  foreach ($required as $key) {
    if ($trial[$key] === '') {
      fail('Заполните обязательные поля '
        . 'испытания или сохраните черновик');
    }
  }
  return $trial;
}
function news_action($method) {
  if ($method === 'GET') {
    $internal = ($_GET['scope'] ?? '')
      === 'admin';
    if ($internal) require_admin();
    $id = $_GET['id'] ?? '';
    if ($id !== '' && !valid_id($id)) {
      fail('Не найдено', 404);
    }
    $posts = [];
    foreach (glob(STORE . 'posts/*.php')
        ?: [] as $file) {
      $post = read('posts/'
        . basename($file, '.php'));
      if (!$post) continue;
      if (!$internal
          && !news_published($post)) {
        continue;
      }
      if ($id !== ''
          && ($post['id'] ?? '') !== $id) {
        continue;
      }
      $post['status'] = $post['status']
        ?? 'published';
      $post['kind'] = $post['kind'] ?? 'news';
      $posts[] = $post;
    }
    if ($id !== '' && !$posts) {
      fail('Не найдено', 404);
    }
    usort($posts, function ($a, $b) {
      return strcmp($b['date'], $a['date']);
    });
    answer(['posts' => $posts,
      'canEdit' => $internal && admin()]);
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
  $status = $d['status'] ?? 'published';
  $kind = $d['kind'] ?? 'news';
  if (!in_array($status,
      ['draft', 'published'], true)
      || !in_array($kind,
      ['news', 'trial', 'trial-plan'], true)) {
    fail('Неверный тип или статус новости');
  }
  $media = $d['media'] ?? null;
  if (($status === 'published'
      && ($title === '' || $body === ''))
      || !is_array($media)
      || count($media) > 6) {
    fail('Для публикации заполните '
      . 'заголовок и текст');
  }
  $trial = news_trial($d['trial'] ?? null,
    $kind, $status);
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
  $firstPublication = null;
  if ($id) {
    if (!valid_id($id)) fail('Неверный ID');
    $old = read('posts/' . $id);
    if (!$old) fail('Новость удалена', 404);
    $firstPublication = $old['publishedAt']
      ?? (news_published($old)
        ? $old['date'] : null);
    $date = $old['date'];
  } else {
    $id = uuid();
  }
  if ($status === 'published') {
    if ($firstPublication === null) {
      $firstPublication =
        gmdate('Y-m-d\TH:i:s\Z');
    }
    $date = $firstPublication;
  }
  $post = [
    'id' => $id, 'date' => $date,
    'title' => $title, 'body' => $body,
    'status' => $status, 'kind' => $kind,
    'trial' => $trial, 'media' => $clean,
    'publishedAt' => $firstPublication
  ];
  save('posts/' . $id, $post);
  answer(['post' => $post]);
}
