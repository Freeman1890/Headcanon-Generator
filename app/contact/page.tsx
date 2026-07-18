import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Headcanon Generator",
  description:
    "Contact Headcanon Generator about bugs, privacy questions, content removal, and site feedback.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="Use the project page to report a bug, ask a question, or raise a privacy or content concern."
      updated="July 19, 2026"
      sections={[
        {
          title: "General questions",
          paragraphs: [
            <span key="general">
              Open an issue in the{" "}
              <a
                href="https://github.com/Freeman1890/Headcanon-Generator/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                Headcanon Generator repository
              </a>
              . Include the page URL and a short description of what happened.
            </span>,
          ],
        },
        {
          title: "Privacy and content requests",
          paragraphs: [
            "Do not put personal information, private prompts, or confidential material in a public issue. For a privacy or content removal request, describe only the type of request and ask the repository owner for a private channel before sharing details.",
          ],
        },
        {
          title: "Before you report a bug",
          items: [
            "Note the page you were using and the approximate time of the problem.",
            "Say whether the problem happened on desktop or mobile.",
            "Remove names, email addresses, and other personal information from screenshots or copied text.",
          ],
        },
      ]}
    />
  );
}
