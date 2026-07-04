import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";
import { SITE_URL } from "@/lib/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const runtime = "edge";
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "fandom-slug": string; "character-slug": string }>;
}

function findExample(fandomSlug: string, characterSlug: string) {
  const expectedPath = `/fandom/${fandomSlug}/${characterSlug}`;
  return STATIC_HEADCANON_EXAMPLES.find((ex) => ex.shareUrl === expectedPath);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { "fandom-slug": fandomSlug, "character-slug": characterSlug } =
    await params;
  const match = findExample(fandomSlug, characterSlug);

  if (!match) {
    return {
      title: "Headcanon not found | Headcanon Generator",
    };
  }

  const url = `${SITE_URL}${match.shareUrl}`;

  return {
    title: match.metaTitle,
    description: match.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: match.metaTitle,
      description: match.metaDescription,
      url,
      siteName: "Headcanon Generator",
      type: "article",
    },
  };
}

export default async function FandomCharacterPage({ params }: PageProps) {
  const { "fandom-slug": fandomSlug, "character-slug": characterSlug } =
    await params;
  const match = findExample(fandomSlug, characterSlug);

  if (!match) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {match.workName
                ? `${match.characterName} headcanon for ${match.workName}`
                : `${match.characterName} headcanon`}
            </h1>
            <CardDescription>Headcanon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-5 leading-relaxed text-slate-600 dark:text-slate-400">
              {match.summary}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {match.content}
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Why it fits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.whyItFits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Writing prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.prompts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:underline">
            Back to homepage to generate more
          </Link>
        </p>
      </div>
    </div>
  );
}
