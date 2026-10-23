import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FANDOM_HUBS } from "@/lib/fandom-hubs";
import { WRITING_GUIDES } from "@/lib/guides";
import { WRITING_TOOLS } from "@/lib/writing-tools";

const FAQ_ITEMS = [
  {
    q: "Is a headcanon maker the same as a character generator?",
    a: "A headcanon maker adds an invented detail to a character or relationship. It does not necessarily create a whole person, appearance, name, or biography. This tool returns five short ideas; a complete profile is a different task.",
  },
  {
    q: "Is this a random headcanon generator or an AI writing tool?",
    a: "It uses AI to write five new suggestions from the character and context you enter, rather than drawing a sentence from a fixed list. Results can be wrong or out of character. The public examples are free to read; new generations use purchased credits.",
  },
  {
    q: "Can I request friendship or fluff headcanons?",
    a: "Yes. Choose Relationship and use More options to select Friendship for a platonic request or Romance / ship for a pairing. Fluff asks for warm, low-stakes moments. You can also add a scene in Character or Original character mode.",
  },
  {
    q: "What is a headcanon?",
    a: "A headcanon is a fan's personal idea about a character or story. It is not official canon. It might be a habit, a memory, a relationship detail, or a small explanation for something the source material leaves open.",
  },
  {
    q: "How does Headcanon Generator work?",
    a: "Sign in with an email code, choose a character, relationship, or OC, and enter the names. Each generation uses one credit and returns five short ideas. A 100-credit pack costs $9.90 once; credits do not expire, and there is no subscription.",
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
      "Turn a generated idea into a scene by choosing an object, a witness, and a change. If a character keeps something private, decide what it is, who notices it, and what happens next.",
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

        <section id="writing-tools" className="mb-16 scroll-mt-24 border-y border-slate-200 py-10 dark:border-slate-800">
          <h2 className="text-2xl font-semibold">Writing tools and templates</h2>
          <ul className="mt-5 grid list-none gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{WRITING_TOOLS.map(tool => <li key={tool.id} className="min-w-0 border-b border-slate-200 py-4 dark:border-slate-800"><Link href={tool.path} className="inline-flex min-h-11 items-center gap-2 font-medium text-indigo-600 hover:underline dark:text-indigo-400">{tool.title}<ArrowRight className="h-4 w-4 shrink-0" /></Link><p className="mt-1 text-sm text-slate-500">{tool.free ? 'Free, no account needed' : '1 credit for 5 results'}</p></li>)}</ul>
        </section>

        <article id="headcanon-basics" aria-labelledby="headcanon-basics-title" className="prose prose-slate dark:prose-invert mx-auto mb-12 max-w-3xl scroll-mt-24">
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="mb-8">
              <h2 id="headcanon-basics-title" className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">What is a headcanon?</h2>
              <p className="mb-4">A headcanon is a fan&apos;s personal idea about a character or story that the original work has not established. This generator suggests small invented details for your writing, not facts about official canon.</p>
              <figure className="m-0 border-l-2 border-indigo-300 pl-4 dark:border-indigo-700">
                <blockquote cite="https://www.merriam-webster.com/wordplay/words-were-watching-headcanon-fanon" className="m-0 font-normal not-italic">
                  <p className="m-0">Merriam-Webster describes a headcanon as <q>something that a fan imagines to be true about a character</q>.</p>
                </blockquote>
                <figcaption className="mt-2 text-xs"><cite className="not-italic"><a href="https://www.merriam-webster.com/wordplay/words-were-watching-headcanon-fanon" className="text-indigo-600 underline dark:text-indigo-400">Merriam-Webster: Words We&apos;re Watching, &ldquo;Headcanon&rdquo;</a></cite></figcaption>
              </figure>
              <p className="mt-4">For example, a character might keep spare gloves for a friend but deny doing it on purpose. That is an invented writing prompt. For the distinction between personal ideas and shared fan interpretations, read <Link href="/guides/headcanon-vs-canon" className="text-indigo-600 underline dark:text-indigo-400">headcanon, canon, fanon, and AU compared</Link>.</p>
            </section>

            <section className="mb-8" aria-labelledby="headcanon-mode-title">
              <h2 id="headcanon-mode-title" className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Which headcanon mode should I choose?</h2>
              <p className="mb-4">Choose Character for one existing character, Relationship for a pair, or Original character for someone you created. Use the mode that matches who you want to write about.</p>
              <table className="m-0 w-full table-fixed border-collapse text-left text-sm [overflow-wrap:anywhere]">
                <caption className="mb-3 text-left text-sm text-slate-600 dark:text-slate-400">Three generation modes and when to use them</caption>
                <thead><tr className="border-b border-slate-300 dark:border-slate-700"><th scope="col" className="w-[29%] p-2 align-top">Mode</th><th scope="col" className="w-[36%] p-2 align-top">Use it for</th><th scope="col" className="w-[35%] p-2 align-top">What to enter</th></tr></thead>
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-800"><th scope="row" className="p-2 align-top font-medium">Character</th><td className="p-2 align-top">A habit, preference, or reaction for one character.</td><td className="p-2 align-top">A character name; add the work if the name is ambiguous.</td></tr>
                  <tr className="border-b border-slate-200 dark:border-slate-800"><th scope="row" className="p-2 align-top font-medium">Relationship</th><td className="p-2 align-top">Two characters interacting as friends or a pairing.</td><td className="p-2 align-top">Both names; choose Friendship or Romance / ship in More options if needed.</td></tr>
                  <tr className="border-b border-slate-200 dark:border-slate-800"><th scope="row" className="p-2 align-top font-medium">Original character</th><td className="p-2 align-top">A detail for your own character or roleplay persona.</td><td className="p-2 align-top">Your OC&apos;s name or label, with optional context.</td></tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8" aria-labelledby="headcanon-cost-title">
              <h2 id="headcanon-cost-title" className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">What does a generation cost?</h2>
              <p className="mb-4">One successful batch costs 1 credit and returns 5 ideas. A pack costs $9.90 once for 100 credits; it is not a subscription.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>100 credits:</strong> up to 100 successful batches if you use the full pack on generation.</li>
                <li><strong>500 ideas:</strong> 100 batches multiplied by 5 ideas per batch, not a promise of 500 publish-ready passages.</li>
                <li><strong>No expiry:</strong> use the credits when you need them. Failed generations do not consume a credit.</li>
              </ul>
              <p className="mt-4">You can read the public examples without buying credits. To generate, <a href="#generator" className="text-indigo-600 underline dark:text-indigo-400">return to the generator</a>, sign in with an email code, and buy the pack if you need credits. Check each result against the source material and rewrite it before using it.</p>
            </section>

            {LONG_FORM_CONTENT.map((section) => (
              <section key={section.title} className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {section.title}
                </h2>
                {section.body.map((para) => (
                  <p key={para} className="mb-4">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>

        <div id="fandoms" className="scroll-mt-24 border-t border-slate-200 pt-12 dark:border-slate-800">
          <div className="grid gap-10 md:grid-cols-2">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Browse by fandom
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Start with a setting, then open a character example or prefill the generator.
              </p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                {FANDOM_HUBS.map((hub) => (
                  <Link
                    key={hub.slug}
                    href={`/fandom/${hub.slug}`}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {hub.name} headcanons
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Headcanon writing guides
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Check the basics, shape a character detail, or turn a relationship idea into a scene.
              </p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                {WRITING_GUIDES.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {guide.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
            More ways to start
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link
              href="/random-character-generator"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Random Character Generator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/writing-prompt-generator"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Writing Prompt Generator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/multiple-character-headcanon-generator"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Multiple Character Headcanon Generator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/relationship-headcanon-generator"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Relationship Headcanon Generator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/oc-headcanon-generator"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400"
            >
              OC Headcanon Generator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
