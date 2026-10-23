import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Headcanon Generator | Questions and Feedback",
  description:
    "Contact Headcanon Generator to report bugs, ask questions, request content removal, or raise a privacy concern. Include the page URL and a short issue summary.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
};

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact"
      intro="Questions about credits, a payment, or something the tool generated? Get in touch below."
      updated="October 24, 2026"
      sections={[
        {
          title: "Billing and private requests",
          paragraphs: [
            <span key="billing">Email <a href="mailto:ljt463015573@gmail.com" className="text-indigo-600 underline dark:text-indigo-400">ljt463015573@gmail.com</a> from your sign-in address. For a payment issue, include the order reference and approximate purchase date. Never send your password, sign-in code, or full card details.</span>,
          ],
        },
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
            "Send privacy or content removal requests by email. Include the relevant page URL and what you want reviewed. Do not put private prompts, payment information, or personal details in a public GitHub issue.",
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
