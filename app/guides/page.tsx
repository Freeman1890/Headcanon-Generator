import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WRITING_GUIDES } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

const PAGE_URL = `${SITE_URL}/guides`;

export const metadata: Metadata = {
  title: "Headcanon Writing Guides for Characters, OCs, and Ships",
  description:
    "Read practical headcanon writing guides about canon, character details, relationship ideas, original characters, and turning a prompt into a usable scene.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Headcanon Writing Guides",
    description: "Practical guides for writing characters, relationships, and original character ideas.",
    url: PAGE_URL,
    siteName: "Headcanon Generator",
    type: "website",
  },
};

export default function GuidesPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Headcanon Writing Guides",
      description: metadata.description,
      url: PAGE_URL,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: WRITING_GUIDES.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        url: `${PAGE_URL}/${guide.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: PAGE_URL },
      ],
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <JsonLd data={schemas} />
        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Writing help</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              Headcanon writing guides
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Use these guides when a generated idea needs more shape. They cover the line between canon and fan interpretation, character details, relationships, and original characters.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {WRITING_GUIDES.map((guide) => (
              <Card key={guide.slug}>
                <CardHeader>
                  <h2 className="text-xl font-semibold leading-snug text-slate-900 dark:text-slate-50">
                    {guide.title}
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {guide.description}
                  </p>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Read the guide
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
