import Link from "next/link";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export const runtime = "edge";

interface SharePageProps {
  params: Promise<{ "character-slug": string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function labelFromSlug(slug: string) {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { "character-slug": characterSlug } = await params;
  const characterName = labelFromSlug(characterSlug) || "Shared headcanon";

  return {
    title: `${characterName} shared headcanon | Headcanon Generator`,
    description:
      "A shared headcanon generated with Headcanon Generator. Open it, copy it, or make your own version.",
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const { "character-slug": characterSlug } = await params;
  const query = await searchParams;
  const characterName = labelFromSlug(characterSlug) || "Shared character";
  const workName = firstValue(query.work);
  const headcanon = firstValue(query.headcanon);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {characterName}
              {workName ? ` headcanon for ${workName}` : " headcanon"}
            </h1>
            <CardDescription>Shared headcanon</CardDescription>
          </CardHeader>
          <CardContent>
            {headcanon ? (
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                {headcanon}
              </p>
            ) : (
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                This shared link does not include a saved headcanon. Generate a
                fresh one and share it again.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:underline">
            Back to homepage to generate more
          </Link>
        </p>
      </div>
    </main>
  );
}
