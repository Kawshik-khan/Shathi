"use client"
import React from "react"
import { motion } from 'framer-motion'
import { GlassCard } from "@/components/ui/GlassCard"
import BurnoutGauge from "@/components/charts/BurnoutGauge"
import EmotionalGrowthTracker from "@/components/charts/EmotionalGrowthTracker"
import { 
  Wind, 
  Moon, 
  BookOpen, 
  Heart, 
  Droplets, 
  Zap,
  Coffee,
  Target
} from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  benefit: string
}

const recommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Morning Breathing',
    description: '4-7-8 breathing technique for 5 minutes',
    icon: <Wind className="w-5 h-5" />,
    color: 'text-[#6366F1]',
    bgColor: 'bg-[#C7D2FE]',
    benefit: 'Reduces stress by 40%'
  },
  {
    id: '2',
    title: 'Sleep Optimization',
    description: 'Maintain consistent bedtime routine',
    icon: <Moon className="w-5 h-5" />,
    color: 'text-[#8B5CF6]',
    bgColor: 'bg-[#DDD6FE]',
    benefit: 'Improves sleep quality'
  },
  {
    id: '3',
    title: 'Gratitude Journaling',
    description: 'Write 3 things you\'re grateful for',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'text-[#22C55E]',
    bgColor: 'bg-[#BBF7D0]',
    benefit: 'Boosts emotional resilience'
  },
  {
    id: '4',
    title: 'Mindfulness Break',
    description: '10-minute body scan meditation',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-[#EC4899]',
    bgColor: 'bg-[#FBCFE8]',
    benefit: 'Increases self-awareness'
  },
  {
    id: '5',
    title: 'Hydration Reminder',
    description: 'Drink 8 glasses of water daily',
    icon: <Droplets className="w-5 h-5" />,
    color: 'text-[#06B6D4]',
    bgColor: 'bg-[#A5F3FC]',
    benefit: 'Enhances mental clarity'
  },
  {
    id: '6',
    title: 'Energy Management',
    description: 'Schedule breaks between tasks',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#FDE68A]',
    benefit: 'Maintains productivity'
  }
]

export default function Recommendations() {
  return (
    <div className="space-y-8">
      {/* Widget 9: Personalized Recommendations */}
      <section aria-labelledby="recommendations-heading">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#5DBB63]" />
          <h2 id="recommendations-heading" className="text-lg font-semibold text-[#0F172A]">
            Personalized Recommendations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <GlassCard 
                className="cursor-pointer hover:shadow-lg transition-shadow group"
                ariaLabel={`${rec.title} recommendation`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${rec.bgColor} flex items-center justify-center ${rec.color} group-hover:scale-110 transition-transform`}>
                    {rec.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[#0F172A] text-sm">{rec.title}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{rec.description}</p>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                        {rec.benefit}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Widget 10: Burnout Detection & Widget 11: Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 10: Burnout Detection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard ariaLabel="Burnout detection card">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-[#5DBB63]" />
              <h3 className="text-lg font-semibold text-[#0F172A]">Burnout Detection</h3>
            </div>
            
            <div className="flex flex-col items-center">
              <BurnoutGauge score={32} riskLevel="low" />
              
              <div className="mt-6 w-full space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Workload Balance</span>
                  <span className="text-[#0F172A] font-medium">78%</span>
                </div>
                <div className="h-2 bg-[#EEF7EF] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#7ED957] to-[#22C55E] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Widget 12: AI Memory Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard ariaLabel="AI memory highlights card" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FCD34D]" />
                <h3 className="text-lg font-semibold text-[#0F172A]">AI Memory Highlights</h3>
              </div>
            </div>

            <EmotionalGrowthTracker />
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
