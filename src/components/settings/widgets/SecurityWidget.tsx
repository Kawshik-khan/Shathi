"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { securitySchema, type SecurityFormData } from '@/lib/schemas/settingsSchema'

export default function SecurityWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit } = useForm<SecurityFormData>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorEnabled: store.twoFactorEnabled,
      biometricLogin: store.biometricLogin,
    },
  })

  const onSubmit = (data: SecurityFormData) => {
    store.updateSecurity(data)
  }

  const handleManageSessions = () => {
    // TODO: Implement session management
    alert('Session management interface would open here')
  }

  return (
    <GlassCard delay={0.22} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Security settings">
        <h3 className="font-medium text-lg mb-3">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="2fa" className="font-medium">
                Two-factor Authentication
              </label>
              <p className="text-sm text-slate-500">Add extra protection to your account</p>
            </div>
            <input
              id="2fa"
              type="checkbox"
              {...register('twoFactorEnabled')}
              aria-label="Enable two-factor authentication"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="sessions" className="font-medium">
                Active Sessions
              </label>
              <p className="text-sm text-slate-500">Manage devices that are signed in</p>
            </div>
            <button
              id="sessions"
              type="button"
              onClick={handleManageSessions}
              className="px-3 py-1 rounded-full bg-white/60 hover:bg-white/80 transition-colors"
              aria-label="Manage active sessions and devices"
            >
              Manage
            </button>
          </div>
        </div>
      </form>
    </GlassCard>
  )
}

