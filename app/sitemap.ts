import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const fandomPages: MetadataRoute.Sitemap = STATIC_HEADCANON_EXAMPLES.map(
    (item) => ({
      url: `${SITE_URL}${item.shareUrl}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  return [...staticPages, ...fandomPages];
}
