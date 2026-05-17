"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore, useDashboardStore } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { LoginRequest, TokenResponse, AuthUser } from "@/types";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const signupRequest = { name, email, password } as LoginRequest & { name: string };
      const tokens: TokenResponse = await apiFetch<TokenResponse>('/api/v1/auth/register', {
        method: "POST",
        body: JSON.stringify(signupRequest),
      });

      // Use user data from response
      const user: AuthUser = {
        id: tokens.user!.id,
        email: tokens.user!.email,
        name: tokens.user!.name,
        plan: tokens.user!.plan as 'free' | 'premium',
        avatar: tokens.user!.avatar_url,
      };

      login(user, tokens);
      useDashboardStore.getState().setUser(user);
      router.push("/dashboard");
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as unknown as { code?: string; message?: string };
        switch (apiErr.code) {
          case 'NETWORK_ERROR':
            setError('Network error - please check your connection');
            break;
          case 'UNAUTHORIZED':
            setError('Account creation failed');
            break;
          case 'SERVER_ERROR':
            setError('Server error - please try again later');
            break;
          default:
          setError(apiErr.message ?? "Signup failed");
        }
      } else {
        setError(err instanceof Error ? err.message : "Signup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="text-center mb-5 sm:mb-6">
        <div className="w-8 sm:w-9 h-8 sm:h-9 mx-auto rounded-full bg-[#EAF6EA] flex items-center justify-center text-base sm:text-lg">✦</div>
        <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#0F172A]">Create your account</h2>
        <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed">Join Sathi and start your wellness journey.</p>
      </div>

      <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Full Name</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <User className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Email</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Mail className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Password</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Lock className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              required
            />
            <button type="button" aria-label="Toggle password visibility" onClick={() => setShow((s) => !s)} className="text-[#94A3B8] flex-shrink-0 hover:text-[#0F172A] transition-colors">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="sr-only">Confirm Password</span>
          <div className="flex items-center gap-3 border border-gray-200 rounded-lg sm:rounded-xl px-3 py-2 sm:py-3 bg-white hover:border-gray-300 transition-colors">
            <Lock className="text-[#94A3B8] flex-shrink-0" size={18} />
            <input
              className="w-full outline-none text-sm sm:text-base text-[#0F172A] placeholder:text-[#94A3B8] bg-transparent"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirm ? "text" : "password"}
              required
            />
            <button type="button" aria-label="Toggle confirm password visibility" onClick={() => setShowConfirm((s) => !s)} className="text-[#94A3B8] flex-shrink-0 hover:text-[#0F172A] transition-colors">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <motion.button
          whileHover={{ y: -2 }}
          disabled={loading}
          className="w-full py-2.5 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base bg-gradient-to-r from-[#5DBB63] to-[#22C55E] shadow-sm hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </motion.button>

        <div className="flex items-center gap-3 my-3 sm:my-4">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs sm:text-sm text-[#94A3B8] px-1">Or continue with</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button className="py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium">Google</button>
          <button className="py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium">Apple</button>
          <button className="py-2.5 sm:py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium">Email</button>
        </div>

        <p className="text-center text-xs sm:text-sm text-[#64748B] mt-4 sm:mt-5">Already have an account? <a href="/auth/login" className="text-[#22C55E] font-medium hover:underline">Log in</a></p>
      </form>
    </div>
  );
}
