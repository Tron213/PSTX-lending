import {
  credentials,
  checkPassword,
  equal,
  createSession,
  json,
  sameOrigin,
  limited,
  failed,
  store,
  attemptKey,
} from '../auth.js';
export async function POST(r) {
  if (!sameOrigin(r))
    return json(
      { error: 'Недопустимый запрос' },
      403,
    );
  try {
    if (await limited(r))
      return json(
        {
          error:
            'Слишком много попыток. П' +
            'овторите через 15 минут.',
        },
        429,
      );
    const d = await r.json();
    if (
      typeof d.username !== 'string' ||
      typeof d.password !== 'string' ||
      d.username.length > 64 ||
      d.password.length > 256
    )
      return json(
        {
          error:
            'Неверный логин или парол' +
            'ь',
        },
        400,
      );
    const c = await credentials();
    const valid = await checkPassword(
      d.password,
      c,
    );
    if (
      !valid ||
      !equal(
        d.username.trim(),
        c.username,
      )
    ) {
      await failed(r);
      return json(
        {
          error:
            'Неверный логин или парол' +
            'ь',
        },
        401,
      );
    }
    await store().delete(
      await attemptKey(r),
    );
    return json(
      { ok: true },
      200,
      await createSession(c),
    );
  } catch {
    return json(
      {
        error:
          'Не удалось выполнить вхо' +
          'д. Попробуйте ещё раз.',
      },
      503,
    );
  }
}
