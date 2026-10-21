import { env } from './storage.js';
import { secureCookie } from './config.js';
const encoder = new TextEncoder();
export const COOKIE = 'pastukh_admin';
export const store = () => env.BUCKET;
export const hex = (bytes) =>
  Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, '0'),
  ).join('');
export const random = () =>
  hex(
    crypto.getRandomValues(
      new Uint8Array(32),
    ),
  );
export async function digest(s) {
  return hex(
    await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(s),
    ),
  );
}
export async function credentials() {
  const saved = await store().get(
    'auth/credentials',
  );
  if (saved) return saved.json();
  const initial =
    env.ADMIN_INITIAL_CREDENTIALS;
  if (!initial)
    throw Error('Run npm run setup');
  return JSON.parse(initial);
}
export async function passwordHash(
  password,
  salt,
) {
  const key =
    await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
  return hex(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      256,
    ),
  );
}
export function equal(a, b) {
  let diff = a.length ^ b.length;
  for (
    let i = 0;
    i < Math.max(a.length, b.length);
    i++
  )
    diff |=
      (a.charCodeAt(i) || 0) ^
      (b.charCodeAt(i) || 0);
  return diff === 0;
}
export async function checkPassword(
  password,
  c,
) {
  return equal(
    await passwordHash(password, c.salt),
    c.hash,
  );
}
export function token(r) {
  const value = r.headers
    .get('cookie')
    ?.split(';')
    .map((x) => x.trim())
    .find((x) =>
      x.startsWith(COOKIE + '='),
    )
    ?.slice(COOKIE.length + 1);
  return value &&
    /^[a-f0-9]{64}$/.test(value)
    ? value
    : null;
}
export async function session(r) {
  const t = token(r);
  if (!t) return null;
  const obj = await store().get(
    'auth/sessions/' + (await digest(t)),
  );
  if (!obj) return null;
  const s = await obj.json();
  if (
    s.expires <= Date.now() ||
    s.revision !==
      (await credentials()).revision
  )
    return null;
  return s;
}
export async function isAdmin(r) {
  return Boolean(await session(r));
}
export async function createSession(c) {
  const t = random();
  await store().put(
    'auth/sessions/' + (await digest(t)),
    JSON.stringify({
      username: c.username,
      revision: c.revision,
      expires:
        Date.now() + 8 * 60 * 60 * 1000,
    }),
  );
  return (
    '' +
    COOKIE +
    '=' +
    t +
    '; Path=/; HttpOnly; ' +
    secureCookie +
    ('; SameSite=Strict; Max-A' +
      'ge=28800')
  );
}
export const clearCookie = () =>
  '' +
  COOKIE +
  ('=; Path=/; HttpOnly; Sec' +
    'ure; SameSite=Strict; Ma' +
    'x-Age=0');
export function sameOrigin(r) {
  return (
    r.headers.get('origin') ===
    new URL(r.url).origin
  );
}
export const json = (
  data,
  status = 200,
  cookie,
) =>
  Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(cookie
        ? { 'Set-Cookie': cookie }
        : {}),
    },
  });
// Durable backoff by client IP.
// Ignore user-supplied forwarded headers.
export async function attemptKey(r) {
  return (
    'auth/attempts/' +
    (await digest(
      r.headers.get('cf-connecting-ip') ||
        'unknown',
    ))
  );
}
export async function limited(r) {
  const obj = await store().get(
    await attemptKey(r),
  );
  if (!obj) return false;
  const a = await obj.json();
  return (
    a.until > Date.now() && a.count >= 10
  );
}
export async function failed(r) {
  const key = await attemptKey(r),
    obj = await store().get(key);
  let a = obj ? await obj.json() : null;
  if (!a || a.until <= Date.now())
    a = {
      count: 0,
      until: Date.now() + 15 * 60 * 1000,
    };
  a.count++;
  await store().put(
    key,
    JSON.stringify(a),
  );
}
