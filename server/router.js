import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from './config.js';
import { isAdmin } from './auth.js';
import * as news from './routes/news.js';
import * as uploads from './routes/uploads.js';
import * as media from './routes/media.js';
import * as login from './routes/login.js';
import * as logout from './routes/logout.js';
import * as credentials
  from './routes/credentials.js';
const routes = {
  '/api/news': news,
  '/api/uploads': uploads,
  '/api/admin/login': login,
  '/api/admin/logout': logout,
  '/api/admin/credentials': credentials,
};
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js':
    'text/javascript; charset' + '=utf-8',
  '.svg': 'image/svg+xml',
  '.txt':
    'text/plain; charset=utf-' + '8',
};
async function fileResponse(file) {
  try {
    return new Response(
      await fs.readFile(file),
      {
        headers: {
          'Content-Type':
            types[path.extname(file)] ||
            'application/octet-stream',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options':
            'nosniff',
        },
      },
    );
  } catch (e) {
    if (e.code === 'ENOENT')
      return new Response('Not found', {
        status: 404,
      });
    throw e;
  }
}
export async function route(request) {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(
    url.pathname,
  );
  const found = routes[pathname];
  if (found) {
    const handler = found[request.method];
    return handler
      ? handler(request)
      : new Response(null, {
          status: 405,
        });
  }
  if (
    pathname.startsWith('/api/media/')
  ) {
    if (request.method !== 'GET')
      return new Response(null, {
        status: 405,
      });
    try {
      return await media.GET(request, {
        params: {
          id: pathname.split('/').pop(),
        },
      });
    } catch (e) {
      if (e.message === 'Invalid range')
        return new Response(null, {
          status: 416,
        });
      throw e;
    }
  }
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD'
  )
    return new Response(null, {
      status: 405,
    });
  if (
    pathname === '/admin' ||
    pathname === '/admin/login'
  ) {
    const allowed =
      await isAdmin(request);
    if (pathname === '/admin' && !allowed)
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/admin/login',
        },
      });
    if (
      pathname === '/admin/login' &&
      allowed
    )
      return new Response(null, {
        status: 303,
        headers: { Location: '/admin' },
      });
    return fileResponse(
      path.join(
        root,
        'views',
        allowed
          ? 'admin.html'
          : 'login.html',
      ),
    );
  }
  const name =
    pathname === '/'
      ? '/index.html'
      : pathname === '/news'
        ? '/news.html'
        : pathname;
  const folder = path.join(
    root,
    'public',
  );
  const file = path.resolve(
    folder,
    '.' + name,
  );
  if (!file.startsWith(folder + path.sep))
    return new Response(null, {
      status: 403,
    });
  return fileResponse(file);
}
