'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Heart, Users, Star } from 'lucide-react'

interface HeroSectionProps {
  user?: any
}

export function HeroSection({ user }: HeroSectionProps = {}) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FBF8] via-[#EEF7EF] to-white opacity-50" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#5DBB63]/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-64 h-64 bg-[#7ED957]/15 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left side - Hero content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20"
          >
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Your AI Companion for Mind & Body
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6"
            >
              Feel better.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
                Every day.
              </span>
              <br />
              With <span className="text-[#5DBB63]">Sathi</span>.
            </motion.h1>

            {/* Supporting paragraph */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg text-gray-600 mb-8 leading-relaxed"
            >
              Sathi is your AI-powered wellness companion that understands you, supports you, and helps you build a healthier, happier life.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <Link href="/dashboard">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Go to Dashboard
                  </motion.button>
                </Link>
              ) : (
                <>
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-8 py-4 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Start your journey
                  </motion.button>
                
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
                  >
                    <span className="mr-2">Watch demo</span>
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    </div>
                  </motion.button>
                </>
              )}
            
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-white hover:shadow-lg transform transition-all duration-200 flex items-center justify-center"
              >
                <span className="mr-2">Login</span>
                <span className="mr-2">Watch demo</span>
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="flex items-center space-x-6 pt-8"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    style={{
                      backgroundImage: `url(https://api.dicebear.com/7x0/avataaars/seed${i}.svg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ))}
              </div>
              
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-gray-600 font-medium ml-2">4.9</span>
              </div>
              
              <div className="flex items-center">
                <Users className="w-4 h-4 text-[#5DBB63] mr-2" />
                <span className="text-gray-600 font-medium">10,000+ users</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - 3D illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative"
          >
            <div className="relative w-full h-96 lg:h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#EEF7EF] to-[#F8FBF8] shadow-2xl">
              {/* Floating AI elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
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
                className="absolute top-20 right-12 w-20 h-20 bg-gradient-to-r from-[#5DBB63] to-[#22C55E] rounded-full blur-lg shadow-lg"
              />
              
              {/* AI speech bubbles */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-12 left-8 bg-white rounded-2xl p-3 shadow-lg max-w-[200px]"
              >
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-[#5DBB63]" />
                  <span className="text-sm text-gray-700">I'm here for you!</span>
                </div>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 right-8 bg-white rounded-2xl p-3 shadow-lg max-w-[180px]"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#7ED957]" />
                  <span className="text-sm text-gray-700">Let's start today!</span>
                </div>
              </motion.div>

              {/* Main illustration placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#5DBB63]/20 to-[#22C55E]/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">AI Companion</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

