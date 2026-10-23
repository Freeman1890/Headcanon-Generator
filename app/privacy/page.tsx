import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Headcanon Generator Data Practices",
  description:
    "Read how Headcanon Generator handles analytics, generated prompts, share links, cookies, browser data, and third-party services, plus your privacy choices.",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="This policy explains what Headcanon Generator handles when you visit the site or use the generator."
      updated="October 24, 2026"
      sections={[
        {
          title: "What the site does",
          paragraphs: [
            "Headcanon Generator is a creative writing tool. Public guides, examples, the worksheet, the curated OC question bank, and the trope randomizer can be used without an account. AI generation requires email sign-in and purchased credits.",
          ],
        },
        {
          title: "Information you provide",
          paragraphs: [
            "When AI generation is enabled, the character names, fandom or setting, brief, and selected writing options you submit are sent to Kie to produce the result. This applies to headcanons, scene premises, fictional dialogue, and plot outlines. Please do not enter your name, email address, private messages, or other personal information into these fields.",
            "We store your email address, account sessions, orders, credit transactions, and generation requests and results so we can deliver purchases and recover interrupted requests. Results are private unless you choose to share a link. Please keep a copy of results you want to retain; this service does not include a personal results library.",
          ],
        },
        {
          title: "Free tools and browser worksheets",
          paragraphs: [
            "The free worksheet keeps separate existing-character and OC notes in local storage in this browser. These notes are not synced to your account or sent to an AI provider. They remain until you clear the worksheet or site data. If browser storage is blocked, you can still use the sheet for the current visit and download a text copy.",
            "The OC question bank and trope randomizer select from curated content in your browser without an AI request. Copy and download controls export the text you choose. Optional analytics and ordinary hosting request data remain subject to the practices described below.",
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
              Kie receives the names and setting you submit and routes the request to Google Gemini. Google&apos;s{" "}
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
            <span key="payments">Waffo processes purchases and payment records. Card details are entered on its hosted checkout, not stored by this site. Resend delivers sign-in codes to your email address.</span>,
          ],
        },
        {
          title: "Cookies and advertising",
          paragraphs: [
            "An essential session cookie keeps you signed in. Session storage remembers the names and setting you entered, including when you return from checkout, and an unfinished request so checking it does not create another charge. This data stays in the current browser session. These are separate from optional analytics. The site does not load Google Analytics until you choose Allow analytics. If you decline, the analytics scripts are not loaded in your browser. You can change this choice by clearing the site data for this domain.",
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
