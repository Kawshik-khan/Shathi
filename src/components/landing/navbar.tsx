"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLandingLang } from "@/components/landing/landing-lang-context";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how-it-works" },
  { name: "Pricing", href: "#pricing" },
  { name: "Journal", href: "#journal" },
  { name: "About", href: "#about" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lang, setLang } = useLandingLang();

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="landing-nav-rail"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span
            className="size-2 rounded-full bg-[var(--p-sage-500)] motion-safe:animate-pulse"
            aria-hidden
          />
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              "bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]",
              "shadow-flat transition-shadow group-hover:shadow-card",
            )}
          >
            <Icon icon={Leaf} size={16} className="text-text-inverse" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-gradient-sage">
            Shathi
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:text-text-primary focus-visible:outline-none after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-text-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div
            className="flex h-8 items-center rounded-pill border border-border-subtle bg-bg-elevated px-1 text-xs font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLang("en")}
              className={cn(
                "rounded-pill px-3 py-1 transition-colors",
                lang === "en"
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              EN
            </button>
            <span className="text-text-secondary/50" aria-hidden>|</span>
            <button
              type="button"
              onClick={() => setLang("bn")}
              className={cn(
                "rounded-pill px-3 py-1 transition-colors",
                lang === "bn"
                  ? "bg-bg-hover text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              বাংলা
            </button>
          </div>
          <Button variant="ghost" size="default" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button
            variant="primary"
            size="default"
            asChild
            className="bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] shadow-flat hover:shadow-card"
          >
            <Link href="/auth/login?intent=signup">Start for free</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-tile text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls={mobileMenuOpen ? "mobile-landing-menu" : undefined}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <Icon icon={mobileMenuOpen ? X : Menu} size={20} />
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-landing-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border-subtle md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              <div className="mb-3 flex h-9 items-center rounded-pill border border-border-subtle bg-bg-elevated px-1">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={cn(
                    "flex-1 rounded-pill py-1.5 text-xs font-semibold",
                    lang === "en" ? "bg-bg-hover" : "text-text-secondary",
                  )}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("bn")}
                  className={cn(
                    "flex-1 rounded-pill py-1.5 text-xs font-semibold",
                    lang === "bn" ? "bg-bg-hover" : "text-text-secondary",
                  )}
                >
                  বাংলা
                </button>
              </div>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-tile px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
                >
                  {item.name}
                </Link>
              ))}
              <div className="space-y-2 pt-4">
                <Button
                  variant="ghost"
                  size="default"
                  asChild
                  className="w-full justify-center"
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  variant="primary"
                  size="default"
                  asChild
                  className="w-full justify-center bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] shadow-flat hover:shadow-card"
                >
                  <Link href="/auth/login?intent=signup">Start for free</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
