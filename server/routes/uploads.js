import { isAdmin } from '../auth.js';
import { env } from '../storage.js';
export async function POST(r) {
  if (
    !(await isAdmin(r)) ||
    r.headers.get('origin') !==
      new URL(r.url).origin
  )
    return Response.json(
      { error: 'Нет доступа' },
      { status: 403 },
    );
  const type =
    r.headers.get('content-type') || '';
  const types = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  if (!types.includes(type))
    return Response.json(
      {
        error: 'Формат не поддерживается',
      },
      { status: 400 },
    );
  const max = type.startsWith('image/')
    ? 10 * 1024 * 1024
    : 50 * 1024 * 1024;
  const size = Number(
    r.headers.get('content-length'),
  );
  if (!size || size > max)
    return Response.json(
      {
        error:
          'Слишком большой или пуст' +
          'ой файл',
      },
      { status: 413 },
    );
  const id = crypto.randomUUID();
  await env.BUCKET.put(
    'news/media/' + id,
    r.body,
    {
      httpMetadata: { contentType: type },
    },
  );
  return Response.json({
    id,
    type: type.startsWith('image/')
      ? 'image'
      : 'video',
  });
}
