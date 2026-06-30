"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { useLandingLang } from "@/components/landing/landing-lang-context";

export function PromiseSection() {
  const { t } = useLandingLang();

  return (
    <section
      id="about"
      className="border-y border-border-subtle section-y page-x"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-pill bg-[var(--p-sage-50)] px-3 py-1.5 text-sm font-medium text-[var(--p-sage-500)]">
          <Icon icon={ShieldCheck} size={12} />
          {t.promise.eyebrow}
        </span>

        <h2 className="mt-5 font-display text-3xl font-medium tracking-tight lg:text-4xl">
          {t.promise.headline}
        </h2>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-text-secondary">
          {t.promise.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-[var(--p-sage-500)]">
          <Link href="/privacy" className="hover:underline">
            {t.promise.privacy}
          </Link>
          <Link href="/resources/crisis" className="hover:underline">
            {t.promise.crisis}
          </Link>
          <Link href="/settings" className="hover:underline">
            {t.promise.export}
          </Link>
        </div>
      </div>
    </section>
  );
}
