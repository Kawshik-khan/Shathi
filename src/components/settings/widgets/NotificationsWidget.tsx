"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { notificationsSchema, type NotificationsFormData } from '@/lib/schemas/settingsSchema'

export default function NotificationsWidget() {
  const store = useSettingsStore()
  const { register, handleSubmit } = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emotionalCheckIns: store.emotionalCheckIns,
      reminderFrequency: store.reminderFrequency,
      bedtimeReminders: store.bedtimeReminders,
      journalingPrompts: store.journalingPrompts,
      motivationalNudges: store.motivationalNudges,
    },
  })

  const onSubmit = (data: NotificationsFormData) => {
    store.updateNotifications(data)
  }

  return (
    <GlassCard delay={0.14} className="h-full">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Notification preferences">
        <h3 className="font-medium text-lg mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="checkIns" className="font-medium">
                Emotional check-ins
              </label>
              <p className="text-sm text-slate-500">Gentle prompts to check in</p>
            </div>
            <input
              id="checkIns"
              type="checkbox"
              {...register('emotionalCheckIns')}
              aria-label="Enable emotional check-ins"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="bedtime" className="font-medium">
                Bedtime reminders
              </label>
              <p className="text-sm text-slate-500">Quiet reminders to wind down</p>
            </div>
            <input
              id="bedtime"
              type="checkbox"
              {...register('bedtimeReminders')}
              aria-label="Enable bedtime reminders"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="journal" className="font-medium">
                Journaling prompts
              </label>
              <p className="text-sm text-slate-500">Suggestions for journaling</p>
            </div>
            <input
              id="journal"
              type="checkbox"
              {...register('journalingPrompts')}
              aria-label="Enable journaling prompts"
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

