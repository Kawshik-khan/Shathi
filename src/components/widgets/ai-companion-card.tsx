'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Wind, Quote, MessageCircle, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

const quickActions = [
  { label: 'Breathing', icon: Wind },
  { label: 'Motivation', icon: Quote },
  { label: 'Vent', icon: MessageCircle },
  { label: 'Focus', icon: Target },
];

export function AICompanionCard() {
  const router = useRouter();

  return (
    <GlassCard className="h-full relative overflow-hidden" delay={0}>
      {/* Decorative brand accent */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/dashboard-hero.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute -bottom-6 -right-4 w-56 opacity-20 hidden sm:block"
      />
      <div className="flex items-start justify-between h-full relative z-10">
        {/* Left Content */}
        <div className="flex-1 z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">AI Companion</span>
          </div>

          <h3 className="text-2xl font-semibold text-foreground mb-2">
            I&apos;m here for you,<br />whenever you need.
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            How are you feeling today?
          </p>

          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full btn-primary-gradient text-sm font-medium mb-6"
            onClick={() => router.push('/ai-companion')}
          >
            Start a conversation
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-primary transition-colors border border-primary/20"
                onClick={() => alert(`${action.label} conversation coming soon!`)}
              >
                <span className="flex items-center gap-1.5">
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right - AI Avatar */}
        <div className="relative w-40 h-40 flex-shrink-0">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-light/20 to-primary/10 rounded-full blur-2xl" />
          
          {/* Avatar Circle */}
          <motion.div
            animate={{ 
              scale: [1, 1.02, 1],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative w-full h-full rounded-full bg-gradient-to-br from-primary-soft to-primary-light flex items-center justify-center shadow-xl"
          >
            {/* Smile Face */}
            <div className="text-white">
              <div className="flex gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-white" />
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div className="w-8 h-4 border-b-2 border-white rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
}

