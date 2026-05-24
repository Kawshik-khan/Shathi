import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SecondaryGrid } from "@/components/landing/secondary-grid";
import { JournalSection } from "@/components/landing/journal-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: siteConfig.title,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-accent">
      <Navbar />
      <main>
        <HeroSection />
        <FeatureGrid />
        <SecondaryGrid />
        <JournalSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

