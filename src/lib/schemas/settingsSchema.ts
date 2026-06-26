import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name must be under 100 characters'),
  email: z.string().email('Invalid email address'),
  timezone: z.string().min(1, 'Timezone is required'),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
})

export const personalitySchema = z.object({
  personalityMode: z.enum(['calm_therapist', 'supportive_friend', 'motivational_coach', 'minimal_advisor']),
  responseLength: z.number().min(20).max(100),
  emotionalWarmth: z.number().min(0).max(100),
  conversationDepth: z.number().min(0).max(100),
  motivationalTone: z.number().min(0).max(100),
})

export const themeSchema = z.object({
  theme: z.enum(['light', 'dark', 'adaptive']),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),
  fontSize: z.number().min(12).max(24),
  motionEnabled: z.boolean(),
  density: z.enum(['comfortable', 'compact']),
  highContrast: z.boolean(),
})

export const wellnessSchema = z.object({
  sleepGoal: z.number().min(4).max(10),
  hydrationReminders: z.boolean(),
  mindfulnessGoal: z.boolean(),
  workoutGoal: z.number().min(0).max(7),
  journalingFrequency: z.enum(['daily', 'weekly', 'monthly']),
})

export const notificationsSchema = z.object({
  emotionalCheckIns: z.boolean(),
  reminderFrequency: z.enum(['low', 'medium', 'high']),
  bedtimeReminders: z.boolean(),
  journalingPrompts: z.boolean(),
  motivationalNudges: z.boolean(),
})

export const privacySchema = z.object({
  aiMemoryEnabled: z.boolean(),
  dataExportSchedule: z.enum(['weekly', 'monthly', 'never']),
})

export const connectedAppsSchema = z.object({
  appleHealth: z.boolean(),
  googleFit: z.boolean(),
  fitbit: z.boolean(),
  notion: z.boolean(),
})

export const memorySchema = z.object({
  memoryRetention: z.number().min(0).max(100),
  emotionalMemory: z.boolean(),
  longTermPersonalization: z.boolean(),
})

export const securitySchema = z.object({
  twoFactorEnabled: z.boolean(),
  biometricLogin: z.boolean(),
})

export const fullSettingsSchema = z.object({
  profile: profileSchema,
  personality: personalitySchema,
  theme: themeSchema,
  wellness: wellnessSchema,
  notifications: notificationsSchema,
  privacy: privacySchema,
  connectedApps: connectedAppsSchema,
  memory: memorySchema,
  security: securitySchema,
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type PersonalityFormData = z.infer<typeof personalitySchema>
export type ThemeFormData = z.infer<typeof themeSchema>
export type WellnessFormData = z.infer<typeof wellnessSchema>
export type NotificationsFormData = z.infer<typeof notificationsSchema>
export type PrivacyFormData = z.infer<typeof privacySchema>
export type ConnectedAppsFormData = z.infer<typeof connectedAppsSchema>
export type MemoryFormData = z.infer<typeof memorySchema>
export type SecurityFormData = z.infer<typeof securitySchema>
export type FullSettingsFormData = z.infer<typeof fullSettingsSchema>

