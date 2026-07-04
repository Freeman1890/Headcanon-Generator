import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "What is a headcanon?",
    a: "A headcanon is a fan's personal idea about a character or story. It is not official canon. It might be a habit, a memory, a relationship detail, or a small explanation for something the source material leaves open.",
  },
  {
    q: "How does Headcanon Generator work?",
    a: "Enter a character name and, optionally, the fandom. The tool returns a short headcanon you can keep, rewrite, or use as a scene prompt.",
  },
  {
    q: "Can I use generated headcanons commercially?",
    a: "Treat the output as a writing prompt, not legal advice. If you plan to publish or sell work based on existing characters, check the copyright rules for that fandom and add your own writing.",
  },
  {
    q: "What types of characters are supported?",
    a: "You can try anime, games, movies, TV shows, books, original characters, and tabletop characters. Specific names usually work better than broad descriptions.",
  },
  {
    q: "How do I share my generated headcanons?",
    a: "Use the copy or share controls on a result card. You can also rewrite the text before posting it elsewhere.",
  },
];

const LONG_FORM_CONTENT = [
  {
    title: "What makes a useful headcanon",
    body: [
      "A useful headcanon is small enough to fit into a scene. It does not need to explain a character's whole life. A habit, a fear, a private preference, or a repeated reaction is usually enough.",
      "The best ones feel like they could have been missed in canon. They add a little pressure to a character without forcing them into a new personality.",
    ],
  },
  {
    title: "Using the generator for fanfiction",
    body: [
      "Start with the generated idea, then make it more specific. If the result says a character keeps something private, decide what the object is, who notices it, and what changes after that.",
      "You can also use a headcanon as a quiet scene between larger plot moments. Those small scenes often make action or romance feel less generic.",
    ],
  },
  {
    title: "How to make the result sound like you",
    body: [
      "Rewrite any sentence that sounds too clean. Add one concrete object, one awkward reaction, or one line of dialogue. That is usually enough to make the idea feel less machine written.",
      "If a result feels too dramatic, make it more ordinary. Characters are often easier to write when the detail is simple: bad handwriting, a snack they hide, a song they pretend not to like.",
    ],
  },
];

export function SeoSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-slate-200 py-20 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Common questions about headcanons and this tool
          </p>
        </div>

        <Accordion type="single" collapsible className="mb-20">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <article className="prose prose-slate dark:prose-invert mx-auto max-w-3xl">
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {LONG_FORM_CONTENT.map((section) => (
              <section key={section.title} className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {section.title}
                </h3>
                {section.body.map((para) => (
                  <p key={para} className="mb-4">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
