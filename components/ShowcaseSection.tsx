"use client";

import { Copy, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const POPULAR_TAGS = [
  "Genshin Impact",
  "Honkai: Star Rail",
  "Jujutsu Kaisen",
  "Demon Slayer",
  "Attack on Titan",
  "Spy x Family",
  "Chainsaw Man",
  "Frieren",
  "Fate",
  "Sword Art Online",
];

interface HeadcanonResult {
  id: string;
  characterName: string;
  workName?: string;
  content: string;
  shareUrl?: string;
}

interface ShowcaseSectionProps {
  result?: HeadcanonResult | null;
  staticExamples?: HeadcanonResult[];
}

export function ShowcaseSection({
  result,
  staticExamples = [],
}: ShowcaseSectionProps) {
  const [copied, setCopied] = useState(false);

  const displayResults = result
    ? [result, ...staticExamples.slice(0, 2)]
    : staticExamples;

  const handleCopyAsImage = async (cardRef: HTMLDivElement | null) => {
    if (!cardRef) return;
    try {
      // 使用 html2canvas 或 dom-to-image 可转为图片，此处简化用复制文本
      const text = cardRef.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareUrl = (shareUrl: string) => {
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${shareUrl}`
        : shareUrl;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: "Headcanon Generator",
        url: fullUrl,
        text: "Check out my headcanon!",
      });
    } else {
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="showcase" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Results
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Your headcanons, ready to share
          </p>
        </div>

        {/* Bento Box 布局 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayResults.length > 0 ? (
            displayResults.map((item, i) => (
              <ShowcaseCard
                key={item.id}
                item={item}
                isFeatured={i === 0 && !!result}
                onCopyAsImage={handleCopyAsImage}
                onShareUrl={handleShareUrl}
                copied={copied}
              />
            ))
          ) : (
            <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">
                Enter a character name and click Generate to see results
              </p>
            </div>
          )}
        </div>

        {/* 猜你喜欢 / 热门角色标签云 */}
        <div className="mt-16">
          <h3 className="mb-4 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
            Popular fandoms · You might like
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_TAGS.map((tag) => (
              <a
                key={tag}
                href={`/?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({
  item,
  isFeatured,
  onCopyAsImage,
  onShareUrl,
  copied,
}: {
  item: HeadcanonResult;
  isFeatured: boolean;
  onCopyAsImage: (ref: HTMLDivElement | null) => void;
  onShareUrl: (url: string) => void;
  copied: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <Card
      ref={cardRef}
      className={
        isFeatured
          ? "border-2 border-indigo-200 shadow-lg dark:border-indigo-800"
          : ""
      }
    >
      <CardHeader>
        <CardTitle>
          {item.characterName}
          {item.workName && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              · {item.workName}
            </span>
          )}
        </CardTitle>
        <CardDescription>AI-generated Headcanon</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {item.content}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCopyAsImage(cardRef.current)}
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy as Image"}
        </Button>
        {item.shareUrl && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onShareUrl(item.shareUrl!)}
          >
            <Share2 className="h-4 w-4" />
            Share URL
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
