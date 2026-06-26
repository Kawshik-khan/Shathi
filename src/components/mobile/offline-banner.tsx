'use client';

import { WifiOff, RefreshCcw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const online = useOnlineStatus();
  const { t } = useTranslation();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="lg:hidden sticky top-14 z-40 flex items-center justify-between gap-3 border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex min-w-0 items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {t('mobile.offline', "You're offline. Changes will sync when reconnected.")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="focus-ring btn-haptic touch-target inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
        aria-label={t('mobile.retry', 'Retry')}
      >
        <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
        {t('mobile.retry', 'Retry')}
      </button>
    </div>
  );
}
