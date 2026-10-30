import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/relationship-headcanon-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Relationship Headcanon Generator | Ships and Couples",
  description:
    "Use a relationship headcanon generator for couples, ships, friendships, or rivalries. Enter both characters and turn one short detail into a scene idea.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "Relationship Headcanon Generator for Couples and Ships",
    description:
      "Find a small interaction, habit, or tension point for a couple, ship, friendship, or rivalry.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function RelationshipHeadcanonGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        path: PAGE_PATH,
        title: "Relationship Headcanon Generator",
        eyebrow: "Character dynamics for couples, ships, and friendships",
        intro:
          "Generate five small interactions for a pair: a favor with an awkward cost, a routine someone breaks, or a disagreement that changes their next move. One successful batch costs one credit.",
        note:
          "Use one name in First character and the other in Second character. Add the work's name in Fandom, or leave it blank for an original pair.",
        inputHint: "More options contains Friendship, Romance / ship, Rivals, Tone, and a Scene field for up to 240 characters.",
        purpose: [
          "A strong pair idea gives both people a choice. If one remembers the other's order, decide whether that attention feels welcome, outdated, or intrusive.",
          "Use the five results to choose a starting interaction. Then give the other person a response that changes what happens next.",
        ],
        steps: [
          "Choose Relationship and enter one name in First character and the other in Second character.",
          "Add the fandom if useful. In More options, choose Friendship, Romance / ship, or Rivals; add a short scene to focus the request.",
          "Generate five ideas for one purchased credit. Keep the interaction that fits, then decide what each character notices or avoids saying.",
        ],
        useCases: [
          {
            title: "Friendship: a useful favor",
            body: "A friend collects a parcel while the other is at work, then reorganizes the entire porch. The recipient is grateful for the parcel and annoyed that their spare key has moved. Both reactions can stay in the scene.",
          },
          {
            title: "Romance: plans that collide",
            body: "One person books a surprise dinner; the other has spent the afternoon cooking. Let the decision about where to eat reveal how each wants to be cared for.",
          },
          {
            title: "Rivals: help with a condition",
            body: "A rival lends a spare part before a race, then asks for the damaged one back to study it. The favor solves one problem and creates a new negotiation.",
          },
        ],
        example: {
          heading: "Compare the same situation across three relationships",
          body:
            "Our worked guide takes a borrowed coat, a missed train, and an unfinished apology through friendship, romance, and rivalry. Follow the change in expectations to build your own version.",
          href: "/guides/relationship-headcanon-ideas",
          linkLabel: "Read the nine relationship examples",
        },
        faqs: [
          {
            q: "Is a ship headcanon the same as a relationship headcanon?",
            a: "A ship usually means a romantic pairing; OTP means a favorite pairing. Relationship headcanons also cover friends and rivals. Choose the relationship type that fits your pair in More options.",
          },
          {
            q: "Can I enter two characters in the generator?",
            a: "Yes. Choose Relationship and enter the names in First character and Second character. Two people, a duo, or a couple all use this two-name form. One credit gives five ideas involving both characters, not a complete profile.",
          },
          {
            q: "Can I use the result for roleplay?",
            a: "Yes. Turn the detail into a reason for a conversation, a reveal, or a small choice. Change anything that does not sound like the characters you are playing.",
          },
        ],
        relatedLinks: [
          { href: "/guides/headcanon-generator-prompts", label: "Copy a field-by-field input recipe" },
          { href: "/scenario-headcanon-generator", label: "Couple and Pair Scenarios" },
          { href: "/incorrect-quotes-generator", label: "Fictional Dialogue for Two Characters" },
          { href: "/multiple-character-headcanon-generator", label: "Multiple Character Headcanon Generator" },
          { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
          { href: "/?mode=relationship&relationshipKind=friendship#generator", label: "Try a friendship (no romance)" },
          { href: "/?mode=relationship&relationshipKind=romance&tone=fluff#generator", label: "Try a warm ship idea" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
