"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = { compact?: boolean };

export default function OrbIllustration({ compact = false }: Props) {
  const reduce = useReducedMotion();

  const float = {
    initial: { y: 0 },
    animate: { y: [-6, 6, -6] },
  };

  const outerSize = compact ? "w-32 h-32" : "w-48 h-48";
  const innerSize = compact ? "w-20 h-20" : "w-32 h-32";
  const faceSize = compact ? 48 : 68;

  return (
    <div className="flex items-center justify-center">
      <motion.div
        aria-hidden
        className={`${outerSize} rounded-full bg-linear-to-br from-[#F0FAF1] to-[#DCF5E0] flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.10)]`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          {...(!reduce ? { variants: float, animate: "animate", initial: "initial", transition: { duration: 6, repeat: Infinity } } : {})}
          className={`${innerSize} rounded-full bg-white/80 flex items-center justify-center`}
        >
          <svg width={faceSize} height={faceSize} viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="34" cy="34" r="34" fill="#DCF5E0" />
            <circle cx="26" cy="28" r="4" fill="#0F172A" opacity="0.9" />
            <circle cx="42" cy="28" r="4" fill="#0F172A" opacity="0.9" />
            <path d="M24 42c4 3 16 3 20 0" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

