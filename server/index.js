import http from 'node:http';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  host,
  port,
  origin,
} from './config.js';
import { credentials } from './auth.js';
import { route } from './router.js';
await credentials();
const maxBody = 51 * 1024 * 1024;
const server = http.createServer(
  async (req, res) => {
    try {
      const chunks = [];
      let total = 0;
      for await (const part of req) {
        total += part.length;
        if (total > maxBody) {
          res.writeHead(413);
          res.end('File is too large');
          return;
        }
        chunks.push(part);
      }
      const headers = new Headers();
      for (const [
        key,
        value,
      ] of Object.entries(req.headers)) {
        if (value)
          headers.set(
            key,
            Array.isArray(value)
              ? value.join(',')
              : value,
          );
      }
      // Never trust an IP sent by the client.
      headers.set(
        'cf-connecting-ip',
        req.socket.remoteAddress ||
          'local',
      );
      const body = Buffer.concat(chunks);
      if (body.length)
        headers.set(
          'content-length',
          String(body.length),
        );
      const request = new Request(
        new URL(req.url, origin),
        {
          method: req.method,
          headers,
          ...(body.length
            ? { body }
            : {}),
        },
      );
      const response =
        await route(request);
      res.writeHead(
        response.status,
        Object.fromEntries(
          response.headers,
        ),
      );
      if (
        req.method === 'HEAD' ||
        !response.body
      ) {
        res.end();
        return;
      }
      await pipeline(
        Readable.fromWeb(response.body),
        res,
      );
    } catch (error) {
      console.error(error.message);
      if (!res.headersSent)
        res.writeHead(500, {
          'Content-Type':
            'application/json',
        });
      res.end(
        JSON.stringify({
          error:
            'Ошибка сервера. Смотрите' +
            ' терминал.',
        }),
      );
    }
  },
);
server.requestTimeout = 120000;
server.listen(port, host, () =>
  console.log(
    'ПАСТУХ: ' +
      origin +
      '',
  ),
);
