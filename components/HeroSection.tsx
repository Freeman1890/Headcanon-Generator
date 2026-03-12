"use client";

import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroSectionProps {
  onGenerate?: (characterName: string, workName: string) => void;
  isLoading?: boolean;
}

export function HeroSection({ onGenerate, isLoading = false }: HeroSectionProps) {
  const characterRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const characterName = characterRef.current?.value?.trim() ?? "";
    const workName = workRef.current?.value?.trim() ?? "";

    if (onGenerate) {
      onGenerate(characterName, workName);
    }

    // 平滑滚动到结果展示区
    document.getElementById("showcase")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="relative min-h-[85vh] overflow-hidden">
      {/* 微弱渐变与网格背景 */}
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
              Enter character and fandom names — AI generates unique headcanons for you
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 sm:gap-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
              <Input
                ref={characterRef}
                type="text"
                placeholder="Character name"
                className="h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-5 text-base backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:flex-1"
              />
              <Input
                ref={workRef}
                type="text"
                placeholder="Fandom (optional)"
                className="h-14 rounded-xl border-2 border-slate-200 bg-white/80 px-5 text-base backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sm:flex-1"
              />
            </div>
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
                "Generate"
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
