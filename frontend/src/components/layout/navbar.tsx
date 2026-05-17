'use client'

import { useState, useEffect } from 'react'
import { Menu, X, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop navbar */}
      <nav className={`
        fixed top-0 left-0 right-0 z-40
        bg-white/80 backdrop-blur-sm border-b border-gray-100
        transition-all duration-300
        ${scrolled ? 'shadow-lg' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Sathi</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                How it works
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Pricing
              </Link>
              <Link href="#resources" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Resources
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                About
              </Link>
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-6">
              {user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">Welcome, {user?.full_name || 'User'}!</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign Out
                  </button>
                  <Link href="/dashboard" className="text-[#5DBB63] hover:text-[#22C55E] font-medium transition-colors">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 ml-4"
                  >
                    Start for free
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col p-6 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Sathi</span>
            </Link>
            
            <Link href="#features" className="text-gray-600 hover:text-[#0F172A] transition-colors py-2">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-[#0F172A] transition-colors py-2">
              How it works
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-[#0F172A] transition-colors py-2">
              Pricing
            </Link>
            <Link href="#resources" className="text-gray-600 hover:text-[#0F172A] transition-colors py-2">
              Resources
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-[#0F172A] transition-colors py-2">
              About
            </Link>
            
            <Link
              href="/auth/login"
              className="flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center justify-center px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-200 ml-4"
            >
              Start for free
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop navbar */}
      <nav className={`
        fixed top-0 left-0 right-0 z-40
        bg-white/80 backdrop-blur-sm border-b border-gray-100
        transition-all duration-300 ease-in-out
        ${scrolled ? 'shadow-lg' : ''}
      `}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Sathi</span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                How it works
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Pricing
              </Link>
              <Link href="#resources" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                Resources
              </Link>
              <Link href="#about" className="text-gray-600 hover:text-[#0F172A] transition-colors">
                About
              </Link>
            </div>

            {/* CTA button */}
            <Link
              href="#start"
              className="hidden lg:inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Start for free
            </Link>
          </div>
        </div>

        {/* Mobile navigation */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-sm">
            <div className="flex flex-col p-6 space-y-4">
              <Link
                href="#features"
                className="text-gray-600 hover:text-[#0F172A] transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-[#0F172A] transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                How it works
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 hover:text-[#0F172A] transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#resources"
                className="text-gray-600 hover:text-[#0F172A] transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Resources
              </Link>
              <Link
                href="#about"
                className="text-gray-600 hover:text-[#0F172A] transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="#start"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                Start for free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}

