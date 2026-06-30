"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

type Props = { children: React.ReactNode };

/**
 * Auth shell used by both `/auth/login` and `/auth/signup`.
 *
 * After the hero panel was removed, the layout collapsed to a
 * single centred form on a sand radial background. A compact brand
 * row (Shathi logo + "AI-Powered Health Companion" pill) is kept
 * above the form so the page still reads as on-brand.
 *
 * The radial sand gradient comes straight from the design system
 * PRD (#F8F6F1 → #F1ECE2 → #E6DFD1) and the panel respects
 * ``prefers-reduced-motion``.
 */
export default function AuthLayout({ children }: Props) {
  const reduce = useReducedMotion();
  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" as const },
      };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 0% 0%, #F8F6F1 0%, #F1ECE2 45%, #E6DFD1 100%)",
      }}
    >
      {/* Soft ambient emerald wash, low opacity, behind everything. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(50% 40% at 20% 30%, rgba(34,197,94,0.12), transparent 70%)",
        }}
      />

      <main className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Compact brand row, replaces the removed hero panel. */}
        <div className="mb-6 flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70 shadow-[0_8px_24px_rgba(31,42,36,0.06)] ring-1 ring-white/60 backdrop-blur-md">
              <Image
                src="/favicon.ico"
                alt="Shathi logo"
                width={22}
                height={22}
                className="h-5 w-5"
              />
            </span>
            <span className="font-display text-xl font-medium tracking-tight text-[#1F2A24]">
              Shathi
            </span>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-[0_4px_12px_rgba(31,42,36,0.04)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            AI-Powered Health Companion
          </span>
        </div>

        <motion.section
          {...fade}
          className="w-full rounded-[28px] bg-[#F8F6F1]/95 px-6 py-10 shadow-[0_30px_80px_-30px_rgba(31,42,36,0.18)] ring-1 ring-white/60 backdrop-blur-md sm:px-10 sm:py-12 lg:px-14 lg:py-16"
        >
          {children}
        </motion.section>
      </main>
    </div>
  );
}

