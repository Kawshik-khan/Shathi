'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeakOptions {
  lang?: 'en' | 'bn';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export function useSpeechSynthesis() {
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = options.lang === 'bn' ? 0.95 : 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        options.onStart?.();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        options.onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        options.onError?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [cancel]
  );

  return { isSupported, isSpeaking, speak, cancel };
}
