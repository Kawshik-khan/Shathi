"use client"
import React from "react";
import { motion } from 'framer-motion';
import { Brain, Sparkles, Heart } from 'lucide-react';

interface GrowthMilestoneProps {
  title: string;
  description: string;
  date: string;
  type?: 'achievement' | 'reflection' | 'breakthrough';
  trend?: 'up' | 'down';
}

const milestoneIcons = {
  achievement: Brain,
  breakthrough: Sparkles,
  reflection: Heart,
};

export function GrowthMilestone({ 
  title, 
  description, 
  date,
  type = 'achievement',
  trend = 'up'
}: GrowthMilestoneProps) {
  const getColor = () => {
    switch (type) {
      case 'breakthrough':
        return 'bg-[#FCD34D] text-[#B45309]';
      case 'reflection':
        return 'bg-[#FECACA] text-[#DC2626]';
      default:
        return 'bg-[#A7F3D0] text-[#15803D]';
    }
  };

  const Icon = milestoneIcons[type];

  return (
    <motion.div 
      className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FBF8] hover:bg-[#EEF7EF] transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-label={title}
    >
      <div className={`w-10 h-10 rounded-xl ${getColor()} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-[#0F172A] truncate">{title}</h4>
          {trend === 'up' && (
            <span className="text-[#22C55E]">↑</span>
          )}
        </div>
        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{description}</p>
        <span className="text-xs text-[#94A3B8] mt-1 block">{date}</span>
      </div>
    </motion.div>
  );
}

interface EmotionalGrowthTrackerProps {
  milestones?: Array<{
    title: string;
    description: string;
    date: string;
    type?: 'achievement' | 'reflection' | 'breakthrough';
    trend?: 'up' | 'down';
  }>;
}

export default function EmotionalGrowthTracker({
  milestones = [
    {
      title: 'Emotional Stability Improved',
      description: 'You\'ve shown consistent emotional balance this week despite challenges.',
      date: '2 days ago',
      type: 'achievement',
      trend: 'up'
    },
    {
      title: 'Sleep Breakthrough',
      description: 'Two weeks ago you struggled with sleep consistency. You\'ve improved by 34%.',
      date: '1 week ago',
      type: 'breakthrough',
      trend: 'up'
    },
    {
      title: 'Self-Reflection',
      description: 'Daily journaling habit has strengthened your emotional awareness.',
      date: '2 weeks ago',
      type: 'reflection',
      trend: 'up'
    }
  ]
}: EmotionalGrowthTrackerProps) {
  return (
    <motion.div 
      role="region"
      aria-label="Emotional growth timeline"
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-[#0F172A]">Growth Timeline</h4>
        <span className="text-xs text-[#5DBB63]">+18% this month</span>
      </div>

      {/* Timeline line */}
      <div className="relative pl-4">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22C55E] via-[#7ED957] to-[#BBF7D0]" />
        
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <GrowthMilestone {...milestone} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
