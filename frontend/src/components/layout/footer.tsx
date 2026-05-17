'use client'

import { motion } from 'framer-motion'
import { Github, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Sathi</span>
            </div>
            <p className="text-gray-600 text-sm max-w-xs">
              Your AI-powered wellness companion for better mental and physical health.
            </p>
          </motion.div>

          {/* Product column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#roadmap" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Roadmap
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Company column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#careers" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#blog" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Resources column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#help" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#privacy" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#terms" className="text-gray-600 hover:text-[#5DBB63] transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Newsletter column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            <h4 className="font-semibold text-gray-900 mb-3">Stay Connected</h4>
            <p className="text-gray-600 text-sm mb-4">
              Get wellness tips and updates delivered to your inbox.
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5DBB63] focus:border-transparent"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium rounded-lg hover:shadow-lg transform transition-all duration-200"
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-6 text-gray-600 text-sm">
              <MapPin className="w-4 h-4" />
              <span>123 Wellness Street, Mind City, MC 12345</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Phone className="w-4 h-4" />
              <span className="text-gray-600 text-sm">+1 (555) 123-4567</span>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-600 text-sm">
              <Mail className="w-4 h-4" />
              <span>hello@Sathi.ai</span>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center space-x-6 mt-8">
            <motion.a
              href="https://github.com"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Github className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="https://twitter.com"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </motion.a>
            <motion.a
              href="https://linkedin.com"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

