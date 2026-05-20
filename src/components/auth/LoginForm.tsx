"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { LoginRequest, TokenResponse, AuthUser } from "@/types";
import { useTranslation } from "react-i18next";
import GoogleSignInButton from "./GoogleSignInButton";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { i18n, t } = useTranslation();

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const tokens: TokenResponse = await apiFetch<TokenResponse>('/api/v1/auth/login', {
        method: "POST",
        body: JSON.stringify({ email, password } as LoginRequest),
      }, 0);

      // Use user data from response
      const user: AuthUser = {
        id: tokens.user!.id,
        email: tokens.user!.email,
        name: tokens.user!.name,
        plan: tokens.user!.plan as 'free' | 'premium',
        avatar_url: tokens.user!.avatar_url,
        language: tokens.user!.language,
        family_id: tokens.user!.family_id,
      };

      login(user, tokens);
      if (user.language) {
        void i18n.changeLanguage(user.language);
      }
      useDashboardStore.getState().setUser(user);
      const nextPath = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get("next")
        : null;
      router.replace(nextPath || "/dashboard");
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as unknown as { code?: string; message?: string };
        switch (apiErr.code) {
          case 'NETWORK_ERROR':
            setError(t('errors.network'));
            break;
          case 'UNAUTHORIZED':
            setError(t('errors.invalidCredentials'));
            break;
          case 'SERVER_ERROR':
            setError(t('errors.server'));
            break;
          default:
            setError(apiErr.message ?? t('errors.loginFailed'));
        }
      } else {
        setError(err instanceof Error ? err.message : t('errors.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="text-center mb-5 sm:mb-6">
        <div className="w-8 sm:w-9 h-8 sm:h-9 mx-auto rounded-full bg-[#EAF6EA] flex items-center justify-center text-base sm:text-lg">✦</div>
        <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#0F172A]">{t('auth.welcomeBack')}</h2>
        <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">{t('auth.welcomeSubtitle')}</p>
      </div>

      <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">{t('auth.email')}</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Mail className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder={t('auth.enterEmail')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">{t('auth.password')}</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Lock className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder={t('auth.enterPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              required
            />
            <button type="button" aria-label={t('auth.togglePassword')} onClick={() => setShow((s) => !s)} className="text-[#94A3B8] flex-shrink-0 hover:text-[#0F172A] transition-colors">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={remember} onChange={() => setRemember((r) => !r)} className="h-4 w-4 rounded" />
            <span className="text-[#475569]">{t('auth.rememberMe')}</span>
          </label>
          <button
            type="button"
            disabled
            title="Password reset is not configured yet"
            className="text-[#22C55E]/60 whitespace-nowrap bg-transparent border-none p-0 cursor-not-allowed"
          >
            {t('actions.forgotPassword')}
          </button>
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          disabled={loading}
          className="w-full py-2.5 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base bg-gradient-to-r from-[#5DBB63] to-[#22C55E] shadow-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('actions.loggingIn') : t('actions.logIn')}
        </motion.button>

        <div className="flex items-center gap-3 my-3 sm:my-4">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs sm:text-sm text-[#94A3B8] px-1">or</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-xs sm:text-sm text-[#64748B] mt-4 sm:mt-5">{t('auth.dontHaveAccount')} <a href="/auth/signup" className="text-[#22C55E] font-medium hover:underline">{t('actions.signUp')}</a></p>
      </form>
    </div>
  );
}

