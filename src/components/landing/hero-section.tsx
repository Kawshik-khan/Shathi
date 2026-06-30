"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLandingLang } from "@/components/landing/landing-lang-context";

export function HeroSection() {
  const { t } = useLandingLang();
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative isolate min-h-[min(100vh,920px)] overflow-hidden">
      <Image
        src="/heroimage.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%]"
        aria-hidden
      />

      <div
        className="absolute inset-0 bg-gradient-to-r from-[rgb(15_28_24/0.82)] via-[rgb(15_28_24/0.45)] to-[rgb(15_28_24/0.15)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[rgb(15_28_24/0.55)] via-transparent to-[rgb(15_28_24/0.25)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[min(100vh,920px)] items-end pb-16 pt-28 page-x lg:items-center lg:pb-20">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-2xl lg:max-w-xl"
        >
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
          >
            <Icon icon={Sparkles} size={12} className="text-[var(--p-sage-300)]" />
            {t.hero.eyebrow}
          </span>

          <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-white lg:text-[3.25rem] lg:leading-[1.06]">
            {t.hero.headline}
          </h1>

          <p className="mt-5 max-w-prose text-base leading-relaxed text-white/80 lg:text-lg">
            {t.hero.sub}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] px-8 text-base shadow-flat hover:shadow-card"
            >
              <Link href="/auth/login?intent=signup">{t.hero.ctaPrimary}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link href="#moment-wake">{t.hero.ctaSecondary}</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-white/65">{t.hero.microproof}</p>
        </motion.div>
      </div>
    </section>
  );
}
