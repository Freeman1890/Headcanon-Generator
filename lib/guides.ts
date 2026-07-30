export interface WritingGuide {
  slug: string;
  title: string;
  description: string;
  intro: string;
  reviewed: string;
  sections: {
    title: string;
    paragraphs: string[];
    items?: string[];
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
    reviewed: "July 30, 2026",
    sections: [
      {
        title: "Headcanon in plain language",
        paragraphs: [
          "Canon is what the original work establishes. A headcanon sits outside that record. It can be compatible with canon, but it remains a fan interpretation unless the creator later confirms it.",
          "The scale can be tiny. A character always orders the same drink. Two teammates have a routine before difficult missions. Someone keeps a broken object because replacing it would feel like admitting a chapter of their life is over. None of these details needs to rewrite the plot.",
        ],
      },
      {
        title: "Why fans make headcanons",
        paragraphs: [
          "Stories leave blank spaces. Sometimes that is deliberate, and sometimes a series simply has no reason to show what a character does on an ordinary afternoon. Headcanons give fans a way to explore those spaces.",
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
    reviewed: "July 30, 2026",
    sections: [
      {
        title: "A quick comparison",
        paragraphs: [
          "If a novel states that a character hates rain, that detail is canon. If a reader imagines the character keeps an umbrella by every door because of that dislike, the umbrella habit is a headcanon. It follows the source, but the source never says it happens.",
          "A headcanon can be well supported. It may explain body language, repeated choices, or a gap between two episodes. Evidence makes an interpretation persuasive, but it does not change its status.",
        ],
        items: [
          "Canon: stated or clearly shown in the authorized work",
          "Headcanon: a personal idea that fills or interprets a gap",
          "Fanon: a fan idea repeated so widely that it feels familiar across the community",
          "Canon divergence: a story that deliberately changes an established event",
        ],
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
          "Long-running series may have novels, games, films, translations, and adaptations that do not line up perfectly. Name the version you mean. An idea can be canon in one adaptation and unsupported in another.",
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
  {
    slug: "how-to-write-a-character-headcanon",
    title: "How to Write a Character Headcanon That Feels Specific",
    description:
      "Write a character headcanon by starting with canon behavior, choosing one concrete detail, and testing how it changes a short scene between characters.",
    intro:
      "A convincing character headcanon usually adds less than you expect. It takes one behavior the audience already recognizes and follows it into a moment the source did not show.",
    reviewed: "July 30, 2026",
    sections: [
      {
        title: "Start with an observable pattern",
        paragraphs: [
          "Choose something the character repeatedly does under pressure, around friends, or when they think nobody is watching. Stay close to actions before you explain motives. The same action can support more than one reading.",
          "For example, a character who always arrives early might be anxious, considerate, controlling, or simply bad at estimating travel time. Pick the explanation that creates the most useful scene, then leave room for uncertainty.",
        ],
      },
      {
        title: "Add one physical detail",
        paragraphs: [
          "A prop or repeated action gives the headcanon a place to live. Use a cracked phone case, a half-finished cup of tea, a carefully folded receipt, or a chair nobody else sits in.",
          "Concrete details also keep the idea from becoming a diagnosis or a personality summary. Readers can watch the character do something and decide what it means.",
        ],
        items: [
          "What object does the character keep longer than necessary?",
          "What ordinary task do they make unusually difficult?",
          "Who is allowed to notice the habit?",
          "What changes when the routine is interrupted?",
        ],
      },
      {
        title: "Test it in a scene",
        paragraphs: [
          "Write six to ten lines in which another character encounters the detail. Do not explain it in narration yet. Let the first character hide it, defend it, joke about it, or act as if nothing unusual happened.",
          "If the scene only works after a paragraph of background information, make the detail smaller. A headcanon should open a question before it answers one.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long should a character headcanon be?",
        a: "One or two sentences can be enough. Add more only when you are turning it into a scene, a list, or a longer character study.",
      },
      {
        q: "What should I do if the generated idea feels out of character?",
        a: "Keep the useful object or situation and change the reaction. The character's response matters more than preserving the generated sentence.",
      },
    ],
    relatedLinks: [
      { href: "/random-character-generator", label: "Random Character Generator" },
      { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
      { href: "/#generator", label: "Try the headcanon generator" },
    ],
  },
  {
    slug: "relationship-headcanon-ideas",
    title: "Relationship Headcanon Ideas for Ships, Friends, and Rivals",
    description:
      "Develop relationship headcanon ideas with shared routines, uneven knowledge, small conflicts, and scene prompts for ships, friendships, and rivalries.",
    intro:
      "A relationship headcanon becomes useful when it shows what two people do to each other. Give the pair a routine, a disagreement, or a piece of knowledge that belongs only to them.",
    reviewed: "July 30, 2026",
    sections: [
      {
        title: "Give the relationship a repeated action",
        paragraphs: [
          "One person fixes the other's collar before formal events. They compete over who pays for coffee. They send each other photos of badly designed signs. A repeated action creates history without requiring a flashback.",
          "The routine should allow for variation. On a difficult day, the collar goes unfixed or the message receives no reply. The change tells the reader something has shifted before either character says it.",
        ],
      },
      {
        title: "Use uneven knowledge",
        paragraphs: [
          "Relationships feel distinct when each person knows a different version of the other. A rival may notice a weakness that friends overlook. A sibling may remember an old fear the character has learned to hide.",
          "Choose one fact that only this relationship makes visible. Then decide whether the knowledge feels safe, irritating, embarrassing, or dangerous to the person being read so closely.",
        ],
        items: [
          "A preference one person orders without asking",
          "A warning sign only the other person recognizes",
          "An argument they have never fully settled",
          "A favor that became a habit without discussion",
        ],
      },
      {
        title: "Write the interruption",
        paragraphs: [
          "Put the routine in front of a third person, change the setting, or make one character refuse their usual role. Interruption turns a list item into a scene.",
          "For romance, let intimacy appear through attention rather than a speech. For friendship or rivalry, use the same approach. Recognition can be affectionate, competitive, or both.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do relationship headcanons have to be romantic?",
        a: "No. The same methods work for friends, rivals, family members, teammates, mentors, and relationships that do not fit one label.",
      },
      {
        q: "How do I enter a pair in the generator?",
        a: "Put both names in the character field, such as “Mara and Jo,” then add the fandom if it helps establish the setting.",
      },
    ],
    relatedLinks: [
      { href: "/relationship-headcanon-generator", label: "Relationship Headcanon Generator" },
      { href: "/multiple-character-headcanon-generator", label: "Multiple Character Headcanon Generator" },
      { href: "/guides/how-to-write-a-character-headcanon", label: "Character headcanon guide" },
    ],
  },
  {
    slug: "how-to-create-an-oc-headcanon",
    title: "How to Create an OC Headcanon Without Writing a Full Profile",
    description:
      "Build an original character headcanon from one choice, habit, or contradiction, then expand it into a focused profile, scene, or roleplay setup for writing.",
    intro:
      "An original character does not need a finished biography before the first scene. One specific choice can reveal enough tension to start writing and leave the rest open for discovery.",
    reviewed: "July 30, 2026",
    sections: [
      {
        title: "Begin with a choice, not a trait",
        paragraphs: [
          "Instead of writing that an OC is generous, decide what they give away and what they refuse to share. Instead of calling them cautious, show what they check twice before leaving home.",
          "Choices have context. A character can be patient with children and impatient with authority, brave in public and hesitant when asking for help. That variation keeps a profile from feeling like a list of fixed settings.",
        ],
      },
      {
        title: "Add a useful contradiction",
        paragraphs: [
          "A contradiction is not two random traits placed together. It is a point where the character's values compete. Someone may want to be dependable but hate being needed. Another person may value honesty and still hide anything that makes them look uncertain.",
          "Give the contradiction a cost small enough to show in a scene. They miss a train because they went back to check a lock, or they agree to help and quietly resent the interruption.",
        ],
        items: [
          "What do they want others to assume about them?",
          "Which ordinary task exposes the opposite?",
          "Who gets the most honest version of the character?",
          "What would make them abandon a familiar routine?",
        ],
      },
      {
        title: "Let the profile follow the scene",
        paragraphs: [
          "Use the headcanon in a short interaction before deciding on every date, relative, or formative event. The scene will tell you which background details are actually needed.",
          "Afterward, record only what became useful: the choice, the reason you currently believe it happens, and one condition that could change it. This gives the character room to surprise you later.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I use the OC generator without choosing a fandom?",
        a: "Yes. Enter a name or temporary label and leave the fandom blank for an original setting.",
      },
      {
        q: "Should an OC headcanon become part of the final profile?",
        a: "Only if it helps. Treat the idea as a test. Keep it when it creates better choices or scenes, and discard it when it narrows the character too early.",
      },
    ],
    relatedLinks: [
      { href: "/oc-headcanon-generator", label: "OC Headcanon Generator" },
      { href: "/random-character-generator", label: "Random Character Generator" },
      { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
    ],
  },
];

export function findWritingGuide(slug: string) {
  return WRITING_GUIDES.find((guide) => guide.slug === slug);
}
