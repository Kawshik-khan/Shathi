"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { register as registerWithBackendSession } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import { LoginRequest, TokenResponse, AuthUser } from "@/types";
import { useTranslation } from "react-i18next";
import GoogleSignInButton from "./GoogleSignInButton";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the terms and privacy policy to create an account.");
      setLoading(false);
      return;
    }

    try {
      const signupRequest = { name, email, password } as LoginRequest & { name: string };
      const tokens: TokenResponse = await registerWithBackendSession(
        signupRequest.email,
        signupRequest.password,
        signupRequest.name,
      );

      // Use user data from response
      const user: AuthUser = {
        id: tokens.user!.id,
        email: tokens.user!.email,
        name: tokens.user!.name,
        plan: tokens.user!.plan,
        avatar_url: tokens.user!.avatar_url,
        language: tokens.user!.language,
        family_id: tokens.user!.family_id,
        family_role: tokens.user!.family_role,
        system_role: tokens.user!.system_role,
        subscription_status: tokens.user!.subscription_status,
        subscription_started_at: tokens.user!.subscription_started_at,
        subscription_ends_at: tokens.user!.subscription_ends_at,
      };

      login(user, tokens);
      if (user.language) {
        void i18n.changeLanguage(user.language);
      }
      useDashboardStore.getState().setUser(user);
      const nextPath = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get("next")
        : null;
      router.replace(getPostAuthRedirect(user, nextPath));
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as unknown as { code?: string; message?: string };
        switch (apiErr.code) {
          case 'NETWORK_ERROR':
            setError(t('errors.network'));
            break;
          case 'UNAUTHORIZED':
            setError(t('errors.accountCreationFailed'));
            break;
          case 'CONFLICT':
            setError('An account with this email already exists.');
            break;
          case 'SERVER_ERROR':
            setError(t('errors.server'));
            break;
          default:
          setError(apiErr.message ?? t('errors.signupFailed'));
        }
      } else {
        setError(err instanceof Error ? err.message : t('errors.signupFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="text-center mb-5 sm:mb-6">
        <div className="w-8 sm:w-9 h-8 sm:h-9 mx-auto rounded-full bg-[#EAF6EA] flex items-center justify-center text-base sm:text-lg">✦</div>
        <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#0F172A]">{t('auth.createAccountTitle')}</h2>
        <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">{t('auth.joinSathi')}</p>
      </div>

      <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">{t('auth.fullName')}</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <User className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder={t('auth.enterFullName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
            />
          </div>
        </label>

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
              placeholder={t('auth.createPassword')}
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

        <label className="block">
          <span className="sr-only">{t('auth.passwordConfirm')}</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Lock className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder={t('auth.passwordConfirmPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirm ? "text" : "password"}
              required
            />
            <button type="button" aria-label={t('auth.togglePasswordConfirm')} onClick={() => setShowConfirm((s) => !s)} className="text-[#94A3B8] flex-shrink-0 hover:text-[#0F172A] transition-colors">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <label className="flex items-start gap-2 text-xs sm:text-sm text-[#475569]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#22C55E] focus:ring-[#22C55E]"
          />
          <span>I agree to the terms, privacy policy, and wellness data handling notice.</span>
        </label>

        <motion.button
          whileHover={{ y: -2 }}
          disabled={loading || !acceptedTerms}
          className="w-full py-2.5 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base bg-gradient-to-r from-[#5DBB63] to-[#22C55E] shadow-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('actions.creatingAccount') : t('actions.createAccount')}
        </motion.button>

        <div className="flex items-center gap-3 my-3 sm:my-4">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs sm:text-sm text-[#94A3B8] px-1">or</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <GoogleSignInButton />

        <p className="text-center text-xs sm:text-sm text-[#64748B] mt-4 sm:mt-5">{t('auth.alreadyHaveAccount')} <a href="/auth/login" className="text-[#22C55E] font-medium hover:underline">{t('actions.logIn')}</a></p>
      </form>
    </div>
  );
}
