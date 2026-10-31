import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(
  new URL('../', import.meta.url),
);
const skipped = new Set([
  '.git', '.pastukh', 'data', 'node_modules',
  '.tools', '.qa',
]);
let checked = 0;
let failed = false;
function walk(folder) {
  for (const entry of fs.readdirSync(folder,
    { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    const javascript = /\.m?js$/.test(file);
    const php = file.endsWith('.php');
    if (!javascript && !php) continue;
    const binary = javascript
      ? process.execPath
      : process.env.PHP_BINARY || 'php';
    const result = spawnSync(binary,
      [javascript ? '--check' : '-l', file],
      { encoding: 'utf8' });
    if (result.error || result.status !== 0) {
      failed = true;
      console.error(path.relative(root, file),
        result.error?.message || result.stderr
          || result.stdout);
    }
    checked++;
  }
}
walk(root);
console.log('Проверено файлов: ' + checked);
if (failed) process.exitCode = 1;
