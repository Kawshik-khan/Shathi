"use client"
import React, { useEffect } from 'react'
import ProfileWidget from './widgets/ProfileWidget'
import AIPersonalityWidget from './widgets/AIPersonalityWidget'
import ThemeWidget from './widgets/ThemeWidget'
import WellnessWidget from './widgets/WellnessWidget'
import NotificationsWidget from './widgets/NotificationsWidget'
import PrivacyWidget from './widgets/PrivacyWidget'
import ConnectedAppsWidget from './widgets/ConnectedAppsWidget'
import MemoryWidget from './widgets/MemoryWidget'
import SecurityWidget from './widgets/SecurityWidget'
import { useSettingsStore } from '@/lib/stores/settingsStore'

export default function SettingsGrid() {
  const { isSaving, lastError, loadSettings } = useSettingsStore()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  return (
    <div>
      {(isSaving || lastError) && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
          lastError
            ? 'border border-red-200 bg-red-50 text-red-600'
            : 'border border-[#A7F3A0]/60 bg-[#F3FAF4] text-[#22C55E]'
        }`}>
          {lastError || 'Saving settings...'}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <ProfileWidget />
        </div>

        <div className="space-y-6">
          <AIPersonalityWidget />
          <ThemeWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WellnessWidget />
        <NotificationsWidget />
        <PrivacyWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <ConnectedAppsWidget />
        <MemoryWidget />
        <SecurityWidget />
      </div>
    </div>
  )
}

