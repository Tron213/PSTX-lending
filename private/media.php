<?php
if (!defined('PASTUKH')) exit;
function upload_action($method) {
  if ($method !== 'POST') {
    fail('Метод не поддерживается', 405);
  }
  require_admin();
  csrf();
  $mime = $_SERVER['CONTENT_TYPE'] ?? '';
  $types = ['image/jpeg', 'image/png',
    'image/webp', 'image/gif', 'video/mp4',
    'video/webm', 'video/quicktime'];
  if (!in_array($mime, $types, true)) {
    fail('Формат не поддерживается');
  }
  $type = strpos($mime, 'image/') === 0
    ? 'image' : 'video';
  $limit = ($type === 'image' ? 10 : 50)
    * 1024 * 1024;
  $id = uuid();
  $dir = STORE . 'blobs/';
  if (!is_dir($dir)) mkdir($dir, 0700, true);
  $path = $dir . $id . '.php';
  $in = fopen('php://input', 'rb');
  $out = fopen($path, 'wb');
  if (!$in || !$out) {
    throw new RuntimeException('Upload');
  }
  fwrite($out, PREFIX);
  $size = stream_copy_to_stream(
    $in, $out, $limit + 1
  );
  fclose($out);
  fclose($in);
  if (!$size || $size > $limit) {
    unlink($path);
    fail('Слишком большой или пустой файл',
      413);
  }
  save('media/' . $id, [
    'type' => $type,
    'mime' => $mime, 'size' => $size
  ]);
  answer(['id' => $id, 'type' => $type]);
}
function media_action($method) {
  if ($method !== 'GET') {
    fail('Метод не поддерживается', 405);
  }
  $id = $_GET['id'] ?? '';
  if (!valid_id($id)) fail('Не найдено', 404);
  $meta = read('media/' . $id);
  if (!$meta) fail('Не найдено', 404);
  $file = STORE . 'blobs/' . $id . '.php';
  if (!is_file($file)) fail('Не найдено', 404);
  $size = $meta['size'];
  $start = 0;
  $end = $size - 1;
  $range = $_SERVER['HTTP_RANGE'] ?? '';
  if ($range !== '') {
    $regex = '/^bytes=(\d*)-(\d*)$/D';
    if (!preg_match($regex, $range, $m)
        || ($m[1] === '' && $m[2] === '')) {
      fail('Неверный диапазон', 416);
    }
    if ($m[1] === '') {
      $start = max(0, $size - intval($m[2]));
    } else {
      $start = intval($m[1]);
      if ($m[2] !== '') {
        $end = min($end, intval($m[2]));
      }
    }
    if ($start > $end || $start >= $size) {
      header('Content-Range: bytes */' . $size);
      fail('Неверный диапазон', 416);
    }
    http_response_code(206);
    header('Content-Range: bytes ' . $start
      . '-' . $end . '/' . $size);
  }
  header('Content-Type: ' . $meta['mime']);
  header('Accept-Ranges: bytes');
  header('Content-Length: ' . ($end-$start+1));
  session_write_close();
  $fp = fopen($file, 'rb');
  fseek($fp, strlen(PREFIX) + $start);
  $left = $end - $start + 1;
  while ($left > 0 && !feof($fp)) {
    $chunk = fread($fp, min(65536, $left));
    if ($chunk === false || $chunk === '') break;
    echo $chunk;
    $left -= strlen($chunk);
  }
  fclose($fp);
  exit;
}
