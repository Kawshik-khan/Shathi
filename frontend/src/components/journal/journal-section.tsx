'use client'

import { motion } from 'framer-motion'
import { BookOpen, PenTool, Calendar, TrendingUp } from 'lucide-react'

export function JournalSection() {
  const journalEntries = [
    {
      title: 'Morning Reflection',
      preview: 'Today I feel grateful for the small moments...',
      date: '2 hours ago',
      mood: 'positive',
    },
    {
      title: 'Evening Thoughts',
      preview: 'Had a challenging day but learned...',
      date: '5 hours ago',
      mood: 'neutral',
    },
    {
      title: 'Weekend Adventures',
      preview: 'Amazing weekend with friends and...',
      date: '1 day ago',
      mood: 'happy',
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
            Track your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
              emotional journey
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Document your thoughts and track your emotional patterns with our intelligent journal system
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Journal Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Journal Preview</h3>
                <p className="text-gray-600 text-sm">Your recent entries</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {journalEntries.slice(0, 3).map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{entry.title}</h4>
                      <p className="text-sm text-gray-500">{entry.date}</p>
                    </div>
                    <div className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${entry.mood === 'positive' ? 'bg-green-100 text-green-700' : 
                       entry.mood === 'happy' ? 'bg-yellow-100 text-yellow-700' : 
                       entry.mood === 'neutral' ? 'bg-gray-100 text-gray-700' : 
                       'bg-blue-100 text-blue-700'}
                    `}>
                      {entry.mood}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm line-clamp-2">{entry.preview}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              View all entries
            </motion.button>
          </motion.div>

          {/* Wellness Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22C55E] to-[#7ED957] flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Wellness Score</h3>
                <p className="text-gray-600 text-sm">Your overall wellbeing</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative inline-block"
                >
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">85</span>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    +12%
                  </div>
                </motion.div>
                <p className="text-gray-600 text-sm mt-2">Great improvement!</p>
              </div>
              
              <div className="grid grid-cols-7 gap-2 mt-6">
                {['M', 'T', 'W', 'Th', 'F', 'S', 'S'].map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                    className={`
                      text-center p-2 rounded-lg
                      ${index === 0 ? 'bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white' : 
                       index === 1 || index === 5 ? 'bg-[#7ED957] text-white' : 
                       'bg-gray-100 text-gray-700'}
                    `}
                  >
                    <div className="text-xs font-medium">{day}</div>
                    <div className="text-xs mt-1">15</div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Weekly average</span>
                  <span className="font-semibold text-gray-900">82</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly trend</span>
                  <span className="font-semibold text-[#7ED957]">↑ 15%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Check-in Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -8 }}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7ED957] to-[#5DBB63] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Daily Check-in</h3>
                <p className="text-gray-600 text-sm">Track your emotions</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="inline-flex items-center space-x-2 text-4xl">
                  {['😊', '😐', '😔', '😌', '🤗'].map((emoji, index) => (
                    <motion.button
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-16 h-16 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-200 text-2xl"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <PenTool className="w-4 h-4 mr-2" />
                How are you feeling today?
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

