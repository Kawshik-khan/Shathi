'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import {
  Loader2,
  Menu,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
  Wind,
  X,
  Quote,
  MessageCircle,
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
  { label: 'শ্বাস', icon: Wind, prompt: 'আমাকে একটি শ্বাস-প্রশ্বাসের ব্যায়াম করাও' },
  { label: 'অনুপ্রেরণা', icon: Quote, prompt: 'আজ আমার একটু অনুপ্রেরণা দরকার' },
  { label: 'মনের কথা', icon: MessageCircle, prompt: 'আমি কিছু কথা বলতে চাই' },
  { label: 'ফোকাস', icon: Target, prompt: 'আমাকে মনোযোগ ধরে রাখতে সাহায্য করো' },
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

function inferOrbEmotion(text: string): OrbEmotion {
  const lower = text.toLowerCase();

  if (/(happy|congrats|great|khushi|a\+|ভালো|খুশি|অভিনন্দন)/i.test(text)) return 'happy';
  if (/(sad|alone|depressed|mon kharap|কষ্ট|মন খারাপ|একা|হতাশ)/i.test(text)) return 'sad';
  if (/(anxious|panic|stress|চিন্তা|দুশ্চিন্তা|ভয়|ভয়)/i.test(text)) return 'anxious';
  if (/(breathe|calm|শ্বাস|শান্ত)/i.test(text)) return 'calm';
  if (lower.trim()) return 'supportive';

  return 'neutral';
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
  const [error, setError] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [, setOrbEmotion] = useState<OrbEmotion>('neutral');
  const [interimTranscript, setInterimTranscript] = useState('');
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

  const sidebar = (
    <aside className="h-full flex flex-col bg-white/70 dark:bg-white/5 border-r border-black/5 dark:border-white/10">
      <div className="p-3 flex items-center gap-2 border-b border-black/5 dark:border-white/10">
        <button
          onClick={handleNewChat}
          className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-[#4A90A4] text-white text-sm font-medium hover:bg-[#3F7E90] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close chat history"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {isHistoryLoading && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No saved chats yet.
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div
                key={conversation.id}
                className={cn(
                  'group flex items-center gap-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-[#E3F0F3] text-[#2C6373]'
                    : 'text-muted-foreground hover:bg-[#F1F5F7] hover:text-foreground dark:hover:bg-white/10'
                )}
              >
                <button
                  onClick={() => loadConversation(conversation.id)}
                  className="min-w-0 flex-1 flex items-center gap-2 px-3 py-2 text-left"
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {conversation.title || 'New Chat'}
                    </span>
                    <span className="block text-[11px] opacity-70">
                      {conversation.language === 'en' ? 'English' : 'বাংলা'} · {formatHistoryTime(conversation.updated_at)}
                    </span>
                  </span>
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteConversation(conversation.id);
                  }}
                  className="mr-2 opacity-0 group-hover:opacity-100 h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-100 hover:text-red-600 transition-all"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );

  return (
    <DashboardShell>
      <div className="max-w-[1400px] mx-auto h-[calc(100vh-140px)] min-h-[620px] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg bg-white/70 dark:bg-white/10 border border-black/5 dark:border-white/10"
            aria-label="Open chat history"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4] flex items-center justify-center shadow-lg shadow-[#4A90A4]/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground truncate">
              {activeConversation?.title || 'AI Companion'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeLanguage === 'en' ? 'Continuing in English' : 'বাংলা ডিফল্ট চ্যাট'}
            </p>
          </div>
          <div className="ml-auto hidden lg:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4A90A4] animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        <GlassCard className="flex-1 overflow-hidden" delay={0.1}>
          <div className="h-full flex">
            <div className={cn('hidden lg:block transition-all duration-200', isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72')}>
              {sidebar}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="hidden lg:flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/10">
                <button
                  onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:bg-[#F1F5F7] dark:hover:bg-white/10 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                  History
                </button>
                <button
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium bg-[#F1F5F7] dark:bg-white/10 hover:bg-[#E3F0F3] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index === messages.length - 1 ? 0 : 0 }}
                      className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-[#A8D0D9] to-[#6FA8C7]'
                            : 'bg-gradient-to-br from-[#6FA8C7] to-[#4A90A4]'
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-white" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'max-w-[82%] px-4 py-3 rounded-2xl',
                          message.role === 'user'
                            ? 'bg-[#4A90A4] text-white rounded-br-md'
                            : 'bg-[#F1F5F7] dark:bg-white/10 text-foreground rounded-bl-md'
                        )}
                      >
                        <div className="text-sm whitespace-pre-line break-words">
                          {message.content || (isSending ? '...' : '')}
                        </div>
                        <div
                          className={cn(
                            'text-[10px] mt-1',
                            message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                          )}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4 py-2 border-t border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="px-4 py-3 border-t border-black/5 dark:border-white/5">
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.prompt)}
                      disabled={isSending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F5F7] dark:bg-white/10 text-xs font-medium text-muted-foreground hover:bg-[#EAF2F4] dark:hover:bg-white/20 hover:text-[#4A90A4] transition-colors disabled:opacity-50"
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 sm:p-4 border-t border-black/5 dark:border-white/5">
                <div className="flex items-end gap-2 rounded-[1.6rem] border border-black/5 bg-white/75 p-2 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/8">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeLanguage === 'en' ? 'Type your message...' : 'আপনার মেসেজ লিখুন...'}
                    disabled={isSending}
                    rows={1}
                    aria-label={voiceState === 'listening' && interimTranscript ? interimTranscript : 'Message'}
                    className="min-w-0 flex-1 resize-none rounded-[1.25rem] border border-transparent bg-[#F1F5F7]/70 px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-[#A8D0D9] focus:outline-none focus:ring-2 focus:ring-[#4A90A4]/10 dark:bg-white/10"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
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
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full btn-primary-gradient shadow-sm transition-all hover:shadow-[0_10px_26px_rgba(34,197,94,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <button
              className="absolute inset-0 bg-black/30"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close chat history overlay"
            />
            <div className="absolute left-0 top-0 bottom-0 w-[min(320px,85vw)] shadow-2xl">
              {sidebar}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
