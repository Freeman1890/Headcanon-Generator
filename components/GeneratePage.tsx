"use client";

import { useState } from "react";
import { FeatureSection } from "@/components/FeatureSection";
import { HeroSection } from "@/components/HeroSection";
import { Navigation } from "@/components/Navigation";
import { SeoSection } from "@/components/SeoSection";
import { ShowcaseSection } from "@/components/ShowcaseSection";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";

interface HeadcanonResult {
  id: string;
  characterName: string;
  workName?: string;
  content: string;
  shareUrl?: string;
}

export function GeneratePage() {
  const [result, setResult] = useState<HeadcanonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (characterName: string, workName: string) => {
    if (!characterName.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: characterName.trim(),
          workName: workName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }

      const data = await res.json();
      setResult({
        id: data.id,
        characterName: data.characterName,
        workName: data.workName,
        content: data.content,
        shareUrl: data.shareUrl,
      });
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <HeroSection onGenerate={handleGenerate} isLoading={isLoading} />
      <ShowcaseSection
        result={result}
        staticExamples={STATIC_HEADCANON_EXAMPLES}
      />
      <FeatureSection />
      <SeoSection />
    </>
  );
}
