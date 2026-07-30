import { GeneratePage } from "@/components/GeneratePage";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
  description:
    "Use this headcanon generator to turn a character and fandom into a fan idea for fanfiction, roleplay, writing prompts, scene notes, and quick story starts.",
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
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
