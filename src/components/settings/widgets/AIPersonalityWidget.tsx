"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { personalitySchema, type PersonalityFormData } from '@/lib/schemas/settingsSchema'

export default function AIPersonalityWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit, watch, setValue } = useForm<PersonalityFormData>({
    resolver: zodResolver(personalitySchema),
    defaultValues: {
      personalityMode: store.personalityMode,
      responseLength: store.responseLength,
      emotionalWarmth: store.emotionalWarmth,
      conversationDepth: store.conversationDepth,
      motivationalTone: store.motivationalTone,
    },
  })

  const emotionalWarmth = watch('emotionalWarmth')
  const personalityMode = watch('personalityMode')

  const onSubmit = (data: PersonalityFormData) => {
    store.updatePersonality(data)
  }

  return (
    <GlassCard delay={0.08} className="">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="AI Personality settings">
        <h3 className="font-medium text-lg mb-3">AI Personality</h3>
        <div className="flex flex-col gap-3">
          <fieldset>
            <legend className="text-sm font-medium mb-2">Personality Mode</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'calm_therapist' as const, label: 'Calm Therapist' },
                { value: 'supportive_friend' as const, label: 'Supportive Friend' },
                { value: 'motivational_coach' as const, label: 'Motivational Coach' },
                { value: 'minimal_advisor' as const, label: 'Minimal Advisor' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('personalityMode', value, { shouldDirty: true })}
                  className={`py-2 rounded-lg transition-colors ${
                    personalityMode === value ? 'bg-white/60' : 'bg-white/10 hover:bg-white/30'
                  }`}
                  aria-pressed={personalityMode === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="warmth" className="text-sm text-slate-600">
                Emotional Warmth
              </label>
              <span className="text-sm font-medium" aria-live="polite">
                {emotionalWarmth}%
              </span>
            </div>
            <input
              id="warmth"
              type="range"
              min={0}
              max={100}
              {...register('emotionalWarmth', { valueAsNumber: true })}
              className="w-full"
              aria-label="Emotional warmth level"
            />
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5DBB63] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

