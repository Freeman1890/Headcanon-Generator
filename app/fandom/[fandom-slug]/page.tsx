import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { findFandomHub } from "@/lib/fandom-hubs";
import { SITE_URL } from "@/lib/site";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";

export const runtime = "edge";
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "fandom-slug": string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { "fandom-slug": fandomSlug } = await params;
  const hub = findFandomHub(fandomSlug);

  if (!hub) {
    return { title: "Fandom not found | Headcanon Generator" };
  }

  const url = `${SITE_URL}/fandom/${hub.slug}`;
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: url },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url,
      siteName: "Headcanon Generator",
      type: "website",
    },
  };
}

export default async function FandomHubPage({ params }: PageProps) {
  const { "fandom-slug": fandomSlug } = await params;
  const hub = findFandomHub(fandomSlug);

  if (!hub) notFound();

  const url = `${SITE_URL}/fandom/${hub.slug}`;
  const examples = STATIC_HEADCANON_EXAMPLES.filter(
    (example) => example.workName === hub.name
  );
  const generatorHref = `/?fandom=${encodeURIComponent(hub.name)}#generator`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: hub.title,
      description: hub.description,
      url,
      isPartOf: { "@type": "WebSite", name: "Headcanon Generator", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: hub.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: hub.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <JsonLd data={schemas} />
        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-indigo-600 hover:underline">
                Home
              </Link>
              <span aria-hidden="true"> / </span>
              <span>{hub.name}</span>
            </nav>
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Fandom writing guide
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              {hub.title}
            </h1>
            <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              {hub.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <Button asChild size="lg" variant="primary" className={hub.writingExamples ? "mt-8 h-auto min-h-11 max-w-full whitespace-normal py-3 text-center" : "mt-8"}>
              <Link href={generatorHref}>
                Generate a {hub.name} headcanon
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {hub.writingExamples && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Examples are free to read. Generation requires sign-in and purchased credits: 1 credit for 5 ideas, $9.90 for 100 credits.</p>}
          </div>
        </section>

        {hub.writingExamples && <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Start with a character</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-slate-600 dark:text-slate-400">Original fan-made examples, not canon. Each link prefills the character, fandom, and scene; it does not start a paid generation.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {hub.writingExamples.map(example => {
                const query = new URLSearchParams({ character: example.character, fandom: hub.name, scenario: example.scenario });
                return <article key={example.character} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{example.character}</h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{example.body}</p>
                  <Link href={`/?${query}#generator`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Try {example.character}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>
                </article>;
              })}
            </div>
          </div>
        </section>}

        {examples.length > 0 &&
        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Character headcanon examples
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {examples.map((example) => (
                <Card key={example.id}>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {example.characterName}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {example.summary}
                    </p>
                    <Link
                      href={example.shareUrl}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Read the full example
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>}

        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Ways to write this fandom
            </h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {hub.angles.map((angle) => (
                <section key={angle.title} className="border-t border-slate-200 pt-5 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{angle.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {angle.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 dark:border-slate-800">
          <div className="mx-auto grid max-w-5xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Scene starts
              </h2>
              <ul className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {hub.sceneStarts.map((idea) => <li key={idea}>{idea}</li>)}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Questions writers ask
              </h2>
              <div className="mt-6 space-y-6">
                {hub.faqs.map((faq) => (
                  <section key={faq.q}>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{faq.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Turn one detail into a scene</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Prefill the fandom, add a character, and keep only what fits.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href={generatorHref} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Open the generator</Link>
              <Link href="/guides/how-to-write-a-character-headcanon" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Read the character guide</Link>
              {hub.writingExamples && <Link href={`/?${new URLSearchParams({ mode: 'relationship', fandom: hub.name })}#generator`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Write a pair or ship</Link>}
              {hub.writingExamples && <Link href="/relationship-headcanon-generator" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Relationship writing ideas</Link>}
            </div>
          </div>
        </section>
        {hub.sources && <section className="border-t border-slate-200 py-10 dark:border-slate-800">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Check the source, keep your interpretation</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">These references provide character and setting context. The invented examples above are not quotations, confirmed lore, or an official collaboration.</p>
            <ul className="mt-4 space-y-3 text-sm">{hub.sources.map(source => <li key={source.href}><a href={source.href} className="text-indigo-600 hover:underline dark:text-indigo-400">{source.label}</a></li>)}</ul>
            <Link href="/#fandoms" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Browse other fandoms<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>}
      </main>
      <Footer />
    </>
  );
}
