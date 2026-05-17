'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { useDashboardStore } from '@/lib/store';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function DailyCheckIn() {
  const { checkInMoods, selectedMood, setSelectedMood } = useDashboardStore();
  const [note, setNote] = useState('');

  return (
    <GlassCard className="h-full" delay={0.45}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#22C55E]" />
          <span className="text-sm font-medium text-foreground">Daily Check-in</span>
        </div>
      </div>

      {/* Question */}
      <p className="text-sm text-muted-foreground mb-4">
        How are you feeling right now?
      </p>

      {/* Mood Selector */}
      <div className="flex items-center gap-3 mb-4">
        {checkInMoods.map((mood, index) => (
          <motion.button
            key={mood.value}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedMood(mood.value)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all",
              selectedMood === mood.value
                ? "bg-[#DCFCE7] ring-2 ring-[#22C55E] ring-offset-2 shadow-md"
                : "hover:bg-[#F3FAF4]"
            )}
          >
            {mood.emoji}
          </motion.button>
        ))}
      </div>

      {/* Note Input */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Add note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#F3FAF4] border border-transparent focus:border-[#A7F3A0] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/10 text-sm placeholder:text-muted-foreground/60 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (selectedMood) {
              alert('Check-in saved!');
              setNote('');
            }
          }}
          disabled={!selectedMood}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
            selectedMood
              ? "btn-primary-gradient"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          Save
        </motion.button>
      </div>
    </GlassCard>
  );
}

