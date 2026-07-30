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
          "An OC does not need a full history before you write the first scene. Enter a name or working nickname, leave the fandom blank if the character is yours, and use the result as one detail to build around.",
        note:
          "Use a real name, a placeholder, or a short character label. The fandom field is optional, so it works for both fan characters and original settings.",
        inputHint: "Enter an original character name",
        purpose: [
          "A new character often becomes easier to write after one ordinary detail appears. A habit, preference, or private worry can tell you more than a long list of traits.",
          "The generator gives you a starting point for an OC profile. Keep the detail if it fits, change it if it does not, and ask what kind of scene would reveal it naturally.",
          "You can use the result for a fanfiction OC, an original story, a tabletop character, or a roleplay setup. The character remains yours to revise.",
        ],
        steps: [
          "Enter your OC's name, nickname, or a temporary label. A placeholder is fine while the character is still taking shape.",
          "Add a fandom only when the character belongs to an existing world. Leave it blank for an original setting.",
          "Use the result to add one concrete detail to the profile or test the character in a scene.",
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
          href: "/#generator",
          linkLabel: "Try it for an OC",
        },
        faqs: [
          {
            q: "Can I use this without a fandom?",
            a: "Yes. Enter the OC's name and leave the fandom field blank. The result can fit an original setting or a character you are still designing.",
          },
          {
            q: "Does it create a full OC profile?",
            a: "No. It creates one short character detail. Use it as a prompt for a longer profile, a scene, or a roleplay introduction.",
          },
          {
            q: "Can I use the generated idea in my own story?",
            a: "Yes. Read the result, change anything that does not fit, and add your own choices before using it in a story or game.",
          },
        ],
        relatedLinks: [
          { href: "/random-character-generator", label: "Random Character Generator" },
          { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
