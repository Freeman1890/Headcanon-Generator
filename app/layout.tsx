import type { Metadata } from "next";
import { Analytics } from "@/components/Analytics";
import { AccountProvider } from "@/components/AccountProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: process.env.PAID_REVIEW === "1" ? { default: "付费接入预览1 | Headcanon Generator", template: "付费接入预览1 | %s" } : "Headcanon Generator for Fanfiction and Roleplay Ideas",
  ...(process.env.PAID_REVIEW === "1" ? { robots: { index: false, follow: false } } : {}),
  description:
    "Use this headcanon generator to turn a character and fandom into a fan idea for fanfiction, roleplay, writing prompts, scene notes, and quick story starts.",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        {process.env.PAID_REVIEW === "1" && <div lang="zh-CN" className="border-b border-indigo-200 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-800">付费接入预览1 · 本地预览，尚未上线</div>}
        <AccountProvider>{children}</AccountProvider>
        <Analytics />
      </body>
    </html>
  );
}
