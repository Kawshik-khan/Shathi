'use client'

import { motion } from 'framer-motion'
import { Moon, Target, Calendar, TrendingUp, BookOpen, Smile } from 'lucide-react'

export function SecondaryBentoGrid() {
  const cards = [
    {
      title: 'Today\'s Goals',
      content: 'Daily wellness objectives and progress tracking',
      icon: Target,
      gradient: 'from-[#5DBB63] to-[#22C55E]',
      items: ['Meditation', 'Exercise', 'Hydration'],
      delay: 0.1,
    },
    {
      title: 'Habit Streaks',
      content: 'Track your daily habits and build consistency',
      icon: Calendar,
      gradient: 'from-[#7ED957] to-[#5DBB63]',
      stats: '🔥 7 day streak',
      delay: 0.2,
    },
    {
      title: 'Sleep Tracking',
      content: 'Monitor your sleep patterns and quality',
      icon: Moon,
      gradient: 'from-[#22C55E] to-[#7ED957]',
      chart: true,
      delay: 0.3,
    },
    {
      title: 'AI Insight',
      content: 'Personalized wellness recommendations',
      icon: TrendingUp,
      gradient: 'from-[#5DBB63] to-[#7ED957]',
      insight: 'Your mood has improved 23% this week',
      delay: 0.4,
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Your wellness
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
              dashboard
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your progress and celebrate your wins
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: card.delay,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2 }
              }}
              className="group"
            >
              <div className={`
                relative h-64 lg:h-72 rounded-3xl p-6
                bg-white/80 backdrop-blur-md border border-white/20
                shadow-lg hover:shadow-xl
                transition-all duration-300
                overflow-hidden
              `}>
                {/* Background gradient */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${card.gradient}
                  opacity-0 group-hover:opacity-10
                  transition-opacity duration-300
                `} />

                {/* Icon */}
                <div className="relative z-10 mb-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: card.delay + 0.2, duration: 0.4 }}
                    className="w-12 h-12 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center"
                  >
                    <card.icon className="w-6 h-6 text-gray-700" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay + 0.3, duration: 0.5 }}
                    className="text-xl font-semibold text-gray-900 mb-2"
                  >
                    {card.title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: card.delay + 0.4, duration: 0.6 }}
                    className="text-gray-600 text-sm mb-4"
                  >
                    {card.content}
                  </motion.p>

                  {/* Items list */}
                  {card.items && (
                    <motion.ul
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: card.delay + 0.5, duration: 0.6 }}
                      className="space-y-2"
                    >
                      {card.items.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: card.delay + 0.6 + i * 0.1, duration: 0.3 }}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <div className="w-2 h-2 rounded-full bg-[#5DBB63] mr-2" />
                          {item}
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}

                  {/* Stats */}
                  {card.stats && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: card.delay + 0.5, duration: 0.4 }}
                      className="mt-4 text-center"
                    >
                      <span className="text-lg font-semibold text-[#5DBB63]">
                        {card.stats}
                      </span>
                    </motion.div>
                  )}

                  {/* Chart */}
                  {card.chart && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: card.delay + 0.5, duration: 0.6 }}
                      className="mt-4 h-24 flex items-end justify-center"
                    >
                      <div className="w-full h-full flex items-end justify-center space-x-1">
                        {[40, 65, 45, 80, 55, 70, 60].map((height, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ 
                              delay: card.delay + 0.5 + i * 0.05,
                              duration: 0.3
                            }}
                            className="w-8 bg-gradient-to-t from-[#22C55E] to-[#5DBB63] rounded-t"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Insight */}
                  {card.insight && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: card.delay + 0.5, duration: 0.6 }}
                      className="mt-4 p-3 bg-[#5DBB63]/10 rounded-lg text-center"
                    >
                      <p className="text-sm text-gray-700">
                        {card.insight}
                      </p>
                    </motion.div>
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-full h-full bg-white/5 backdrop-blur-sm flex items-center justify-center">
                      <Smile className="w-8 h-8 text-[#5DBB63]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

