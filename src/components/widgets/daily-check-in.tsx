'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useDashboardStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function DailyCheckIn() {
  const { checkInMoods, selectedMood, setSelectedMood, saveCheckIn } = useDashboardStore();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!selectedMood) return;
    saveCheckIn(note);
    setNote('');
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="card card-interactive h-full">
      <header className="mb-3 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-mood-red" aria-hidden="true" />
          Daily Check-in
        </span>
        {saved ? (
          <span className="status-pill status-pill--success">Saved</span>
        ) : selectedMood ? (
          <span className="status-pill status-pill--info">Selected</span>
        ) : (
          <span className="card-caption">2 min</span>
        )}
      </header>

      <p className="card-title mb-3">How are you feeling right now?</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {checkInMoods.map((mood, index) => (
          <motion.button
            key={mood.value}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + index * 0.04 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setSelectedMood(mood.value)}
            aria-pressed={selectedMood === mood.value}
            aria-label={mood.label}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full text-xl transition-all focus-ring',
              selectedMood === mood.value
                ? 'bg-mood-green-soft ring-2 ring-mood-green ring-offset-2 shadow-sm'
                : 'hover:bg-mood-green-soft/60',
            )}
          >
            {mood.emoji}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <label htmlFor="checkin-note" className="sr-only">
          Add a note to your check-in
        </label>
        <input
          id="checkin-note"
          type="text"
          placeholder="Add note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(
            'flex-1 rounded-xl border border-transparent bg-muted px-3.5 py-2.5 text-sm',
            'placeholder:text-muted-foreground/70 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15',
            'transition-all',
          )}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedMood}
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm font-medium focus-ring touch-target',
            selectedMood
              ? 'btn-primary-gradient'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}