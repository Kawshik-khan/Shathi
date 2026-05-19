'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  completeHabit,
  createHabit,
  deleteHabit,
  getHabits,
  updateHabit,
  type Habit,
  type HabitCreate,
} from '@/lib/api';
import {
  Check,
  CheckCircle2,
  Dumbbell,
  Edit3,
  Flame,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const iconOptions = ['sparkles', 'dumbbell', 'moon', 'flame'];
const colorOptions = ['#22C55E', '#7ED957', '#A7F3A0', '#16A34A'];

const iconMap = {
  sparkles: Sparkles,
  meditation: Sparkles,
  workout: Dumbbell,
  dumbbell: Dumbbell,
  sleep: Moon,
  moon: Moon,
  flame: Flame,
};

const emptyForm: HabitCreate = {
  name: '',
  description: '',
  icon: 'sparkles',
  color: '#22C55E',
  frequency: 'daily',
  target_count: 1,
};

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitCreate>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadHabits() {
    setLoading(true);
    setError('');

    try {
      setHabits(await getHabits());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load habits.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    getHabits()
      .then((nextHabits) => {
        if (mounted) setHabits(nextHabits);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load habits.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalCompletions = useMemo(
    () => habits.reduce((sum, habit) => sum + habit.total_completions, 0),
    [habits]
  );

  function openCreateDialog() {
    setEditingHabit(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(habit: Habit) {
    setEditingHabit(habit);
    setForm({
      name: habit.name,
      description: habit.description ?? '',
      icon: habit.icon ?? 'sparkles',
      color: habit.color ?? '#22C55E',
      frequency: habit.frequency,
      target_count: habit.target_count,
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
      };

      if (editingHabit) {
        await updateHabit(editingHabit.id, payload);
        setSuccess('Habit updated.');
      } else {
        await createHabit(payload);
        setSuccess('Habit created.');
      }

      setDialogOpen(false);
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save habit.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(habitId: string) {
    setError('');
    setSuccess('');

    try {
      await completeHabit(habitId);
      setSuccess('Habit completed for today.');
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete habit.');
    }
  }

  async function handleDelete(habit: Habit) {
    if (!window.confirm(`Delete "${habit.name}"?`)) return;

    setError('');
    setSuccess('');

    try {
      await deleteHabit(habit.id);
      setSuccess('Habit deleted.');
      await loadHabits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete habit.');
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="max-w-5xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Habits</h1>
                <p className="text-sm text-muted-foreground">Build and track healthy routines</p>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full btn-primary-gradient text-sm font-medium"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4" />
              Add Habit
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-[#A7F3A0]/60 bg-[#F3FAF4] px-4 py-3 text-sm text-[#22C55E]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <GlassCard delay={0.05}>
              <p className="text-sm text-muted-foreground">Active Habits</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{loading ? '-' : habits.length}</p>
            </GlassCard>
            <GlassCard delay={0.1}>
              <p className="text-sm text-muted-foreground">Completions</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{loading ? '-' : totalCompletions}</p>
            </GlassCard>
            <GlassCard delay={0.15}>
              <p className="text-sm text-muted-foreground">Best Streak</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {loading ? '-' : Math.max(0, ...habits.map((habit) => habit.longest_streak))}
              </p>
            </GlassCard>
          </div>

          {loading ? (
            <GlassCard className="min-h-[280px] flex items-center justify-center" delay={0.2} glowOnHover={false}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading habits
              </div>
            </GlassCard>
          ) : habits.length === 0 ? (
            <GlassCard className="min-h-[320px] flex flex-col items-center justify-center text-center" delay={0.2} glowOnHover={false}>
              <div className="w-20 h-20 rounded-2xl bg-[#F3FAF4] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h2 className="text-xl font-medium text-foreground mb-2">No habits yet</h2>
              <p className="text-muted-foreground max-w-md mb-5">
                Add your first routine and Sathi will track your streaks here.
              </p>
              <button className="rounded-full btn-primary-gradient px-5 py-2.5 text-sm font-medium" onClick={openCreateDialog}>
                Create your first habit
              </button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {habits.map((habit, index) => {
                const Icon = iconMap[(habit.icon ?? 'sparkles') as keyof typeof iconMap] ?? Sparkles;
                const progress = Math.min(100, (habit.total_completions / Math.max(habit.target_count, 1)) * 100);

                return (
                  <GlassCard key={habit.id} delay={0.1 + index * 0.05} glowOnHover={false}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#F3FAF4] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-[#22C55E]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-foreground truncate">{habit.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {habit.current_streak} day streak, {habit.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${habit.name}`}
                          onClick={() => openEditDialog(habit)}
                          className="rounded-full p-2 text-muted-foreground hover:bg-[#F3FAF4] hover:text-[#22C55E]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${habit.name}`}
                          onClick={() => void handleDelete(habit)}
                          className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {habit.description && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{habit.description}</p>
                    )}

                    <div className="mb-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{habit.total_completions} total completions</span>
                        <span>Target {habit.target_count}</span>
                      </div>
                      <div className="h-2 w-full bg-[#EEF7EF] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleComplete(habit.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F3FAF4] px-4 py-2 text-sm font-medium text-[#22C55E] hover:bg-[#EEF7EF]"
                    >
                      <Check className="w-4 h-4" />
                      Complete today
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="glass-card-strong rounded-2xl sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingHabit ? 'Edit habit' : 'Add habit'}</DialogTitle>
                <DialogDescription>
                  Keep the routine simple enough to complete consistently.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Name</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-foreground">Description</span>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Frequency</span>
                    <select
                      value={form.frequency}
                      onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="weekdays">Weekdays</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Target</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={form.target_count}
                      onChange={(event) => setForm((current) => ({ ...current, target_count: Number(event.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Icon</span>
                    <select
                      value={form.icon ?? 'sparkles'}
                      onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#22C55E]/30 dark:bg-secondary"
                    >
                      {iconOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <span className="text-sm font-medium text-foreground">Color</span>
                  <div className="mt-2 flex gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, color }))}
                        className={`h-8 w-8 rounded-full ring-offset-2 ${form.color === color ? 'ring-2 ring-[#22C55E]' : ''}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Use ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-[#F3FAF4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-full btn-primary-gradient px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingHabit ? 'Save changes' : 'Create habit'}
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
