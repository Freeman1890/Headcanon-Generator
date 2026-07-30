import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Headcanon Generator | Site and Writing Tools",
  description:
    "Learn how Headcanon Generator creates character details, how its examples work, and how the site handles fandom names, ownership, site feedback, and requests.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Headcanon Generator"
      intro="Headcanon Generator is a writing tool for small character details, scene starters, and fanfiction notes."
      updated="July 30, 2026"
      sections={[
        {
          title: "What you can do here",
          paragraphs: [
            "Enter a character and, if useful, the fandom they come from. The generator returns a short idea that you can keep, rewrite, or use as a starting point for a scene.",
            "The site also includes a small set of fixed examples. Each example has extra prompts, scene ideas, writer notes, and questions that help turn one detail into a usable piece of writing.",
          ],
        },
        {
          title: "About the content",
          paragraphs: [
            "A headcanon is a fan idea, not official canon. The examples and generated results are creative reference material. They should not be presented as statements from the original creators or rights holders.",
          ],
        },
        {
          title: "How content is written and reviewed",
          paragraphs: [
            "Some generator output and early copy drafts are AI-assisted. Fixed character examples, fandom pages, and writing guides are edited before publication. The review checks whether the writing is clear, specific, useful in a scene, and honest about the difference between fan interpretation and canon.",
            "Generated results are not checked against every episode, chapter, game update, or translation in real time. When a canon detail matters, use the original work or an official source and revise the prompt to fit your version of the character.",
          ],
        },
        {
          title: "What the review changes",
          items: [
            "Removes generic filler and claims the page cannot support",
            "Replaces broad personality labels with concrete actions or objects",
            "Checks that a page gives the reader a practical next step",
            "Keeps copyrighted characters and fandom names attributed to their owners",
          ],
        },
        {
          title: "Fandom names and ownership",
          paragraphs: [
            "Character names, series names, and other third-party marks belong to their respective owners. Headcanon Generator is an independent fan-writing tool and does not claim affiliation with those owners.",
          ],
        },
        {
          title: "Source and feedback",
          paragraphs: [
            <span key="source">
              The project source is available on{" "}
              <a
                href="https://github.com/Freeman1890/Headcanon-Generator"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                GitHub
              </a>
              . Bug reports and privacy questions can be sent through the{" "}
              <a href="/contact" className="text-indigo-600 underline dark:text-indigo-400">
                Contact page
              </a>
              .
            </span>,
          ],
        },
      ]}
    />
  );
}
