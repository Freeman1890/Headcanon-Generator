import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { findWritingGuide } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";

export const runtime = "edge";
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findWritingGuide(slug);

  if (!guide) return { title: "Guide not found | Headcanon Generator" };

  const url = `${SITE_URL}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      siteName: "Headcanon Generator",
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findWritingGuide(slug);
  if (!guide) notFound();

  const url = `${SITE_URL}/guides/${guide.slug}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      url,
      datePublished: "2026-07-30",
      dateModified: "2026-07-30",
      author: { "@type": "Organization", name: "Headcanon Generator", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Headcanon Generator", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faqs.map((faq) => ({
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
        <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-indigo-600 hover:underline">Home</Link>
            <span aria-hidden="true"> / </span>
            <Link href="/guides" className="hover:text-indigo-600 hover:underline">Guides</Link>
          </nav>
          <header className="mt-7 border-b border-slate-200 pb-10 dark:border-slate-800">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              {guide.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{guide.intro}</p>
            <p className="mt-4 text-sm text-slate-500">Reviewed {guide.reviewed}</p>
          </header>

          <div className="mt-12 space-y-12">
            {guide.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                {section.items && (
                  <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Questions about this topic</h2>
            <div className="mt-6 space-y-7">
              {guide.faqs.map((faq) => (
                <section key={faq.q}>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{faq.q}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p>
                </section>
              ))}
            </div>
          </section>

          <section className="mt-14 border-t border-slate-200 pt-10 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Keep writing</h2>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
              {guide.relatedLinks.map((link) => (
                <Link key={link.href} href={link.href} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
