import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { findWritingGuide, formatGuideDate } from "@/lib/guides";
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
      publishedTime: guide.published,
      modifiedTime: guide.updated,
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
      datePublished: guide.published,
      dateModified: guide.updated,
      author: { "@type": "Organization", name: "Headcanon Generator", url: `${SITE_URL}/about#content-review` },
      publisher: { "@type": "Organization", name: "Headcanon Generator", url: SITE_URL },
      ...(guide.sections.some((section) => section.reference) ? {
        citation: guide.sections.flatMap((section) => section.reference ? [section.reference.href] : []),
      } : {}),
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
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              By <Link href="/about#content-review" className="text-indigo-600 hover:underline dark:text-indigo-400">Headcanon Generator</Link>
              <span className="mx-2" aria-hidden="true">·</span>
              Published <time dateTime={guide.published}>{formatGuideDate(guide.published)}</time>
              <br />
              Updated <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
            </p>
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
                {section.steps && (
                  <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                    {section.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                )}
                {section.comparison && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-left text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      <caption className="mb-3 text-left text-sm text-slate-500">Fandom terms compared with invented examples</caption>
                      <thead className="border-b-2 border-slate-300 dark:border-slate-700">
                        <tr>
                          <th scope="col" className="w-[30%] break-words px-2 py-3 font-semibold">Term</th>
                          <th scope="col" className="break-words px-2 py-3 font-semibold">Meaning</th>
                          <th scope="col" className="break-words px-2 py-3 font-semibold">Invented example</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.comparison.map((row) => (
                          <tr key={row.term} className="border-b border-slate-200 align-top dark:border-slate-800">
                            <th scope="row" className="break-words px-2 py-4 font-medium">{row.term}</th>
                            <td className="break-words px-2 py-4">{row.meaning}</td>
                            <td className="break-words px-2 py-4">{row.example}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.reference && (
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Reference: <a href={section.reference.href} className="text-indigo-600 underline dark:text-indigo-400">{section.reference.label}</a>
                    {". "}{section.reference.note}
                  </p>
                )}
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm leading-relaxed text-slate-500">
            Writing exercises and invented examples are suggestions from Headcanon Generator, not quotations or official story material.
            {" "}<Link href="/about#content-review" className="text-indigo-600 hover:underline dark:text-indigo-400">How content is reviewed</Link>.
          </p>

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
