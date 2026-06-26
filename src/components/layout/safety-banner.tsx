'use client';

/**
 * App-wide emergency / safety disclaimer.
 *
 * Renders a non-blocking-but-always-visible banner on every authenticated
 * page. Acknowledging the banner hides it for the rest of the session but
 * surfaces again on the next login. The intent is to make sure users always
 * know Shathi is not a substitute for professional help and to give them
 * immediate access to crisis hotlines (Bangladesh 109 / 999).
 *
 * Persistence key: `sathi:safety-banner:acknowledged` — value is the ISO
 * timestamp of the acknowledgement. We re-show on a new session (login)
 * because we never persist an acknowledgement across sessions; the only
 * way to keep it hidden is to not log out.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Phone, ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'sathi:safety-banner:acknowledged';
const SESSION_KEY = 'sathi:safety-banner:session-acknowledged';

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function alreadyAcknowledgedThisSession(): boolean {
  const storage = safeStorage();
  if (!storage) {
    return false;
  }
  return Boolean(storage.getItem(SESSION_KEY));
}

function markAcknowledgedThisSession(): void {
  const storage = safeStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(SESSION_KEY, new Date().toISOString());
    // Mirror to localStorage so support staff can see acknowledgement history.
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* storage disabled / quota — ignore */
  }
}

export function SafetyBanner() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Defer to the next paint so the banner doesn't cause a layout jump on
    // first render of the dashboard shell.
    const raf = requestAnimationFrame(() => {
      setVisible(!alreadyAcknowledgedThisSession());
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!visible) {
    return null;
  }

  const isBengali = i18n.language === 'bn';

  const handleAcknowledge = () => {
    markAcknowledgedThisSession();
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={isBengali ? 'নিরাপত্তা বিজ্ঞপ্তি' : 'Safety notice'}
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {isBengali
              ? 'শাথী পেশাদার সহায়তার বিকল্প নয়'
              : 'Shathi is not a substitute for professional help'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed">
            {isBengali
              ? 'যদি আপনি বা আপনার পরিচিত কেউ নিরাপত্তাহীন বোধ করেন, অনুগ্রহ করে এখনই জরুরি সহায়তায় যোগাযোগ করুন।'
              : 'If you or someone you know is in immediate danger, please contact emergency support now.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <a
          href="tel:109"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
          aria-label={isBengali ? 'বাংলাদেশ জাতীয় হেল্পলাইন ১০৯' : 'Bangladesh National Helpline 109'}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          109
        </a>
        <a
          href="tel:999"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
          aria-label={isBengali ? 'জরুরি সেবা ৯৯৯' : 'Emergency Services 999'}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          999
        </a>
        <button
          type="button"
          onClick={handleAcknowledge}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {isBengali ? 'বুঝেছি' : 'I understand'}
        </button>
        <button
          type="button"
          onClick={handleAcknowledge}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-amber-800 transition-colors hover:bg-amber-200/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
          aria-label={isBengali ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss notice'}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
