"use client"
import React from "react";
import { motion } from 'framer-motion';

export default function ProgressRing({ size = 96, stroke = 10, value = 86 }: { size?: number; stroke?: number; value?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <svg role="img" aria-label={`Wellness score ${value} out of 100`} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#7ED957" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={r} cx={0} cy={0} stroke="#ECF8EE" strokeWidth={stroke} fill="none" />
        <motion.circle r={r} cx={0} cy={0} stroke="url(#g1)" strokeWidth={stroke} strokeLinecap="round" fill="none"
          strokeDasharray={`${c} ${c}`} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill="#0F172A">{value}</text>
      </g>
    </svg>
  );
}

