import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Headcanon Generator",
  description:
    "How Headcanon Generator handles analytics, generated prompts, share links, cookies, and third-party services.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="This policy explains what Headcanon Generator handles when you visit the site or use the generator."
      updated="July 19, 2026"
      sections={[
        {
          title: "What the site does",
          paragraphs: [
            "Headcanon Generator is a small creative tool. You can enter a character name and an optional fandom name to get a short writing prompt. You do not need an account to use it.",
          ],
        },
        {
          title: "Information you provide",
          paragraphs: [
            "When generation is enabled, the character name and fandom name you submit are sent to the service that produces the result. Please do not enter your name, email address, private messages, or other personal information into the generator.",
            "The site does not create user accounts or keep a saved results database. A generated result can still pass through temporary technical logs held by the services that deliver and protect the site.",
          ],
        },
        {
          title: "Third-party services",
          items: [
            <span key="cloudflare">
              Cloudflare hosts and protects the site. It may process technical request data such as IP address, headers, and browser details. See the{" "}
              <a
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                Cloudflare privacy policy
              </a>
              .
            </span>,
            <span key="analytics">
              Google Analytics 4 may process page views and device or browser information after you allow analytics. See Google&apos;s{" "}
              <a
                href="https://support.google.com/analytics/answer/6004245"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                Analytics privacy guidance
              </a>
              .
            </span>,
            <span key="generation">
              When the generation service is enabled, Google Gemini processes the submitted names to return a result. Google&apos;s{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                privacy policy
              </a>{" "}
              explains how Google handles information across its services.
            </span>,
          ],
        },
        {
          title: "Cookies and advertising",
          paragraphs: [
            "The site does not load Google Analytics until you choose Allow analytics. If you decline, the analytics scripts are not loaded in your browser. You can change this choice by clearing the site data for this domain.",
            <span key="ads">
              If Google AdSense is added, Google may use cookies, web beacons, IP addresses, and similar identifiers to deliver ads, measure performance, and prevent fraud. Before ads are served where consent is required, the site will use the required Google consent message and identify the relevant ad partners. Google also explains its advertising cookies in its{" "}
              <a
                href="https://support.google.com/adsense/answer/7549925"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline dark:text-indigo-400"
              >
                AdSense cookie guidance
              </a>
              .
            </span>,
          ],
        },
        {
          title: "Share links",
          paragraphs: [
            "New share links keep the generated text in the URL fragment after the # symbol. Browsers do not send that fragment to the server in an HTTP request, but anyone who receives the link can read it. Do not use the generator for private or sensitive material.",
          ],
        },
        {
          title: "Your choices and privacy requests",
          paragraphs: [
            <span key="requests">
              You can decline analytics, control cookies in your browser, and contact the site through the{" "}
              <Link href="/contact" className="text-indigo-600 underline dark:text-indigo-400">
                Contact page
              </Link>
              . Do not post personal information in a public issue.
            </span>,
          ],
        },
        {
          title: "Changes to this policy",
          paragraphs: [
            "The policy may change when the site adds a new service, analytics tool, or advertising product. The date at the top of this page shows when the text was last updated.",
          ],
        },
      ]}
    />
  );
}
