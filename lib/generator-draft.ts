import { DEFAULT_GENERATION_OPTIONS, GENERATION_TONES, RELATIONSHIP_KINDS, type GenerationOptions, type GenerationMode } from "../commerce/src/config/generation-options";

export type GeneratorDraft = GenerationOptions & {
  characterName: string; workName: string; secondCharacter: string; mode: GenerationMode;
};

export function readGeneratorDraft(search: string, saved: unknown): GeneratorDraft {
  const params = new URLSearchParams(search);
  const draft = saved && typeof saved === "object" ? saved as Record<string, unknown> : {};
  // An explicit entry link starts a fresh draft; old names must not leak into a new fandom.
  const explicit = ["character", "fandom", "mode", "secondCharacter", "relationshipKind", "tone", "scenario"].some(key => params.has(key));
  const field = (query: string, key: string, maximum = 80) => (params.get(query) ?? (!explicit && typeof draft[key] === "string" ? draft[key] as string : "")).slice(0, maximum);
  const modeValue = field("mode", "mode");
  const mode: GenerationMode = ["character", "relationship", "oc"].includes(modeValue) ? modeValue as GenerationMode : "character";
  const kind = field("relationshipKind", "relationshipKind");
  const tone = field("tone", "tone");
  return {
    characterName: field("character", "characterName"), workName: field("fandom", "workName"),
    secondCharacter: field("secondCharacter", "secondCharacter"), mode,
    relationshipKind: mode === "relationship" && RELATIONSHIP_KINDS.includes(kind as GenerationOptions["relationshipKind"]) ? kind as GenerationOptions["relationshipKind"] : DEFAULT_GENERATION_OPTIONS.relationshipKind,
    tone: GENERATION_TONES.includes(tone as GenerationOptions["tone"]) ? tone as GenerationOptions["tone"] : DEFAULT_GENERATION_OPTIONS.tone,
    scenario: field("scenario", "scenario", 240),
  };
}
