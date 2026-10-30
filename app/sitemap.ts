import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { FANDOM_HUBS } from "@/lib/fandom-hubs";
import { WRITING_GUIDES } from "@/lib/guides";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";
import { WRITING_TOOLS } from "@/lib/writing-tools";
import { GOJO_STUDY } from "@/lib/gojo-study";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: "2026-10-24",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const trustPages: MetadataRoute.Sitemap = [
    "/about",
    "/contact",
    "/pricing",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    ...(path === "/about" ? { lastModified: "2026-10-24" } : {}),
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
    ...(path === "/relationship-headcanon-generator" ? { lastModified: "2026-10-30" } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const fandomPages: MetadataRoute.Sitemap = STATIC_HEADCANON_EXAMPLES.map(
    (item) => ({
      url: `${SITE_URL}${item.shareUrl}`,
      ...(item.id === "gojo-jjk" ? { lastModified: GOJO_STUDY.updated } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })
  );

  const fandomHubs: MetadataRoute.Sitemap = FANDOM_HUBS.map((hub) => ({
    url: `${SITE_URL}/fandom/${hub.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const guidePages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/guides`,
      lastModified: WRITING_GUIDES.reduce((latest, guide) => guide.updated > latest ? guide.updated : latest, "2026-07-30"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...WRITING_GUIDES.map((guide) => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated,
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
    ...WRITING_TOOLS.map(tool => ({ url: `${SITE_URL}${tool.path}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...trustPages,
  ];
}
