import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "What is a Headcanon?",
    a: "Headcanon is a fan's personal interpretation or extension of a character beyond official canon. It's not part of the official story but is adopted by creators or fans for fanfiction, roleplay, and creative work. Headcanons can cover a character's past, habits, relationships, or anything the source material leaves ambiguous.",
  },
  {
    q: "How does Headcanon Generator work?",
    a: "This tool uses Google Gemini 2.0 to analyze character traits and behavior from the source material, then generates headcanon suggestions that fit the character. Enter a character name and fandom — the AI will produce multiple headcanon options for your creative reference.",
  },
  {
    q: "Can I use generated headcanons commercially?",
    a: "AI-generated content is for personal creative reference and inspiration only. For commercial use, please assess copyright and compliance risks yourself. We recommend using AI output as a starting point and adding your own creative input.",
  },
  {
    q: "What types of characters are supported?",
    a: "We support characters from anime, games, movies, TV shows, and books. Enter the character name and fandom — the more specific the fandom, the more accurate the results.",
  },
  {
    q: "How do I share my generated headcanons?",
    a: "Results support \"Copy as Image\" to copy as card format and \"Share URL\" to generate shareable links for social media, forums, and more.",
  },
];

const LONG_FORM_CONTENT = `
Headcanon Generator is an AI tool designed for fanfiction writers and roleplay enthusiasts. Enter a character name and fandom — the AI generates headcanons that fit the character's personality.

## What is Headcanon? Origin and Meaning

The term "headcanon" combines "head" (mind) with "canon" (official story). It refers to a fan's personal interpretation or extension of a character beyond official canon — background details, personality traits, or hidden habits not covered in the source material. Unlike official canon, headcanon is not authoritative but is widely used in fandom to enrich characters and support creative work.

Headcanons can cover anything: childhood experiences, secret habits, hidden relationships, or unique opinions. For example, if a character's preference for sweets is never mentioned, a fan might headcanon "they're secretly obsessed with sweets but never admit it" — that's a classic headcanon.

## Headcanon Generator's Core Value

Headcanon Generator uses Google Gemini 2.0 to analyze character behavior and traits, then generates headcanon suggestions that fit the character. Whether you write fanfiction, do character play, cosplay, or simply want to discuss character interpretations with fellow fans, this tool provides a creative starting point.

The workflow is simple: enter a character name (e.g., "Raiden Shogun") and fandom (e.g., "Genshin Impact"), click Generate, and receive AI-generated headcanons. Results support one-click copy as image or shareable links for social media.

## Headcanon and Fan Fiction

In fan fiction, headcanon plays a key role. It helps authors expand beyond official material while keeping the character's core consistent, creating unique narrative angles. In AU (alternate universe) settings, headcanons may differ wildly, but if they align with the character's essence, readers can still connect.

Headcanon Generator aims to lower the barrier of "starting from scratch" so more people can quickly enter a creative flow while maintaining quality. We encourage users to treat AI output as inspiration and add their own creative interpretation rather than copying directly.
`;

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

        {/* 深度长文本 SEO 内容 */}
        <article className="prose prose-slate dark:prose-invert mx-auto max-w-3xl">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {LONG_FORM_CONTENT.split("\n").map((para, i) =>
              para.startsWith("##") ? (
                <h3
                  key={i}
                  className="mt-8 mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50"
                >
                  {para.replace(/^##\s*/, "")}
                </h3>
              ) : para.trim() ? (
                <p key={i} className="mb-4">
                  {para}
                </p>
              ) : null
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
