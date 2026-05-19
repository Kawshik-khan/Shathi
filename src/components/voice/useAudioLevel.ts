'use client';

import { useEffect, useRef, useState } from 'react';

export function useAudioLevel(enabled: boolean) {
  const [level, setLevel] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    let frame = 0;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const values = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          analyser.getByteFrequencyData(values);
          const average = values.reduce((sum, value) => sum + value, 0) / values.length;
          setLevel(Math.min(1, average / 90));
          frame = requestAnimationFrame(tick);
        };

        tick();

        cleanupRef.current = () => {
          cancelAnimationFrame(frame);
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
          void audioContext.close();
          setLevel(0);
        };
      } catch {
        setLevel(0);
      }
    }

    void start();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [enabled]);

  return level;
}
