"use client";

import React from "react";
import { usePathname } from "next/navigation";
import OrbIllustration from "../../components/illustrations/OrbIllustration";

type Props = { children: React.ReactNode };

export default function AuthLayout({ children }: Props) {
  const pathname = usePathname();
  const isSignup = pathname?.includes('/signup');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-5xl xl:max-w-7xl rounded-2xl sm:rounded-3xl lg:rounded-4xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden bg-white/60 backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Panel - Illustration (hidden on mobile/tablet, visible on lg+) */}
          <div className="hidden lg:flex p-6 sm:p-8 lg:p-10 xl:p-12 flex-col justify-center gap-6 sm:gap-7 lg:gap-8 bg-gradient-to-b from-[#F1F5F7] to-[#EAF2F4]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/70 flex items-center justify-center shadow-sm text-lg sm:text-xl">🌿</div>
                <div className="text-sm sm:text-base font-medium text-[#0F172A]">Shathi</div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 sm:gap-3 bg-[#EAF2F4] text-[#2C6373] px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-[#5F9DB0] block" />
                <span>Your AI Companion for Mind & Body</span>
              </div>

              <h1 className="mt-4 sm:mt-6 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] leading-tight sm:leading-snug">
                {isSignup ? 'Join Shathi' : 'Welcome back'}<br />to Shathi <span className="text-[#5F9DB0]">🌿</span>
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-[#475569] max-w-md leading-relaxed">
                {isSignup ? 'Start your journey towards a healthier, happier you.' : 'Continue your journey towards a healthier, happier you.'}
              </p>
            </div>

            <div className="mt-4 sm:mt-6 lg:mt-8">
              <OrbIllustration />
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

