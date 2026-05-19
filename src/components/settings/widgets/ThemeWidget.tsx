"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { themeSchema, type ThemeFormData } from '@/lib/schemas/settingsSchema'

export default function ThemeWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit, watch, setValue } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: store.theme,
      accentColor: store.accentColor,
      fontSize: store.fontSize,
      motionEnabled: store.motionEnabled,
    },
  })

  const theme = watch('theme')
  const motionEnabled = watch('motionEnabled')

  const onSubmit = (data: ThemeFormData) => {
    store.updateTheme(data)
  }

  return (
    <GlassCard delay={0.1} className="">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Theme and appearance settings">
        <h3 className="font-medium text-lg mb-3">Theme & Appearance</h3>
        <div className="flex flex-col gap-3">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Theme</legend>
            <div className="flex gap-3">
              {[
                { value: 'light' as const, label: 'Light' },
                { value: 'dark' as const, label: 'Dark' },
                { value: 'adaptive' as const, label: 'Adaptive' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('theme', value, { shouldDirty: true })}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    theme === value ? 'bg-white/60' : 'bg-white/10 hover:bg-white/30'
                  }`}
                  aria-pressed={theme === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center justify-between">
            <label htmlFor="motion" className="text-sm text-slate-600">
              Motion & Animations
            </label>
            <input
              id="motion"
              type="checkbox"
              {...register('motionEnabled')}
              className="toggle"
              aria-label="Enable animations and motion effects"
            />
          </div>
          <p className="text-xs text-slate-500">{motionEnabled ? 'Motion enabled' : 'Reduced motion preference saved'}</p>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5DBB63] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

