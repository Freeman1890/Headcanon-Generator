import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Headcanon Generator",
  description:
    "Learn what Headcanon Generator does, how its examples work, and how it relates to existing fandoms.",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Headcanon Generator"
      intro="Headcanon Generator is a writing tool for small character details, scene starters, and fanfiction notes."
      updated="July 19, 2026"
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
