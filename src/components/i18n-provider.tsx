"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n, { LANGUAGE_STORAGE_KEY, SupportedLanguage } from "@/i18n/client";

interface I18nProviderProps {
  children: React.ReactNode;
}

function applyDocumentLanguage(language: SupportedLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = "ltr";
  document.documentElement.dataset.language = language;
}

export function I18nProvider({ children }: I18nProviderProps) {
  useEffect(() => {
    applyDocumentLanguage(i18n.language === "bn" ? "bn" : "en");

    const handleLanguageChange = (language: string) => {
      const nextLanguage: SupportedLanguage = language === "bn" ? "bn" : "en";
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      applyDocumentLanguage(nextLanguage);
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
