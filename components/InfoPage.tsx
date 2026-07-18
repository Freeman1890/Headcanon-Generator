import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

interface InfoSection {
  title: string;
  paragraphs?: ReactNode[];
  items?: ReactNode[];
}

interface InfoPageProps {
  title: string;
  intro: ReactNode;
  updated: string;
  sections: InfoSection[];
}

export function InfoPage({ title, intro, updated, sections }: InfoPageProps) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {intro}
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">
              Last updated: {updated}
            </p>
          </header>

          <div className="mt-12 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index} className="mt-4">
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="mt-4 list-disc space-y-2 pl-5">
                    {section.items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="mt-12 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
              Back to the generator
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
