export interface AcceptanceRunConfig {
  runId: string;
  ownerEmail: string;
}

export interface AcceptanceEnvironment {
  ACCEPTANCE_RUN_ID?: string;
  ACCEPTANCE_GENERATION_ENABLED?: string;
  ADMIN_EMAIL?: string;
  GENERATION_ENABLED?: string;
  RELEASE_STAGE?: string;
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isStrictAcceptanceRunId(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4.test(value);
}

/** Acceptance is available only in the launch stage while public generation is closed. */
export function configuredAcceptanceRun(env: AcceptanceEnvironment): AcceptanceRunConfig | null {
  const ownerEmail = env.ADMIN_EMAIL?.trim().toLowerCase() || '';
  if (env.RELEASE_STAGE !== 'launch'
    || env.GENERATION_ENABLED !== 'false'
    || env.ACCEPTANCE_GENERATION_ENABLED !== 'true'
    || !isStrictAcceptanceRunId(env.ACCEPTANCE_RUN_ID)
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return null;
  return { runId: env.ACCEPTANCE_RUN_ID, ownerEmail };
}

export function isAcceptanceOwner(run: AcceptanceRunConfig, email: unknown, mode: unknown): boolean {
  return mode === 'live'
    && typeof email === 'string'
    && email.trim().toLowerCase() === run.ownerEmail;
}

export function isAcceptanceGenerationInput(input: {
  operation: string;
  ratio: string;
  referenceUrl: string;
  characterId?: string;
  parentAssetId?: string;
  items?: string[];
}): boolean {
  return input.operation === 'generate'
    && input.ratio === '1:1'
    && /^\/api\/media\/[A-Za-z0-9-]{1,100}$/.test(input.referenceUrl)
    && !input.characterId
    && !input.parentAssetId
    && !input.items?.length;
}
