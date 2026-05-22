'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { getUserProfile, updateUserProfile, UserProfileResponse } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AuthUser } from '@/types';
import { Camera, HeartHandshake, Loader2, Save, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const wellnessGoalOptions = [
  { key: 'stress', label: 'Reduce stress' },
  { key: 'sleep', label: 'Improve sleep' },
  { key: 'mood', label: 'Track mood' },
  { key: 'mindfulness', label: 'Practice mindfulness' },
  { key: 'fitness', label: 'Stay active' },
  { key: 'journaling', label: 'Journal regularly' },
];

interface ProfileFormState {
  name: string;
  avatar_url: string;
  language: 'en' | 'bn';
  bio: string;
  timezone: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  wellness_goals: Record<string, boolean>;
  preferred_support_style: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const emptyProfile: ProfileFormState = {
  name: '',
  avatar_url: '',
  language: 'en',
  bio: '',
  timezone: 'Asia/Dhaka',
  phone: '',
  date_of_birth: '',
  gender: '',
  wellness_goals: {},
  preferred_support_style: 'gentle',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

function toFormState(profile: UserProfileResponse): ProfileFormState {
  const wellnessGoals = Object.fromEntries(
    Object.entries(profile.wellness_goals ?? {}).map(([key, value]) => [key, Boolean(value)])
  );

  return {
    name: profile.name,
    avatar_url: profile.avatar_url ?? '',
    language: profile.language,
    bio: profile.bio ?? '',
    timezone: profile.timezone || 'Asia/Dhaka',
    phone: profile.phone ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    gender: profile.gender ?? '',
    wellness_goals: wellnessGoals,
    preferred_support_style: profile.preferred_support_style ?? 'gentle',
    emergency_contact_name: profile.emergency_contact_name ?? '',
    emergency_contact_phone: profile.emergency_contact_phone ?? '',
  };
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <ProfileContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const setAuthUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [form, setForm] = useState<ProfileFormState>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await getUserProfile();
        if (cancelled) return;
        setProfile(response);
        setForm(toFormState(response));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load profile');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGoal = (key: string) => {
    setForm((prev) => ({
      ...prev,
      wellness_goals: {
        ...prev.wellness_goals,
        [key]: !prev.wellness_goals[key],
      },
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedMessage(null);

    try {
      const updated = await updateUserProfile({
        name: form.name.trim(),
        avatar_url: form.avatar_url.trim() || null,
        language: form.language,
        bio: form.bio.trim() || null,
        timezone: form.timezone.trim() || 'Asia/Dhaka',
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        wellness_goals: form.wellness_goals,
        preferred_support_style: form.preferred_support_style || null,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
      });

      setProfile(updated);
      setForm(toFormState(updated));
      const nextAuthUser: AuthUser = {
        id: currentUser?.id ?? updated.user_id,
        email: updated.email,
        name: updated.name,
        avatar_url: updated.avatar_url ?? undefined,
        language: updated.language,
        family_id: currentUser?.family_id ?? null,
        family_role: currentUser?.family_role ?? null,
        system_role: currentUser?.system_role,
        plan: currentUser?.plan ?? 'free',
        subscription_status: currentUser?.subscription_status,
        subscription_started_at: currentUser?.subscription_started_at,
        subscription_ends_at: currentUser?.subscription_ends_at,
      };
      setAuthUser(nextAuthUser);
      setSavedMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and wellness preferences.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {savedMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      <GlassCard delay={0.05}>
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Basic Info</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#A7F3A0] to-[#22C55E] flex items-center justify-center overflow-hidden text-white text-3xl font-semibold">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                form.name.charAt(0).toUpperCase() || 'U'
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">Display name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  value={profile?.email ?? ''}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-black/10 text-muted-foreground"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Avatar URL</span>
                <input
                  value={form.avatar_url}
                  onChange={(event) => updateField('avatar_url', event.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Language</span>
                <select
                  value={form.language}
                  onChange={(event) => updateField('language', event.target.value as 'en' | 'bn')}
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                >
                  <option value="en">English</option>
                  <option value="bn">Bangla</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 resize-none"
                />
              </label>
            </div>
          </div>
        </section>
      </GlassCard>

      <GlassCard delay={0.1}>
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <HeartHandshake className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Wellness Preferences</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Timezone</span>
              <input
                value={form.timezone}
                onChange={(event) => updateField('timezone', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Date of birth</span>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(event) => updateField('date_of_birth', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Gender</span>
              <select
                value={form.gender}
                onChange={(event) => updateField('gender', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1 md:col-span-3">
              <span className="text-sm font-medium">Preferred support style</span>
              <select
                value={form.preferred_support_style}
                onChange={(event) => updateField('preferred_support_style', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              >
                <option value="gentle">Gentle and reassuring</option>
                <option value="practical">Practical and action-focused</option>
                <option value="reflective">Reflective and exploratory</option>
                <option value="motivational">Motivational</option>
              </select>
            </label>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Wellness goals</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {wellnessGoalOptions.map((goal) => (
                <label
                  key={goal.key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-black/5"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.wellness_goals[goal.key])}
                    onChange={() => toggleGoal(goal.key)}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
      </GlassCard>

      <GlassCard delay={0.15}>
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#22C55E]" />
            <h2 className="text-lg font-semibold">Emergency Contact</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Contact name</span>
              <input
                value={form.emergency_contact_name}
                onChange={(event) => updateField('emergency_contact_name', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Contact phone</span>
              <input
                value={form.emergency_contact_phone}
                onChange={(event) => updateField('emergency_contact_phone', event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
              />
            </label>
          </div>
        </section>
      </GlassCard>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#22C55E] text-white text-sm font-medium hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </button>
      </div>
    </form>
  );
}
