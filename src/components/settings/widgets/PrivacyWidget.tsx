"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { privacySchema, type PrivacyFormData } from '@/lib/schemas/settingsSchema'
import { deleteAccount, exportUserData } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function PrivacyWidget() {
  const store = useSettingsStore()
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const { register, handleSubmit } = useForm<PrivacyFormData>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      aiMemoryEnabled: store.aiMemoryEnabled,
      dataExportSchedule: store.dataExportSchedule,
    },
  })

  const onSubmit = (data: PrivacyFormData) => {
    store.updatePrivacy(data)
  }

  const handleExport = async () => {
    setStatus('')
    setError('')
    try {
      const blob = await exportUserData()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'sathi-data-export.json'
      link.click()
      URL.revokeObjectURL(url)
      setStatus('Data export downloaded.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Export failed. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    setStatus('')
    setError('')

    try {
      await deleteAccount(confirmation)
      logout()
      router.push('/auth/signup')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete account failed.')
    }
  }

  return (
    <GlassCard delay={0.16} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Privacy and data settings">
        <h3 className="font-medium text-lg mb-3">Privacy &amp; Data</h3>
        <div className="space-y-3">
          {(status || error) && (
            <p className={`text-sm ${error ? 'text-red-500' : 'text-[#22C55E]'}`}>
              {error || status}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="aiMemory" className="font-medium">
                AI Memory
              </label>
              <p className="text-sm text-slate-500">Control what Sathi remembers</p>
            </div>
            <input
              id="aiMemory"
              type="checkbox"
              {...register('aiMemoryEnabled')}
              aria-label="Enable AI memory"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="export" className="font-medium">
                Export Data
              </label>
              <p className="text-sm text-slate-500">Download your data</p>
            </div>
            <button
              id="export"
              type="button"
              onClick={handleExport}
              className="px-3 py-1 rounded-full bg-white/60 hover:bg-white/80 transition-colors"
              aria-label="Export your personal data"
            >
              Export
            </button>
          </div>

          <div className="rounded-2xl bg-red-50/80 p-3">
            <label htmlFor="deleteAccount" className="font-medium text-red-600">
              Delete Account
            </label>
            <p className="text-sm text-red-500">Type DELETE to deactivate your account.</p>
            <div className="mt-3 flex gap-2">
              <input
                id="deleteAccount"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                className="min-w-0 flex-1 rounded-full border border-red-200 bg-white/80 px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-red-300"
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={confirmation !== 'DELETE'}
                className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5DBB63] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

