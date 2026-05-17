'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';
import { GlassCard } from '@/components/shared/glass-card';
import { Sparkles, Send, Wind, Quote, MessageCircle, Target, User, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: 'Breathing', icon: Wind, prompt: 'Guide me through a breathing exercise' },
  { label: 'Motivation', icon: Quote, prompt: 'I need some motivation today' },
  { label: 'Vent', icon: MessageCircle, prompt: 'I need to vent about something' },
  { label: 'Focus', icon: Target, prompt: 'Help me focus and concentrate' },
];

interface ChatResponse {
  response: string;
  conversation_id: string;
  message_id: string;
  emotion_detected?: string;
  crisis_flag: boolean;
  model_used: string;
}

export default function AICompanionPage() {
  return (
    <ProtectedRoute>
      <AICompanionContent />
    </ProtectedRoute>
  );
}

function AICompanionContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm your AI wellness companion. I'm here to support you with breathing exercises, motivation, or just to listen. How are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const chatResponse: ChatResponse = await apiFetch<ChatResponse>('/api/v1/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          message: content.trim(),
          conversation_id: conversationId,
          model: 'llama-3.3-70b',
        }),
      });

      // Update conversation ID if this is the first message
      if (!conversationId) {
        setConversationId(chatResponse.conversation_id);
      }

      const aiResponse: Message = {
        id: chatResponse.message_id,
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add error message to chat
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center shadow-lg shadow-green-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Companion</h1>
            <p className="text-sm text-muted-foreground">Your personal wellness assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        <GlassCard className="flex-1 flex flex-col overflow-hidden" delay={0.1}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0 : 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#A7F3A0] to-[#7ED957]'
                      : 'bg-gradient-to-br from-[#7ED957] to-[#22C55E]'
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl',
                    message.role === 'user'
                      ? 'bg-[#22C55E] text-white rounded-br-md'
                      : 'bg-[#F3FAF4] dark:bg-white/10 text-foreground rounded-bl-md'
                  )}>
                    <div className="text-sm whitespace-pre-line">{message.content}</div>
                    <div className={cn(
                      'text-[10px] mt-1',
                      message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7ED957] to-[#22C55E] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#F3FAF4] dark:bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 border-t border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 py-3 border-t border-black/5 dark:border-white/5">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3FAF4] dark:bg-white/10 text-xs font-medium text-muted-foreground hover:bg-[#EEF7EF] dark:hover:bg-white/20 hover:text-[#22C55E] transition-colors disabled:opacity-50"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-black/5 dark:border-white/5">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
                className="flex-1 px-4 py-3 rounded-xl bg-[#F3FAF4] dark:bg-white/10 border border-transparent focus:border-[#A7F3A0] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/10 text-sm resize-none transition-all placeholder:text-muted-foreground/60"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 rounded-xl btn-primary-gradient disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}

