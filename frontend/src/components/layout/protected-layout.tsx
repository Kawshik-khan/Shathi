'use client'

import { ReactNode, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedLayoutProps {
  children: ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FBF8] via-[#EEF7EF] to-white">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-600 mb-4">Please sign in to continue</h1>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-gradient-to-r from-[#5DBB63] to-[#22C55E] text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

