"use client"
import React from "react";
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface InsightBarProps {
  label: string;
  value: number;
  maxValue?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

export function InsightBar({ 
  label, 
  value, 
  maxValue = 100,
  trend = 'stable',
  color = '#22C55E'
}: InsightBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const trendColors = {
    up: '#22C55E',
    down: '#F97316',
    stable: '#64748B'
  };

  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#64748B]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#0F172A]">{value}%</span>
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: trendColors[trend] }}
          />
        </div>
      </div>
      
      <div className="h-2 bg-[#EEF7EF] rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

interface BarChartSoftProps {
  data?: Array<{ label: string; value: number; color?: string }>;
  title?: string;
}

export default function BarChartSoft({ 
  data = [
    { label: 'Meditation', value: 85, color: '#22C55E' },
    { label: 'Exercise', value: 72, color: '#7ED957' },
    { label: 'Sleep', value: 90, color: '#86EFAC' },
    { label: 'Hydration', value: 65, color: '#A7F3A0' },
    { label: 'Journaling', value: 78, color: '#BBF7D0' },
  ],
  title = "Habit Impact"
}: BarChartSoftProps) {
  return (
    <motion.div 
      role="img" 
      aria-label={`${title} bar chart`}
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#5DBB63]" />
        <span className="text-sm font-semibold text-[#0F172A]">{title}</span>
      </div>

      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <InsightBar 
            label={item.label} 
            value={item.value} 
            color={item.color}
            trend={item.value >= 80 ? 'up' : item.value >= 60 ? 'stable' : 'down'}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}