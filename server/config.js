import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(
  import.meta.url,
);
export const root = path.resolve(
  path.dirname(here),
  '..',
);
export const port = Number(
  process.env.PORT || 3000,
);
export const host =
  process.env.HOST || '127.0.0.1';
export const origin =
  process.env.PUBLIC_URL ||
  'http://localhost:' + port + '';
export const secureCookie =
  origin.startsWith('https:')
    ? 'Secure'
    : '';
export const dataDir = path.resolve(
  root,
  process.env.DATA_DIR || 'data',
);
