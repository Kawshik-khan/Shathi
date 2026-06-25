"use client"
import React, { useState } from 'react'

const sections = [
  { id: 'account', label: 'Account' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'wellness', label: 'Wellness' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'security', label: 'Security' },
  { id: 'connected', label: 'Connected Apps' },
]

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState<string>('account')

  return (
    <nav aria-label="Settings sections" className="glass-card p-4 sticky top-20">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-slate-500">Personalize your Shathi experience</p>
      </div>

      <ul className="space-y-2" role="list">
        {sections.map((s) => {
          const isActive = activeSection === s.id
          const baseClass = 'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3'
          const bgClass = isActive ? 'bg-[#E3F0F3] text-[#0F172A]' : 'hover:bg-white/40'

          return (
            <li key={s.id} role="listitem">
              <button
                onClick={() => setActiveSection(s.id)}
                className={`${baseClass} ${bgClass}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Navigate to ${s.label} settings`}
              >
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isActive ? 'bg-[#4A90A4]' : 'bg-[#E3F0F3]'
                  }`}
                  aria-hidden="true"
                />
                <span className="flex-1">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

