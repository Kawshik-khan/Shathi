const DEFAULT_SITE_URL = "https://shathi.vercel.app";

function normalizeSiteUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(process.env.VERCEL_URL) ??
    DEFAULT_SITE_URL
  );
}

export const siteConfig = {
  name: "Shathi",
  title: "Shathi | AI Mental Wellness Companion",
  description:
    "Track mood, sleep, habits, and journaling with personalized AI insights from Shathi, an intelligent mental wellness companion.",
  url: getSiteUrl(),
  keywords: [
    "Shathi",
    "AI mental wellness companion",
    "mental health app",
    "mood tracker",
    "sleep tracker",
    "habit tracker",
    "wellness journal",
    "personalized wellness insights",
  ],
};
