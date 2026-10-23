"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GenerationMode } from "@/lib/commerce";
import type { GenerationOptions } from "@/commerce/src/config/generation-options";

interface HeroSectionProps {
  onGenerate?: (characterName: string, workName: string) => void;
  isLoading?: boolean;
  characterName: string;
  onCharacterNameChange: (value: string) => void;
  workName: string;
  onWorkNameChange: (value: string) => void;
  mode: GenerationMode;
  onModeChange: (value: GenerationMode) => void;
  secondCharacter: string;
  onSecondCharacterChange: (value: string) => void;
  error?: string;
  balance?: number;
  needsCredits?: boolean;
  onBuy?: () => void;
  options: GenerationOptions;
  onOptionsChange: (value: GenerationOptions) => void;
}

export function HeroSection({
  onGenerate,
  isLoading = false,
  characterName,
  onCharacterNameChange,
  workName,
  onWorkNameChange,
  mode, onModeChange, secondCharacter, onSecondCharacterChange, error, balance, needsCredits, onBuy,
  options, onOptionsChange,
}: HeroSectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCharacterName = characterName.trim();
    const fandomName = workName.trim();

    if (onGenerate) {
      onGenerate(trimmedCharacterName, fandomName);
    }

  };

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,.08) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 py-20">
        <div className="flex w-full max-w-2xl flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-slate-100 dark:via-indigo-200 dark:to-slate-100 sm:text-5xl md:text-6xl">
              Headcanon Generator
            </h1>
            <p className="max-w-lg text-base text-slate-600 dark:text-slate-400">
              Give us a character. Get five small details worth writing a scene around.
            </p>
          </div>

          <form
            id="generator"
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 sm:gap-6"
          >
            <div role="group" aria-label="Headcanon type" className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-700">
              {([['character', 'Character'], ['relationship', 'Relationship'], ['oc', 'Original character']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => onModeChange(value)} className={`min-h-11 border-b-2 px-2 py-2 text-sm ${mode === value ? 'border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-600 dark:text-slate-400'}`}>{label}</button>)}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
              <label className="min-w-0 flex-1"><span className="mb-2 block text-sm font-medium">{mode === 'relationship' ? 'First character' : mode === 'oc' ? 'Your character' : 'Character name'}</span>
              <Input
                type="text"
                required
                maxLength={80}
                placeholder="Character name"
                value={characterName}
                onChange={(event) => onCharacterNameChange(event.target.value)}
                className="h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-5 text-base backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:flex-1"
              />
              </label>
              {mode === 'relationship' && <label className="min-w-0 flex-1"><span className="mb-2 block text-sm font-medium">Second character</span><Input value={secondCharacter} onChange={event => onSecondCharacterChange(event.target.value)} required maxLength={80} placeholder="Second character" className="h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-5 text-base dark:border-slate-700 dark:bg-slate-900/80" /></label>}
              </div>
              <label><span className="mb-2 block text-sm font-medium">{mode === 'oc' ? 'Setting (optional)' : 'Fandom (optional)'}</span>
              <Input
                type="text"
                maxLength={80}
                placeholder="Fandom (optional)"
                value={workName}
                onChange={(event) => onWorkNameChange(event.target.value)}
                className="h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-5 text-base backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:flex-1"
              />
              </label>
            <details className="border-y border-slate-200 py-2 text-sm dark:border-slate-700">
              <summary className="min-h-11 cursor-pointer py-3 font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-200">More options{options.tone !== 'any' || options.scenario || (mode === 'relationship' && options.relationshipKind !== 'any') ? ' (selected)' : ' (optional)'}</summary>
              <div className="grid gap-4 pb-3 sm:grid-cols-2">
                {mode === 'relationship' && <label className="min-w-0"><span className="mb-2 block font-medium">Relationship type</span><select value={options.relationshipKind} onChange={event => onOptionsChange({ ...options, relationshipKind: event.target.value as GenerationOptions['relationshipKind'] })} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"><option value="any">Any dynamic</option><option value="friendship">Friendship (no romance)</option><option value="romance">Romance / ship</option><option value="rivals">Rivals</option></select></label>}
                <label className="min-w-0"><span className="mb-2 block font-medium">Tone</span><select value={options.tone} onChange={event => onOptionsChange({ ...options, tone: event.target.value as GenerationOptions['tone'] })} className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 dark:border-slate-600 dark:bg-slate-900"><option value="any">Any tone</option><option value="fluff">Fluff / warm everyday moments</option></select></label>
                <label className="min-w-0 sm:col-span-2"><span className="mb-2 block font-medium">Scene (optional)</span><Input value={options.scenario} onChange={event => onOptionsChange({ ...options, scenario: event.target.value })} maxLength={240} placeholder="Waiting for the rain to stop after training" className="min-h-11 rounded-md bg-white dark:bg-slate-900" /></label>
              </div>
            </details>
            <p className="text-sm text-slate-600 dark:text-slate-400">1 credit for 5 ideas. 100 credits for $9.90, no subscription.{balance !== undefined ? ` Balance: ${balance}.` : ''}</p>
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            {needsCredits && <Button type="button" variant="secondary" className="min-h-11" onClick={onBuy}>Buy 100 credits · $9.90</Button>}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              disabled={isLoading}
              className="h-14 w-full rounded-xl text-base sm:w-auto sm:px-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate 5 ideas · 1 credit"
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
