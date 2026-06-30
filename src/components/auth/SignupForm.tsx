"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { register as registerWithBackendSession } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import { TokenResponse, AuthUser } from "@/types";
import { useTranslation } from "react-i18next";
import GoogleSignInButton from "./GoogleSignInButton";
import { AppleGlyph, MicrosoftGlyph } from "./SocialIcons";

/**
 * Premium create-account form. Renders inside ``LoginLayout``'s
 * right-hand panel — same 56px pill inputs and emerald-gradient CTA
 * as ``LoginForm`` so the login/signup pair read as a single design
 * system. Adds a name field and terms checkbox that login doesn't
 * need.
 *
 * Apple/Microsoft buttons no-op with a translated "coming soon"
 * notice (the BFF only ships Google OAuth today).
 */
export default function SignupForm() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { i18n, t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError(t("auth.termsRequired", { defaultValue: "Please accept the terms to continue." }));
      setLoading(false);
      return;
    }

    try {
      const tokens: TokenResponse = await registerWithBackendSession(email, password, name);

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

      login(user);
      if (user.language) {
        void i18n.changeLanguage(user.language);
      }
      useDashboardStore.getState().setUser(user);

      const nextPath = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("next")
        : null;
      router.replace(getPostAuthRedirect(user, nextPath));
    } catch (err) {
      if (err && typeof err === "object" && "status" in err) {
        const apiErr = err as unknown as { code?: string; message?: string };
        switch (apiErr.code) {
          case "NETWORK_ERROR":
            setError(t("errors.network"));
            break;
          case "UNAUTHORIZED":
            setError(t("errors.accountCreationFailed"));
            break;
          case "CONFLICT":
            setError(t("auth.emailTaken", { defaultValue: "An account with this email already exists." }));
            break;
          case "SERVER_ERROR":
            setError(t("errors.server"));
            break;
          default:
            setError(apiErr.message ?? t("errors.signupFailed"));
        }
      } else {
        setError(err instanceof Error ? err.message : t("errors.signupFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Editorial headline cluster */}
      <header className="mb-8 sm:mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700/80">
          {t("auth.signupEyebrow")}
        </p>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.05] text-[#1F2A24] sm:text-[2.5rem]">
          {t("auth.createAccountTitle")}
          <span className="block italic text-emerald-700">{t("auth.signupHeadline")}</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5B6660] sm:text-[15px]">
          {t("auth.signupSubtitle")}
        </p>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Full name */}
        <label className="block">
          <span className="sr-only">{t("auth.fullName")}</span>
          <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#DAD7CF] bg-white/80 px-4 backdrop-blur-sm transition-all focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/15 hover:border-[#9CA39A]">
            <User className="shrink-0 text-[#5B6660] group-focus-within:text-emerald-700" size={20} aria-hidden />
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("auth.enterFullName")}
              className="w-full bg-transparent text-[15px] text-[#1F2A24] placeholder:text-[#9CA39A] focus:outline-none"
            />
          </div>
        </label>

        {/* Email */}
        <label className="block">
          <span className="sr-only">{t("auth.email")}</span>
          <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#DAD7CF] bg-white/80 px-4 backdrop-blur-sm transition-all focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/15 hover:border-[#9CA39A]">
            <Mail className="shrink-0 text-[#5B6660] group-focus-within:text-emerald-700" size={20} aria-hidden />
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.enterEmail")}
              className="w-full bg-transparent text-[15px] text-[#1F2A24] placeholder:text-[#9CA39A] focus:outline-none"
            />
          </div>
        </label>

        {/* Password */}
        <label className="block">
          <span className="sr-only">{t("auth.password")}</span>
          <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#DAD7CF] bg-white/80 px-4 backdrop-blur-sm transition-all focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/15 hover:border-[#9CA39A]">
            <Lock className="shrink-0 text-[#5B6660] group-focus-within:text-emerald-700" size={20} aria-hidden />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.createPassword")}
              className="w-full bg-transparent text-[15px] text-[#1F2A24] placeholder:text-[#9CA39A] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={t("auth.togglePassword")}
              aria-pressed={showPassword}
              className="shrink-0 rounded-md p-1.5 text-[#5B6660] transition-colors hover:bg-[#F1ECE2] hover:text-[#1F2A24] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </label>

        {/* Confirm password */}
        <label className="block">
          <span className="sr-only">{t("auth.passwordConfirm")}</span>
          <div className="group flex h-14 items-center gap-3 rounded-2xl border border-[#DAD7CF] bg-white/80 px-4 backdrop-blur-sm transition-all focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/15 hover:border-[#9CA39A]">
            <Lock className="shrink-0 text-[#5B6660] group-focus-within:text-emerald-700" size={20} aria-hidden />
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.passwordConfirmPlaceholder")}
              className="w-full bg-transparent text-[15px] text-[#1F2A24] placeholder:text-[#9CA39A] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={t("auth.togglePasswordConfirm")}
              aria-pressed={showConfirm}
              className="shrink-0 rounded-md p-1.5 text-[#5B6660] transition-colors hover:bg-[#F1ECE2] hover:text-[#1F2A24] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {showConfirm ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
        </label>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {/* Terms checkbox */}
        <label className="flex cursor-pointer items-start gap-3 pt-1 text-sm text-[#5B6660]">
          <span className="relative mt-0.5 inline-block shrink-0">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="peer sr-only"
            />
            <span className="block h-5 w-5 rounded-md border border-[#DAD7CF] bg-white transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40" />
            <svg
              viewBox="0 0 16 16"
              aria-hidden
              className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100"
            >
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="select-none leading-relaxed">
            {t("auth.agreeToTerms")}
          </span>
        </label>

        {/* Primary CTA */}
        <motion.button
          type="submit"
          disabled={loading || !acceptedTerms}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          className="relative mt-2 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-6 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)] transition-shadow hover:shadow-[0_14px_36px_-10px_rgba(16,185,129,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative">
            {loading ? t("actions.creatingAccount") : t("auth.signupCta")}
          </span>
          {!loading && (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          )}
        </motion.button>

        {/* OR divider */}
        <div className="flex items-center gap-4 py-1" aria-hidden>
          <span className="h-px flex-1 bg-[#E7E2D8]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#9CA39A]">
            {t("auth.continueWith")}
          </span>
          <span className="h-px flex-1 bg-[#E7E2D8]" />
        </div>

        {/* Social row */}
        <div className="grid grid-cols-1 gap-3">
          <GoogleSignInButton />
          <div className="grid grid-cols-2 gap-3">
            <SignupSocialButton
              label={t("auth.appleCta")}
              onClick={() => setError(t("auth.appleComingSoon"))}
              icon={<AppleGlyph />}
            />
            <SignupSocialButton
              label={t("auth.microsoftCta")}
              onClick={() => setError(t("auth.microsoftComingSoon"))}
              icon={<MicrosoftGlyph />}
            />
          </div>
        </div>

        {/* Secondary link */}
        <p className="pt-2 text-center text-sm text-[#5B6660]">
          {t("auth.alreadyHaveAccount")}{" "}
          <a
            href="/auth/login"
            className="font-semibold text-emerald-700 underline-offset-4 transition-colors hover:text-emerald-800 hover:underline focus:outline-none focus-visible:underline"
          >
            {t("actions.logIn")}
          </a>
        </p>
      </form>
    </div>
  );
}

function SignupSocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#DAD7CF] bg-white/70 px-4 text-sm font-medium text-[#1F2A24] backdrop-blur-sm transition-colors hover:border-[#9CA39A] hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15"
    >
      <span className="flex h-5 w-5 items-center justify-center text-[#1F2A24]">{icon}</span>
      <span className="truncate">{label}</span>
    </motion.button>
  );
}
