<?php
if (!defined('PASTUKH')) exit;

function project_templates() {
  $titles = [
    'passport' => 'Паспорт проекта',
    'team' => 'Команда проекта',
    'prototype' => 'Прототип в действии',
    'trials' => 'Дневник испытаний',
    'pilot' => 'Участие хозяйств в пилоте',
    'materials' => 'Материалы проекта',
    'faq' => 'Вопросы о системе',
    'capabilities' => 'Готовность возможностей'
  ];
  $blocks = [];
  foreach ($titles as $id => $title) {
    $blocks[] = [
      'id' => $id,
      'title' => $title,
      'body' => '',
      'links' => [],
      'media' => [],
      'status' => 'draft'
    ];
  }
  return $blocks;
}

function project_safe_url($url) {
  if (!is_string($url)
      || strlen($url) > 2000
      || preg_match('/[\x00-\x20\x7f]/', $url)) {
    return false;
  }
  if (preg_match('/^#[a-z][a-z0-9-]*$/D',
      $url)) {
    return true;
  }
  // Only explicitly public local paths.
  if (preg_match(
      '~^/news\.html(?:\?kind=(?:trial|trial-plan|news))?(?:#post-[a-f0-9-]{36})?$~D',
      $url)) {
    return true;
  }
  if (preg_match(
      '~^/assets/[a-zA-Z0-9_-][a-zA-Z0-9_./-]*$~D',
      $url)) {
    return strpos($url, '..') === false;
  }
  if (!filter_var($url, FILTER_VALIDATE_URL)) {
    return false;
  }
  $parts = parse_url($url);
  return is_array($parts)
    && ($parts['scheme'] ?? '') === 'https'
    && !empty($parts['host'])
    && !isset($parts['user'])
    && !isset($parts['pass']);
}

function project_publishable($block) {
  if (!is_array($block)
      || !is_string($block['title'] ?? null)
      || trim($block['title']) === ''
      || !is_string($block['body'] ?? null)
      || strlen(trim($block['body'])) < 30
      || !is_array($block['links'] ?? null)
      || !is_array($block['media'] ?? null)) {
    return false;
  }
  foreach ($block['links'] as $link) {
    if (!is_array($link)
        || !is_string($link['label'] ?? null)
        || trim($link['label']) === ''
        || !project_safe_url(
          $link['url'] ?? null)) {
      return false;
    }
  }
  foreach ($block['media'] as $media) {
    if (!is_array($media)
        || !valid_id($media['id'] ?? null)
        || !is_string($media['name'] ?? null)
        || !in_array($media['type'] ?? null,
          ['image', 'video'], true)
        || !read('media/' . $media['id'])) {
      return false;
    }
  }
  return true;
}

function project_blocks() {
  $saved = read('project-content');
  $blocks = project_templates();
  if (!is_array($saved)
      || !is_array($saved['blocks'] ?? null)) {
    return $blocks;
  }
  foreach ($blocks as &$template) {
    foreach ($saved['blocks'] as $block) {
      if (is_array($block)
          && ($block['id'] ?? null)
            === $template['id']) {
        $template = array_replace($template,
          array_intersect_key($block, $template));
        break;
      }
    }
  }
  unset($template);
  return $blocks;
}

function project_media_public($id) {
  if (!valid_id($id)) return false;
  foreach (project_blocks() as $block) {
    if (($block['status'] ?? '')
        !== 'published'
        || !project_publishable($block)) {
      continue;
    }
    foreach ($block['media'] as $media) {
      if ($media['id'] === $id) return true;
    }
  }
  return false;
}

function project_clean_media($media) {
  if (!is_array($media)
      || count($media) > 6) {
    fail('Допустимо до 6 вложений в разделе');
  }
  $safe = [];
  $ids = [];
  foreach ($media as $item) {
    if (!is_array($item)
        || !valid_id($item['id'] ?? null)
        || isset($ids[$item['id']])) {
      fail('Неверное или повторное вложение');
    }
    $meta = read('media/' . $item['id']);
    if (!$meta || !in_array($meta['type'],
        ['image', 'video'], true)) {
      fail('Вложение не найдено');
    }
    $ids[$item['id']] = true;
    $name = trim(text_value(
      $item, 'name', 1000));
    if ($name === '') {
      fail('Укажите название вложения');
    }
    $safe[] = [
      'id' => $item['id'],
      'type' => $meta['type'],
      'name' => $name
    ];
  }
  return $safe;
}

function project_clean_blocks($input) {
  $templates = project_templates();
  if (!is_array($input)
      || count($input) !== count($templates)) {
    fail('Передайте все разделы проекта');
  }
  $known = array_column($templates, 'id');
  $clean = [];
  foreach ($input as $block) {
    if (!is_array($block)) {
      fail('Неверный формат раздела');
    }
    $id = $block['id'] ?? null;
    if (!is_string($id)
        || !in_array($id, $known, true)
        || isset($clean[$id])) {
      fail('Неверный или повторный раздел');
    }
    $status = $block['status'] ?? '';
    if (!in_array($status,
        ['draft', 'published'], true)) {
      fail('Выберите статус раздела');
    }
    $title = trim(text_value(
      $block, 'title', 640));
    $body = trim(text_value(
      $block, 'body', 20000));
    $links = $block['links'] ?? null;
    if (!is_array($links)
        || count($links) > 6) {
      fail('Допустимо до 6 ссылок в разделе');
    }
    $safe = [];
    foreach ($links as $link) {
      if (!is_array($link)) {
        fail('Проверьте формат ссылки');
      }
      $label = trim(text_value(
        $link, 'label', 320));
      $url = trim(text_value(
        $link, 'url', 2000));
      if ($label === ''
          || !project_safe_url($url)) {
        fail('У ссылки нужны подпись и адрес '
          . 'HTTPS или публичный путь сайта');
      }
      $safe[] = ['label' => $label,
        'url' => $url];
    }
    $media = project_clean_media(
      $block['media'] ?? []);
    $value = [
      'id' => $id, 'title' => $title,
      'body' => $body, 'links' => $safe,
      'media' => $media,
      'status' => $status
    ];
    if ($status === 'published'
        && !project_publishable($value)) {
      fail('Для публикации заполните заголовок '
        . 'и содержательное описание раздела');
    }
    $clean[$id] = $value;
  }
  $ordered = [];
  foreach ($known as $id) {
    $ordered[] = $clean[$id];
  }
  return $ordered;
}

function project_action($method) {
  if ($method === 'GET') {
    $scope = $_GET['scope'] ?? '';
    if ($scope === 'admin') {
      require_admin();
      answer(['blocks' => project_blocks()]);
    }
    if ($scope !== '') fail('Неверный режим');
    $published = [];
    foreach (project_blocks() as $block) {
      if (($block['status'] ?? '')
          === 'published'
          && project_publishable($block)) {
        $published[] = $block;
      }
    }
    answer(['blocks' => $published]);
  }
  require_admin();
  if ($method !== 'PUT') {
    fail('Метод не поддерживается', 405);
  }
  csrf();
  $data = input();
  $blocks = project_clean_blocks(
    $data['blocks'] ?? null);
  save('project-content', [
    'blocks' => $blocks,
    'updatedAt' => gmdate('c')
  ]);
  answer(['blocks' => $blocks]);
}
