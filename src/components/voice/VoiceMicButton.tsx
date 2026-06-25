'use client';

import { Mic, MicOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { VoiceState } from './types';

interface VoiceMicButtonProps {
  state: VoiceState;
  level: number;
  isSupported: boolean;
  onClick: () => void;
}

export function VoiceMicButton({ state, level, isSupported, onClick }: VoiceMicButtonProps) {
  const reduceMotion = useReducedMotion();
  const isListening = state === 'listening';
  const isActive = isListening || state === 'thinking' || state === 'speaking';
  const ringScale = 1.06 + Math.min(level, 1) * 0.18;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!isSupported}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      className={cn(
        'relative grid h-11 w-11 shrink-0 place-items-center overflow-visible rounded-full text-white shadow-sm transition-colors',
        'bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] hover:shadow-[0_10px_26px_rgba(34,197,94,0.26)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90A4]/35 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-45',
        isActive && 'shadow-[0_0_0_5px_rgba(34,197,94,0.12),0_12px_32px_rgba(34,197,94,0.3)]'
      )}
      whileTap={isSupported ? { scale: 0.94 } : undefined}
      whileHover={isSupported ? { scale: 1.04 } : undefined}
      animate={!reduceMotion && isListening ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 1.4, repeat: isListening && !reduceMotion ? Infinity : 0, ease: 'easeInOut' }}
    >
      {isListening && !reduceMotion && (
        <>
          <motion.span
            aria-hidden
            className="absolute inset-[-5px] rounded-full border border-[#4A90A4]/35"
            animate={{ scale: [1, ringScale, 1], opacity: [0.7, 0.18, 0.7] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-[-10px] rounded-full border border-[#A8D0D9]/25"
            animate={{ scale: [1, 1.22, 1], opacity: [0.42, 0.06, 0.42] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <span className="absolute inset-0 rounded-full bg-white/12" aria-hidden />
      {isListening ? <MicOff className="relative h-5 w-5" /> : <Mic className="relative h-5 w-5" />}
    </motion.button>
  );
}

