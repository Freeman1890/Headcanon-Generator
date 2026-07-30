import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";
import { SITE_URL } from "@/lib/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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

  const pageUrl = `${SITE_URL}${match.shareUrl}`;
  const fandomUrl = `${SITE_URL}/fandom/${fandomSlug}`;
  const generatorHref = `/?character=${encodeURIComponent(match.characterName)}&fandom=${encodeURIComponent(match.workName ?? "")}#generator`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: match.metaTitle,
      description: match.metaDescription,
      url: pageUrl,
      author: { "@type": "Organization", name: "Headcanon Generator", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Headcanon Generator", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: match.workName, item: fandomUrl },
        { "@type": "ListItem", position: 3, name: match.characterName, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: match.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <JsonLd data={schemas} />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-indigo-600 hover:underline">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href={`/fandom/${fandomSlug}`} className="hover:text-indigo-600 hover:underline">{match.workName}</Link>
            <span aria-hidden="true"> / </span>
            <span>{match.characterName}</span>
          </nav>
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
            <h2 className="font-semibold leading-none tracking-tight">
              Why it fits
            </h2>
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
            <h2 className="font-semibold leading-none tracking-tight">
              More headcanon ideas
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.moreIdeas.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold leading-none tracking-tight">
              Scene ideas
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.sceneIdeas.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold leading-none tracking-tight">
              Writer notes
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.writerNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold leading-none tracking-tight">
              Writing prompts
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.prompts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold leading-none tracking-tight">
              FAQ
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {match.faqs.map((item) => (
                <section key={item.q}>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                    {item.q}
                  </h3>
                  <p className="mt-1">{item.a}</p>
                </section>
              ))}
            </div>
          </CardContent>
        </Card>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
            <Link href={generatorHref} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Generate another idea for {match.characterName}
            </Link>
            <Link href={`/fandom/${fandomSlug}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Browse {match.workName} ideas
            </Link>
            <Link href="/guides/how-to-write-a-character-headcanon" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Read the character writing guide
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
