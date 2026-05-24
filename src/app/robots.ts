import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const disallowedRoutes = [
  "/api/",
  "/dashboard",
  "/mood",
  "/habits",
  "/journal",
  "/ai-companion",
  "/insights",
  "/settings",
  "/profile",
  "/sleep",
  "/resources",
  "/subscription",
  "/admin",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallowedRoutes,
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
