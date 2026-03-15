import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Headcanon Generator | AI Character Headcanon Tool",
  description:
    "Enter character and fandom names to generate unique headcanons. Perfect for fanfiction, roleplay, and social sharing.",
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
