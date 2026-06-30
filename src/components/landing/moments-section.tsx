"use client";

import { motion } from "framer-motion";
import {
  Angry,
  BatteryMedium,
  BedDouble,
  Check,
  Edit3,
  Frown,
  Lightbulb,
  Meh,
  Smile,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useLandingLang } from "@/components/landing/landing-lang-context";
import { cn } from "@/lib/utils";

function MomentEyebrow({
  children,
  icon,
}: {
  children: string;
  icon: typeof Sparkles;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill bg-bg-hover px-3 py-1.5 text-sm font-medium text-text-primary">
      <Icon icon={icon} size={12} className="text-accent-sleep" />
      {children}
    </span>
  );
}

function MomentCopy({
  eyebrow,
  eyebrowIcon,
  headline,
  sub,
  note,
  id,
}: {
  eyebrow: string;
  eyebrowIcon: typeof Sparkles;
  headline: string;
  sub: string;
  note?: string;
  id?: string;
}) {
  return (
    <div id={id}>
      <MomentEyebrow icon={eyebrowIcon}>{eyebrow}</MomentEyebrow>
      <h2 className="mt-5 font-display text-3xl font-medium tracking-tight lg:text-4xl">
        {headline}
      </h2>
      <p className="mt-4 max-w-prose text-base leading-relaxed text-text-secondary lg:text-lg">
        {sub}
      </p>
      {note ? (
        <p className="mt-3 text-sm text-text-secondary">{note}</p>
      ) : null}
    </div>
  );
}

function WakeMoment() {
  const { t } = useLandingLang();
  const moods = [
    { icon: Angry, label: "Very low" },
    { icon: Frown, label: "Low" },
    { icon: Meh, label: "Neutral", selected: true },
    { icon: Smile, label: "Good" },
    { icon: BatteryMedium, label: "Great" },
  ];

  return (
    <section id="moment-wake" className="section-y page-x">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <MomentCopy
          eyebrow={t.wake.eyebrow}
          eyebrowIcon={Sparkles}
          headline={t.wake.headline}
          sub={t.wake.sub}
        />

        <Card variant="elevated" className="p-6 lg:p-8">
          <CardContent className="p-0">
            <div className="mb-6 flex items-center justify-between gap-4">
              <span className="text-base font-semibold text-text-primary">
                {t.wake.cardTitle}
              </span>
              <span className="text-xs text-text-secondary">Today · 8:12 AM</span>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  aria-label={mood.label}
                  className={cn(
                    "flex size-[4.5rem] items-center justify-center rounded-tile bg-bg-sunken transition-colors",
                    mood.selected &&
                      "ring-2 ring-[var(--p-sage-500)] bg-[var(--p-sage-50)]",
                  )}
                >
                  <Icon
                    icon={mood.icon}
                    size={24}
                    className="text-text-secondary"
                  />
                </button>
              ))}
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">
                  {t.wake.energy}
                </span>
                <span className="font-stats text-sm font-medium text-text-primary">
                  6/10
                </span>
              </div>
              <div className="h-2 rounded-pill bg-bg-sunken">
                <div
                  className="h-full w-[60%] rounded-pill bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                className="text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                {t.wake.skip}
              </button>
              <Button
                size="default"
                className="bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))] shadow-flat hover:shadow-card"
              >
                {t.wake.save}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function TendMoment() {
  const { t } = useLandingLang();

  return (
    <section id="how-it-works" className="section-y page-x bg-bg-card/60">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Card variant="elevated" className="p-6 lg:p-8">
          <CardContent className="p-0">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold text-text-primary">
                Habits
              </span>
              <span className="text-xs text-text-secondary">This week</span>
            </div>
            <div className="divide-y divide-border-subtle">
              {t.tend.habits.map((habit) => (
                <div
                  key={habit.name}
                  className="flex min-h-20 items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-tile",
                      habit.done >= 5
                        ? "bg-[var(--p-sage-500)] text-white"
                        : "bg-bg-sunken text-text-secondary",
                    )}
                  >
                    {habit.done >= 5 ? (
                      <Icon icon={Check} size={16} />
                    ) : (
                      <span className="size-2 rounded-full bg-text-secondary/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text-primary">
                        {habit.name}
                      </span>
                      {habit.skipped ? (
                        <span className="rounded-tile bg-bg-sunken px-2 py-0.5 text-xs text-text-secondary">
                          Skipped — {habit.skipReason}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 7 }, (_, i) => (
                        <span
                          key={i}
                          className={cn(
                            "size-2.5 rounded-full",
                            i < habit.done
                              ? "bg-[var(--p-sage-500)]"
                              : "bg-bg-sunken",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="font-stats text-sm text-text-secondary">
                    {habit.done}/7
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <MomentCopy
          eyebrow={t.tend.eyebrow}
          eyebrowIcon={Sparkles}
          headline={t.tend.headline}
          sub={t.tend.sub}
          note={t.tend.note}
        />
      </div>
    </section>
  );
}

function ReflectMoment() {
  const { t } = useLandingLang();

  return (
    <section id="journal" className="section-y page-x">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <MomentCopy
          eyebrow={t.reflect.eyebrow}
          eyebrowIcon={Edit3}
          headline={t.reflect.headline}
          sub={t.reflect.sub}
        />

        <Card variant="elevated" className="p-6 lg:p-8">
          <CardContent className="p-0">
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]"
              >
                <Icon icon={Edit3} size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t.reflect.time}
                </p>
                <p className="text-xs text-text-secondary">{t.reflect.autosaved}</p>
              </div>
            </div>
            <p className="text-sm italic text-text-secondary">
              {t.reflect.prompt}
            </p>
            <p className="mt-4 text-base leading-relaxed text-text-primary">
              {t.reflect.entry}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--p-sage-500)]" />
            </p>
            <div className="mt-8 flex items-center justify-between text-xs text-text-secondary">
              <span>{t.reflect.footer}</span>
              <span>{t.reflect.chars}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function UnderstandMoment() {
  const { t } = useLandingLang();

  return (
    <section id="features" className="section-y page-x bg-bg-card/60">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <MomentEyebrow icon={Lightbulb}>{t.understand.eyebrow}</MomentEyebrow>
          <h2 className="mt-5 font-display text-3xl font-medium tracking-tight lg:text-4xl">
            {t.understand.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary lg:text-lg">
            {t.understand.sub}
          </p>
        </div>

        <Card variant="elevated" className="p-6 lg:p-10">
          <CardContent className="p-0">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <div
                className="flex size-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]"
              >
                <Icon icon={Lightbulb} size={24} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-text-primary">
                  {t.understand.title}
                </p>
                <span className="rounded-tile bg-bg-sunken px-2 py-0.5 text-xs text-text-secondary">
                  {t.understand.chip}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border-subtle">
              {t.understand.insights.map((insight) => (
                <div key={insight.text} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-medium text-text-primary">{insight.text}</p>
                    <span className="text-sm text-text-secondary">{insight.meta}</span>
                  </div>
                  <div className="mt-4 flex gap-1">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className="h-10 flex-1 rounded-tile bg-bg-sunken"
                        style={{
                          background:
                            i < 5
                              ? `linear-gradient(180deg, transparent ${100 - (i + 3) * 12}%, var(--p-sage-500) 0%)`
                              : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-6">
              <p className="text-sm italic text-text-secondary">
                {t.understand.footer}
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--p-sage-500)] hover:underline"
              >
                {t.understand.edit}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function RestMoment() {
  const { t } = useLandingLang();
  const week = [7.2, 6.8, 6.4, 7.5, 5.9, 8.1, 6.7];
  const max = Math.max(...week);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <section className="section-y page-x">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Card variant="elevated" className="p-6 lg:p-8">
          <CardContent className="p-0">
            <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
              <Icon icon={BedDouble} size={16} className="text-accent-sleep" />
              <span className="font-semibold text-text-primary">
                {t.rest.lastNight}
              </span>
              <span className="ml-auto text-xs">{t.rest.logged}</span>
            </div>

            <p className="font-display text-5xl font-medium tracking-tight text-text-primary lg:text-6xl">
              {t.rest.duration}
            </p>
            <p className="mt-2 text-sm text-text-secondary">{t.rest.goal}</p>

            <div className="mt-6 h-3 rounded-pill bg-bg-sunken">
              <div
                className="h-full w-[89%] rounded-pill bg-[linear-gradient(135deg,var(--p-sage-300),var(--p-sage-500))]"
              />
            </div>

            <div className="mt-8 flex items-end justify-between gap-2">
              {week.map((hours, i) => (
                <div key={days[i]} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full rounded-tile bg-bg-sunken",
                      i === 2 && "ring-2 ring-[var(--p-sage-500)]",
                    )}
                    style={{ height: `${(hours / max) * 56 + 12}px` }}
                  >
                    <div
                      className="h-full w-full rounded-tile bg-[var(--p-sage-500)]"
                      style={{ opacity: 0.35 + (hours / max) * 0.65 }}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary">{days[i]}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-text-secondary">{t.rest.windDown}</p>
          </CardContent>
        </Card>

        <MomentCopy
          eyebrow={t.rest.eyebrow}
          eyebrowIcon={BedDouble}
          headline={t.rest.headline}
          sub={t.rest.sub}
        />
      </div>
    </section>
  );
}

function ProofStrip() {
  const { t } = useLandingLang();

  return (
    <section className="border-y border-border-subtle bg-bg-card/40 py-16 page-x">
      <div className="mx-auto max-w-5xl text-center">
        <MomentEyebrow icon={Sparkles}>{t.proof.eyebrow}</MomentEyebrow>
        <h2 className="mt-5 font-display text-2xl font-medium tracking-tight lg:text-3xl">
          {t.proof.headline}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {t.proof.quotes.map((quote, index) => (
            <motion.blockquote
              key={quote}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="rounded-card border border-border-subtle bg-bg-elevated p-6 text-left text-base leading-relaxed text-text-primary"
            >
              &ldquo;{quote}&rdquo;
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MomentsSection() {
  return (
    <>
      <WakeMoment />
      <TendMoment />
      <ReflectMoment />
      <UnderstandMoment />
      <RestMoment />
      <ProofStrip />
    </>
  );
}
