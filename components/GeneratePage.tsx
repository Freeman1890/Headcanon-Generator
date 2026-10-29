"use client";

import { useEffect, useState } from "react";
import { FeatureSection } from "@/components/FeatureSection";
import { HeroSection } from "@/components/HeroSection";
import { Navigation } from "@/components/Navigation";
import { SeoSection } from "@/components/SeoSection";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";
import { useAccount } from "@/components/AccountProvider";
import { CommerceError, commerceRequest, type HeadcanonResult, type GenerationMode } from "@/lib/commerce";
import { DEFAULT_GENERATION_OPTIONS, type GenerationOptions } from "@/commerce/src/config/generation-options";
import { readGeneratorDraft } from "@/lib/generator-draft";

export function GeneratePage() {
  const [result, setResult] = useState<HeadcanonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workName, setWorkName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [secondCharacter, setSecondCharacter] = useState("");
  const [mode, setMode] = useState<GenerationMode>("character");
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const { account, refresh, openLogin, buy } = useAccount();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let saved: unknown = null;
      try {
        saved = JSON.parse(window.sessionStorage.getItem('headcanon-input-draft') || 'null');
      } catch { window.sessionStorage.removeItem('headcanon-input-draft'); }
      const draft = readGeneratorDraft(window.location.search, saved);
      setCharacterName(draft.characterName); setWorkName(draft.workName);
      setSecondCharacter(draft.secondCharacter); setMode(draft.mode);
      setOptions({ relationshipKind: draft.relationshipKind, tone: draft.tone, scenario: draft.scenario });
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (draftReady) window.sessionStorage.setItem('headcanon-input-draft', JSON.stringify({ characterName, workName, secondCharacter, mode, ...options }));
  }, [draftReady, characterName, workName, secondCharacter, mode, options]);

  const saveDraft = () => {
    window.sessionStorage.setItem('headcanon-input-draft', JSON.stringify({ characterName, workName, secondCharacter, mode, ...options }));
  };

  const waitForResult = async (key: string): Promise<HeadcanonResult> => {
    for (let attempt = 0; attempt < 40; attempt++) {
      let data: HeadcanonResult;
      try { data = await commerceRequest<HeadcanonResult>(`/api/generations/${key}`); }
      catch (cause) { if (cause instanceof CommerceError && cause.status === 404) window.sessionStorage.removeItem('headcanon-pending-request'); throw cause; }
      if (data.status === "succeeded") return data;
      if (data.status === "failed") { window.sessionStorage.removeItem('headcanon-pending-request'); throw new Error(data.error || "Generation failed. No credit was charged."); }
      await new Promise(resolve => window.setTimeout(resolve, 2500));
    }
    throw new Error("Your request is still being checked. Refresh this page to check the same request, without another charge.");
  };

  useEffect(() => {
    const key = window.sessionStorage.getItem('headcanon-pending-request');
    if (!key) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void waitForResult(key).then(data => { if (!cancelled) { setResult(data); window.sessionStorage.removeItem('headcanon-pending-request'); } })
        .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not check your previous request.'); })
        .finally(() => { if (!cancelled) { setIsLoading(false); void refresh().catch(() => {}); } });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [refresh]);

  const handleGenerate = async (characterName: string, workName: string) => {
    if (!characterName.trim()) return;

    setError("");
    saveDraft();
    let key = window.sessionStorage.getItem('headcanon-pending-request');

    try {
      const current = await refresh();
      if (!current.user) { openLogin(); return; }
      if (!key && current.balance < 1) { setError(current.capabilities.payments ? 'Buy credits to generate your five ideas.' : 'You need 1 credit to generate. Credit purchases are temporarily paused.'); return; }
      setIsLoading(true);
      if (key) {
        const data = await waitForResult(key); setResult(data); window.sessionStorage.removeItem('headcanon-pending-request'); return;
      }
      key = crypto.randomUUID();
      window.sessionStorage.setItem('headcanon-pending-request', key);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": current.csrfToken || "", "idempotency-key": key },
        body: JSON.stringify({
          characterName: characterName.trim(),
          workName: workName.trim() || undefined,
          mode, secondCharacter, ...options, relationshipKind: mode === 'relationship' ? options.relationshipKind : 'any',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status < 500 || err.status === 'failed') window.sessionStorage.removeItem('headcanon-pending-request');
        throw new Error(err.error ?? "Generation failed");
      }

      const data = res.status === 202 ? await waitForResult(key) : await res.json();
      window.sessionStorage.removeItem('headcanon-pending-request');
      setResult({
        id: data.id,
        characterName: data.characterName,
        workName: data.workName,
        content: data.content,
        shareUrl: data.shareUrl,
        headcanons: data.headcanons,
      });
      document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Generation could not finish. Please check your request before trying again.');
    } finally {
      setIsLoading(false);
      void refresh().catch(() => {});
    }
  };

  return (
    <>
      <Navigation />
      <HeroSection
        onGenerate={handleGenerate}
        isLoading={isLoading}
        characterName={characterName}
        onCharacterNameChange={setCharacterName}
        workName={workName}
        onWorkNameChange={setWorkName}
        mode={mode} onModeChange={setMode} secondCharacter={secondCharacter} onSecondCharacterChange={setSecondCharacter}
        options={options} onOptionsChange={setOptions}
        error={error} balance={account?.user ? account.balance : undefined}
        needsCredits={Boolean(account?.user && account.balance < 1)}
        paymentsEnabled={account?.capabilities.payments}
        onBuy={() => { saveDraft(); void buy().catch(cause => setError(cause instanceof Error ? cause.message : 'Checkout is unavailable.')); }}
      />
      <ShowcaseSection
        result={result}
        staticExamples={STATIC_HEADCANON_EXAMPLES}
        onFandomSelect={setWorkName}
      />
      <FeatureSection />
      <SeoSection />
    </>
  );
}
