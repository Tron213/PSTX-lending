import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { dataDir } from './config.js';
function location(key) {
  if (
    !/^[a-zA-Z0-9_/-]+$/.test(key) ||
    key.includes('..')
  )
    throw Error('Invalid storage key');
  return path.join(dataDir, key);
}
async function metadata(file) {
  try {
    return JSON.parse(
      await fs.readFile(
        file + '.meta',
        'utf8',
      ),
    );
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}
async function object(key, options = {}) {
  const file = location(key);
  let stat;
  try {
    stat = await fs.stat(file);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
  const meta = await metadata(file);
  const obj = {
    size: stat.size,
    httpMetadata: meta,
    httpEtag:
      '"' +
      stat.size +
      '-' +
      stat.mtimeMs +
      '"',
    json: async () =>
      JSON.parse(
        await fs.readFile(file, 'utf8'),
      ),
    writeHttpMetadata(headers) {
      for (const [k, v] of Object.entries(
        meta,
      )) {
        if (k === 'contentType')
          headers.set('Content-Type', v);
      }
    },
  };
  const header =
    options.range?.get('range');
  let start = 0,
    end = stat.size - 1;
  if (header) {
    const match =
      /^bytes=(\d*)-(\d*)$/.exec(header);
    if (
      !match ||
      (!match[1] && !match[2])
    )
      throw Error('Invalid range');
    if (!match[1])
      start = Math.max(
        0,
        stat.size - Number(match[2]),
      );
    else {
      start = Number(match[1]);
      if (match[2])
        end = Math.min(
          end,
          Number(match[2]),
        );
    }
    if (start > end || start >= stat.size)
      throw Error('Invalid range');
    obj.range = {
      offset: start,
      length: end - start + 1,
    };
  }
  Object.defineProperty(obj, 'body', {
    get() {
      return Readable.toWeb(
        createReadStream(file, {
          start,
          end,
        }),
      );
    },
  });
  return obj;
}
const bucket = {
  get: object,
  async head(key) {
    return object(key);
  },
  async put(key, value, options = {}) {
    const file = location(key);
    await fs.mkdir(path.dirname(file), {
      recursive: true,
    });
    const temp =
      file +
      '.' +
      crypto.randomUUID() +
      '.tmp';
    try {
      if (value?.getReader) {
        await pipeline(
          Readable.fromWeb(value),
          (
            await import('node:fs')
          ).createWriteStream(temp),
        );
      } else {
        await fs.writeFile(temp, value);
      }
      if (options.httpMetadata)
        await fs.writeFile(
          file + '.meta',
          JSON.stringify(
            options.httpMetadata,
          ),
        );
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, { force: true });
    }
  },
  async delete(key) {
    const file = location(key);
    await fs.rm(file, { force: true });
    await fs.rm(file + '.meta', {
      force: true,
    });
  },
  async list({ prefix }) {
    const dir = location(prefix);
    let names;
    try {
      names = await fs.readdir(dir);
    } catch (e) {
      if (e.code === 'ENOENT')
        return {
          objects: [],
          truncated: false,
        };
      throw e;
    }
    return {
      objects: names
        .filter((n) => !n.includes('.'))
        .map((n) => ({
          key: prefix + n,
        })),
      truncated: false,
    };
  },
};
export const env = { BUCKET: bucket };
