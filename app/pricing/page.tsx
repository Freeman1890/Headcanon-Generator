import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing | Headcanon Generator Credits",
  description: "One payment of US$9.90 buys 100 nonexpiring credits. Each credit generates five writing ideas. No subscription or automatic renewal.",
  alternates: { canonical: `${SITE_URL}/pricing` },
};

export default function PricingPage() {
  return (
    <InfoPage
      title="100 credits for US$9.90"
      intro="Pay once and use your credits when you need a new idea. No subscription, automatic renewal, or expiry date."
      updated="October 29, 2026"
      sections={[
        {
          title: "What the credit pack includes",
          items: [
            "100 credits added to your signed-in account after payment is confirmed.",
            "One credit per successful batch of five results: headcanons, scene premises, fictional dialogue snippets, or compact plot outlines.",
            "100 successful batches, or 500 individual results, if you use the full pack.",
            "No extra credit charge for copying a result or checking an unfinished request. A new batch costs another credit.",
            "Failed or interrupted requests do not consume a credit.",
          ],
        },
        {
          title: "Buying credits",
          paragraphs: [
            "New credit purchases are temporarily paused while we update our payment service. Existing credits can still be used. This page explains the credit pack; it is not an active checkout.",
            "When purchases reopen, sign in with your email and choose the 100-credit pack. Waffo hosts checkout and shows any applicable taxes before payment. We do not store your card details.",
            <span key="generator">You can use your existing credits at the <Link href="/#generator" className="text-indigo-600 underline dark:text-indigo-400">generator</Link>.</span>,
          ],
        },
        {
          title: "Free tools",
          paragraphs: [
            "Guides, examples, the character worksheet, curated OC questions, and the trope randomizer are free. You do not need a credit pack to use them.",
          ],
        },
        {
          title: "Payment help and refunds",
          paragraphs: [
            "For a missing credit pack, duplicate charge, or refund request, email ljt463015573+headcanon@gmail.com with your account email and order reference. Do not send card details. We check the payment record and credit usage before resolving the request. Confirmed refunds remove the associated unused credits. Your applicable consumer rights are not excluded.",
            <span key="policies">Read the <Link href="/terms" className="text-indigo-600 underline dark:text-indigo-400">Terms of use</Link> and <Link href="/privacy" className="text-indigo-600 underline dark:text-indigo-400">Privacy policy</Link> before purchasing.</span>,
          ],
        },
      ]}
    />
  );
}
