'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative | undefined;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext: typeof AudioContext;
  }
}

interface UseVoiceRecognitionOptions {
  language: 'en' | 'bn';
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

export function useVoiceRecognition({
  language,
  onFinalTranscript,
  onInterimTranscript,
  onError,
}: UseVoiceRecognitionOptions) {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      onError?.('Voice input is not supported in this browser.');
      return;
    }

    recognitionRef.current?.abort();
    finalTranscriptRef.current = '';
    onInterimTranscript?.('');

    const recognition = new Recognition();
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? '';
        if (event.results[index].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) onInterimTranscript?.(interim.trim());
      if (final) finalTranscriptRef.current = `${finalTranscriptRef.current} ${final}`.trim();
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      onError?.(event.error === 'not-allowed' ? 'Microphone permission was blocked.' : 'Voice input stopped unexpectedly.');
    };
    recognition.onend = () => {
      setIsListening(false);
      const finalTranscript = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';
      onInterimTranscript?.('');
      if (finalTranscript) onFinalTranscript(finalTranscript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onError, onFinalTranscript, onInterimTranscript]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  return { isSupported, isListening, start, stop };
}
