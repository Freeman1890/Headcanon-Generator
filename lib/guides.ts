import { DEEP_WRITING_GUIDES, type InputRecipe } from "./deep-guides";

export interface WritingGuide {
  slug: string;
  title: string;
  description: string;
  intro: string;
  published: string;
  updated: string;
  sections: {
    title: string;
    paragraphs: string[];
    items?: string[];
    steps?: string[];
    example?: { input: string; draft: string; problem: string; revised: string; scene: string[]; reason: string };
    table?: { caption: string; columns: string[]; rows: string[][]; downloadFilename?: string };
    recipes?: InputRecipe[];
    links?: { href: string; label: string }[];
    comparison?: { term: string; meaning: string; example: string }[];
    reference?: { label: string; href: string; note: string };
  }[];
  faqs: { q: string; a: string }[];
  relatedLinks: { href: string; label: string }[];
}

export const WRITING_GUIDES: WritingGuide[] = [
  {
    slug: "what-is-a-headcanon",
    title: "What Is a Headcanon? A Practical Guide for Fan Writing",
    description:
      "Learn what a headcanon is, how it differs from official canon, and how fans use small character ideas in fiction, roleplay, discussion, and scene writing.",
    intro:
      "A headcanon is a personal idea a fan accepts about a character or fictional world even though the source never confirms it. It might explain a habit, fill a quiet gap in the story, or suggest how two characters behave when the plot is not watching.",
    published: "2026-07-30",
    updated: "2026-10-24",
    sections: [
      {
        title: "Headcanon in plain language",
        paragraphs: [
          "Canon is what the original work establishes. A headcanon sits outside that record. It can be compatible with canon, but it remains a fan interpretation unless the creator later confirms it.",
          "The scale can be tiny. A character always orders the same drink. Two teammates have a routine before difficult missions. Someone keeps a broken object because replacing it would feel like admitting a chapter of their life is over. None of these details needs to rewrite the plot.",
        ],
        reference: {
          label: "Dictionary.com: headcanon",
          href: "https://www.dictionary.com/culture/slang/headcanon",
          note: "This slang explainer describes headcanon as a fan's personal interpretation outside the official account. The examples and writing exercises here are our own.",
        },
      },
      {
        title: "Why fans make headcanons",
        paragraphs: [
          "Fans use headcanons to explore moments a story leaves open. Sometimes that is deliberate, and sometimes a series simply has no reason to show what a character does on an ordinary afternoon.",
          "They also make useful writing prompts. A small private habit can create a scene faster than a broad trait such as brave, shy, or mysterious because it gives another character something specific to notice.",
        ],
        items: [
          "To connect two canon moments that feel emotionally unfinished",
          "To test a relationship outside the main plot",
          "To give an original scene a concrete starting point",
          "To talk with other fans about different readings of a character",
        ],
      },
      {
        title: "How to share one clearly",
        paragraphs: [
          "Present a headcanon as your interpretation, not as a fact everyone missed. Phrases such as “I like to imagine” or “my headcanon is” make the boundary clear without weakening the idea.",
          "If the idea touches a sensitive topic or contradicts a major canon event, add enough context for readers to understand the version you are discussing. A short note is usually better than a long defense.",
        ],
      },
    ],
    faqs: [
      { q: "What does headcanon mean in anime?", a: "It means the same thing as in other fiction: a fan's own interpretation that the source does not establish. Imagining a character's private routine can be a headcanon; an event shown in an episode is part of the source record." },
      { q: "Is it headcanon, head canon, or headcannon?", a: "Headcanon is the usual spelling of this fandom term. Head canon is also used as a search phrase; headcannon adds an extra n. These spellings do not describe different kinds of character-writing tools." },
      { q: "What kinds of headcanons can I write?", a: "You can explore daily habits, relationships, motivations, or life between established events. Choose one detail and make clear which part is your interpretation. A complete invented biography or a changed major event may be better described as an AU." },
      {
        q: "Can a headcanon contradict canon?",
        a: "It can, but fans often call that an alternate universe or canon-divergent idea when the contradiction changes an established event or relationship.",
      },
      {
        q: "Does a popular headcanon become canon?",
        a: "No. Popularity can make an idea common in a fandom, but only the source or its authorized creators can establish official canon.",
      },
    ],
    relatedLinks: [
      { href: "/headcanon-template", label: "Separate facts and interpretation in a worksheet" },
      { href: "/writing-prompt-generator", label: "Free headcanon writing prompts" },
      { href: "/guides/headcanon-vs-canon", label: "Headcanon vs. canon" },
      { href: "/guides/how-to-write-a-character-headcanon", label: "How to write a character headcanon" },
      { href: "/#generator", label: "Try the headcanon generator" },
    ],
  },
  {
    slug: "headcanon-vs-canon",
    title: "Headcanon vs. Canon: Differences, Fanon, and Examples",
    description:
      "Compare headcanon and canon, see where fanon and canon divergence fit, and label character ideas clearly when writing fanfiction or discussing a fandom.",
    intro:
      "Canon describes information established by the original work or an authorized source. Headcanon describes a fan's personal interpretation. The difference is not about whether an idea is good. It is about where the idea comes from and how confidently it can be treated as part of the source.",
    published: "2026-07-30",
    updated: "2026-10-24",
    sections: [
      {
        title: "A quick comparison",
        paragraphs: [
          "Canon comes from the source; a headcanon comes from a fan's interpretation. Fanon is an unofficial idea that spreads through a fan community. The invented examples below show how the labels differ.",
          "A headcanon can be well supported. It may explain body language, repeated choices, or a gap between two episodes. Evidence makes an interpretation persuasive, but it does not change its status.",
        ],
        comparison: [
          { term: "Canon", meaning: "A detail established by the source being discussed.", example: "A novel states that a character hates rain." },
          { term: "Headcanon", meaning: "A fan's personal interpretation that the source does not confirm.", example: "You imagine that character keeps an umbrella by every door." },
          { term: "Fanon", meaning: "An unofficial idea shared widely within a fan community.", example: "Other fans adopt the umbrella habit in their own stories." },
          { term: "Canon divergence", meaning: "A fan story deliberately changes an established event.", example: "You rewrite a storm scene so the character stays instead of leaving." },
        ],
        reference: {
          label: "Merriam-Webster: Words We're Watching: Headcanon",
          href: "https://www.merriam-webster.com/wordplay/words-were-watching-headcanon-fanon",
          note: "Merriam-Webster discusses canon, headcanon, and fanon in fandom usage. The umbrella comparison is an original illustration, not a quotation from that article.",
        },
      },
      {
        title: "Why the labels matter",
        paragraphs: [
          "Clear labels keep discussions from turning into arguments about evidence when people are really sharing preferences. They also help readers decide what kind of story or post they are opening.",
          "You do not need to attach a disclaimer to every sentence. State the frame once, especially when the idea is popular enough to be confused with the source or when different adaptations handle the detail differently.",
        ],
      },
      {
        title: "When sources disagree",
        paragraphs: [
          "Name the version you mean when sources disagree. Long-running series may have novels, games, films, translations, and adaptations that do not line up perfectly. An idea can be canon in one adaptation and unsupported in another.",
          "When you are unsure, describe what you observed instead of making a broad claim. That leaves room for another source without forcing the discussion into a winner and loser.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is fanon the same as headcanon?",
        a: "Not exactly. A headcanon can belong to one person. Fanon is a shared fan idea that has become common, even though it is still unofficial.",
      },
      {
        q: "Can an author confirm a headcanon later?",
        a: "Yes. If an authorized source confirms the detail, it may become canon. The status depends on what the fandom treats as an official source.",
      },
    ],
    relatedLinks: [
      { href: "/guides/what-is-a-headcanon", label: "What is a headcanon?" },
      { href: "/guides/how-to-write-a-character-headcanon", label: "Write a character headcanon" },
      { href: "/#generator", label: "Generate an idea" },
    ],
  },
  ...DEEP_WRITING_GUIDES,
];

export function findWritingGuide(slug: string) {
  return WRITING_GUIDES.find((guide) => guide.slug === slug);
}

export function formatGuideDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
