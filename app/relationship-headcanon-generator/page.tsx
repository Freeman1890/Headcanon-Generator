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
          "Need a small detail for a couple, ship, or complicated dynamic? Choose Relationship, enter both names in their own fields, and add the fandom if it helps. One credit gives you five ideas to write from.",
        note:
          "For a ship or OTP, choose Romance / ship in More options. For friends, choose Friendship so the request stays platonic. Add a scene if you already know where they meet.",
        inputHint: "One name in First character, one in Second character",
        purpose: [
          "A relationship headcanon gives two characters something to share. It could be a routine they never discuss, a point they keep arguing about, or a way one of them shows care without saying it directly.",
          "Enter each name in its own field and use the fandom field for context. The generator writes five small interactions involving both characters.",
          "Use the idea to test the dynamic in a scene. You can make it romantic, platonic, competitive, awkward, or something that changes from chapter to chapter.",
        ],
        steps: [
          "Choose Relationship and enter one name in First character and the other in Second character.",
          "Add the fandom if useful. In More options, choose Friendship, Romance / ship, or Rivals; add a short scene to focus the request.",
          "Generate five ideas for one purchased credit. Keep the interaction that fits, then decide what each character notices or avoids saying.",
        ],
        useCases: [
          {
            title: "Couples and romance",
            body: "Choose Romance / ship for a couple or OTP. A remembered order, an awkward invitation, or a borrowed jacket can carry the scene. Use Fluff for warm, low-stakes moments rather than a dramatic reveal.",
          },
          {
            title: "Friendships and rivals",
            body: "Choose Friendship for a strictly platonic request, or Rivals for competition without romance. A favor can matter without becoming a confession. Neither choice is a claim about the official relationship.",
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
          href: "/?mode=relationship#generator",
          linkLabel: "Try a relationship idea",
        },
        faqs: [
          {
            q: "Is a ship headcanon the same as a relationship headcanon?",
            a: "A ship usually means a romantic pairing; OTP means a favorite pairing. Relationship headcanons are broader and can cover friends or rivals too. This page keeps those requests together, with a relationship choice in the generator rather than separate near-identical tools.",
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
