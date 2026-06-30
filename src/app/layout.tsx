import type { Metadata } from "next";
import { connection } from "next/server";
import {
  Fraunces,
  Geist,
  Geist_Mono,
  Hind_Siliguri,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Bengali,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { ThemeProvider } from "@/components/theme-provider";
import { DaytimeProvider } from "@/components/daytime-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";

/* PR1 — "Botanical Dawn" type system:
   - Inter    → UI / body (replaces --font-sans)
   - Fraunces → display / editorial (page titles, greetings, journal prompts)
   - JetBrains Mono → numeric / stats (mood scores, streaks, tooltips)
   Geist is retained as a fallback for the existing --font-heading and
   --font-geist-mono slots so nothing in the current component tree
   regresses. Bengali fallback chain (Hind_Siliguri, Noto_Sans_Bengali)
   is preserved unchanged. */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The proxy sets a per-request CSP nonce in the ``x-nonce`` header.
  // Calling ``connection()`` opts the entire tree into dynamic rendering
  // so Next.js can attach the nonce to its RSC scripts and inline styles
  // at SSR time. Without this, the strict CSP would block the framework's
  // own scripts.
  await connection();
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        fraunces.variable,
        jetbrainsMono.variable,
        geistSans.variable,
        geistMono.variable,
        hindSiliguri.variable,
        notoSansBengali.variable
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans" suppressHydrationWarning={true}>
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              <DaytimeProvider>
                {children}
              </DaytimeProvider>
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
