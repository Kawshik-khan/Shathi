'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useSettingsStore } from '@/lib/stores/settingsStore';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem('Sathi-theme');
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'light';
}

function subscribeToSystemTheme(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getSystemThemeSnapshot(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerSystemThemeSnapshot(): 'light' | 'dark' {
  return 'light';
}

function subscribeToHydration() {
  return () => {};
}

function useHydrated() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const mounted = useHydrated();
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot
  );
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  const motionEnabled = useSettingsStore((state) => state.motionEnabled);
  const density = useSettingsStore((state) => state.density);
  const highContrast = useSettingsStore((state) => state.highContrast);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  // Load settings on mount
  useEffect(() => {
    if (mounted) {
      void loadSettings();
    }
  }, [mounted, loadSettings]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    localStorage.setItem('Sathi-theme', theme);
  }, [mounted, resolvedTheme, theme]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.toggle('motion-disabled', !motionEnabled);
    root.classList.toggle('high-contrast', !!highContrast);
    root.setAttribute('data-density', density || 'comfortable');
    root.style.fontSize = `${fontSize ?? 16}px`;
  }, [mounted, motionEnabled, density, highContrast, fontSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent flash during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
