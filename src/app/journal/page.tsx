'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  type JournalEntry,
} from '@/lib/api';
import { BookHeart, Edit3, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/mobile/empty-state';
import { StickyActionBar } from '@/components/mobile/sticky-action-bar';
import { SkeletonCard } from '@/components/shared/skeleton-card';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const draftKey = 'sathi_journal_draft';

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState(() => {
    if (typeof window === 'undefined') return '';

    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) ?? '{}') as { title?: string };
      return draft.title ?? '';
    } catch {
      return '';
    }
  });
  const [content, setContent] = useState(() => {
    if (typeof window === 'undefined') return '';

    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) ?? '{}') as { content?: string };
      return draft.content ?? '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const online = useOnlineStatus();
  const isEditing = Boolean(editingEntry) || title.trim() || content.trim();

  async function loadEntries() {
    setLoading(true);
    setError('');

    try {
      const nextEntries = await getJournalEntries(30);
      setEntries(nextEntries);
      setSelectedEntry((current) => {
        if (!nextEntries.length) return null;
        if (!current) return nextEntries[0];
        return nextEntries.find((entry) => entry.id === current.id) ?? nextEntries[0];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load journal entries.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    getJournalEntries(30)
      .then((nextEntries) => {
        if (!mounted) return;
        setEntries(nextEntries);
        setSelectedEntry(nextEntries[0] ?? null);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load journal entries.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || editingEntry) return;

    const hasDraft = title.trim() || content.trim();
    if (!hasDraft) {
      window.localStorage.removeItem(draftKey);
      return;
    }

    window.localStorage.setItem(draftKey, JSON.stringify({ title, content }));
  }, [title, content, editingEntry]);

  const wordCount = useMemo(
    () => content.trim().split(/\s+/).filter(Boolean).length,
    [content]
  );

  function startNewEntry() {
    setEditingEntry(null);
    setSelectedEntry(null);
    setTitle('');
    setContent('');
    setError('');
    setSuccess('');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftKey);
    }
  }

  function startEdit(entry: JournalEntry) {
    setEditingEntry(entry);
    setSelectedEntry(entry);
    setTitle(entry.title ?? '');
    setContent(entry.content);
    setError('');
    setSuccess('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title: title.trim() || null,
        content: content.trim(),
      };

      if (!payload.content) {
        setError('Journal content is required.');
        setSaving(false);
        return;
      }

      const savedEntry = editingEntry
        ? await updateJournalEntry(editingEntry.id, payload)
        : await createJournalEntry(payload);

      setSuccess(editingEntry ? 'Journal entry updated.' : 'Journal entry saved.');
      setEditingEntry(null);
      setSelectedEntry(savedEntry);
      setTitle('');
      setContent('');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(draftKey);
      }
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save journal entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: JournalEntry) {
    if (!window.confirm(`Delete "${entry.title || 'Untitled entry'}"?`)) return;

    setError('');
    setSuccess('');

    try {
      await deleteJournalEntry(entry.id);
      setSuccess('Journal entry deleted.');
      if (selectedEntry?.id === entry.id) {
        setSelectedEntry(null);
      }
      if (editingEntry?.id === entry.id) {
        setEditingEntry(null);
        setTitle('');
        setContent('');
      }
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete journal entry.');
    }
  }

  return (
    <ProtectedRoute>
      <DashboardShell>
        <div className="w-full min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center">
                <BookHeart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
                <p className="text-sm text-muted-foreground">Document your thoughts and reflections</p>
              </div>
            </div>
            <button
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full btn-primary-gradient text-sm font-medium touch-target"
              onClick={startNewEntry}
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          </div>

          {/* Mobile FAB */}
          <button
            type="button"
            onClick={startNewEntry}
            className="lg:hidden fixed bottom-[calc(4rem+1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 btn-haptic touch-target flex h-14 w-14 items-center justify-center rounded-full btn-primary-gradient text-white shadow-lg"
            aria-label="New journal entry"
          >
            <Plus className="h-6 w-6" />
          </button>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-[#A8D0D9]/60 bg-[#F1F5F7] px-4 py-3 text-sm text-[#4A90A4]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
            <GlassCard className="min-h-[420px]" delay={0.1} glowOnHover={false}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-foreground">Entries</h2>
                <span className="rounded-full bg-[#E3F0F3] px-2 py-0.5 text-xs font-medium text-[#4A90A4]">
                  {entries.length}
                </span>
              </div>

              {loading ? (
                <SkeletonCard rows={5} hasHeader className="min-h-72" />
              ) : entries.length === 0 ? (
                <EmptyState
                  illustration="/illustrations/empty-journal.svg"
                  title="No entries yet"
                  description="Your saved reflections will appear here."
                  actionLabel="Write first entry"
                  onAction={startNewEntry}
                />
              ) : (
                <div className="divide-y divide-border">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setEditingEntry(null);
                      }}
                      className={`density-list-row mobile-list-row focus-ring btn-haptic w-full px-1 py-3 text-left transition-colors touch-target ${
                        selectedEntry?.id === entry.id
                          ? 'bg-[#E3F0F3]/80'
                          : 'hover:bg-[#F1F5F7]/70'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#4A90A4]" aria-hidden="true" />
                        <p className="flex-1 truncate text-base font-medium text-foreground">
                          {entry.title || 'Untitled entry'}
                        </p>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {relativeTime(entry.written_at)}
                        </span>
                      </div>
                      <p className="mt-1 truncate pl-4 text-sm text-muted-foreground">{entry.content}</p>
                    </button>
                  ))}
                </div>
              )}
            </GlassCard>

            <div className="space-y-5">
              <GlassCard delay={0.15} glowOnHover={false}>
                <form id="journal-editor-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-foreground">
                        {editingEntry ? 'Edit entry' : 'Write a new entry'}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Drafts are kept locally until you save.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#F1F5F7] px-3 py-1 text-xs text-muted-foreground">
                      {wordCount} words
                    </span>
                  </div>

                  <label className="block">
                    <span className="sr-only">Title</span>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Entry title"
                      className="input-mobile w-full rounded-2xl border border-border bg-white/70 px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[#4A90A4]/30 dark:bg-secondary"
                    />
                  </label>

                  <label className="block">
                    <span className="sr-only">Content</span>
                    <textarea
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      rows={12}
                      placeholder="Write what is on your mind..."
                      className="input-mobile w-full resize-none rounded-2xl border border-border bg-white/70 px-4 py-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-[#4A90A4]/30 dark:bg-secondary"
                    />
                  </label>

                  <div className="hidden sm:flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-full btn-primary-gradient px-5 py-2.5 text-sm font-medium touch-target disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingEntry ? 'Save changes' : 'Save entry'}
                    </button>
                    {editingEntry && (
                      <button
                        type="button"
                        onClick={startNewEntry}
                        className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-[#F1F5F7] touch-target"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>

                  {!online && (
                    <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
                      Offline — draft saved locally until you reconnect.
                    </p>
                  )}

                  <p className="fixed bottom-28 right-6 text-xs text-muted-foreground lg:static lg:text-right">
                    {wordCount} words · autosaved locally
                  </p>
                </form>
              </GlassCard>

              {isEditing && (
                <StickyActionBar className="sm:hidden">
                  <button
                    type="submit"
                    form="journal-editor-form"
                    disabled={saving}
                    className="btn-haptic touch-target flex min-h-13 w-full items-center justify-center gap-2 rounded-full btn-primary-gradient text-base font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {editingEntry ? 'Save changes' : 'Save entry'}
                  </button>
                </StickyActionBar>
              )}

              {selectedEntry && (
                <GlassCard delay={0.2} glowOnHover={false}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-medium text-foreground">{selectedEntry.title || 'Untitled entry'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedEntry.written_at)}
                        {selectedEntry.reading_time_minutes ? ` · ${selectedEntry.reading_time_minutes} min read` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(selectedEntry)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-[#F1F5F7] hover:text-[#4A90A4]"
                        aria-label="Edit entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(selectedEntry)}
                        className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {selectedEntry.content}
                  </p>

                  {(selectedEntry.emotion_summary || selectedEntry.ai_insights || selectedEntry.emotion_tags.length > 0) && (
                    <div className="mt-5 rounded-2xl bg-[#F1F5F7]/80 p-4">
                      <p className="text-sm font-medium text-foreground">AI reflection</p>
                      {selectedEntry.emotion_summary && (
                        <p className="mt-2 text-sm text-muted-foreground">{selectedEntry.emotion_summary}</p>
                      )}
                      {selectedEntry.ai_insights && (
                        <p className="mt-2 text-sm text-muted-foreground">{selectedEntry.ai_insights}</p>
                      )}
                      {selectedEntry.emotion_tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedEntry.emotion_tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#E3F0F3] px-2.5 py-1 text-xs font-medium text-[#4A90A4]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    </ProtectedRoute>
  );
}
