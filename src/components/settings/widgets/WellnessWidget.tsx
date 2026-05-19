"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { wellnessSchema, type WellnessFormData } from '@/lib/schemas/settingsSchema'

export default function WellnessWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit, watch, setValue } = useForm<WellnessFormData>({
    resolver: zodResolver(wellnessSchema),
    defaultValues: {
      sleepGoal: store.sleepGoal,
      hydrationReminders: store.hydrationReminders,
      mindfulnessGoal: store.mindfulnessGoal,
      workoutGoal: store.workoutGoal,
      journalingFrequency: store.journalingFrequency,
    },
  })

  const sleepGoal = watch('sleepGoal')
  const hydrationReminders = watch('hydrationReminders')

  const onSubmit = (data: WellnessFormData) => {
    store.updateWellness(data)
  }

  return (
    <GlassCard delay={0.12} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Wellness goals">
        <h3 className="font-medium text-lg mb-3">Wellness Goals</h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sleep" className="text-sm text-slate-600">
                Sleep goal (hrs)
              </label>
              <span className="text-sm font-medium" aria-live="polite">
                {sleepGoal}h
              </span>
            </div>
            <input
              id="sleep"
              type="range"
              min={4}
              max={10}
              {...register('sleepGoal', { valueAsNumber: true })}
              className="w-full"
              aria-label="Sleep goal in hours"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-2 block">Hydration reminders</label>
            <fieldset className="flex items-center gap-3">
              <legend className="sr-only">Hydration reminders</legend>
              <button
                type="button"
                onClick={() => setValue('hydrationReminders', true, { shouldDirty: true })}
                className={`px-3 py-1 rounded-full transition-colors ${
                  hydrationReminders ? 'bg-white/60' : 'bg-white/10 hover:bg-white/30'
                }`}
                aria-pressed={hydrationReminders}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => setValue('hydrationReminders', false, { shouldDirty: true })}
                className={`px-3 py-1 rounded-full transition-colors ${
                  !hydrationReminders ? 'bg-white/60' : 'bg-white/10 hover:bg-white/30'
                }`}
                aria-pressed={!hydrationReminders}
              >
                Off
              </button>
            </fieldset>
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5DBB63] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

