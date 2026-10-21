import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from '../server/config.js';
let failures = 0;
function walk(folder) {
  for (const name of fs.readdirSync(
    folder,
  )) {
    if (
      [
        'data',
        '.git',
        'node_modules',
      ].includes(name)
    )
      continue;
    const file = path.join(folder, name);
    if (fs.statSync(file).isDirectory()) {
      walk(file);
      continue;
    }
    const text = fs.readFileSync(
      file,
      'utf8',
    );
    for (const [index, line] of text
      .split('\n')
      .entries()) {
      if ([...line].length > 50) {
        console.error(
          path.relative(root, file),
          index + 1,
          '> 50',
        );
        failures++;
      }
    }
    if (file.endsWith('.js')) {
      const result = spawnSync(
        process.execPath,
        ['--check', file],
        { encoding: 'utf8' },
      );
      if (result.status !== 0) {
        console.error(result.stderr);
        failures++;
      }
    }
  }
}
walk(root);
if (failures) process.exit(1);
console.log(
  'OK: синтаксис и строки <' +
    '= 50.',
);
