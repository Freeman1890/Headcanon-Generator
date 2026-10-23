export const RELATIONSHIP_KINDS = ["any", "friendship", "romance", "rivals"] as const;
export const GENERATION_TONES = ["any", "fluff"] as const;
export type GenerationMode = "character" | "relationship" | "oc";
export const GENERATION_KINDS = ["headcanon", "scenario", "dialogue", "plot"] as const;
export type GenerationKind = typeof GENERATION_KINDS[number];
export type RelationshipKind = typeof RELATIONSHIP_KINDS[number];
export type GenerationTone = typeof GENERATION_TONES[number];
export type GenerationOptions = {
  relationshipKind: RelationshipKind;
  tone: GenerationTone;
  scenario: string;
};
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  relationshipKind: "any", tone: "any", scenario: "",
};
