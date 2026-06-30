"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Leaf, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { useLandingLang } from "@/components/landing/landing-lang-context";
import { cn } from "@/lib/utils";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Journal", href: "#journal", soon: false },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Careers", href: "#", soon: true },
    { name: "Press", href: "#", soon: true },
    { name: "Contact", href: "#", soon: true },
  ],
  resources: [
    { name: "Blog", href: "#", soon: true },
    { name: "Help Center", href: "#", soon: true },
    { name: "Crisis resources", href: "/resources/crisis", soon: false },
    { name: "Privacy", href: "/privacy", soon: false },
  ],
};

export function Footer() {
  const { lang, setLang, t } = useLandingLang();

  return (
    <footer className="border-t border-border-subtle bg-bg-card">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Link href="/" className="mb-5 inline-flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  "bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]",
                )}
              >
                <Icon icon={Leaf} size={16} className="text-text-inverse" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-gradient-sage">
                Shathi
              </span>
            </Link>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-text-secondary">
              {t.footer.tagline}
            </p>

            <div className="flex h-8 items-center rounded-pill border border-border-subtle bg-bg-elevated px-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "rounded-pill px-3 py-1",
                  lang === "en" ? "bg-bg-hover" : "text-text-secondary",
                )}
              >
                EN
              </button>
              <span className="text-text-secondary/50" aria-hidden>|</span>
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={cn(
                  "rounded-pill px-3 py-1",
                  lang === "bn" ? "bg-bg-hover" : "text-text-secondary",
                )}
              >
                বাংলা
              </button>
            </div>
          </motion.div>

          <FooterColumn title="Product" links={footerLinks.product} delay={0.1} />
          <FooterColumn title="Company" links={footerLinks.company} delay={0.2} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <FooterColumn title="Resources" links={footerLinks.resources} inline />
            <div className="mt-8">
              <h4 className="mb-3 text-sm font-medium text-text-primary">
                {t.footer.stayUpdated}
              </h4>
              <form
                className="flex gap-2"
                onSubmit={(event) => event.preventDefault()}
              >
                <Input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  aria-label={t.footer.emailPlaceholder}
                  className="input-sunken flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="primary"
                  aria-label="Subscribe"
                  className="bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] shadow-flat hover:shadow-card"
                >
                  <Icon icon={Mail} size={16} />
                </Button>
              </form>
              <p className="mt-2 text-xs text-text-secondary">
                {t.footer.newsletterHint}
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row"
        >
          <p className="text-xs text-text-secondary">{t.footer.copyright}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-secondary">
            <Link href="/privacy" className="transition-colors hover:text-text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-text-primary">
              Terms
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-text-primary">
              Cookie
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  delay = 0,
  inline = false,
}: {
  title: string;
  links: Array<{ name: string; href: string; soon?: boolean }>;
  delay?: number;
  inline?: boolean;
}) {
  const content = (
    <>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-primary">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.name}
              {link.soon ? (
                <span className="rounded-tile bg-bg-sunken px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  soon
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (inline) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.5 }}
    >
      {content}
    </motion.div>
  );
}
