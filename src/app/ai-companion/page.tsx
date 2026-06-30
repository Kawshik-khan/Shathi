'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Leaf,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PenLine,
  Plus,
  Send,
  Trash2,
  Wind,
  X,
  MessageCircle,
  HeartHandshake,
  Sparkles,
  Sun,
  Search,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ChatConversation,
  deleteChatConversation,
  getChatConversation,
  getChatConversations,
  streamChatMessage,
} from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { VoiceMicButton } from '@/components/voice/VoiceMicButton';
import { useAudioLevel } from '@/components/voice/useAudioLevel';
import { useSpeechSynthesis } from '@/components/voice/useSpeechSynthesis';
import { useVoiceRecognition } from '@/components/voice/useVoiceRecognition';
import type { OrbEmotion, VoiceState } from '@/components/voice/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: 'শ্বাস', icon: Wind, prompt: 'Guide me through a calming breathing exercise' },
  { label: 'অনুপ্রেরণা', icon: Sparkles, prompt: 'Give me a gentle motivation for today' },
  { label: 'মনের কথা', icon: MessageCircle, prompt: 'I need someone supportive to talk to' },
  { label: 'ফোকাস', icon: PenLine, prompt: 'Help me focus and clear my thoughts' },
];

function welcomeMessage(language: 'en' | 'bn' = 'bn'): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content:
      language === 'en'
        ? "Hi there! I'm your AI wellness companion. How are you feeling today?"
        : 'হ্যালো! আমি আপনার AI সুস্থতা সঙ্গী। শ্বাস-প্রশ্বাস, অনুপ্রেরণা, বা মনের কথা বলার জন্য আমি আছি। আজ আপনি কেমন অনুভব করছেন?',
    timestamp: new Date(),
  };
}

function mapConversationMessages(conversation: ChatConversation): Message[] {
  const messages = (conversation.messages ?? [])
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      timestamp: new Date(message.created_at),
    }));

  return messages.length > 0 ? messages : [welcomeMessage(conversation.language ?? 'bn')];
}

function formatHistoryTime(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

function getConversationDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getConversationGroup(value?: string | null) {
  const date = getConversationDate(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfConversationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfConversationDate) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Last 7 Days';
  return 'Older conversations';
}

function inferOrbEmotion(text: string): OrbEmotion {
  const lower = text.toLowerCase();

  if (/(happy|congrats|great|khushi|a\+|ভালো|খুশি|অভিনন্দন)/i.test(text)) return 'happy';
  if (/(sad|alone|depressed|mon kharap|কষ্ট|মন খারাপ|একা|হতাশ)/i.test(text)) return 'sad';
  if (/(anxious|panic|stress|চিন্তা|দুশ্চিন্তা|ভয়|ভয়)/i.test(text)) return 'anxious';
  if (/(breathe|calm|শ্বাস|শান্ত)/i.test(text)) return 'calm';
  if (lower.trim()) return 'supportive';

  return 'neutral';
}

function MessageBubbleContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.split('\n').length > 6 || content.length > 300;

  if (isStreaming && !content) {
    return (
      <div className="flex items-center gap-1.5 py-2.5 px-1" aria-label="Streaming response">
        <span className="w-2 h-2 rounded-full bg-[#4A90A4] animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#4A90A4] animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 rounded-full bg-[#4A90A4] animate-pulse"></span>
      </div>
    );
  }

  return (
    <div>
      <div className={cn("text-sm whitespace-pre-line break-words leading-relaxed", !expanded && isLong && "line-clamp-6")}>
        {content}
      </div>
      {!expanded && isLong && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs font-semibold underline text-[#4A90A4] focus-ring touch-target flex items-center h-11"
        >
          Show more / আরো দেখুন
        </button>
      )}
    </div>
  );
}

export default function AICompanionPage() {
  return (
    <ProtectedRoute>
      <AICompanionContent />
    </ProtectedRoute>
  );
}

function AICompanionContent() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage()]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'bn'>('bn');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [, setOrbEmotion] = useState<OrbEmotion>('neutral');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isCrisisOverlayOpen, setIsCrisisOverlayOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdRef = useRef(0);
  const streamAbortRef = useRef<AbortController | null>(null);
  const audioLevel = useAudioLevel(voiceState === 'listening');
  const speech = useSpeechSynthesis();

  const resetToNewChat = useCallback(() => {
    setActiveConversationId(null);
    setActiveLanguage('bn');
    setMessages([welcomeMessage('bn')]);
    setError(null);
    setVoiceState('idle');
    setOrbEmotion('neutral');
    setInterimTranscript('');
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsHistoryLoading(true);
    setError(null);

    try {
      const conversation = await getChatConversation(conversationId);
      setActiveConversationId(conversation.id);
      setActiveLanguage(conversation.language ?? 'bn');
      setMessages(mapConversationMessages(conversation));
      setConversations((prev) =>
        prev.map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
      );
      setIsSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load conversation');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const refreshConversationList = useCallback(
    async (preferredConversationId?: string | null) => {
      const list = await getChatConversations();
      setConversations(list);

      if (preferredConversationId) {
        const selected = list.find((conversation) => conversation.id === preferredConversationId);
        if (selected?.language) {
          setActiveLanguage(selected.language);
        }
        return;
      }

      if (list[0]) {
        await loadConversation(list[0].id);
      } else {
        resetToNewChat();
      }
    },
    [loadConversation, resetToNewChat]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialConversation() {
      try {
        const list = await getChatConversations();
        if (cancelled) return;

        setConversations(list);

        if (list[0]) {
          const conversation = await getChatConversation(list[0].id);
          if (cancelled) return;

          setActiveConversationId(conversation.id);
          setActiveLanguage(conversation.language ?? 'bn');
          setMessages(mapConversationMessages(conversation));
          setConversations((prev) =>
            prev.map((item) => (item.id === conversation.id ? { ...item, ...conversation } : item))
          );
        } else {
          setActiveConversationId(null);
          setActiveLanguage('bn');
          setMessages([welcomeMessage('bn')]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load conversations');
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadInitialConversation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    resetToNewChat();
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (isSending) return;

    setError(null);
    try {
      await deleteChatConversation(conversationId);
      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(remaining);

      if (activeConversationId === conversationId) {
        if (remaining[0]) {
          await loadConversation(remaining[0].id);
        } else {
          resetToNewChat();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete conversation');
    }
  };

  const handleSend = useCallback(async (content: string = input, source: 'text' | 'voice' = 'text') => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    streamAbortRef.current?.abort();
    streamAbortRef.current = new AbortController();
    speech.cancel();
    setOrbEmotion(inferOrbEmotion(trimmedContent));
    if (source === 'voice') {
      setVoiceState('thinking');
    }

    messageIdRef.current += 1;
    const userMessage: Message = {
      id: `user-${messageIdRef.current}`,
      role: 'user',
      content: trimmedContent,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const withoutWelcome = prev.length === 1 && prev[0].id === 'welcome' ? [] : prev;
      return [...withoutWelcome, userMessage];
    });
    setInput('');
    setIsSending(true);
    setError(null);

    messageIdRef.current += 1;
    const assistantId = `assistant-stream-${messageIdRef.current}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    try {
      let streamedConversationId = activeConversationId;
      let assistantResponseText = '';
      let responseLanguage = activeLanguage;

      await streamChatMessage(
        {
          message: trimmedContent,
          conversation_id: activeConversationId,
          model: 'llama-3.3-70b',
        },
        (event) => {
          if (event.crisis_flag) {
            setIsCrisisOverlayOpen(true);
          }

          if (event.language) {
            setActiveLanguage(event.language);
            responseLanguage = event.language;
          }

          if (event.type === 'meta' && event.conversation_id) {
            streamedConversationId = event.conversation_id;
            setActiveConversationId(event.conversation_id);
          }

          if (event.type === 'chunk' && event.chunk) {
            assistantResponseText += event.chunk;
            setOrbEmotion(inferOrbEmotion(assistantResponseText));
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + event.chunk }
                  : message
              )
            );
          }

          if (event.type === 'replace' && event.content) {
            assistantResponseText = event.content;
            setOrbEmotion(inferOrbEmotion(event.content));
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId ? { ...message, content: event.content ?? '' } : message
              )
            );
          }

          if (event.type === 'done') {
            if (event.conversation_id) {
              streamedConversationId = event.conversation_id;
              setActiveConversationId(event.conversation_id);
            }

            if (event.message_id) {
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantId ? { ...message, id: event.message_id ?? assistantId } : message
                )
              );
            }
          }

          if (event.type === 'error') {
            // Partial-stream errors (e.g. "Connection interrupted. Showing
            // partial response.") come from the SSE reader after we've
            // already accumulated assistant text. Don't clobber the
            // partial response with an error message — just log and
            // surface a soft warning so the user knows it was cut short.
            if (assistantResponseText.trim().length > 0) {
              setError(event.message || 'Connection interrupted. Showing partial response.');
              setVoiceState('idle');
              return;
            }
            throw new Error(event.message || 'Failed to stream message');
          }
        },
        { signal: streamAbortRef.current.signal }
      );

      await refreshConversationList(streamedConversationId);

      if (source === 'voice' && assistantResponseText.trim()) {
        speech.speak(assistantResponseText, {
          lang: responseLanguage,
          onStart: () => setVoiceState('speaking'),
          onEnd: () => setVoiceState('idle'),
          onError: () => setVoiceState('error'),
        });
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setVoiceState('interrupted');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setVoiceState('error');

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }
            : message
        )
      );
    } finally {
      streamAbortRef.current = null;
      setIsSending(false);
    }
  }, [activeConversationId, activeLanguage, input, isSending, refreshConversationList, speech]);

  const voiceRecognition = useVoiceRecognition({
    language: activeLanguage,
    onFinalTranscript: (transcript) => {
      setInterimTranscript('');
      void handleSend(transcript, 'voice');
    },
    onInterimTranscript: setInterimTranscript,
    onError: (message) => {
      setError(message);
      setVoiceState('error');
    },
  });

  const handleStartVoice = useCallback(() => {
    speech.cancel();
    streamAbortRef.current?.abort();
    setError(null);
    setVoiceState('listening');
    voiceRecognition.start();
  }, [speech, voiceRecognition]);

  const handleStopVoice = useCallback(() => {
    voiceRecognition.stop();
    setVoiceState('idle');
  }, [voiceRecognition]);

  const handleToggleVoice = useCallback(() => {
    if (voiceState === 'listening') {
      handleStopVoice();
      return;
    }

    handleStartVoice();
  }, [handleStartVoice, handleStopVoice, voiceState]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const isEmptyConversation = messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome');
  const filteredConversations = conversations.filter((conversation) =>
    (conversation.title || 'New Chat').toLowerCase().includes(historySearch.trim().toLowerCase())
  );
  const groupedConversations = ['Today', 'Yesterday', 'Last 7 Days', 'Older conversations'].map((group) => ({
    group,
    items: filteredConversations.filter((conversation) => getConversationGroup(conversation.updated_at) === group),
  }));
  const togglePinnedConversation = (conversationId: string) => {
    setPinnedConversationIds((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  return (
    <DashboardShell fullWidth>
      <div className="flex h-[calc(100vh-120px)] min-h-[680px] w-full min-w-0 flex-col bg-[#FAFBF8] text-[#25342A]">
        <div className={cn('grid h-full min-h-0 w-full min-w-0 gap-5', isSidebarCollapsed ? 'lg:grid-cols-[minmax(0,1fr)]' : 'lg:grid-cols-[clamp(280px,22vw,340px)_minmax(0,1fr)]')}>
          <aside className={cn('hidden h-[calc(100vh-120px)] min-h-[680px] min-w-0 flex-col overflow-hidden rounded-[30px] border border-[rgba(86,113,92,.12)] bg-[#F4F7F2] p-4 shadow-[0_18px_55px_rgba(41,63,48,.10)] transition-all duration-300 lg:flex', isSidebarCollapsed && 'lg:hidden')}>
            <button
              onClick={handleNewChat}
              className="flex h-[52px] min-h-[52px] w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-br from-[#56715C] via-[#64806A] to-[#75917A] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(41,63,48,.18)] transition-all hover:-translate-y-1"
            >
              <Plus className="h-5 w-5" /> New Chat
            </button>

            <label className="mt-4 flex h-12 items-center gap-3 rounded-[16px] border border-[rgba(86,113,92,.12)] bg-white px-4 text-[#66756A] shadow-[0_10px_24px_rgba(41,63,48,.06)]">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search conversations</span>
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search conversations"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2A24] outline-none placeholder:text-[#66756A]/70"
              />
            </label>

            <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1">
              {isHistoryLoading && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-[#56715C]"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : filteredConversations.length === 0 ? (
                <button onClick={handleNewChat} className="w-full rounded-[20px] bg-white px-4 py-5 text-left text-sm text-[#66756A] transition-all hover:bg-[#EEF6F0]">
                  No conversations found. Start a new chat.
                </button>
              ) : groupedConversations.map(({ group, items }) => (
                <div key={group} className={cn(items.length === 0 && 'hidden')}>
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.16em] text-[#66756A]">{group}</p>
                  <div className="space-y-2">
                    {items.map((conversation) => {
                      const isActive = conversation.id === activeConversationId;
                      const isPinned = pinnedConversationIds.includes(conversation.id);

                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            'group flex items-center gap-1 rounded-[18px] border transition-all duration-300',
                            isActive
                              ? 'border-white bg-gradient-to-br from-[#56715C] to-[#75917A] text-white shadow-[0_14px_30px_rgba(41,63,48,.18)]'
                              : 'border-transparent bg-white/65 text-[#25342A] hover:-translate-y-0.5 hover:bg-white'
                          )}
                        >
                          <button onClick={() => loadConversation(conversation.id)} className="min-w-0 flex flex-1 items-center gap-3 px-3 py-3 text-left">
                            <MessageSquare className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white/90' : 'text-[#56715C]')} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{conversation.title || 'New Chat'}</span>
                              <span className={cn('block truncate text-[11px]', isActive ? 'text-white/70' : 'text-[#66756A]')}>
                                {conversation.language === 'en' ? 'English' : 'বাংলা'} · {formatHistoryTime(conversation.updated_at) || 'Just now'}
                              </span>
                            </span>
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePinnedConversation(conversation.id);
                            }}
                            className={cn('grid h-9 w-9 place-items-center rounded-full transition-all hover:bg-[#DDEEE3]', isPinned ? 'text-[#E3B341]' : isActive ? 'text-white/60 hover:text-white' : 'text-[#66756A]/60 group-hover:text-[#56715C]')}
                            aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                          >
                            <Star className={cn('h-4 w-4', isPinned && 'fill-current')} />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteConversation(conversation.id);
                            }}
                            className={cn('mr-2 grid h-9 w-9 place-items-center rounded-full transition-all hover:bg-red-50 hover:text-red-600', isActive ? 'text-white/60' : 'text-[#66756A]/60 group-hover:text-[#56715C]')}
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col gap-5">
            <header className="flex flex-shrink-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F6F2] text-[#36513C] shadow-[0_12px_30px_rgba(41,63,48,.10)] transition-all hover:-translate-y-1 hover:bg-[#E8F2EA] lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#6D916E] to-[#3E5E44] text-white shadow-[0_16px_34px_rgba(41,63,48,.18)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#2B4431] sm:text-4xl">{activeConversation?.title || 'New Chat'}</h1>
                  <p className="mt-1 text-sm font-medium text-[#425F48]">বাংলা চেকইন চ্যাট</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[#2E4635]">
                <span className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium sm:inline-flex">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6E936E]" /> Online
                </span>
                <button className="grid h-12 w-12 place-items-center rounded-full border border-[#DCE8DD] bg-white/70 shadow-[0_10px_28px_rgba(41,63,48,.08)] transition-all hover:-translate-y-1" aria-label="Theme settings">
                  <Sun className="h-5 w-5" />
                </button>
                <button className="flex h-12 items-center gap-3 rounded-full border border-[#DCE8DD] bg-white/70 pl-2 pr-4 shadow-[0_10px_28px_rgba(41,63,48,.08)] transition-all hover:-translate-y-1" aria-label="Open profile menu">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#6C936D] to-[#3F5F45] text-white font-semibold">K</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </header>

            <section className="relative flex min-h-0 flex-1 overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_85%_45%,rgba(147,178,143,.34),transparent_30%),linear-gradient(135deg,#5B7B5F_0%,#3F6247_42%,#294833_100%)] text-white shadow-[0_28px_80px_rgba(36,58,42,.28)]">
              <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-[34rem] rounded-tl-full bg-white/5 blur-sm" />
              <Leaf className="pointer-events-none absolute bottom-24 right-24 h-28 w-28 rotate-12 text-white/7" />
              <Leaf className="pointer-events-none absolute bottom-12 right-6 h-48 w-48 -rotate-45 text-white/6" />
              <div className="relative flex min-h-0 w-full flex-col">
                <div className="flex flex-shrink-0 items-center justify-between border-b border-white/12 px-5 py-5 sm:px-7">
                    <div className="flex items-center gap-3 text-white/80">
                      <BookOpen className="h-5 w-5" />
                      <span className="text-base font-medium">Conversation</span>
                    </div>
                    <button
                      onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                      className="hidden h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 text-sm font-semibold text-white transition-all hover:-translate-y-1 hover:bg-white/16 lg:inline-flex"
                    >
                      <PanelLeftClose className="h-4 w-4" /> {isSidebarCollapsed ? 'Show History' : 'Hide History'}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-7">
                    <AnimatePresence initial={false}>
                      {isEmptyConversation ? (
                        <motion.div className="flex min-h-full flex-col items-center justify-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <div className="grid h-20 w-20 place-items-center rounded-full bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14)]"><Leaf className="h-10 w-10" /></div>
                          <h3 className="mt-5 text-2xl font-semibold">What&apos;s on your mind today?</h3>
                          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/65">I&apos;m here to listen without judgment.</p>
                          <button onClick={handleNewChat} className="mt-5 rounded-full bg-white/14 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20">Start Conversation</button>
                        </motion.div>
                      ) : messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: index === messages.length - 1 ? 0 : 0 }}
                          className={cn('mb-5 flex items-start gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                        >
                          <div
                            className={cn(
                              'grid h-11 w-11 flex-shrink-0 place-items-center rounded-full shadow-[0_14px_28px_rgba(16,32,21,.16)]',
                              message.role === 'user' ? 'bg-white text-[#38553E]' : 'bg-[#7FA17E] text-white'
                            )}
                          >
                            {message.role === 'user' ? <span className="font-semibold">K</span> : <Sparkles className="h-5 w-5" />}
                          </div>

                          <div
                            className={cn(
                              'max-w-[82%] rounded-[22px] border px-5 py-4 text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,.10)]',
                              message.role === 'user'
                                ? 'border-white/14 bg-white/12 text-white'
                                : 'border-white/10 bg-white/10 text-white/92'
                            )}
                          >
                            <MessageBubbleContent
                              content={message.content}
                              isStreaming={isSending && index === messages.length - 1 && message.role === 'assistant'}
                            />
                            <div className="mt-2 text-[11px] text-white/62">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {error && (
                      <div className="mt-4 rounded-[14px] border border-[#D58A63]/60 bg-[#6D533B]/30 px-5 py-4 text-sm font-medium text-[#FFE1D1]">
                        {error}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="flex-shrink-0 overflow-x-auto border-t border-white/8 px-5 py-4 scrollbar-none snap-x snap-mandatory sm:px-7">
                    <div className="flex flex-row gap-3 whitespace-nowrap">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => handleSend(action.prompt)}
                          disabled={isSending}
                          className="flex-shrink-0 snap-start flex h-11 items-center gap-2 rounded-full bg-white/12 px-5 text-sm font-semibold text-white/82 transition-all duration-300 hover:-translate-y-1 hover:bg-white/18 disabled:opacity-50 btn-haptic touch-target"
                        >
                          <action.icon className="h-4 w-4" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex-shrink-0 border-t border-white/8 bg-[#2D4C37]/80 px-5 pb-6 pt-5 backdrop-blur-xl sm:px-7">
                    <div className="flex items-end gap-3 rounded-full border border-white/70 bg-white p-2.5 text-[#25342A] shadow-[0_18px_45px_rgba(10,24,14,.22)]">
                      <button
                        type="button"
                        onClick={() => setIsCrisisOverlayOpen(true)}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#EEF6F0] text-[#56715C] transition-colors hover:bg-[#DDEEE3] btn-haptic touch-target"
                        aria-label="Get emergency help"
                      >
                        <HeartHandshake className="h-5 w-5" />
                      </button>
                      <textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={activeLanguage === 'en' ? 'Type your message...' : 'আপনার মেসেজ লিখুন...'}
                        disabled={isSending}
                        rows={1}
                        aria-label={voiceState === 'listening' && interimTranscript ? interimTranscript : 'Message'}
                        className="min-w-0 flex-1 resize-none bg-transparent px-2 py-3.5 text-base text-[#1F2A24] outline-none transition-all placeholder:text-[#66756A]/70 focus:placeholder:text-[#66756A]/45"
                        style={{ minHeight: '52px', maxHeight: '120px' }}
                      />
                      <VoiceMicButton
                        state={voiceState}
                        level={audioLevel}
                        isSupported={voiceRecognition.isSupported}
                        onClick={handleToggleVoice}
                      />
                      <button
                        onClick={() => handleSend()}
                        disabled={isSending || !input.trim()}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#56715C] to-[#75917A] text-white shadow-[0_12px_28px_rgba(10,24,14,.16)] transition-all hover:-translate-y-1 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Send message"
                      >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
              </div>
            </section>
          </div>
        </div>

        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <button
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close chat history overlay"
            />
            <div className="absolute bottom-0 left-0 top-0 flex w-[min(320px,85vw)] flex-col overflow-hidden bg-[#F4F7F2] p-4 text-[#25342A] shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-bold text-[#2B4431]">Conversation History</p>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#36513C] transition-colors hover:bg-[#E8F2EA]"
                  aria-label="Close conversation history"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleNewChat}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-br from-[#56715C] via-[#64806A] to-[#75917A] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(41,63,48,.18)]"
              >
                <Plus className="h-5 w-5" /> New Chat
              </button>
              <label className="mt-4 flex h-12 items-center gap-3 rounded-[16px] border border-[rgba(86,113,92,.12)] bg-white px-4 text-[#66756A]">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search conversations</span>
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Search conversations"
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2A24] outline-none placeholder:text-[#66756A]/70"
                />
              </label>
              <div className="mt-5 flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-1">
                {groupedConversations.map(({ group, items }) => (
                  <div key={group} className={cn(items.length === 0 && 'hidden')}>
                    <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.16em] text-[#66756A]">{group}</p>
                    <div className="space-y-2">
                      {items.map((conversation) => {
                        const isActive = conversation.id === activeConversationId;
                        const isPinned = pinnedConversationIds.includes(conversation.id);

                        return (
                          <div key={conversation.id} className={cn('group flex items-center gap-1 rounded-[18px] border transition-all', isActive ? 'border-white bg-gradient-to-br from-[#56715C] to-[#75917A] text-white' : 'border-transparent bg-white/65 text-[#25342A]')}>
                            <button onClick={() => loadConversation(conversation.id)} className="min-w-0 flex flex-1 items-center gap-3 px-3 py-3 text-left">
                              <MessageSquare className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white/90' : 'text-[#56715C]')} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold">{conversation.title || 'New Chat'}</span>
                                <span className={cn('block truncate text-[11px]', isActive ? 'text-white/70' : 'text-[#66756A]')}>{formatHistoryTime(conversation.updated_at) || 'Just now'}</span>
                              </span>
                            </button>
                            <button onClick={() => togglePinnedConversation(conversation.id)} className={cn('grid h-9 w-9 place-items-center rounded-full', isPinned ? 'text-[#E3B341]' : isActive ? 'text-white/70' : 'text-[#66756A]')} aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}>
                              <Star className={cn('h-4 w-4', isPinned && 'fill-current')} />
                            </button>
                            <button onClick={() => void handleDeleteConversation(conversation.id)} className={cn('mr-1 grid h-9 w-9 place-items-center rounded-full hover:bg-red-50 hover:text-red-600', isActive ? 'text-white/70' : 'text-[#66756A]')} aria-label="Delete conversation">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety overlay for crisis detected state */}
      <AnimatePresence>
        {isCrisisOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white dark:bg-[#1A202C] rounded-t-3xl p-6 shadow-2xl pb-safe"
            >
              <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                We are here for you / আমরা আপনার পাশে আছি
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                It sounds like you might be going through a very tough time. Please reach out to someone who can help. You are not alone.
              </p>
              <div className="space-y-3">
                <a
                  href="tel:109"
                  className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl font-bold text-red-700 dark:text-red-400 touch-target"
                >
                  <span>National Helpline (Bangladesh)</span>
                  <span>109</span>
                </a>
                <a
                  href="tel:999"
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-foreground touch-target"
                >
                  <span>Emergency Services</span>
                  <span>999</span>
                </a>
                <button
                  onClick={() => setIsCrisisOverlayOpen(false)}
                  className="w-full py-3 bg-[#4A90A4] text-white rounded-2xl font-semibold touch-target mt-2"
                >
                  Close / বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
}
