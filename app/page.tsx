import { GeneratePage } from "@/components/GeneratePage";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: process.env.CONTENT_REVIEW === "1" ? "关键词内页预览2 | Headcanon Generator" : process.env.KEYWORD_REVIEW === "1" ? "关键词内页预览1 | Headcanon Generator" : process.env.PAID_REVIEW === "1" ? "付费接入预览1 | Headcanon Generator" : "Headcanon Generator for Fanfiction and Roleplay Ideas",
  description:
    "Generate five character, relationship, or OC headcanons for fanfiction and roleplay. One credit per batch, with 100 credits for $9.90 and no subscription.",
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Home() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Headcanon Generator",
      url: SITE_URL,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Web",
      description: metadata.description,
      offers: { "@type": "Offer", name: "100 headcanon generation credits", price: "9.90", priceCurrency: "USD", url: `${SITE_URL}/#generator` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Headcanon Generator",
      url: SITE_URL,
      sameAs: ["https://github.com/Freeman1890/Headcanon-Generator"],
    },
  ];

  return (
    <>
      <JsonLd data={schemas} />
      <GeneratePage />
      <Footer />
    </>
  );
}
