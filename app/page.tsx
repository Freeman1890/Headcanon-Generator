import { GeneratePage } from "@/components/GeneratePage";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Headcanon Generator | AI Character Headcanon Tool",
  description:
    "Enter character and fandom names to generate unique headcanons. Perfect for fanfiction, roleplay, and social sharing.",
};

export default function Home() {
  return (
    <>
      <GeneratePage />
      <Footer />
    </>
  );
}