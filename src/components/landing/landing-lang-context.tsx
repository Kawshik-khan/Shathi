"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n, { LANGUAGE_STORAGE_KEY } from "@/i18n/client";
import {
  landingContent,
  type LandingLang,
} from "@/components/landing/landing-content";

type LandingCopy = typeof landingContent.en | typeof landingContent.bn;

type LandingLangContextValue = {
  lang: LandingLang;
  setLang: (lang: LandingLang) => void;
  t: LandingCopy;
};

const LandingLangContext = createContext<LandingLangContextValue | null>(null);

export function LandingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LandingLang>(() =>
    i18n.language === "bn" ? "bn" : "en",
  );

  const setLang = useCallback((next: LandingLang) => {
    setLangState(next);
    i18n.changeLanguage(next);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: landingContent[lang],
    }),
    [lang, setLang],
  );

  return (
    <LandingLangContext.Provider value={value}>
      {children}
    </LandingLangContext.Provider>
  );
}

export function useLandingLang() {
  const ctx = useContext(LandingLangContext);
  if (!ctx) {
    throw new Error("useLandingLang must be used within LandingLangProvider");
  }
  return ctx;
}
