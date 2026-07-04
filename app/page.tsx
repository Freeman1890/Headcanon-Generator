import { GeneratePage } from "@/components/GeneratePage";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Headcanon Generator | AI Character Headcanon Tool",
  description:
    "Enter character and fandom names to generate unique headcanons. Perfect for fanfiction, roleplay, and social sharing.",
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
