"use client";

import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { SupportedLanguage } from "@/i18n/client";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const language: SupportedLanguage = i18n.language === "bn" ? "bn" : "en";

  const changeLanguage = async (nextLanguage: SupportedLanguage) => {
    if (nextLanguage === language) {
      return;
    }

    await i18n.changeLanguage(nextLanguage);

    try {
      await apiFetch("/api/v1/users/language", {
        method: "PUT",
        body: JSON.stringify({ language: nextLanguage }),
      }, 0);
    } catch {
      // Guest users and offline sessions still keep the local preference.
    }
  };

  return (
    <div
      className="flex items-center rounded-full bg-white/80 dark:bg-white/10 border border-black/5 dark:border-white/10 p-0.5"
      aria-label={t("language.toggleLabel")}
    >
      {(["en", "bn"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => changeLanguage(option)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
            language === option
              ? "bg-[#22C55E] text-white shadow-sm shadow-green-500/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={language === option}
        >
          {t(`language.${option}`)}
        </button>
      ))}
    </div>
  );
}
