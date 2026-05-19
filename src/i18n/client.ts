"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bn from "./locales/bn.json";
import en from "./locales/en.json";

export const supportedLanguages = ["en", "bn"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const LANGUAGE_STORAGE_KEY = "Sathi-language";

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "bn" ? "bn" : "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
