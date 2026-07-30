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
        title: "Relationship Headcanon Generator",
        eyebrow: "Character dynamics for couples, ships, and friendships",
        intro:
          "Need a small detail for a couple, ship, or complicated dynamic? Put both names in Character name, add the fandom if it helps, and use the result to start a scene between them.",
        note:
          "A ship can be romantic, friendly, tense, or hard to name. Enter the two characters and let the result suggest one moment between them.",
        inputHint: "Enter both characters or a ship",
        purpose: [
          "A relationship headcanon gives two characters something to share. It could be a routine they never discuss, a point they keep arguing about, or a way one of them shows care without saying it directly.",
          "Enter the pair as one text input and use the fandom field for context. This keeps the current generator simple while giving the result both names to work with.",
          "Use the idea to test the dynamic in a scene. You can make it romantic, platonic, competitive, awkward, or something that changes from chapter to chapter.",
        ],
        steps: [
          "Enter both character names in Character name. A format such as \"Mara and Jo\" makes the relationship clear.",
          "Add the fandom in the optional field when the source world matters. Leave it blank for an original relationship.",
          "Read the result as a scene prompt. Decide what each character wants from the moment and what they avoid saying.",
        ],
        useCases: [
          {
            title: "Couples and romance",
            body: "Give a couple a recurring habit or a quiet point of friction that can carry a scene without turning into a full plot summary.",
          },
          {
            title: "Friendships and rivals",
            body: "Use the same format for a friendship, rivalry, or uneasy partnership. The relationship does not have to be romantic.",
          },
          {
            title: "Roleplay scenes",
            body: "Start with a reason for two characters to meet, disagree, notice something, or reveal a detail they were avoiding.",
          },
        ],
        example: {
          heading: "Example: a relationship detail that creates a scene",
          body:
            "One character always remembers the other person's order but pretends it is accidental. That detail can stay sweet, become annoying, or turn into an argument when the order changes.",
          href: "/#generator",
          linkLabel: "Try a relationship idea",
        },
        faqs: [
          {
            q: "Does ship always mean romance?",
            a: "No. You can use the page for romance, friendship, rivalry, family dynamics, or a relationship that does not have a clear label yet.",
          },
          {
            q: "Can I enter two characters in the generator?",
            a: "Yes. Enter both names in the Character name field, then use the fandom field for their setting. The result is a short relationship detail, not a complete profile.",
          },
          {
            q: "Can I use the result for roleplay?",
            a: "Yes. Turn the detail into a reason for a conversation, a reveal, or a small choice. Change anything that does not sound like the characters you are playing.",
          },
        ],
        relatedLinks: [
          { href: "/multiple-character-headcanon-generator", label: "Multiple Character Headcanon Generator" },
          { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
