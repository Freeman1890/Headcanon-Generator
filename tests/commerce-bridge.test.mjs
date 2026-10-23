import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

test('Pages bridge keeps routes valid, preserves Next, and is repeatable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'headcanon-bridge-'));
  try {
    await mkdir(join(directory, '.vercel/output/static/_worker.js'), { recursive: true });
    const entry = join(directory, '.vercel/output/static/_worker.js/index.js');
    const routes = join(directory, '.vercel/output/static/_routes.json');
    await writeFile(entry, 'export default {fetch(){return new Response("next")}}');
    await writeFile(routes, JSON.stringify({ version: 1, include: ['/*', '/api/generate'], exclude: ['/_next/static/*'] }));
    for (let attempt = 0; attempt < 2; attempt++) execFileSync(process.execPath, [resolve('scripts/attach-commerce.mjs')], { cwd: directory, stdio: 'pipe' });
    assert.deepEqual(JSON.parse(await readFile(routes, 'utf8')).include, ['/*']);
    assert.match(await readFile(entry, 'utf8'), /env\.HEADCANON_COMMERCE\.fetch\(request\)/);
    assert.match(await readFile(join(directory, '.vercel/output/static/_worker.js/next-entry.js'), 'utf8'), /new Response\("next"\)/);
  } finally {
    // This fixture directory is created by this test directly inside the OS temp directory.
    assert.equal(resolve(directory).startsWith(resolve(tmpdir()) + (process.platform === 'win32' ? '\\' : '/')), true);
    await rm(directory, { recursive: true, force: true });
  }
});
