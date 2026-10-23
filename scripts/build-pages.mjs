import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { delimiter, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const env = { ...process.env };
if (process.platform === 'win32') {
  const bash = ['C:/Program Files/Git/bin/bash.exe', 'C:/Program Files/Git/usr/bin/bash.exe'].find(existsSync);
  if (!bash) throw new Error('Git Bash is required for the Pages adapter on Windows.');
  const originalPath = process.env.PATH || '';
  for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
  env.PATH = `${dirname(process.execPath)}${delimiter}${dirname(bash)}${delimiter}${originalPath}`;
  env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --import="${new URL('./windows-vercel-links.mjs', import.meta.url).href}"`;
}
if (!existsSync('.vercel/project.json')) {
  await mkdir('.vercel', { recursive: true });
  await writeFile('.vercel/project.json', JSON.stringify({ projectId: '_', orgId: '_', settings: { framework: 'nextjs' } }));
}
for (const args of [
  ['node_modules/vercel/dist/index.js', 'build', '--yes'],
  ['node_modules/@cloudflare/next-on-pages/bin/index.js', '--skip-build'],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
await import('./attach-commerce.mjs');
