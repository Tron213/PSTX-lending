import { env } from '../server/storage.js';
import {
  passwordHash,
  random,
} from '../server/auth.js';
const key = 'auth/credentials';
if (await env.BUCKET.get(key)) {
  console.log(
    'Администратор уже создан' +
      '.',
  );
  console.log(
    'Измените данные в админ-' +
      'панели.',
  );
  process.exit(0);
}
const password = random().slice(0, 20);
const salt = random();
await env.BUCKET.put(
  key,
  JSON.stringify({
    username: 'admin',
    salt,
    hash: await passwordHash(
      password,
      salt,
    ),
    revision: random(),
  }),
);
console.log('Логин: admin');
console.log('Пароль: ' + password);
console.log(
  'Сохраните пароль перед з' +
    'акрытием окна.',
);
