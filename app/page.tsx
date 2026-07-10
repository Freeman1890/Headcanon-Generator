import { GeneratePage } from "@/components/GeneratePage";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
  description:
    "Use this headcanon generator to turn a character and fandom into a short fan idea for fanfiction, roleplay, writing prompts, or scene notes.",
  alternates: {
    canonical: SITE_URL,
  },
};

export default function Home() {
  return (
    <>
      <GeneratePage />
      <Footer />
    </>
  );
}
