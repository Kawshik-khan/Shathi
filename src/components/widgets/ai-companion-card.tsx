'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Wind, Quote, MessageCircle, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

const quickPrompts = [
  { label: 'Breathing', icon: Wind },
  { label: 'Motivation', icon: Quote },
  { label: 'Vent', icon: MessageCircle },
  { label: 'Focus', icon: Target },
];

const lastReply = {
  author: 'Sathi',
  text: "You've had two strong days in a row — what's one thing you want to protect today?",
};

export function AICompanionCard() {
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  return (
    <div className="card card-interactive relative h-full overflow-hidden">
      {/* Decorative brand accent */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/dashboard-hero.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -right-4 w-56 select-none opacity-15 hidden sm:block"
      />

      <div className="relative z-10 flex h-full flex-col">
        <header className="mb-3 flex items-center justify-between">
          <span className="card-eyebrow flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            AI Companion
          </span>
          <span className="status-pill status-pill--success">Online</span>
        </header>

        <div className="flex flex-1 items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="card-title text-xl">
              I&apos;m here for you,
              <br className="hidden sm:block" />
              whenever you need.
            </h3>
            <p className="card-body mt-1">How are you feeling today?</p>

            {/* Recent conversation preview */}
            <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary/70">
                Sathi said
              </p>
              <p className="mt-1 text-sm text-foreground/90">{lastReply.text}</p>
            </div>
          </div>

          <motion.div
            aria-hidden="true"
            animate={reducedMotion ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative hidden h-24 w-24 shrink-0 rounded-full bg-linear-to-br from-primary-soft to-primary-light shadow-xl shadow-primary/20 sm:flex sm:items-center sm:justify-center"
          >
            <div className="text-white">
              <div className="mb-2 flex gap-2 justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
                <div className="h-2.5 w-2.5 rounded-full bg-white" />
              </div>
              <div className="mx-auto h-3 w-7 rounded-b-full border-b-2 border-white" />
            </div>
          </motion.div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/ai-companion')}
            className="btn-primary-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium focus-ring touch-target"
          >
            Start a conversation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <motion.button
                key={prompt.label}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => alert(`${prompt.label} conversation coming soon!`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary focus-ring transition-colors"
              >
                <prompt.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {prompt.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}