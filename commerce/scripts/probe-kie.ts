import { callKie } from '../src/server/text-generation';
import { mkdir, writeFile } from 'node:fs/promises';
const input = { characterName: 'Mira', secondCharacter: '', workName: '', mode: 'oc' as const };
const start = Date.now();
try {
  const result = await callKie(input);
  const receipt = { provider: 'Kie', model: 'gemini-3-8-flash', requests: 1,
    elapsedMs: Date.now() - start, ...result,
    note: 'One authorized live request. No payment, retry, top-up, or balance read was performed.' };
  await mkdir('../output/paid-setup', { recursive: true });
  await writeFile('../output/paid-setup/kie-probe.json', JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ success: true, count: result.headcanons.length, inputTokens: result.inputTokens, outputTokens: result.outputTokens, providerCredits: result.providerCredits, elapsedMs: receipt.elapsedMs }));
} catch (error) {
  console.error(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error', requests: 1, elapsedMs: Date.now() - start }));
  process.exitCode = 1;
}
