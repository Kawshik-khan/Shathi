"use client"
import React from "react"
import { motion } from 'framer-motion'
import { GlassCard } from "@/components/ui/GlassCard"
import LineChartSoft from "@/components/charts/LineChartSoft"
import BarChartSoft from "@/components/charts/BarChartSoft"
import EmotionHeatmap from "@/components/charts/EmotionHeatmap"
import { Heart, Brain, Lightbulb, TrendingDown, Sparkles } from 'lucide-react'

export default function AdvancedGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Widget 5: Emotional Timeline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <GlassCard ariaLabel="Emotional timeline card" className="h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#5DBB63]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">Emotional Timeline</h3>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-[#A7F3D0] text-[#15803D]">Interactive</span>
          </div>
          
          <div className="h-40 mb-4">
            <LineChartSoft 
              data={[
                { name: 'Mon', value: 72 },
                { name: 'Tue', value: 78 },
                { name: 'Wed', value: 65 },
                { name: 'Thu', value: 82 },
                { name: 'Fri', value: 88 },
                { name: 'Sat', value: 75 },
                { name: 'Sun', value: 91 },
              ]} 
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-[#64748B] mb-2">Mood Heatmap (4 Weeks)</p>
            <EmotionHeatmap weeks={4} />
          </div>

          <div className="p-3 rounded-xl bg-[#F8FBF8]">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-[#5DBB63] mt-0.5" />
              <p className="text-sm text-[#64748B]">
                <span className="font-medium text-[#0F172A]">AI Note:</span> Your emotional stability has improved 12% since last week. Morning routines seem to positively impact your afternoon mood.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Widget 6: Stress vs Sleep Correlation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard ariaLabel="Stress vs sleep correlation card" className="h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#5DBB63]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">Stress vs Sleep Correlation</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-[#EEF7EF] to-[#F5FAF5]">
              <p className="text-2xl font-bold text-[#0F172A]">32%</p>
              <p className="text-xs text-[#64748B]">Stress Level</p>
              <p className="text-xs text-[#22C55E] mt-1">↓ Lower than average</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-[#C7D2FE] to-[#E0E7FF]">
              <p className="text-2xl font-bold text-[#0F172A]">7.4h</p>
              <p className="text-xs text-[#64748B]">Avg Sleep</p>
              <p className="text-xs text-[#6366F1] mt-1">↑ Optimal range</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FBF8]">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-[#FCD34D] mt-0.5" />
              <p className="text-sm text-[#64748B]">
                <span className="font-medium text-[#0F172A]">Insight:</span> Your stress levels decrease significantly after consistent sleep above 7 hours. Prioritizing sleep this week helped reduce anxiety markers.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Widget 7: Habit Impact Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <GlassCard ariaLabel="Habit impact analysis card" className="h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#5DBB63]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">Habit Impact Analysis</h3>
            </div>
          </div>

          <BarChartSoft 
            title=""
            data={[
              { label: 'Meditation', value: 85, color: '#22C55E' },
              { label: 'Exercise', value: 72, color: '#7ED957' },
              { label: 'Sleep', value: 90, color: '#6366F1' },
              { label: 'Journaling', value: 78, color: '#86EFAC' },
              { label: 'Hydration', value: 65, color: '#A7F3D0' },
            ]}
          />
        </GlassCard>
      </motion.div>

      {/* Widget 8: AI Reflection Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard ariaLabel="AI reflection summary card" className="h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FCD34D]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">AI Reflection Summary</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F8FBF8] to-[#EEF7EF] border border-[#BBF7D0]">
              <p className="text-[#0F172A] text-sm leading-relaxed">
                <span className="font-semibold">🌱 Week in Review:</span> You&apos;ve shown improved emotional stability this week despite increased workload. Your morning meditation habit continues to pay dividends.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-[#DCFCE7]">
                <p className="text-lg font-bold text-[#15803D]">+12%</p>
                <p className="text-xs text-[#64748B]">Mood</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#C7D2FE]">
                <p className="text-lg font-bold text-[#4338CA]">+0.5h</p>
                <p className="text-xs text-[#64748B]">Sleep</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[#FED7AA]">
                <p className="text-lg font-bold text-[#C2410C]">85%</p>
                <p className="text-xs text-[#64748B]">Habits</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF3C7]">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <p className="text-xs text-[#92400E]">
                <strong>Keep going!</strong> You&apos;re building sustainable wellness patterns.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

