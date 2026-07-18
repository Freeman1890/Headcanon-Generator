import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
  description:
    "Use this headcanon generator to turn a character and fandom into a fan idea for fanfiction, roleplay, writing prompts, scene notes, and quick story starts.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
    description:
      "Use this headcanon generator to turn a character and fandom into a fan idea for fanfiction, roleplay, writing prompts, scene notes, and quick story starts.",
    url: SITE_URL,
    siteName: "Headcanon Generator",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
