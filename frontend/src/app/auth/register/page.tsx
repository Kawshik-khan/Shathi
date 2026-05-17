'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await signUp(formData.email, formData.password)
      if (error) {
        setError(error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FBF8] via-[#EEF7EF] to-white flex items-center justify-center p-6">
      {/* Floating outer container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-6xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
          
          {/* Left Panel - Emotional Welcome Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5DBB63]/10 to-[#22C55E]/5 rounded-2xl" />
            
            {/* Sathi Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative z-10 mb-8"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Sathi</span>
              </div>
            </motion.div>

            {/* Wellness Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="relative z-10 mb-8"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white text-sm font-medium">
                <span className="mr-2">🌿</span>
                Your AI Companion for Mind & Body
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="relative z-10 text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6"
            >
              A better you,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DBB63] to-[#22C55E]">
                starts today.
              </span>
              <span className="text-3xl">🌿</span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="relative z-10 text-lg text-gray-600 mb-8 leading-relaxed"
            >
              Create your account and take the first step towards a healthier, happier life with Sathi.
            </motion.p>

            {/* 3D Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative z-10 h-64 lg:h-80"
            >
              <div className="relative w-full h-full">
                {/* Floating AI companion orb */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-4 right-8 w-20 h-20 bg-gradient-to-br from-[#5DBB63]/30 to-[#22C55E]/20 rounded-full blur-lg shadow-lg"
                />
                
                {/* Main character illustration */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Character body */}
                    <div className="w-32 h-40 bg-gradient-to-br from-[#DCFCE7] to-[#BBF7D0] rounded-3xl shadow-xl flex items-end justify-center">
                      {/* Face */}
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#A7F3D0] to-[#64748B] rounded-full flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#5DBB63] to-[#22C55E] rounded-full flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <div className="w-4 h-4 bg-[#5DBB63] rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hoodie */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-36 h-16 bg-gradient-to-br from-[#5DBB63] to-[#22C55E] rounded-t-2xl shadow-lg"></div>
                    </div>
                    
                    {/* Floating particles */}
                    <motion.div
                      animate={{
                        y: [0, 10, 0],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute top-8 left-4 w-3 h-3 bg-[#7ED957]/60 rounded-full"
                    />
                    <motion.div
                      animate={{
                        y: [0, -8, 0],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute bottom-12 right-6 w-2 h-2 bg-[#5DBB63]/40 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Environment elements */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-transparent to-[#F8FBF8]/30 rounded-b-2xl">
              <div className="absolute bottom-4 left-8 w-8 h-8 bg-[#5DBB63]/20 rounded-full blur-md"></div>
              <div className="absolute bottom-8 right-12 w-6 h-6 bg-[#22C55E]/15 rounded-full blur-sm"></div>
            </div>
          </motion.div>

          {/* Right Panel - Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Top wellness icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex justify-center mb-8"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-[#5DBB63] rounded-full"></div>
                </div>
              </div>
            </motion.div>

            {/* Form Container */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
                <p className="text-gray-600">Join Sathi and unlock your personalized wellness journey</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5DBB63]/20 focus:border-[#5DBB63] transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </motion.div>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5DBB63]/20 focus:border-[#5DBB63] transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5DBB63]/20 focus:border-[#5DBB63] transition-all duration-200"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5DBB63]/20 focus:border-[#5DBB63] transition-all duration-200"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                {/* Terms Checkbox */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}
                  className="flex items-center"
                >
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#5DBB63] border-gray-300 rounded focus:ring-[#5DBB63] focus:ring-2"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => alert('Terms of Service coming soon!')}
                      className="text-[#5DBB63] hover:text-[#22C55E] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => alert('Privacy Policy coming soon!')}
                      className="text-[#5DBB63] hover:text-[#22C55E] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !formData.agreeToTerms}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Create account'
                  )}
                </motion.button>
              </form>

              {/* Social Authentication */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-[#5DBB63] hover:shadow-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-gray-800 rounded"></div>
                    </div>
                    <span className="text-sm text-gray-600">Google</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-[#5DBB63] hover:shadow-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-gray-800 rounded"></div>
                    </div>
                    <span className="text-sm text-gray-600">Apple</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-[#5DBB63] hover:shadow-lg transition-all duration-200"
                  >
                    <Mail className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm text-gray-600">Email</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="text-center mt-8"
              >
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-[#5DBB63] hover:text-[#22C55E] font-medium transition-colors">
                    Log in
                  </Link>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

