"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useLandingLang } from "@/components/landing/landing-lang-context";

export function CTASection() {
  const { t } = useLandingLang();

  return (
    <section id="pricing" className="relative isolate section-y page-x">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[var(--radius-3xl)] bg-[var(--p-sage-50)] px-8 py-14 text-center lg:px-12 lg:py-16"
        >
          <h2 className="font-display text-3xl font-medium tracking-tight lg:text-4xl">
            {t.cta.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary lg:text-lg">
            {t.cta.sub}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] px-10 text-base shadow-flat hover:shadow-card"
            >
              <Link href="/auth/login?intent=signup">{t.cta.primary}</Link>
            </Button>
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-[var(--p-sage-500)] hover:underline"
            >
              {t.cta.secondary}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
