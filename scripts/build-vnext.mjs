import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scripts = [
  'build-vnext-home', 'build-vnext-contact', 'build-portfolio',
  'build-vnext-offerings', 'build-vnext-labs', 'build-vnext-demos',
  'build-vnext-sitemap',
];
const args = process.argv.includes('--check') ? ['--check'] : [];
for (const script of scripts) {
  const file = fileURLToPath(new URL(`./${script}.mjs`, import.meta.url));
  const processResult = spawnSync(process.execPath, [file, ...args], { stdio: 'inherit' });
  if (processResult.error) throw processResult.error;
  if (processResult.status !== 0) process.exit(processResult.status ?? 1);
}
