'use client'

import { motion } from 'framer-motion'
import { Bot, Heart, Brain, Moon, TrendingUp, Calendar, CheckCircle } from 'lucide-react'

interface FeatureBentoGridProps {
  user?: any
}

export function FeatureBentoGrid({ user }: FeatureBentoGridProps = {}) {
  const features = [
    {
      icon: Bot,
      title: 'AI Companion',
      description: 'Your personal wellness assistant available 24/7',
      gradient: 'from-[#5DBB63] to-[#22C55E]',
      delay: 0.1,
    },
    {
      icon: Heart,
      title: 'Mood Tracking',
      description: 'Monitor your emotional patterns and wellbeing',
      gradient: 'from-[#7ED957] to-[#5DBB63]',
      delay: 0.2,
    },
    {
      icon: Brain,
      title: 'Smart Insights',
      description: 'AI-powered wellness recommendations',
      gradient: 'from-[#22C55E] to-[#7ED957]',
      delay: 0.3,
    },
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything you need for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
              better wellness
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools designed to support your mental and emotional wellbeing journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: feature.delay,
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
                relative h-72 lg:h-80 rounded-3xl p-6
                bg-white/80 backdrop-blur-md border border-white/20
                shadow-lg hover:shadow-xl
                transition-all duration-300
                overflow-hidden flex flex-col
              `}>
                {/* Background gradient */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl
                  opacity-0 group-hover:opacity-10
                  transition-opacity duration-300
                `} />

                {/* Hover effect checkmark (background) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <CheckCircle className="w-32 h-32 text-[#5DBB63] opacity-[0.03]" />
                </div>

                {/* Icon */}
                <div className="relative z-10 mb-6 mt-2">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: feature.delay + 0.2, duration: 0.4 }}
                    className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center shadow-lg"
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center flex-grow">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: feature.delay + 0.3, duration: 0.5 }}
                    className="text-xl font-semibold text-gray-900 mb-3"
                  >
                    {feature.title}
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: feature.delay + 0.4, duration: 0.6 }}
                    className="text-gray-600 leading-relaxed"
                  >
                    {feature.description}
                  </motion.p>
                </div>

                {/* CTA Button */}
                <div className="relative z-20 mt-auto pt-4">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: feature.delay + 0.5, duration: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full py-3 rounded-full
                      bg-gradient-to-r ${feature.gradient}
                      text-white font-medium shadow-md
                      hover:shadow-lg
                      transition-all duration-200
                      ${user ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {user ? 'Go to Dashboard' : 'Get Started'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

