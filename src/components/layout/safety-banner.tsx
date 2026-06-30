'use client';

/**
 * App-wide emergency / safety disclaimer (PR3 redesign).
 *
 * - Renders a non-blocking-but-always-visible banner on every
 *   authenticated page. Acknowledging hides it for the session and
 *   surfaces again on the next login (we never persist acknowledgement
 *   across sessions).
 * - Uses feedback-warning tokens (`--color-feedback-warning`,
 *   `--color-feedback-warning-soft`) so the alert tone is consistent
 *   with other warning surfaces.
 * - The acknowledge/dismiss controls use the redesigned `Button`
 *   variants so the visual hierarchy reads as:
 *      primary acknowledge  →  outline phone 1  →  outline phone 2
 *
 * Persistence: `sessionStorage.sathi:safety-banner:acknowledged` (with
 * a localStorage mirror for support staff visibility).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Phone, ShieldCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';

import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <motion.aside
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="region"
      aria-label={isBengali ? 'নিরাপত্তা বিজ্ঞপ্তি' : 'Safety notice'}
      data-slot="safety-banner"
      data-state="warning"
      className={cn(
        'mb-6 flex flex-col gap-3 rounded-[20px] border px-4 py-3 shadow-flat sm:flex-row sm:items-center sm:justify-between',
        'border-feedback-warning/40 bg-feedback-warning/10 text-text-primary',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-feedback-warning/20 text-feedback-warning"
        >
          <Icon icon={AlertTriangle} size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {isBengali
              ? 'শাথী পেশাদার সহায়তার বিকল্প নয়'
              : 'Shathi is not a substitute for professional help'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
            {isBengali
              ? 'যদি আপনি বা আপনার পরিচিত কেউ নিরাপত্তাহীন বোধ করেন, অনুগ্রহ করে এখনই জরুরি সহায়তায় যোগাযোগ করুন।'
              : 'If you or someone you know is in immediate danger, please contact emergency support now.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Button asChild variant="outline" size="sm">
          <a
            href="tel:109"
            aria-label={
              isBengali
                ? 'বাংলাদেশ জাতীয় হেল্পলাইন ১০৯'
                : 'Bangladesh National Helpline 109'
            }
          >
            <Icon icon={Phone} size={12} aria-hidden />
            109
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href="tel:999"
            aria-label={
              isBengali ? 'জরুরি সেবা ৯৯৯' : 'Emergency Services 999'
            }
          >
            <Icon icon={Phone} size={12} aria-hidden />
            999
          </a>
        </Button>
        <Button variant="primary" size="sm" onClick={handleAcknowledge}>
          <Icon icon={ShieldCheck} size={12} aria-hidden />
          {isBengali ? 'বুঝেছি' : 'I understand'}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleAcknowledge}
          aria-label={isBengali ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss notice'}
        >
          <Icon icon={X} size={12} aria-hidden />
        </Button>
      </div>
    </motion.aside>
  );
}
