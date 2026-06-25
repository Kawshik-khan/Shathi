"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { memorySchema, type MemoryFormData } from '@/lib/schemas/settingsSchema'

export default function MemoryWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit, watch } = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      memoryRetention: store.memoryRetention,
      emotionalMemory: store.emotionalMemory,
      longTermPersonalization: store.longTermPersonalization,
    },
  })

  const memoryRetention = watch('memoryRetention')

  const onSubmit = (data: MemoryFormData) => {
    store.updateMemory(data)
  }

  return (
    <GlassCard delay={0.2} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="AI memory settings">
        <h3 className="font-medium text-lg mb-3">AI Memory Settings</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="retention" className="font-medium">
                Memory Retention
              </label>
              <span className="text-sm text-slate-500" aria-live="polite">
                {memoryRetention === 50 ? 'Balanced' : memoryRetention < 50 ? 'Short-term' : 'Long-term'}
              </span>
            </div>
            <input
              id="retention"
              type="range"
              min={0}
              max={100}
              {...register('memoryRetention', { valueAsNumber: true })}
              aria-label="Memory retention balance from short-term to long-term"
              className="w-full"
            />
            <p className="text-xs text-slate-400 mt-1">Short-term ← → Long-term</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="emotionalMem" className="font-medium">
                Emotional Memory
              </label>
              <p className="text-sm text-slate-500">Keep emotional highlights</p>
            </div>
            <input
              id="emotionalMem"
              type="checkbox"
              {...register('emotionalMemory')}
              aria-label="Enable emotional memory"
            />
          </div>
        </div>
        <button type="submit" className="mt-4 rounded-full bg-[#5F9DB0] px-4 py-2 text-sm font-medium text-white hover:bg-[#4da857]">
          Save
        </button>
      </form>
    </GlassCard>
  )
}

