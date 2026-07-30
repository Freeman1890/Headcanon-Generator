import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";

interface LandingFaq {
  q: string;
  a: string;
}

interface LandingUseCase {
  title: string;
  body: string;
}

export interface KeywordLandingPageConfig {
  title: string;
  eyebrow: string;
  intro: string;
  note: string;
  inputHint?: string;
  purpose: string[];
  steps: string[];
  useCases: LandingUseCase[];
  example: {
    heading: string;
    body: string;
    href: string;
    linkLabel: string;
  };
  faqs: LandingFaq[];
  relatedLinks: { href: string; label: string }[];
}

export function KeywordLandingPage({
  config,
}: {
  config: KeywordLandingPageConfig;
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <span>{config.eyebrow}</span>
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                {config.intro}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" variant="primary">
                  <Link href="/#generator">
                    Try the generator
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href={config.example.href}
                  className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {config.example.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <Card className="self-center border-indigo-100 bg-indigo-50/60 dark:border-indigo-950 dark:bg-indigo-950/20">
              <CardHeader>
                <h2 className="text-xl font-semibold leading-none tracking-tight">
                  Start with a small idea
                </h2>
                <CardDescription className="leading-relaxed">
                  {config.note}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="border-l-2 border-indigo-300 pl-4 text-sm leading-relaxed text-slate-700 dark:border-indigo-700 dark:text-slate-300">
                  {config.inputHint ??
                    "Enter a character name, add a fandom if it helps, and use the result as a place to begin."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 dark:border-slate-800 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                What this page is for
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {config.purpose.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Use it in three steps</CardTitle>
                <CardDescription>Keep the first pass simple. You can reshape the idea later.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {config.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 dark:border-slate-800 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Where the idea can go
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                A short result is easier to use when it points toward a real writing task.
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {config.useCases.map((useCase) => (
                <section key={useCase.title} className="border-t border-slate-200 pt-5 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{useCase.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {useCase.body}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 py-16 dark:border-slate-800 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>{config.example.heading}</CardTitle>
                <CardDescription>One example from the Headcanon Generator collection.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-slate-600 dark:text-slate-400">{config.example.body}</p>
                <Link
                  href={config.example.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {config.example.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 py-16 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="mt-6">
              {config.faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-slate-600 dark:text-slate-400">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Keep exploring</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
                {config.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
