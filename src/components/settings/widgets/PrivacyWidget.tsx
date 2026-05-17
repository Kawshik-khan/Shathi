"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { privacySchema, type PrivacyFormData } from '@/lib/schemas/settingsSchema'

export default function PrivacyWidget() {
  const store = useSettingsStore()
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
    try {
      // TODO: Implement actual data export
      alert('Data export initiated. Check your email for the download link.')
    } catch (error) {
      alert('Export failed. Please try again.')
    }
  }

  return (
    <GlassCard delay={0.16} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Privacy and data settings">
        <h3 className="font-medium text-lg mb-3">Privacy &amp; Data</h3>
        <div className="space-y-3">
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
        </div>
      </form>
    </GlassCard>
  )
}

