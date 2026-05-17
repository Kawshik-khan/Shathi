'use client'

import { motion } from 'framer-motion'
import { User, LogOut, Home, Settings, Activity, Heart } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { ProtectedLayout } from '../../components/layout/protected-layout'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Activity, label: 'Activity', onClick: () => alert('Activity page coming soon!') },
    { icon: Heart, label: 'Mood', onClick: () => alert('Mood page coming soon!') },
    { icon: Settings, label: 'Settings', onClick: () => alert('Settings page coming soon!') },
  ]

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#F8FBF8] via-[#EEF7EF] to-white">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
                  {user?.email || 'User'}!
                </span>
              </h1>
              <p className="text-gray-600">Your wellness journey continues</p>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-6">
              {menuItems.map((item, index) => (
                item.href ? (
                  <Link
                    key={index}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-2 rounded-lg
                      transition-all duration-200
                      ${item.href === '/dashboard'
                        ? 'bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              ))}
            </div>

            {/* Sign Out Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut()}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard Content */}
        <div className="px-6 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              whileHover={{ y: -8 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
                  <p className="text-sm text-gray-600">Track your progress</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              whileHover={{ y: -8 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22C55E] to-[#5DBB63] flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Mood Score</h3>
                  <p className="text-sm text-gray-600">Current wellness level</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              whileHover={{ y: -8 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#7ED957] to-[#5DBB63] flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                  <p className="text-sm text-gray-600">Manage your account</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20"
              whileHover={{ y: -8 }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#22C55E] to-[#7ED957] flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-600">Your information</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            
            <div className="space-y-4">
              {[
                { date: 'Today', activity: 'Completed morning meditation', mood: 'Calm' },
                { date: 'Yesterday', activity: 'Logged mood tracking', mood: 'Positive' },
                { date: '2 days ago', activity: 'Journal entry', mood: 'Reflective' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
                  whileHover={{ x: 8 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{item.date}</p>
                      <p className="font-medium text-gray-900">{item.activity}</p>
                      {item.mood && (
                        <span className="inline-flex items-center px-2 py-1 bg-[#5DBB63]/10 text-green-700 rounded-full text-xs">
                          {item.mood}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl text-gray-300">→</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

