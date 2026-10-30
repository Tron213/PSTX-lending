<?php
if (!defined('PASTUKH')) {
  http_response_code(404);
  exit;
}
const PREFIX = "<?php exit; ?>\n";
const STORE = __DIR__ . '/../.pastukh/';
function fail($text, $status = 400) {
  http_response_code($status);
  echo json_encode(['error' => $text],
    JSON_UNESCAPED_UNICODE);
  exit;
}
function save($key, $value) {
  $path = STORE . $key . '.php';
  $dir = dirname($path);
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0700, true)) {
      throw new RuntimeException('Storage');
    }
  }
  $temp = tempnam($dir, 'tmp');
  $data = PREFIX . json_encode($value,
    JSON_UNESCAPED_UNICODE);
  try {
    if (file_put_contents($temp, $data)
        === false) {
      throw new RuntimeException('Write');
    }
    if (!rename($temp, $path)) {
      throw new RuntimeException('Rename');
    }
  } finally {
    if (is_file($temp)) unlink($temp);
  }
}
function read($key) {
  $path = STORE . $key . '.php';
  if (!is_file($path)) return null;
  $raw = file_get_contents($path);
  return json_decode(
    substr($raw, strlen(PREFIX)), true
  );
}
function bootstrap() {
  if (!is_dir(STORE)) {
    if (!mkdir(STORE, 0700, true)) {
      throw new RuntimeException('Storage');
    }
  }
  $lock = fopen(STORE . 'lock.php', 'c');
  if (!$lock || !flock($lock, LOCK_EX)) {
    throw new RuntimeException('Lock');
  }
  // Serialize writes and login counters.
  register_shutdown_function(
    function () use ($lock) {
      flock($lock, LOCK_UN);
      fclose($lock);
    }
  );
  if (!read('account') && !read('setup-key')) {
    save('setup-key', [
      'token' => bin2hex(random_bytes(24))
    ]);
  }
  ini_set('session.use_strict_mode', '1');
  session_name('pastukh_session');
  session_set_cookie_params([
    'lifetime' => 28800,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS'])
      && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict'
  ]);
  if (!session_start()) {
    throw new RuntimeException('Session');
  }
}
function admin() {
  $account = read('account');
  return $account
    && ($_SESSION['until'] ?? 0) > time()
    && hash_equals($account['revision'],
      $_SESSION['revision'] ?? '');
}
function require_admin() {
  if (!admin()) {
    fail('Войдите в админ-панель', 401);
  }
}
function csrf() {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $scheme = !empty($_SERVER['HTTPS'])
    && $_SERVER['HTTPS'] !== 'off'
      ? 'https' : 'http';
  $host = $_SERVER['HTTP_HOST'] ?? '';
  if ($origin !== $scheme . '://' . $host) {
    fail('Недопустимый запрос', 403);
  }
}
function input() {
  if (intval($_SERVER['CONTENT_LENGTH']
      ?? 0) > 150000) {
    fail('Слишком большой запрос', 413);
  }
  $raw = file_get_contents('php://input',
    false, null, 0, 150001);
  $data = json_decode($raw, true);
  if (!is_array($data)) {
    fail('Неверный формат запроса');
  }
  return $data;
}
function text_value($data, $key, $max) {
  $value = $data[$key] ?? null;
  if (!is_string($value)
      || strlen($value) > $max) {
    fail('Проверьте введённые данные');
  }
  return $value;
}
function answer($data) {
  echo json_encode($data,
    JSON_UNESCAPED_UNICODE);
  exit;
}
function login_session($account) {
  session_regenerate_id(true);
  $_SESSION['revision'] =
    $account['revision'];
  $_SESSION['until'] = time() + 28800;
}
function attempt_key() {
  return 'attempts/' . hash('sha256',
    $_SERVER['REMOTE_ADDR'] ?? 'local');
}
function limit_login() {
  $a = read(attempt_key());
  if ($a && $a['until'] > time()
      && $a['count'] >= 10) {
    fail('Повторите через 15 минут.', 429);
  }
}
function bad_login() {
  $key = attempt_key();
  $a = read($key);
  if (!$a || $a['until'] <= time()) {
    $a = ['count' => 0,
      'until' => time() + 900];
  }
  $a['count']++;
  save($key, $a);
}
function valid_id($id) {
  return is_string($id)
    && preg_match('/^[a-f0-9-]{36}$/D', $id);
}
function uuid() {
  $s = bin2hex(random_bytes(16));
  return substr($s, 0, 8) . '-'
    . substr($s, 8, 4) . '-'
    . substr($s, 12, 4) . '-'
    . substr($s, 16, 4) . '-'
    . substr($s, 20, 12);
}
