'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '../../contexts/AuthContext'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

