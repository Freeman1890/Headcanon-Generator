import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { createHash } from 'node:crypto';

const source = resolve(process.argv[2] || '');
const target = resolve('commerce');
if (!existsSync(resolve(source, 'src/server/api.ts'))) throw new Error('An explicit, readable starter path is required.');
if (existsSync(resolve(target, 'source-manifest.json'))) throw new Error('The extraction already exists; adapt the derived files, not the starter.');
const require = createRequire(resolve(source, 'package.json'));
const ts = require('typescript');
const records = [];
const visited = new Set();
function copy(path) {
  if (visited.has(path)) return;
  visited.add(path);
  const contents = readFileSync(resolve(source, path), 'utf8');
  const output = resolve(target, path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, contents);
  records.push({ source: path, target: relative(target, output).replaceAll('\\', '/'), sha256: createHash('sha256').update(contents).digest('hex') });
  if (extname(path) !== '.ts' && extname(path) !== '.tsx') return;
  const tree = ts.createSourceFile(path, contents, ts.ScriptTarget.Latest, true);
  for (const node of tree.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    const specifier = node.moduleSpecifier?.text;
    if (!specifier?.startsWith('.')) continue;
    const absolute = resolve(source, dirname(path), specifier);
    const dependency = [absolute, `${absolute}.ts`, `${absolute}.tsx`, `${absolute}.json`, resolve(absolute, 'index.ts')].find(existsSync);
    if (!dependency) throw new Error(`Cannot resolve ${path}: ${specifier}`);
    copy(relative(source, dependency).replaceAll('\\', '/'));
  }
}
for (const entry of ['src/server/billing.ts', 'src/server/billing-recovery.ts', 'src/server/db.cloud.ts', 'src/server/db.ts', 'src/server/admin-account.ts', 'src/cloudflare/routing.ts', 'src/cloudflare/user-directory.ts']) copy(entry);

const authNames = new Set(['Row', 'Session', 'SESSION_COOKIE', 'previewSessionSecret', 'HttpError', 'appMode', 'now', 'iso', 'addDays', 'getOrigin', 'sessionSecret', 'hash', 'sign', 'constantTimeEqual', 'id', 'json', 'withCookie', 'sessionCookie', 'clearSessionCookie', 'readCookie', 'csrfTokenForSession', 'getSession', 'requireSession', 'requireOrigin', 'requireMutation', 'userRow', 'publicUser', 'authenticatedEmail', 'normalizeEmail', 'bodyJson', 'createSession', 'requestEmailCode', 'verifyEmailCode', 'logout', 'reserveChildCredits', 'reservedAmount']);
const raw = readFileSync(resolve(source, 'src/server/api.ts'), 'utf8');
const tree = ts.createSourceFile('api.ts', raw, ts.ScriptTarget.Latest, true);
const chosen = tree.statements.filter(node => authNames.has(node.name?.text) || ts.isVariableStatement(node) && node.declarationList.declarations.some(item => authNames.has(item.name.getText(tree))));
const identifiers = new Set();
for (const node of chosen) {
  const visit = item => { if (ts.isIdentifier(item)) identifiers.add(item.text); ts.forEachChild(item, visit); };
  visit(node);
}
const imports = [];
for (const node of tree.statements.filter(ts.isImportDeclaration)) {
  const clause = node.importClause;
  if (!clause) continue;
  const name = clause.name && identifiers.has(clause.name.text) ? clause.name.text : null;
  const bindings = clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.filter(item => identifiers.has(item.name.text)).map(item => item.getText(tree)) : [];
  if (!name && !bindings.length) continue;
  const specifier = node.moduleSpecifier.text;
  imports.push(`import ${clause.isTypeOnly ? 'type ' : ''}${[name, bindings.length ? `{ ${bindings.join(', ')} }` : null].filter(Boolean).join(', ')} from '${specifier}';`);
  if (specifier.startsWith('.')) {
    const base = resolve(source, 'src/server', specifier);
    const file = [base, `${base}.ts`, `${base}.json`].find(existsSync);
    if (file) copy(relative(source, file).replaceAll('\\', '/'));
  }
}
const exports = [...authNames].filter(name => !['Row', 'Session', 'previewSessionSecret', 'SESSION_COOKIE'].includes(name));
const auth = `// Extracted from the starter's email/session/credit implementation. See source-manifest.json.\n${imports.join('\n')}\nimport { stateFor } from './account-state';\n${chosen.map(node => node.getText(tree).replace(/^export\s+/, '')).join('\n\n')}\nexport { ${exports.join(', ')} };\n`;
writeFileSync(resolve(target, 'src/server/auth.ts'), auth);
records.push({ source: 'src/server/api.ts', target: 'src/server/auth.ts', extraction: [...authNames], sha256: createHash('sha256').update(raw).digest('hex') });
writeFileSync(resolve(target, 'source-manifest.json'), JSON.stringify({ description: 'Selective Headcanon adaptation; no source secrets, production data, media, or deployment configuration copied.', source: 'website-template', files: records }, null, 2) + '\n');
console.log(`Extracted ${records.length} source modules. No external service was called.`);
