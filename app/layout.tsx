import type { Metadata } from "next";
import Script from "next/script";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
  description:
    "Use this headcanon generator to turn a character and fandom into a short fan idea for fanfiction, roleplay, writing prompts, or scene notes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Headcanon Generator for Fanfiction and Roleplay Ideas",
    description:
      "Use this headcanon generator to turn a character and fandom into a short fan idea for fanfiction, roleplay, writing prompts, or scene notes.",
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
        <div style={{ display: "none" }}>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-L1SQ5EQQ4Q"
            strategy="lazyOnload"
          />
          <Script id="gtag-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L1SQ5EQQ4Q');
            `}
          </Script>
        </div>
      </body>
    </html>
  );
}
