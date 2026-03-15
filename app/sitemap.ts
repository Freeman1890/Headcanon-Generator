import type { MetadataRoute } from "next";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://headcanon-generator.vercel.app");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const fandomPages: MetadataRoute.Sitemap = STATIC_HEADCANON_EXAMPLES.map(
    (item) => ({
      url: `${baseUrl}${item.shareUrl}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  return [...staticPages, ...fandomPages];
}
