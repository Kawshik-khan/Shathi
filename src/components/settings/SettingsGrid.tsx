"use client"
import React from 'react'
import { GlassCard } from '@/components/shared/glass-card'
import ProfileWidget from './widgets/ProfileWidget'
import AIPersonalityWidget from './widgets/AIPersonalityWidget'
import ThemeWidget from './widgets/ThemeWidget'
import WellnessWidget from './widgets/WellnessWidget'
import NotificationsWidget from './widgets/NotificationsWidget'
import PrivacyWidget from './widgets/PrivacyWidget'
import ConnectedAppsWidget from './widgets/ConnectedAppsWidget'
import MemoryWidget from './widgets/MemoryWidget'
import SecurityWidget from './widgets/SecurityWidget'

export default function SettingsGrid() {
  return (
    <div>
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

