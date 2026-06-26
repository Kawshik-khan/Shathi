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
import AvatarWidget from './widgets/AvatarWidget'
import AccountWidget from './widgets/AccountWidget'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import { BentoGrid, BentoCard } from '@/components/shared/bento-grid'

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
            : 'border border-[#A8D0D9]/60 bg-[#F1F5F7] text-[#4A90A4]'
        }`}>
          {lastError || 'Saving settings...'}
        </div>
      )}

      <BentoGrid className="gap-6 mb-6">
        <BentoCard colSpan={8} smColSpan={2} glowOnHover={false} delay={0.05}>
          <ProfileWidget />
        </BentoCard>

        <BentoCard colSpan={4} smColSpan={2} glowOnHover={false} delay={0.1} className="space-y-6">
          <AIPersonalityWidget />
          <ThemeWidget />
        </BentoCard>
      </BentoGrid>

      <BentoGrid className="gap-6">
        <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} delay={0.15}>
          <WellnessWidget />
        </BentoCard>
        <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} delay={0.2}>
          <NotificationsWidget />
        </BentoCard>
        <BentoCard colSpan={4} smColSpan={2} glowOnHover={false} delay={0.25}>
          <PrivacyWidget />
        </BentoCard>
      </BentoGrid>

      <BentoGrid className="gap-6 mt-6">
        <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} delay={0.3}>
          <ConnectedAppsWidget />
        </BentoCard>
        <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} delay={0.35}>
          <MemoryWidget />
        </BentoCard>
        <BentoCard colSpan={4} smColSpan={2} glowOnHover={false} delay={0.4}>
          <SecurityWidget />
        </BentoCard>
      </BentoGrid>

      <BentoGrid className="gap-6 mt-6">
        <BentoCard colSpan={4} smColSpan={1} glowOnHover={false} delay={0.45}>
          <AvatarWidget />
        </BentoCard>
        <BentoCard colSpan={8} smColSpan={2} glowOnHover={false} delay={0.5}>
          <AccountWidget />
        </BentoCard>
      </BentoGrid>
    </div>
  )
}

