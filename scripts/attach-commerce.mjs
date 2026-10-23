import { readFile, writeFile, rename, access } from 'node:fs/promises';
const directory = '.vercel/output/static/_worker.js';
const entry = `${directory}/index.js`;
const current = await readFile(entry, 'utf8');
if (!current.includes('Headcanon same-origin commerce bridge')) {
  await rename(entry, `${directory}/next-entry.js`);
  await writeFile(entry, `// Headcanon same-origin commerce bridge. Generated after next-on-pages.\nimport nextWorker from './next-entry.js';\nexport default { async fetch(request, env, ctx) {\n  const url = new URL(request.url);\n  if (url.pathname.startsWith('/api/')) {\n    if (!env.HEADCANON_COMMERCE) return Response.json({error:'The account service is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}});\n    return env.HEADCANON_COMMERCE.fetch(request);\n  }\n  return nextWorker.fetch(request, env, ctx);\n} };\n`);
}
const routesPath = '.vercel/output/static/_routes.json';
await access(routesPath);
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
if (routes.include.includes('/*')) routes.include = ['/*'];
else {
  routes.include = routes.include.filter(route => !route.startsWith('/api/'));
  routes.include.push('/api/*');
}
await writeFile(routesPath, JSON.stringify(routes, null, 2));
console.log('Same-origin account service bridge attached.');
