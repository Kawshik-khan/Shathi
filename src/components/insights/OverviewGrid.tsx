"use client"
import React from "react"
import { motion } from 'framer-motion'
import GlassCard from "@/components/ui/GlassCard"
import ProgressRing from "@/components/charts/ProgressRing"
import LineChartSoft from "@/components/charts/LineChartSoft"
import StreakIndicator from "@/components/charts/StreakIndicator"
import { Moon, TrendingUp, Activity, Zap } from 'lucide-react'

export default function OverviewGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
      <motion.div 
        className="lg:col-span-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCard ariaLabel="Wellness score card" className="h-full">
          <div className="flex items-center gap-4">
            <ProgressRing value={86} size={100} stroke={8} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-[#0F172A]">86</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-xs text-[#15803D] font-medium">Excellent</span>
              </div>
              <p className="text-sm text-[#64748B] mt-1">Wellness Score</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-[#5DBB63]">
                <TrendingUp className="w-3 h-3" />
                <span>+4% from last week</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div 
        className="lg:col-span-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard ariaLabel="Mood stability chart card" className="h-full">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#0F172A]">Mood Stability</h4>
            <span className="text-xs px-2 py-1 rounded-full bg-[#BBF7D0] text-[#15803D]">Stable</span>
          </div>
          <div className="h-32">
            <LineChartSoft 
              data={[
                { name: 'M', value: 72 },
                { name: 'T', value: 78 },
                { name: 'W', value: 75 },
                { name: 'T', value: 82 },
                { name: 'F', value: 80 },
                { name: 'S', value: 85 },
                { name: 'S', value: 88 },
              ]} 
            />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#64748B]">
            <Activity className="w-3 h-3 text-[#5DBB63]" />
            <span>Weekly variation: ±8%</span>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div 
        className="lg:col-span-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <GlassCard ariaLabel="Sleep quality card" className="h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-[#0F172A]">7h 24m</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#C7D2FE] text-[#4338CA]">Good</span>
              </div>
              <p className="text-sm text-[#64748B]">Average Sleep</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">Consistency</span>
              <span className="font-medium text-[#0F172A]">84%</span>
            </div>
            <div className="h-2 bg-[#EEF7EF] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div 
        className="lg:col-span-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard ariaLabel="Habit consistency card" className="h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#FB923C] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-[#0F172A]">64%</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#FED7AA] text-[#C2410C]">On Track</span>
              </div>
              <p className="text-sm text-[#64748B]">Habit Consistency</p>
            </div>
          </div>
          <StreakIndicator streak={12} bestStreak={24} label="day streak" />
        </GlassCard>
      </motion.div>
    </div>
  )
}

