/** Chat hook with streaming support */
import { useState, useCallback } from "react";
import { chatApi } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion?: string;
  created_at: string;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  conversationId: string | null;
}

export function useChat(initialConversationId?: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await chatApi.sendMessage(content, conversationId || undefined);

      // Add assistant message
      const assistantMessage: Message = {
        id: response.message_id,
        role: "assistant",
        content: response.response,
        emotion: response.emotion_detected,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    conversationId,
  };
}

