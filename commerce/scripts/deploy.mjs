import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
if (process.env.CF_PAGES !== '1' && process.env.WORKERS_CI !== '1') {
  throw new Error('Production deployment is allowed only from Cloudflare Builds.');
}
const branch = process.env.CF_PAGES_BRANCH || process.env.WORKERS_CI_BRANCH;
if (branch !== 'main') throw new Error('Only main may deploy production commerce.');
const required = ['SESSION_SECRET', 'ACCOUNT_ROUTING_SECRET', 'KIE_API_KEY', 'RESEND_API_KEY', 'WAFFO_PRIVATE_KEY'];
let directory;
let file;
const args = ['node_modules/wrangler/bin/wrangler.js', 'deploy'];
try {
  if (process.env.HEADCANON_BUILD_SECRETS) {
    const values = JSON.parse(process.env.HEADCANON_BUILD_SECRETS);
    if (required.some(name => typeof values[name] !== 'string' || !values[name])) throw new Error('The initial Headcanon secret bundle is incomplete.');
    directory = await mkdtemp(join(tmpdir(), 'headcanon-build-secrets-'));
    file = join(directory, 'secrets.json');
    await writeFile(file, JSON.stringify(Object.fromEntries(required.map(name => [name, values[name]]))), { mode: 0o600 });
    args.push('--secrets-file', file);
  }
  const env = { ...process.env };
  delete env.HEADCANON_BUILD_SECRETS;
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (file) await unlink(file);
  if (directory) await rmdir(directory);
}
