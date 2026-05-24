import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date("2026-05-24T00:00:00.000Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
