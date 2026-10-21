import {
  token,
  digest,
  store,
  json,
  clearCookie,
  sameOrigin,
} from '../auth.js';
export async function POST(r) {
  if (!sameOrigin(r))
    return json(
      { error: 'Недопустимый запрос' },
      403,
    );
  const t = token(r);
  if (t)
    await store().delete(
      'auth/sessions/' +
        (await digest(t)),
    );
  return json(
    { ok: true },
    200,
    clearCookie(),
  );
}
