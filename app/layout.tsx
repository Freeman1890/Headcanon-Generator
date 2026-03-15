import type { Metadata } from "next";
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
      </body>
    </html>
  );
}
