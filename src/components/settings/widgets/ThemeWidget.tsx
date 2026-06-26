"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { themeSchema, type ThemeFormData } from '@/lib/schemas/settingsSchema'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export default function ThemeWidget() {
  const store = useSettingsStore()
  const { t } = useTranslation()
  const { register, handleSubmit, watch, setValue } = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: store.theme,
      accentColor: store.accentColor,
      fontSize: store.fontSize,
      motionEnabled: store.motionEnabled,
      density: store.density,
      highContrast: store.highContrast,
    },
  })

  const theme = watch('theme')
  const motionEnabled = watch('motionEnabled')
  const density = watch('density')
  const highContrast = watch('highContrast')
  const fontSize = watch('fontSize')

  const onSubmit = (data: ThemeFormData) => {
    store.updateTheme(data)
  }

  const toggleDensity = () => {
    const next = density === 'compact' ? 'comfortable' : 'compact'
    setValue('density', next, { shouldDirty: true })
    store.updateTheme({ density: next })
  }

  const toggleHighContrast = () => {
    const next = !highContrast
    setValue('highContrast', next, { shouldDirty: true })
    store.updateTheme({ highContrast: next })
  }

  const toggleMotion = () => {
    const next = !motionEnabled
    setValue('motionEnabled', next, { shouldDirty: true })
    store.updateTheme({ motionEnabled: next })
  }

  return (
    <GlassCard delay={0.1} className="">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Theme and appearance settings">
        <h3 className="mb-3 text-lg font-medium">Theme & Appearance</h3>
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-base font-medium">Theme</legend>
            <div className="flex gap-2">
              {[
                { value: 'light' as const, label: 'Light' },
                { value: 'dark' as const, label: 'Dark' },
                { value: 'adaptive' as const, label: 'Adaptive' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('theme', value, { shouldDirty: true })}
                  className={cn(
                    'touch-target btn-haptic flex-1 rounded-xl py-2.5 text-base transition-colors',
                    theme === value ? 'bg-white/60 font-semibold' : 'bg-white/10 hover:bg-white/30',
                  )}
                  aria-pressed={theme === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3 border-t border-border pt-3">
            <p className="text-base font-medium">Display</p>

            <div className="density-list-row flex min-h-14 items-center justify-between gap-3">
              <label htmlFor="fontSize" className="text-base text-foreground">
                {t('mobile.textSize', 'Text size')}
              </label>
              <input
                id="fontSize"
                type="range"
                min={14}
                max={20}
                step={1}
                {...register('fontSize', { valueAsNumber: true })}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setValue('fontSize', val, { shouldDirty: true })
                  store.updateTheme({ fontSize: val })
                }}
                className="w-32 touch-target"
                aria-valuenow={fontSize}
              />
            </div>

            <button
              type="button"
              onClick={toggleMotion}
              className="density-list-row focus-ring btn-haptic flex min-h-14 w-full items-center justify-between rounded-xl px-1 touch-target"
              aria-pressed={motionEnabled}
            >
              <span className="text-base">Reduced motion</span>
              <span className={cn('text-sm font-semibold', motionEnabled ? 'text-muted-foreground' : 'text-[#4A90A4]')}>
                {motionEnabled ? 'Off' : 'On'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleHighContrast}
              className="density-list-row focus-ring btn-haptic flex min-h-14 w-full items-center justify-between rounded-xl px-1 touch-target"
              aria-pressed={highContrast}
            >
              <span className="text-base">{t('mobile.highContrast', 'High contrast')}</span>
              <span className={cn('text-sm font-semibold', highContrast ? 'text-[#4A90A4]' : 'text-muted-foreground')}>
                {highContrast ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleDensity}
              className="density-list-row focus-ring btn-haptic flex min-h-14 w-full items-center justify-between rounded-xl px-1 touch-target"
              aria-pressed={density === 'compact'}
            >
              <span className="text-base">{t('mobile.density', 'Display density')}</span>
              <span className="text-sm font-semibold text-[#4A90A4]">
                {density === 'compact'
                  ? t('mobile.densityCompact', 'Compact')
                  : t('mobile.densityComfortable', 'Comfortable')}
              </span>
            </button>
          </div>

          <input type="hidden" {...register('motionEnabled')} />
          <input type="hidden" {...register('density')} />
          <input type="hidden" {...register('highContrast')} />

          <p className="text-sm text-muted-foreground">
            {motionEnabled ? 'Motion enabled' : 'Reduced motion preference saved'}
          </p>
        </div>
        <button
          type="submit"
          className="btn-haptic touch-target mt-4 rounded-full bg-[#5F9DB0] px-5 py-3 text-base font-medium text-white hover:bg-[#4A90A4]"
        >
          Save
        </button>
      </form>
    </GlassCard>
  )
}
