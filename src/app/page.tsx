import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SecondaryGrid } from "@/components/landing/secondary-grid";
import { JournalSection } from "@/components/landing/journal-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { MobileCTA } from "@/components/landing/mobile-cta";

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
      <MobileCTA />
    </div>
  );
}

