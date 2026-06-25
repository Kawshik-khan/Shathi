"use client"
import React from "react";
import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

interface StreakIndicatorProps {
  streak?: number;
  bestStreak?: number;
  label?: string;
}

export default function StreakIndicator({ 
  streak = 12, 
  bestStreak = 24,
  label = "day streak"
}: StreakIndicatorProps) {
  const isOnFire = streak >= 7;

  return (
    <motion.div 
      role="img" 
      aria-label={`${streak} ${label}`}
      className="flex items-center gap-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Streak display */}
      <div className="relative">
        <motion.div 
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isOnFire 
              ? 'bg-gradient-to-br from-[#F97316] to-[#FB923C]' 
              : 'bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4]'
          }`}
          animate={isOnFire ? {
            boxShadow: [
              '0 0 20px rgba(249, 115, 22, 0.3)',
              '0 0 30px rgba(249, 115, 22, 0.5)',
              '0 0 20px rgba(249, 115, 22, 0.3)',
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {isOnFire ? (
            <Flame className="w-7 h-7 text-white" />
          ) : (
            <span className="text-2xl font-bold text-white">{streak}</span>
          )}
        </motion.div>

        {/* Glow effect for fire streak */}
        {isOnFire && (
          <div className="absolute inset-0 rounded-2xl bg-[#F97316] blur-lg opacity-30 -z-10" />
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold text-[#0F172A]">{streak}</span>
          <span className="text-sm text-[#64748B]">{label}</span>
        </div>
        
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-xs text-[#5F9DB0]">
            <TrendingUp className="w-3 h-3" />
            <span>Best: {bestStreak}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-24 h-1.5 bg-[#EAF2F4] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#6FA8C7] to-[#4A90A4] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((streak / bestStreak) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
