import { randomBytes } from 'node:crypto';
import { parseEnv } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const directory = 'output/paid-setup';
const destination = `${directory}/backend-secrets.json`;
const current = JSON.parse(await readFile(destination, 'utf8').catch(() => '{}'));
const local = parseEnv(await readFile('commerce/.dev.vars', 'utf8'));
const values = {
  SESSION_SECRET: current.SESSION_SECRET || randomBytes(48).toString('base64url'),
  ACCOUNT_ROUTING_SECRET: current.ACCOUNT_ROUTING_SECRET || randomBytes(48).toString('base64url'),
  KIE_API_KEY: local.KIE_API_KEY,
  RESEND_API_KEY: local.RESEND_API_KEY,
  WAFFO_PRIVATE_KEY: await readFile('C:/Users/Freeman/Documents/New project/output/choicervoicer-waffo-live/output/live-setup/waffo-live-private.pem', 'utf8'),
};
if (Object.values(values).some(value => typeof value !== 'string' || !value)) throw new Error('A required backend credential is still missing.');
await mkdir(directory, { recursive: true });
await writeFile(destination, JSON.stringify(values), { mode: 0o600 });
console.log('Headcanon backend secret bundle prepared locally. Values hidden; no network request.');
