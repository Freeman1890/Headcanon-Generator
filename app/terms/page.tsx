import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use for Headcanon Generator | Usage Rules",
  description:
    "Read the rules for using Headcanon Generator, including generated writing, copyright limits, acceptable use, service changes, and your responsibilities.",
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      intro="These terms explain what Headcanon Generator provides and what you are responsible for when you use it."
      updated="October 29, 2026"
      sections={[
        {
          title: "Credits and purchases",
          paragraphs: [
            "A one-time US$9.90 purchase provides 100 credits. Applicable taxes, if any, are shown at checkout. There is no subscription or automatic renewal. Purchased credits do not expire and cannot be transferred or redeemed for cash.",
            "One credit pays for one successful batch of five results from the selected AI tool: headcanon ideas, scene premises, fictional dialogue snippets, or compact plot outlines. Failed or interrupted requests do not consume a credit. Checking or copying a completed result does not consume another credit. Requesting a new batch does. The browser worksheet, curated OC questions, and trope randomizer are free and do not use credits.",
            "For a payment problem, duplicate purchase, or refund request, contact ljt463015573+headcanon@gmail.com with your order reference and account email. Do not send card details. Requests are reviewed against the payment record and credit usage; applicable consumer rights are not excluded. A confirmed refund removes the associated unused credits.",
          ],
        },
        {
          title: "Using the site",
          paragraphs: [
            "You may use the generator for personal creative work, writing practice, roleplay notes, and similar lawful purposes. Please use the site in a way that does not interfere with other visitors or the services that run it.",
          ],
        },
        {
          title: "Generated writing",
          paragraphs: [
            "Generated text is a starting point, not a promise of accuracy, originality, canon status, or suitability for a particular project. Read it before you reuse it and make your own decisions about publication, attribution, and licensing.",
            "You are responsible for the text you submit and for how you use the result. Do not submit private information or material that you do not have permission to use.",
          ],
        },
        {
          title: "Fandom and copyright",
          paragraphs: [
            "The site does not claim ownership of third-party characters, series, settings, or trademarks. If you publish or sell work based on an existing fandom, check the rules that apply to that work and add your own original writing.",
          ],
        },
        {
          title: "Prohibited use",
          items: [
            "Do not use the service to request explicit sexual content, sexual exploitation of minors, threats, targeted harassment, hate content, or instructions for illegal activity.",
            "Do not use the service to collect personal information, distribute malware, probe the site, or bypass usage limits.",
            "Do not present generated text as an official statement from a creator, publisher, studio, or rights holder.",
          ],
        },
        {
          title: "Account restrictions",
          paragraphs: [
            "We may restrict accounts that misuse the service, bypass payment or usage limits, or put other people at risk. If you believe a restriction is mistaken, contact support with your account email. A restriction does not remove any refund or consumer rights that apply to you.",
          ],
        },
        {
          title: "Availability and changes",
          paragraphs: [
            "The site may change, become unavailable, or stop supporting a feature. Third-party services used by the site have their own terms and privacy policies. We may update these terms when the service or its data practices change.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "For questions about these terms, use the Contact page. Do not include private information in a public issue.",
          ],
        },
      ]}
    />
  );
}
