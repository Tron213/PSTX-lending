<?php
if (!defined('PASTUKH')) exit;
function auth_action($action, $method) {
  if ($action === 'credentials'
      && $method === 'GET') {
    require_admin();
    answer(['username' =>
      read('account')['username']]);
  }
  if ($method !== 'POST') {
    fail('Метод не поддерживается', 405);
  }
  csrf();
  if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    setcookie('pastukh_session', '', [
      'expires' => 1, 'path' => '/',
      'httponly' => true,
      'samesite' => 'Strict'
    ]);
    answer(['ok' => true]);
  }
  if ($action === 'credentials') {
    require_admin();
  }
  limit_login();
  $d = input();
  $account = read('account');
  if ($action === 'setup' && $account) {
    fail('Администратор уже создан', 409);
  }
  $username = text_value($d, 'username', 64);
  $password = text_value($d, 'password', 128);
  if ($action === 'login') {
    $ok = $account
      && password_verify($password,
        $account['hash'])
      && hash_equals($account['username'],
        trim($username));
    if (!$ok) {
      bad_login();
      fail('Неверный логин или пароль', 401);
    }
    login_session($account);
    save(attempt_key(), [
      'count' => 0, 'until' => 0
    ]);
    answer(['ok' => true]);
  }
  if ($action === 'setup') {
    $token = text_value($d, 'token', 128);
    $setup = read('setup-key');
    if (!$setup || !hash_equals(
        $setup['token'], trim($token))) {
      bad_login();
      fail('Неверный ключ настройки', 403);
    }
  } elseif ($action === 'credentials') {
    $old = text_value($d,
      'currentPassword', 128);
    if (!password_verify($old,
        $account['hash'])) {
      bad_login();
      fail('Текущий пароль неверен', 403);
    }
  } else {
    fail('Не найдено', 404);
  }
  $pattern = '/^[a-zA-Z0-9_.-]{3,64}$/D';
  if (!preg_match($pattern, $username)
      || strlen($password) < 10) {
    fail('Проверьте логин и пароль');
  }
  $account = [
    'username' => $username,
    'hash' => password_hash($password,
      PASSWORD_DEFAULT),
    'revision' => bin2hex(random_bytes(16))
  ];
  save('account', $account);
  $key = STORE . 'setup-key.php';
  if (is_file($key)) unlink($key);
  login_session($account);
  answer(['ok' => true]);
}
