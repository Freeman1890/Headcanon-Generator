import type { Metadata } from "next";
import { ShareContent } from "@/components/ShareContent";
import { SITE_URL } from "@/lib/site";

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
    alternates: {
      canonical: `${SITE_URL}/share/${characterSlug}`,
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
    <ShareContent
      characterName={characterName}
      legacyHeadcanon={headcanon}
      legacyWorkName={workName}
    />
  );
}
