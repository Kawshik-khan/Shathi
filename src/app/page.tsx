import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { MomentsSection } from "@/components/landing/moments-section";
import { PromiseSection } from "@/components/landing/promise-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { LandingLangProvider } from "@/components/landing/landing-lang-context";
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
    <LandingLangProvider>
      <div
        className="relative isolate min-h-screen text-text-primary"
        style={{ background: "var(--bg-gradient)" }}
      >
        <Navbar />
        <main>
          <HeroSection />
          <MomentsSection />
          <PromiseSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </LandingLangProvider>
  );
}
