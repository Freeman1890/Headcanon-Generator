import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/oc-headcanon-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "OC Headcanon Generator for Original Character Ideas",
  description:
    "Use an OC headcanon generator to find a habit, preference, or scene detail for an original character. Add a fandom or leave it blank for your own world.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "OC Headcanon Generator for Original Character Ideas",
    description:
      "Start an original character with one specific detail you can use in a profile, scene, or roleplay setup.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function OcHeadcanonGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        path: PAGE_PATH,
        title: "OC Headcanon Generator",
        eyebrow: "Original character details for stories and roleplay",
        intro:
          "An OC does not need a full history before you write the first scene. Choose Original character, enter a name or working nickname, and add your setting if you have one. One credit returns five small details to build around.",
        note:
          "Use a name or a short working label. Setting is optional. In More options, add an everyday scene or choose Fluff when you want warm, low-stakes details.",
        inputHint: "Enter an original character name",
        purpose: [
          "A new character often becomes easier to write after one ordinary detail appears. A habit, preference, or private worry can tell you more than a long list of traits.",
          "The generator gives you a starting point for an OC profile. Keep the detail if it fits, change it if it does not, and ask what kind of scene would reveal it naturally.",
          "You can use the result for a fanfiction OC, an original story, a tabletop character, or a roleplay setup. The character remains yours to revise.",
        ],
        steps: [
          "Enter your OC's name, nickname, or a temporary label. A placeholder is fine while the character is still taking shape.",
          "Use Setting for your own world or an existing fandom. Leave it blank if you have not decided yet.",
          "Add a scene in More options if useful, then generate five details. Keep the one that fits the character instead of treating every suggestion as part of their biography.",
        ],
        useCases: [
          {
            title: "New OC profiles",
            body: "Add one behavior or preference before you fill out the rest of the character sheet.",
          },
          {
            title: "Fanfiction OCs",
            body: "Include the fandom when the setting, cast, or tone needs to shape the character detail.",
          },
          {
            title: "Roleplay characters",
            body: "Give a character a small choice or private habit that another player can notice during a scene.",
          },
        ],
        example: {
          heading: "Example: an OC detail that can grow into a scene",
          body:
            "An OC who checks the locks twice before leaving might be cautious, superstitious, or covering for someone else. The first detail does not decide the character. It gives you a question to answer while writing.",
          href: "/?mode=oc#generator",
          linkLabel: "Try it for an OC",
        },
        faqs: [
          { q: "What do OC and HC mean?", a: "OC means original character. HC is often used as shorthand for headcanon in fan-writing discussions. Generating an HC for your OC means trying an invented detail, not handing ownership of the character to the tool or making every suggestion part of their story." },
          {
            q: "Can I use this without a fandom?",
            a: "Yes. Choose Original character, enter your OC's name, and leave Setting blank. You can also name your own world there. The tool should not attach an established franchise to an original character without your context.",
          },
          {
            q: "Does it create a full OC profile?",
            a: "No. One credit generates five short character details, not a full biography. Use them to start a profile, scene, or roleplay introduction.",
          },
          {
            q: "Can I use the generated idea in my own story?",
            a: "Yes. Read the result, change anything that does not fit, and add your own choices before using it in a story or game.",
          },
        ],
        relatedLinks: [
          { href: "/headcanon-template", label: "Free Headcanon and OC Worksheet" },
          { href: "/oc-questions-generator", label: "OC Questions Generator" },
          { href: "/scenario-headcanon-generator", label: "OC Scene Premises" },
          { href: "/random-character-generator", label: "Random Character Generator" },
          { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
