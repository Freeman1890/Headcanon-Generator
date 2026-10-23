import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/worker.ts'], outfile: 'dist/worker.mjs', bundle: true,
  format: 'esm', platform: 'browser', target: 'es2022', conditions: ['workerd', 'worker', 'browser'],
  external: ['node:*', 'cloudflare:*'],
  plugins: [{ name: 'starter-cloud-adapters', setup(builder) {
    builder.onResolve({ filter: /^crypto$/ }, () => ({ path: 'node:crypto', external: true }));
    builder.onResolve({ filter: /^\.\/db$/ }, () => ({ path: resolve('src/server/db.cloud.ts') }));
  } }],
});
