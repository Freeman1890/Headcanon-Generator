import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/multiple-character-headcanon-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Multiple Character Headcanon Generator for Pair Ideas | Headcanon Generator",
  description:
    "Use a multiple character headcanon generator for two characters, a couple, or a group. Enter their names and a fandom, then shape the result into a scene idea.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "Multiple Character Headcanon Generator for Pair Ideas",
    description:
      "Find a shared habit, disagreement, or scene idea for two characters or a larger cast.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function MultipleCharacterHeadcanonGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        title: "Multiple Character Headcanon Generator",
        eyebrow: "Pair and group ideas for fanfiction and roleplay",
        intro:
          "Need a detail that belongs to two characters instead of one? Enter both names in the character field, add the fandom if it helps, and use the result as a starting point for a shared habit, disagreement, or scene.",
        note:
          "For a pair, enter both names together, such as \"Mara and Jo\". Use the fandom field for the world they share.",
        inputHint: "Enter one character, pair, or group",
        purpose: [
          "A pair headcanon is easier to use when it gives the characters something specific to do together. It might be a ritual before a mission, a disagreement about a small object, or a habit that only one of them knows.",
          "For a first pass, enter both names in the character field. Keep the fandom separate so the result has enough context without turning the input into a full plot summary.",
          "Treat the result as a draft. Change the balance between the characters, move the setting, or make the detail quieter before writing the scene.",
        ],
        steps: [
          "Enter both names in Character name, such as \"Mara and Jo\". For a larger cast, enter a short group label or the names you want to keep in focus.",
          "Add the fandom in the optional field. For an original cast, leave it blank or add the name of your project.",
          "Use the result as a shared detail. Decide who notices it, who pushes back, and what scene it could start.",
        ],
        useCases: [
          {
            title: "Pair dynamics",
            body: "Give two characters a shared routine, private joke, or small problem before you plan the whole relationship.",
          },
          {
            title: "Group scenes",
            body: "Use a group name or a short list of characters when a scene needs a common habit that brings everyone into focus.",
          },
          {
            title: "Small conflicts",
            body: "A disagreement about food, timing, or an ordinary object can give a group scene somewhere to move.",
          },
        ],
        example: {
          heading: "Example: a shared habit for two characters",
          body:
            "A shared habit can be as plain as one character saving the last chair without mentioning it. The detail gives the other character something to notice, question, or quietly expect in the next scene.",
          href: "/#generator",
          linkLabel: "Try it with a pair",
        },
        faqs: [
          {
            q: "Can I enter two character names?",
            a: "Yes. Put both names in the Character name field, such as \"Mara and Jo\". Use the fandom field for the setting or source they share.",
          },
          {
            q: "Does this create a complete relationship profile?",
            a: "No. It creates one short headcanon detail. Use that detail as a starting point for a relationship, group scene, or character outline.",
          },
          {
            q: "Can I use it for a group of original characters?",
            a: "Yes. Enter a short group label or the names that matter in the scene. A smaller pair usually produces a more specific result, while a larger group gives you a broader starting point.",
          },
        ],
        relatedLinks: [
          { href: "/relationship-headcanon-generator", label: "Relationship Headcanon Generator" },
          { href: "/oc-headcanon-generator", label: "OC Headcanon Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
