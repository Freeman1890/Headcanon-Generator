import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/random-character-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Random Character Generator for OCs and Fandom Ideas | Headcanon Generator",
  description:
    "Use a random character generator to find a small detail for an OC, fictional character, or fandom scene. Enter a name and optional fandom to get a headcanon idea.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "Random Character Generator for OCs and Fandom Ideas",
    description:
      "Find a small character detail for an OC, roleplay character, or fandom scene, then turn it into a scene or writing prompt.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function RandomCharacterGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        title: "Random Character Generator",
        eyebrow: "Random character ideas for OCs, fanfiction, and roleplay",
        intro:
          "Looking for a random character generator that gives you something to write with? Enter a character name and, if useful, a fandom. You will get a short headcanon idea for an OC or a fictional character.",
        note:
          "This is a text tool for character details, not an image generator or a full profile builder. Use it when you want one idea with room to make it your own.",
        purpose: [
          "Sometimes a character needs one small fact before a scene starts to feel possible. A private habit or a strange preference can give you a place to begin.",
          "The generator keeps that first step small. It gives you one character detail to keep, change, or turn into a writing prompt. That is enough to start a scene without fixing the whole plot.",
          "You can use the form for a cartoon character, anime character, game character, or OC. Enter the name first and add the fandom only when it helps. This page stays focused on text you can write around.",
        ],
        steps: [
          "Enter the name of the character you want to develop. Your own OC works just as well as an established character.",
          "Add the fandom if the character belongs to one. This helps when you are working with a cartoon character, anime character, or another fictional character. Leave it blank for a looser idea.",
          "Read the result as a starting point. Keep what fits, change what does not, and turn it into a scene or writing prompt.",
        ],
        useCases: [
          {
            title: "OC character ideas",
            body: "Give a new character one behavior or private thought before you fill in a longer profile.",
          },
          {
            title: "Fandom characters",
            body: "Use the fandom field when you want the idea to stay close to the character's world and tone.",
          },
          {
            title: "Cartoon and anime writing",
            body: "A random character detail can give you a reaction or a scene to test before you write the full chapter.",
          },
        ],
        example: {
          heading: "Example: a random character detail for Raiden Shogun",
          body:
            "Small details are often easier to write than grand backstories. In this example, Raiden Shogun takes a private dessert attempt as seriously as formal training. That is enough to suggest a scene without changing her larger role.",
          href: "/fandom/genshin-impact/raiden-shogun",
          linkLabel: "See a character example",
        },
        faqs: [
          {
            q: "What does this random character generator create?",
            a: "It creates a short, text-based headcanon detail for the character name you enter. Use it as one part of a profile, roleplay setup, or scene plan. It is not a full character sheet or an image generator.",
          },
          {
            q: "Can I generate random cartoon characters or anime characters?",
            a: "Yes, as a writing starting point. Enter the name of a cartoon character, anime character, game character, or your own OC. The tool creates a detail for that character instead of selecting an image from a catalog.",
          },
          {
            q: "Can I use this as a writing prompt generator for roleplay?",
            a: "Yes. A habit, preference, or private worry can give you something to reveal during a conversation or use when a scene stalls. Change the result until it sounds like your character.",
          },
        ],
        relatedLinks: [
          { href: "/writing-prompt-generator", label: "Writing Prompt Generator" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
      }}
    />
  );
}
