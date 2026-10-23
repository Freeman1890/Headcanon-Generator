import type { Metadata } from "next";
import { KeywordLandingPage } from "@/components/KeywordLandingPage";
import { SITE_URL } from "@/lib/site";

const PAGE_PATH = "/writing-prompt-generator";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Writing Prompt Generator for Stories | Headcanon Generator",
  description:
    "Use the writing prompt generator to turn a character and optional fandom into a scene idea. Shape the result for fanfiction, roleplay, or an original story.",
  alternates: {
    canonical: `${SITE_URL}${PAGE_PATH}`,
  },
  openGraph: {
    title: "Writing Prompt Generator for Fanfiction and Roleplay",
    description:
      "Start with a character and optional fandom, then turn a short prompt into a scene that fits your story.",
    url: `${SITE_URL}${PAGE_PATH}`,
    siteName: "Headcanon Generator",
    type: "article",
  },
};

export default function WritingPromptGeneratorPage() {
  return (
    <KeywordLandingPage
      config={{
        path: PAGE_PATH,
        title: "Writing Prompt Generator",
        eyebrow: "Writing prompts for fanfiction, roleplay, and original stories",
        intro:
          "Writer's block is easier to push through with a place to start. Enter a character and, if useful, a fandom. You will get a small writing prompt for a scene, relationship, or story turn you can actually work with.",
        note:
          "This page makes scene starters, not finished stories. Keep the part that fits and change the rest until it sounds like your story.",
        purpose: [
          "A useful writing prompt gives you somewhere to move. It might start with a conversation or a decision that changes the next scene.",
          "The character stays at the center of the prompt. Add a fandom when you want the idea to stay close to an existing world. Leave it out when you want more room to invent.",
          "For a scenario headcanon, put a situation in Scene under More options: waiting out a storm, sharing a late shift, or finding a returned letter. The five ideas will use that setting rather than offering unrelated habits. Choose Fluff for warm, low-stakes moments.",
        ],
        steps: [
          "Enter the character you want to write about. It can be an established character or your own OC.",
          "Add a fandom when the character belongs to an existing world. Leave it blank for a more open creative writing prompt.",
          "In More options, add a scene if you have one. Generate five short ideas for one credit, then rewrite the voice or ending until it fits your story.",
        ],
        useCases: [
          {
            title: "Fanfiction scenes",
            body: "Start with a character and fandom, then give the scene one clear problem to work through.",
          },
          {
            title: "Roleplay setup",
            body: "Use a prompt as a reason for two characters to meet, disagree, or reveal something they were avoiding.",
          },
          {
            title: "Original stories",
            body: "Give an OC a situation or choice to test before you build the full plot.",
          },
        ],
        example: {
          heading: "Example: a quiet writing prompt for a busy character",
          body:
            "A writing prompt does not need to begin with a crisis. For Raiden Shogun, a simple prompt about taking a private dessert attempt too seriously can open a scene about control and an ordinary mistake.",
          href: "/fandom/genshin-impact/raiden-shogun",
          linkLabel: "See a character example",
        },
        faqs: [
          { q: "Is this the same as the scenario or plot tool?", a: "No. This entry uses the core headcanon generator for five small character details, which you can develop into scenes. The dedicated Scenario tool instead asks for a place, disruption, and unresolved choice. The Plot tool asks for a goal, obstacle, turn, and ending." },
          {
            q: "What does this writing prompt generator create?",
            a: "It creates a short scene starter based on the character and fandom you enter. The result gives the scene somewhere to go, but it does not write the whole story for you.",
          },
          {
            q: "Can I use it for fanfiction and roleplay?",
            a: "Yes. Add the fandom when context matters. For roleplay, use the result as a reason for a conversation, a reveal, or a choice.",
          },
          {
            q: "Can I use it for an original character?",
            a: "Yes. Enter the OC's name or a working name and leave the fandom blank. The prompt can help you test the character's voice in a scene.",
          },
        ],
        relatedLinks: [
          { href: "/scenario-headcanon-generator", label: "Scenario Headcanon Generator" },
          { href: "/fanfiction-plot-generator", label: "Fanfiction Plot Generator" },
          { href: "/random-trope-generator", label: "Random Trope Generator" },
          { href: "/random-character-generator", label: "Random Character Generator" },
          { href: "/?scenario=Waiting%20for%20the%20rain%20to%20stop%20after%20training#generator", label: "Try a rainy-day scene" },
          { href: "/", label: "Open Headcanon Generator" },
        ],
        prompts: [
          { title: "A small favor", body: "What does your character quietly do for someone who thinks they never notice? Put the favor in a place where it can be misunderstood." },
          { title: "A borrowed object", body: "A familiar object comes back repaired. Why did its owner prefer it broken, and how much of that will they explain?" },
          { title: "An OC under pressure", body: "Give your OC a simple errand that conflicts with a promise. Which do they complete, and what do they claim happened to the other?" },
          { title: "A pair without a confession", body: "Two people know each other's usual order. One changes it today. Write the other person's reaction without naming the feeling." },
          { title: "The wrong audience", body: "A character prepares a brave explanation, then has to give it to someone who already knows the truth." },
          { title: "A familiar place", body: "Change one ordinary detail in a place the character visits every day. What do they notice first, and what does everyone else miss?" },
        ],
      }}
    />
  );
}
