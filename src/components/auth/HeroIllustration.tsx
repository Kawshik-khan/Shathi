"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Heart, Moon, Droplet, Sparkles, Leaf } from "lucide-react";

type Props = {
  /** Show a more compact variant when used inline in the mobile banner. */
  compact?: boolean;
};

/**
 * Premium 3D illustration block for the Shathi auth hero.
 *
 * Layout: the user-supplied `Authimag.png` (relaxing person + AI
 * companion in a wellness environment) is the centerpiece. Around it we
 * float a small constellation of:
 *
 *   - circular "metric cards" (Heart Rate, Sleep Score, Hydration,
 *     Mindfulness, Daily Goals, Mood) that nod to Apple Health's compact
 *     KPI cards;
 *   - organic blobs (sand + emerald low-opacity fills) that bend the
 *     gradient mesh into a soft, "Calm-meets-Arc" silhouette;
 *   - drifting leaves and tiny glass orbs that respect the
 *     ``prefers-reduced-motion`` contract — everything snaps to its
 *     resting pose when the user opts out.
 *
 * The component is intentionally presentational: no auth state, no
 * interactive controls, fully SR-ignored so the surrounding login form
 * remains the only focusable surface.
 */
export default function HeroIllustration({ compact = false }: Props) {
  const reduce = useReducedMotion();

  // Subtle parallax that reacts to the mouse. Disabled under reduced
  // motion because it would otherwise feel mechanical.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const imageX = useTransform(x, [-1, 1], [-6, 6]);
  const imageY = useTransform(y, [-1, 1], [-4, 4]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    x.set(nx);
    y.set(ny);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  // We pin each chip to deterministic, but offset, starting positions so
  // the constellation looks organic at any container size.
  const chips = useMemo(
    () => [
      {
        key: "heart",
        Icon: Heart,
        label: "Heart Rate",
        value: "72 bpm",
        position: "top-6 left-2 sm:left-6",
        accent: "text-rose-500",
        fill: "fill-rose-500/20",
      },
      {
        key: "sleep",
        Icon: Moon,
        label: "Sleep Score",
        value: "8.5/10",
        position: "top-20 right-4 sm:right-10",
        accent: "text-indigo-500",
        fill: "fill-indigo-400/20",
      },
      {
        key: "hydrate",
        Icon: Droplet,
        label: "Hydration",
        value: "80%",
        position: "top-44 right-0 sm:right-2",
        accent: "text-sky-500",
        fill: "fill-sky-400/20",
      },
      {
        key: "mind",
        Icon: Sparkles,
        label: "Mindfulness",
        value: "10 min",
        position: "bottom-32 right-6 sm:right-12",
        accent: "text-emerald-600",
        fill: "fill-emerald-400/20",
      },
    ],
    [],
  );

  // Daily Goals + Mood are stacked at the bottom, full-width card style.
  const goals = useMemo(
    () => [
      { key: "exercise", label: "Exercise", state: "done" as const },
      { key: "breathe", label: "Breathe", state: "done" as const },
      { key: "water", label: "Drink Water", state: "done" as const },
      { key: "goals", label: "Daily Goals", state: "live" as const },
    ],
    [],
  );

  const float = reduce
    ? {}
    : {
        animate: { y: [0, -6, 0, 6, 0] },
        transition: {
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  const slowFloat = reduce
    ? {}
    : {
        animate: { y: [0, -10, 0], rotate: [0, 2, 0] },
        transition: {
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  // compact mode = mobile banner — fewer chips, smaller image.
  const imageSize = compact
    ? "relative aspect-[4/3] w-full max-w-sm"
    : "relative aspect-[5/4] w-full max-w-lg";

  return (
    <div
      aria-hidden
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      className="relative isolate w-full"
    >
      {/* Soft organic backdrop: sand → emerald radial wash + two blobs. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_30%,rgba(167,243,208,0.55),transparent_70%),radial-gradient(45%_45%_at_80%_70%,rgba(241,236,226,0.7),transparent_75%)]" />
        <div className="absolute -left-12 -top-8 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -right-16 bottom-4 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
      </div>

      {/* Floating leaves (decorative). */}
      {!reduce && (
        <>
          <motion.div
            {...slowFloat}
            className="pointer-events-none absolute left-2 top-12 -rotate-12 text-emerald-500/70"
          >
            <Leaf size={28} strokeWidth={1.6} />
          </motion.div>
          <motion.div
            {...slowFloat}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute right-6 bottom-16 rotate-12 text-emerald-400/60"
          >
            <Leaf size={20} strokeWidth={1.6} />
          </motion.div>
        </>
      )}

      {/* Centerpiece: the user-supplied 3D illustration. */}
      <motion.div
        {...float}
        className={`${imageSize} mx-auto`}
        style={reduce ? undefined : { x: imageX, y: imageY }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-white/30 shadow-[0_30px_80px_-30px_rgba(34,197,94,0.35)] ring-1 ring-white/60 backdrop-blur-[1px]">
          <Image
            src="/Authimag.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 32rem, (min-width: 640px) 24rem, 18rem"
            className="object-cover"
          />
          {/* Subtle inner gloss to harmonize the illustration with the
              sand/emerald palette — barely visible but helps the asset sit
              inside the gradient mesh. */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(241,236,226,0.18)_0%,transparent_30%,transparent_70%,rgba(167,243,208,0.22)_100%)]" />
        </div>
      </motion.div>

      {/* KPI constellation. */}
      {!compact &&
        chips.map(({ key, Icon, label, value, position, accent, fill }) => (
          <motion.div
            key={key}
            {...(!reduce
              ? {
                  animate: { y: [0, -4, 0] },
                  transition: {
                    duration: 4 + (key.length % 3),
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  },
                }
              : {})}
            className={`absolute z-10 ${position}`}
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_10px_30px_rgba(31,42,36,0.08)] backdrop-blur-md">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 ${accent}`}>
                <Icon size={18} strokeWidth={2} className={fill} />
              </span>
              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#5B6660]">
                  {label}
                </p>
                <p className="font-display text-sm font-medium text-[#1F2A24]">
                  {value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

      {/* Daily Goals cluster (Apple Health style stacked card). */}
      {!compact && (
        <motion.div
          {...(!reduce
            ? {
                animate: { y: [0, 3, 0] },
                transition: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                },
              }
            : {})}
          className="absolute right-2 bottom-2 z-10 sm:right-8 sm:bottom-6"
        >
          <div className="w-56 rounded-2xl border border-white/60 bg-white/85 p-4 shadow-[0_15px_40px_rgba(31,42,36,0.10)] backdrop-blur-md">
            <ul className="space-y-1.5">
              {goals.map(({ key, label, state }) => (
                <li
                  key={key}
                  className="flex items-center justify-between text-xs font-medium text-[#1F2A24]"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3.5 8.5l3 3 6-7" />
                      </svg>
                    </span>
                    {label}
                  </span>
                  {state === "live" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      Live
                    </span>
                  ) : (
                    <span className="text-emerald-500">✓</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
              <span className="text-xs font-medium text-emerald-800">
                Mood Tracking
              </span>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-12 rounded-full bg-emerald-200">
                  <span className="block h-full w-3/4 rounded-full bg-emerald-500" />
                </span>
                <span aria-hidden>🙂</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
