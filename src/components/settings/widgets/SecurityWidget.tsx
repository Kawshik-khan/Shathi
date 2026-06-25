"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { securitySchema, type SecurityFormData } from '@/lib/schemas/settingsSchema'
import { getSessions, updatePassword, type SessionInfo } from '@/lib/api'

export default function SecurityWidget() {
  const store = useSettingsStore()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
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

  const handleManageSessions = async () => {
    setStatus('')
    setError('')
    try {
      setSessions(await getSessions())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load sessions.')
    }
  }

  const handlePasswordUpdate = async () => {
    setStatus('')
    setError('')
    try {
      await updatePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setStatus('Password updated.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update password.')
    }
  }

  return (
    <GlassCard delay={0.22} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Security settings">
        <h3 className="font-medium text-lg mb-3">Security</h3>
        <div className="space-y-3">
          {(status || error) && (
            <p className={`text-sm ${error ? 'text-red-500' : 'text-[#4A90A4]'}`}>
              {error || status}
            </p>
          )}

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

          <div className="rounded-2xl bg-white/40 p-3">
            <p className="font-medium">Update Password</p>
            <div className="mt-3 space-y-2">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Current password"
                className="w-full rounded-full border border-white/20 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                className="w-full rounded-full border border-white/20 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4A90A4]"
              />
              <button
                type="button"
                onClick={handlePasswordUpdate}
                disabled={!currentPassword || newPassword.length < 8}
                className="rounded-full bg-[#5F9DB0] px-3 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="rounded-2xl bg-[#F1F5F7]/80 p-3">
              {sessions.map((session) => (
                <div key={session.id}>
                  <p className="text-sm font-medium">{session.current ? 'Current session' : session.id}</p>
                  <p className="text-xs text-slate-500">{session.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5F9DB0] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

