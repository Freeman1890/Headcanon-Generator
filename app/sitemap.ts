import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { FANDOM_HUBS } from "@/lib/fandom-hubs";
import { WRITING_GUIDES } from "@/lib/guides";
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

  const trustPages: MetadataRoute.Sitemap = [
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  const keywordPages: MetadataRoute.Sitemap = [
    "/random-character-generator",
    "/writing-prompt-generator",
    "/multiple-character-headcanon-generator",
    "/relationship-headcanon-generator",
    "/oc-headcanon-generator",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const fandomPages: MetadataRoute.Sitemap = STATIC_HEADCANON_EXAMPLES.map(
    (item) => ({
      url: `${SITE_URL}${item.shareUrl}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  const fandomHubs: MetadataRoute.Sitemap = FANDOM_HUBS.map((hub) => ({
    url: `${SITE_URL}/fandom/${hub.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const guidePages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...WRITING_GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    ...staticPages,
    ...keywordPages,
    ...fandomHubs,
    ...fandomPages,
    ...guidePages,
    ...trustPages,
  ];
}
