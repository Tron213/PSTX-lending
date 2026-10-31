import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(
  new URL('../', import.meta.url),
);
const executable = process.env.PHP_BINARY
  || 'php';
const child = spawn(executable, [
  '-S', '127.0.0.1:8000',
  'scripts/preview-router.php',
], { cwd: root, stdio: 'inherit' });
child.on('error', () => {
  console.error('Нужен PHP в PATH или PHP_BINARY.');
  process.exitCode = 1;
});
child.on('exit', code => {
  process.exitCode = code || 0;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
