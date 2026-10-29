import { randomUUID } from 'node:crypto';
import { WaffoPancake, ScanSemanticMode } from '@waffo/pancake-ts';
import { getDb } from './db';
import { loadWaffoConfig } from './waffo';

export const CONTENT_SAFETY_SCHEMA = `CREATE TABLE IF NOT EXISTS content_safety_checks (
  id TEXT PRIMARY KEY, generation_id TEXT NOT NULL, phase TEXT NOT NULL,
  provider_request_id TEXT, action TEXT NOT NULL, reason_code TEXT NOT NULL,
  categories_json TEXT NOT NULL, checked_at INTEGER NOT NULL
); CREATE INDEX IF NOT EXISTS content_safety_generation ON content_safety_checks(generation_id);`;

export class ContentSafetyError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function hasRestrictedWriting(text: string): boolean {
  return /\b(?:porn(?:ography)?|explicit sex|sexual assault|rape|incest|child sexual|self[- ]harm|suicide instructions|how to make (?:a )?(?:bomb|explosive)|drug recipe|hate speech|graphic gore|graphic dismemberment|deepfake|nude photo)\b/i.test(text);
}

export async function checkWritingContent(text: string, generationId: string, phase: 'input' | 'output') {
  const record = (action: string, reason: string, requestId: string | null = null, categories: string[] = []) => {
    getDb().prepare('INSERT INTO content_safety_checks(id,generation_id,phase,provider_request_id,action,reason_code,categories_json,checked_at) VALUES(?,?,?,?,?,?,?,?)')
      .run(randomUUID(), generationId, phase, requestId, action, reason, JSON.stringify(categories), Date.now());
  };
  if (hasRestrictedWriting(text)) {
    record('block', 'local_content_policy');
    throw new ContentSafetyError(422, 'This content does not meet our general-audience writing policy. No credit was charged.');
  }
  try {
    if (!text.trim() || text.length > 10_000) throw new Error('Invalid moderation input.');
    const config = loadWaffoConfig(process.env, { requireCredentials: true });
    const client = new WaffoPancake({
      merchantId: config.merchantId!, privateKey: config.privateKey!, baseUrl: config.endpoint, environment: config.environment,
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) }),
    });
    const verdict = await client.contentSafety.scanPrompt({ prompt: text, locale: 'en', semantic: ScanSemanticMode.Enforce });
    record(verdict.action, verdict.reasonCode, verdict.requestId, verdict.matchedCategories);
    if (verdict.action === 'block') throw new ContentSafetyError(422, 'This content does not meet our general-audience writing policy. No credit was charged.');
    if (verdict.action !== 'allow') throw new ContentSafetyError(503, 'The safety check needs another review. Please try again later. No credit was charged.');
  } catch (error) {
    if (error instanceof ContentSafetyError) throw error;
    record('review', 'service_unavailable');
    throw new ContentSafetyError(503, 'The safety check is temporarily unavailable. Please try again later. No credit was charged.');
  }
}
