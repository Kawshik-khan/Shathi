'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Shield, Sparkles } from 'lucide-react'

export function CTASection() {
  return (
    <section id="start" className="py-24 px-6 bg-gradient-to-br from-[#EEF7EF] via-[#F8FBF8] to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            A healthier, happier you starts
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
              here
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Join thousands who have transformed their wellness journey with Sathi
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Headline and illustration */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-6">
              Start your journey to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
                better wellness
              </span>
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Get personalized AI guidance, mood tracking, and wellness insights - all in one beautiful companion app.
            </p>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
            >
              Start for free
              <ArrowRight className="ml-2 w-5 h-5" />
            </motion.button>
            
            <div className="flex items-center space-x-4 mt-6 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
          </motion.div>

          {/* Right side - 3D illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative w-full h-96 lg:h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#EEF7EF] to-[#F8FBF8] shadow-2xl">
              
              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-8 left-8 w-16 h-16 bg-[#5DBB63]/20 rounded-full blur-md"
              />
              
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-20 right-12 w-24 h-24 bg-gradient-to-r from-[#7ED957] to-[#5DBB63] rounded-full blur-lg shadow-lg"
              />
              
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  x: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute bottom-16 left-16 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg"
              />

              {/* Main illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <motion.div
                      animate={{
                        y: [0, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-48 h-48 mx-auto"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-[#5DBB63]/20 to-[#22C55E]/30 rounded-full flex items-center justify-center shadow-xl">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full bg-[#5DBB63]"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Floating particles */}
                    <motion.div
                      animate={{
                        y: [0, 10, 0],
                        opacity: [0.4, 0.6, 0.4],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-4 left-4 w-2 h-2 bg-[#7ED957]/60 rounded-full"
                    />
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-8 right-8 w-3 h-3 bg-[#5DBB63]/40 rounded-full"
                    />
                    <motion.div
                      animate={{
                        y: [0, 12, 0],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute bottom-8 right-12 w-2 h-2 bg-[#22C55E]/60 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

