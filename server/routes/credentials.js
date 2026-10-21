import {
  credentials,
  isAdmin,
  checkPassword,
  passwordHash,
  random,
  store,
  json,
  sameOrigin,
  createSession,
  limited,
  failed,
} from '../auth.js';
export async function GET(r) {
  if (!(await isAdmin(r)))
    return json(
      { error: 'Войдите в админ-панель' },
      401,
    );
  return json({
    username: (await credentials())
      .username,
  });
}
export async function POST(r) {
  if (
    !sameOrigin(r) ||
    !(await isAdmin(r))
  )
    return json(
      { error: 'Войдите в админ-панель' },
      401,
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
      !/^[a-zA-Z0-9_.-]{3,64}$/.test(
        d.username,
      ) ||
      typeof d.currentPassword !==
        'string' ||
      d.currentPassword.length > 256 ||
      typeof d.password !== 'string' ||
      d.password.length < 10 ||
      d.password.length > 128
    )
      return json(
        {
          error:
            'Логин: 3–64 символа (лат' +
            'иница, цифры, _, -, точк' +
            'а). Пароль: 10–128 симво' +
            'лов.',
        },
        400,
      );
    if (
      !(await checkPassword(
        d.currentPassword,
        await credentials(),
      ))
    ) {
      await failed(r);
      return json(
        {
          error: 'Текущий пароль неверен',
        },
        400,
      );
    }
    const salt = random();
    const c = {
      username: d.username,
      salt,
      hash: await passwordHash(
        d.password,
        salt,
      ),
      revision: random(),
    };
    await store().put(
      'auth/credentials',
      JSON.stringify(c),
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
          'Не удалось изменить данн' +
          'ые. Попробуйте ещё раз.',
      },
      503,
    );
  }
}
