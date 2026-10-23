import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/multiple-character-headcanon-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Multiple Character Headcanon Generator for Pair Ideas",
  description:
    "Generate five shared habits or interactions for a pair of characters. Use separate name fields and an optional scene; the current form supports two characters.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "Multiple Character Headcanon Generator for Pair Ideas",
    description:
      "Find a shared habit, disagreement, or scene idea for two characters. Enter each name separately and choose a relationship or scene.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function MultipleCharacterHeadcanonGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        path: PAGE_PATH,
        title: "Multiple Character Headcanon Generator",
        eyebrow: "Shared details for a pair of characters",
        intro:
          "Need a detail that belongs to two characters instead of one? Open Relationship and enter a name in each field. Add a scene to find a shared habit, private joke, or small disagreement that involves both of them.",
        note:
          "The current generator supports two named characters at a time, not a whole cast. For a group scene, work through one pair at a time and check that the details still fit together.",
        inputHint: "Use First character and Second character for the pair",
        purpose: [
          "A pair headcanon is easier to use when it gives the characters something specific to do together. It might be a ritual before a mission, a disagreement about a small object, or a habit that only one of them knows.",
          "Enter the names separately. A clear scene, such as packing before a trip, helps the result stay on a shared action instead of giving you two unrelated personality notes.",
          "Treat the result as a draft. Change the balance between the characters, move the setting, or make the detail quieter before writing the scene.",
        ],
        steps: [
          "Open Relationship and enter the first and second names in their own fields. The form currently takes two characters.",
          "Add the fandom in the optional field. For an original cast, leave it blank or add the name of your project.",
          "Add a shared situation in More options if you have one. One credit returns five ideas; decide who notices the detail and who pushes back.",
        ],
        useCases: [
          {
            title: "Pair dynamics",
            body: "Give two characters a shared routine, private joke, or small problem before you plan the whole relationship.",
          },
          {
            title: "A larger cast, pair by pair",
            body: "Pick the two people whose interaction matters in this scene. You can write a group around them afterward; the generator does not currently accept three or more separate character names.",
          },
          {
            title: "Small conflicts",
            body: "A disagreement about food, timing, or an ordinary object gives both characters something to react to. Use the scene field to keep the five ideas tied to that situation.",
          },
        ],
        example: {
          heading: "Example: a shared habit for two characters",
          body:
            "A shared habit can be as plain as one character saving the last chair without mentioning it. The detail gives the other character something to notice, question, or quietly expect in the next scene.",
          href: "/?mode=relationship#generator",
          linkLabel: "Try it with a pair",
        },
        faqs: [
          {
            q: "Can I enter two character names?",
            a: "Yes. Enter one name in First character and the other in Second character. Keep the shared setting in Fandom rather than adding it to either name.",
          },
          {
            q: "Does this create a complete relationship profile?",
            a: "No. One credit generates five short ideas. Use them as starting points for a relationship, scene, or character outline.",
          },
          {
            q: "Can I generate three or more characters at once?",
            a: "Not with the current form. It supports a pair, including two original characters. Work on the interaction between two people, then build the rest of the group scene yourself. A full ensemble mode is not included.",
          },
        ],
        relatedLinks: [
          { href: "/scenario-headcanon-generator", label: "Two-Character Scene Premises" },
          { href: "/incorrect-quotes-generator", label: "Two-Speaker Fictional Dialogue" },
          { href: "/relationship-headcanon-generator", label: "Relationship Headcanon Generator" },
          { href: "/oc-headcanon-generator", label: "OC Headcanon Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
