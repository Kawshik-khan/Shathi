"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { connectedAppsSchema, type ConnectedAppsFormData } from '@/lib/schemas/settingsSchema'

export default function ConnectedAppsWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit } = useForm<ConnectedAppsFormData>({
    resolver: zodResolver(connectedAppsSchema),
    defaultValues: store.connectedApps,
  })

  const onSubmit = (data: ConnectedAppsFormData) => {
    store.updateConnectedApps(data)
  }

  const appsList = [
    { key: 'appleHealth' as const, name: 'Apple Health', description: 'Health tracking' },
    { key: 'googleFit' as const, name: 'Google Fit', description: 'Fitness integration' },
    { key: 'fitbit' as const, name: 'Fitbit', description: 'Wearable data' },
    { key: 'notion' as const, name: 'Notion', description: 'Personal workspace' },
  ]

  return (
    <GlassCard delay={0.18} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Connected apps">
        <h3 className="font-medium text-lg mb-3">Connected Apps</h3>
        <div className="space-y-3">
          {appsList.map(({ key, name, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/40 flex items-center justify-center text-xs font-semibold">
                  {name[0]}
                </div>
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-slate-500">{description}</div>
                </div>
              </div>
              <div>
                <input
                  type="checkbox"
                  {...register(key)}
                  aria-label={`Connect ${name}`}
                  className="toggle"
                />
              </div>
            </div>
          ))}
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5DBB63] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

