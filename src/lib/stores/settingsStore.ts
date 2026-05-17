import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface SettingsState {
  // Profile
  displayName: string
  email: string
  timezone: string
  bio: string
  
  // AI Personality
  personalityMode: 'calm_therapist' | 'supportive_friend' | 'motivational_coach' | 'minimal_advisor'
  responseLength: number
  emotionalWarmth: number
  conversationDepth: number
  motivationalTone: number
  
  // Theme & Appearance
  theme: 'light' | 'dark' | 'adaptive'
  accentColor: string
  fontSize: number
  motionEnabled: boolean
  
  // Wellness Goals
  sleepGoal: number
  hydrationReminders: boolean
  mindfulnessGoal: boolean
  workoutGoal: number
  journalingFrequency: 'daily' | 'weekly' | 'monthly'
  
  // Notifications
  emotionalCheckIns: boolean
  reminderFrequency: 'low' | 'medium' | 'high'
  bedtimeReminders: boolean
  journalingPrompts: boolean
  motivationalNudges: boolean
  
  // Privacy & Data
  aiMemoryEnabled: boolean
  dataExportSchedule: 'weekly' | 'monthly' | 'never'
  
  // Connected Apps
  connectedApps: {
    appleHealth: boolean
    googleFit: boolean
    fitbit: boolean
    notion: boolean
  }
  
  // AI Memory Settings
  memoryRetention: number
  emotionalMemory: boolean
  longTermPersonalization: boolean
  
  // Security
  twoFactorEnabled: boolean
  biometricLogin: boolean
}

export interface SettingsStore extends SettingsState {
  updateProfile: (profile: Partial<Pick<SettingsState, 'displayName' | 'email' | 'timezone' | 'bio'>>) => void
  updatePersonality: (personality: Partial<Pick<SettingsState, 'personalityMode' | 'responseLength' | 'emotionalWarmth' | 'conversationDepth' | 'motivationalTone'>>) => void
  updateTheme: (theme: Partial<Pick<SettingsState, 'theme' | 'accentColor' | 'fontSize' | 'motionEnabled'>>) => void
  updateWellness: (wellness: Partial<Pick<SettingsState, 'sleepGoal' | 'hydrationReminders' | 'mindfulnessGoal' | 'workoutGoal' | 'journalingFrequency'>>) => void
  updateNotifications: (notif: Partial<Pick<SettingsState, 'emotionalCheckIns' | 'reminderFrequency' | 'bedtimeReminders' | 'journalingPrompts' | 'motivationalNudges'>>) => void
  updatePrivacy: (privacy: Partial<Pick<SettingsState, 'aiMemoryEnabled' | 'dataExportSchedule'>>) => void
  updateConnectedApps: (apps: Partial<SettingsState['connectedApps']>) => void
  updateMemory: (memory: Partial<Pick<SettingsState, 'memoryRetention' | 'emotionalMemory' | 'longTermPersonalization'>>) => void
  updateSecurity: (security: Partial<Pick<SettingsState, 'twoFactorEnabled' | 'biometricLogin'>>) => void
  reset: () => void
}

const defaultState: SettingsState = {
  displayName: 'Alex Morgan',
  email: 'alex@Sathi.example',
  timezone: 'America/Los_Angeles',
  bio: 'Calm-seeking explorer',
  
  personalityMode: 'calm_therapist',
  responseLength: 60,
  emotionalWarmth: 60,
  conversationDepth: 70,
  motivationalTone: 50,
  
  theme: 'adaptive',
  accentColor: '#22C55E',
  fontSize: 16,
  motionEnabled: true,
  
  sleepGoal: 8,
  hydrationReminders: true,
  mindfulnessGoal: true,
  workoutGoal: 3,
  journalingFrequency: 'daily',
  
  emotionalCheckIns: true,
  reminderFrequency: 'medium',
  bedtimeReminders: true,
  journalingPrompts: true,
  motivationalNudges: false,
  
  aiMemoryEnabled: true,
  dataExportSchedule: 'monthly',
  
  connectedApps: {
    appleHealth: true,
    googleFit: false,
    fitbit: false,
    notion: true,
  },
  
  memoryRetention: 50,
  emotionalMemory: true,
  longTermPersonalization: true,
  
  twoFactorEnabled: true,
  biometricLogin: false,
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,
        
        updateProfile: (profile) =>
          set((state) => ({ ...state, ...profile }), false, 'updateProfile'),
        
        updatePersonality: (personality) =>
          set((state) => ({ ...state, ...personality }), false, 'updatePersonality'),
        
        updateTheme: (theme) =>
          set((state) => ({ ...state, ...theme }), false, 'updateTheme'),
        
        updateWellness: (wellness) =>
          set((state) => ({ ...state, ...wellness }), false, 'updateWellness'),
        
        updateNotifications: (notif) =>
          set((state) => ({ ...state, ...notif }), false, 'updateNotifications'),
        
        updatePrivacy: (privacy) =>
          set((state) => ({ ...state, ...privacy }), false, 'updatePrivacy'),
        
        updateConnectedApps: (apps) =>
          set((state) => ({ 
            ...state, 
            connectedApps: { ...state.connectedApps, ...apps } 
          }), false, 'updateConnectedApps'),
        
        updateMemory: (memory) =>
          set((state) => ({ ...state, ...memory }), false, 'updateMemory'),
        
        updateSecurity: (security) =>
          set((state) => ({ ...state, ...security }), false, 'updateSecurity'),
        
        reset: () => set(defaultState, false, 'reset'),
      }),
      {
        name: 'Sathi-settings',
      }
    )
  )
)

