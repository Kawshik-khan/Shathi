import * as React from "react"
import { AlertCircleIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

/**
 * ErrorState — Section 6.7.
 *
 * Centered error affordance. The icon ring is tinted with
 * --color-feedback-danger and gently fades in via `motion-fade-in`.
 *
 * Always renders a primary "Try again" action when `onRetry` is set. A
 * secondary "Report" action is optional and should be wired to the
 * issue tracker.
 */
export type ErrorStateProps = React.ComponentProps<"div"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  /** Primary CTA handler. When omitted, no retry button is rendered. */
  onRetry?: () => void
  /** Whether the primary CTA is currently disabled (e.g. mid-retry). */
  retrying?: boolean
  /** Optional secondary CTA — typically opens an issue tracker. */
  reportAction?: React.ReactNode
  /** Optional custom icon (defaults to AlertCircleIcon). */
  icon?: LucideIcon
}

function ErrorState({
  className,
  title = "Something went wrong",
  description,
  onRetry,
  retrying = false,
  reportAction,
  icon: IconComponent = AlertCircleIcon,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn("motion-fade-in", className)}
      {...props}
    >
      <div data-slot="error-state-icon-frame" aria-hidden>
        <Icon icon={IconComponent} size={24} strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        <h2 data-slot="error-state-title">{title}</h2>
        {description && <p data-slot="error-state-description">{description}</p>}
      </div>

      {(onRetry || reportAction) && (
        <div className="motion-slide-up flex items-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              data-slot="error-state-retry"
              onClick={onRetry}
              disabled={retrying}
              {...(retrying ? { "aria-busy": "true" as const } : {})}
            >
              {retrying ? "Retrying…" : "Try again"}
            </button>
          )}
          {reportAction}
        </div>
      )}
    </div>
  )
}

export { ErrorState }
