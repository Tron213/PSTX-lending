import { env } from '../storage.js';
const bucket = () => env.BUCKET;
import { isAdmin as editor } from '../auth.js';
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
export async function GET(r) {
  const posts = [];
  let cursor;
  do {
    const list = await bucket().list({
      prefix: 'news/posts/',
      cursor,
    });
    const rows = await Promise.all(
      list.objects.map(async (o) => {
        const obj = await bucket().get(
          o.key,
        );
        return obj ? obj.json() : null;
      }),
    );
    posts.push(...rows.filter(Boolean));
    cursor = list.truncated
      ? list.cursor
      : undefined;
  } while (cursor);
  return json({
    posts: posts.sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
    canEdit: await editor(r),
  });
}
export async function POST(r) {
  if (!(await editor(r)))
    return json(
      {
        error: 'Нет доступа к редактору',
      },
      403,
    );
  if (
    r.headers.get('origin') !==
    new URL(r.url).origin
  )
    return json(
      { error: 'Недопустимый запрос' },
      403,
    );
  const d = await r.json();
  if (
    typeof d.title !== 'string' ||
    !d.title.trim() ||
    d.title.length > 160 ||
    typeof d.body !== 'string' ||
    !d.body.trim() ||
    d.body.length > 20000 ||
    !Array.isArray(d.media) ||
    d.media.length > 6
  )
    return json(
      {
        error:
          'Проверьте заголовок, тек' +
          'ст и вложения',
      },
      400,
    );
  for (const m of d.media) {
    if (
      !/^[0-9a-f-]{36}$/.test(m.id) ||
      !['image', 'video'].includes(
        m.type,
      ) ||
      typeof m.name !== 'string' ||
      m.name.length > 250
    )
      return json(
        {
          error: 'Некорректное вложение',
        },
        400,
      );
    const obj = await bucket().head(
      'news/media/' + m.id,
    );
    if (
      !obj ||
      !obj.httpMetadata?.contentType?.startsWith(
        m.type + '/',
      )
    )
      return json(
        { error: 'Вложение не найдено' },
        400,
      );
  }
  let id = crypto.randomUUID(),
    date = new Date().toISOString();
  if (d.id) {
    if (!/^[0-9a-f-]{36}$/.test(d.id))
      return json(
        {
          error:
            'Некорректная публикация',
        },
        400,
      );
    const old = await bucket().get(
      'news/posts/' + d.id,
    );
    if (!old)
      return json(
        { error: 'Публикация удалена' },
        404,
      );
    id = d.id;
    date = (await old.json()).date;
  }
  const post = {
    id,
    date,
    title: d.title.trim(),
    body: d.body.trim(),
    media: d.media,
  };
  await bucket().put(
    'news/posts/' + id,
    JSON.stringify(post),
  );
  return json({ post });
}
export async function DELETE(r) {
  if (
    !(await editor(r)) ||
    r.headers.get('origin') !==
      new URL(r.url).origin
  )
    return json(
      { error: 'Нет доступа' },
      403,
    );
  const id = new URL(
    r.url,
  ).searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/.test(id))
    return json(
      { error: 'Некорректный ID' },
      400,
    );
  await bucket().delete(
    'news/posts/' + id,
  );
  return json({ ok: true });
}
