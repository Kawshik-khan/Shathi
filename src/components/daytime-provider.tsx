'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

export type Daytime = 'morning' | 'noon' | 'afternoon' | 'night';

interface DaytimeContextType {
  daytime: Daytime;
}

const DaytimeContext = createContext<DaytimeContextType | undefined>(undefined);

/**
 * Pure helper: resolves the time-of-day period from an hour (0-23).
 * morning 5–11, noon 11–15, afternoon 15–19, night 19–5.
 */
export function getDaytime(hour: number): Daytime {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 15) return 'noon';
  if (hour >= 15 && hour < 19) return 'afternoon';
  return 'night';
}

function getCurrentDaytime(): Daytime {
  return getDaytime(new Date().getHours());
}

function subscribeToHydration() {
  return () => {};
}

function useHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function DaytimeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useHydrated();
  const [daytime, setDaytime] = useState<Daytime>(getCurrentDaytime);

  useEffect(() => {
    if (!mounted) return;

    const update = () => setDaytime(getCurrentDaytime());

    update();
    document.documentElement.dataset.daytime = getCurrentDaytime();

    // Re-evaluate periodically and when the tab regains focus.
    const interval = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.daytime = daytime;
  }, [mounted, daytime]);

  return (
    <DaytimeContext.Provider value={{ daytime }}>
      {children}
    </DaytimeContext.Provider>
  );
}

export function useDaytime() {
  const context = useContext(DaytimeContext);
  if (context === undefined) {
    throw new Error('useDaytime must be used within a DaytimeProvider');
  }
  return context;
}
