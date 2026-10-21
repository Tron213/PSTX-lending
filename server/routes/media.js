import { env } from '../storage.js';
export async function GET(r, { params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id))
    return new Response(null, {
      status: 404,
    });
  const obj = await env.BUCKET.get(
    'news/media/' + id,
    { range: r.headers },
  );
  if (!obj)
    return new Response(null, {
      status: 404,
    });
  const headers = new Headers({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control':
      'private, max-age=3600',
    'Accept-Ranges': 'bytes',
  });
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  let status = 200;
  if (obj.range) {
    status = 206;
    headers.set(
      'Content-Range',
      'bytes ' +
        obj.range.offset +
        '-' +
        (obj.range.offset +
          obj.range.length -
          1) +
        '/' +
        obj.size +
        '',
    );
    headers.set(
      'Content-Length',
      String(obj.range.length),
    );
  }
  return new Response(obj.body, {
    status,
    headers,
  });
}
