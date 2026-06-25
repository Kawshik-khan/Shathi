"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GlassCard } from '@/components/shared/glass-card'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { profileSchema, type ProfileFormData } from '@/lib/schemas/settingsSchema'

export default function ProfileWidget() {
  const [isEditing, setIsEditing] = useState(false)
  const store = useSettingsStore()
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: store.displayName,
      email: store.email,
      timezone: store.timezone,
      bio: store.bio,
    },
  })

  const displayName = watch('displayName')

  const onSubmit = (data: ProfileFormData) => {
    store.updateProfile(data)
    setIsEditing(false)
  }

  return (
    <GlassCard delay={0.05} className="">
      <form onSubmit={handleSubmit(onSubmit)} aria-label="Profile settings">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E3F0F3] to-[#E9FBEE] flex items-center justify-center">
            <span className="text-xl font-semibold text-[#0F172A]" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
          </div>

          {isEditing ? (
            <div className="flex-1 space-y-3">
              <div>
                <input
                  {...register('displayName')}
                  placeholder="Display name"
                  className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]"
                  aria-label="Display name"
                />
                {errors.displayName && <p className="text-sm text-red-500">{errors.displayName.message}</p>}
              </div>

              <div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]"
                  aria-label="Email address"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <input
                  {...register('timezone')}
                  placeholder="Timezone"
                  className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A90A4]"
                  aria-label="Timezone"
                />
                {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
              </div>

              <div>
                <textarea
                  {...register('bio')}
                  placeholder="Bio (optional)"
                  className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A90A4] resize-none"
                  aria-label="Bio"
                  rows={2}
                />
                {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#5F9DB0] text-white hover:bg-[#4da857] transition-colors"
                  aria-label="Save profile changes"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-full bg-white/60 hover:bg-white/80 transition-colors"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{displayName}</h3>
                  <p className="text-sm text-slate-500">{store.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-full bg-[#5F9DB0] text-white hover:bg-[#4da857] transition-colors"
                  aria-label="Edit profile"
                >
                  Edit
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-500">Timezone: {store.timezone} — Bio: {store.bio || 'Not set'}</p>
            </div>
          )}
        </div>
      </form>
    </GlassCard>
  )
}

