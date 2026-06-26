import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { getAuthToken, getUserSettings, updateUserSettings } from '@/lib/api'

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
  density: 'comfortable' | 'compact'
  highContrast: boolean
  
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
  isLoaded: boolean
  isSaving: boolean
  lastError: string | null
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  updateProfile: (profile: Partial<Pick<SettingsState, 'displayName' | 'email' | 'timezone' | 'bio'>>) => void
  updatePersonality: (personality: Partial<Pick<SettingsState, 'personalityMode' | 'responseLength' | 'emotionalWarmth' | 'conversationDepth' | 'motivationalTone'>>) => void
  updateTheme: (theme: Partial<Pick<SettingsState, 'theme' | 'accentColor' | 'fontSize' | 'motionEnabled' | 'density' | 'highContrast'>>) => void
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
  timezone: 'Asia/Dhaka',
  bio: 'Calm-seeking explorer',
  
  personalityMode: 'calm_therapist',
  responseLength: 60,
  emotionalWarmth: 60,
  conversationDepth: 70,
  motivationalTone: 50,
  
  theme: 'adaptive',
  accentColor: '#4A90A4',
  fontSize: 16,
  motionEnabled: true,
  density: 'comfortable',
  highContrast: false,
  
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

function selectSettings(state: SettingsStore): SettingsState {
  return {
    displayName: state.displayName,
    email: state.email,
    timezone: state.timezone,
    bio: state.bio,
    personalityMode: state.personalityMode,
    responseLength: state.responseLength,
    emotionalWarmth: state.emotionalWarmth,
    conversationDepth: state.conversationDepth,
    motivationalTone: state.motivationalTone,
    theme: state.theme,
    accentColor: state.accentColor,
    fontSize: state.fontSize,
    motionEnabled: state.motionEnabled,
    density: state.density,
    highContrast: state.highContrast,
    sleepGoal: state.sleepGoal,
    hydrationReminders: state.hydrationReminders,
    mindfulnessGoal: state.mindfulnessGoal,
    workoutGoal: state.workoutGoal,
    journalingFrequency: state.journalingFrequency,
    emotionalCheckIns: state.emotionalCheckIns,
    reminderFrequency: state.reminderFrequency,
    bedtimeReminders: state.bedtimeReminders,
    journalingPrompts: state.journalingPrompts,
    motivationalNudges: state.motivationalNudges,
    aiMemoryEnabled: state.aiMemoryEnabled,
    dataExportSchedule: state.dataExportSchedule,
    connectedApps: state.connectedApps,
    memoryRetention: state.memoryRetention,
    emotionalMemory: state.emotionalMemory,
    longTermPersonalization: state.longTermPersonalization,
    twoFactorEnabled: state.twoFactorEnabled,
    biometricLogin: state.biometricLogin,
  }
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        isLoaded: false,
        isSaving: false,
        lastError: null,

        loadSettings: async () => {
          if (!getAuthToken()) return

          set({ lastError: null }, false, 'loadSettings:start')
          try {
            const response = await getUserSettings()
            set(
              {
                ...defaultState,
                ...response.settings,
                isLoaded: true,
                lastError: null,
              } as Partial<SettingsStore>,
              false,
              'loadSettings:success'
            )
          } catch (error) {
            set(
              {
                isLoaded: true,
                lastError: error instanceof Error ? error.message : 'Unable to load settings',
              },
              false,
              'loadSettings:error'
            )
          }
        },

        saveSettings: async () => {
          if (!getAuthToken()) return

          set({ isSaving: true, lastError: null }, false, 'saveSettings:start')
          try {
            await updateUserSettings(selectSettings(get()) as unknown as Record<string, unknown>)
            set({ isSaving: false, lastError: null }, false, 'saveSettings:success')
          } catch (error) {
            set(
              {
                isSaving: false,
                lastError: error instanceof Error ? error.message : 'Unable to save settings',
              },
              false,
              'saveSettings:error'
            )
          }
        },
        
        updateProfile: (profile) =>
          {
            set((state) => ({ ...state, ...profile }), false, 'updateProfile')
            void get().saveSettings()
          },
        
        updatePersonality: (personality) =>
          {
            set((state) => ({ ...state, ...personality }), false, 'updatePersonality')
            void get().saveSettings()
          },
        
        updateTheme: (theme) =>
          {
            set((state) => ({ ...state, ...theme }), false, 'updateTheme')
            void get().saveSettings()
          },
        
        updateWellness: (wellness) =>
          {
            set((state) => ({ ...state, ...wellness }), false, 'updateWellness')
            void get().saveSettings()
          },
        
        updateNotifications: (notif) =>
          {
            set((state) => ({ ...state, ...notif }), false, 'updateNotifications')
            void get().saveSettings()
          },
        
        updatePrivacy: (privacy) =>
          {
            set((state) => ({ ...state, ...privacy }), false, 'updatePrivacy')
            void get().saveSettings()
          },
        
        updateConnectedApps: (apps) =>
          {
            set((state) => ({
              ...state,
              connectedApps: { ...state.connectedApps, ...apps }
            }), false, 'updateConnectedApps')
            void get().saveSettings()
          },
        
        updateMemory: (memory) =>
          {
            set((state) => ({ ...state, ...memory }), false, 'updateMemory')
            void get().saveSettings()
          },
        
        updateSecurity: (security) =>
          {
            set((state) => ({ ...state, ...security }), false, 'updateSecurity')
            void get().saveSettings()
          },
        
        reset: () => set(defaultState, false, 'reset'),
      }),
      {
        name: 'Sathi-settings',
      }
    )
  )
)

