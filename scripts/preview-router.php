<?php
// Local PHP preview. Apache uses .htaccess.
$path = rawurldecode(parse_url(
  $_SERVER['REQUEST_URI'], PHP_URL_PATH
));
$blocked = '~^/(?:private|server|scripts|'
  . 'views|tests|public)(?:/|$)~';
if (preg_match($blocked, $path)
    || preg_match('~(?:^|/)\.~', $path)) {
  http_response_code(404);
  exit('Not found');
}
return false;
