import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * LoadingState — Section 6.7.
 *
 * A shimmer skeleton that mirrors the eventual content shape. Uses
 * `motion-skeleton` keyframe (defined in globals.css). Honors
 * `prefers-reduced-motion`.
 *
 * Variants:
 *   - "block"  (default) — full-width neutral rectangle
 *   - "rows"   — vertical list of bar rows
 *   - "card"   — pre-shaped card skeleton
 */
export type LoadingStateProps = React.ComponentProps<"div"> & {
  variant?: "block" | "rows" | "card"
  /** Row count for variant="rows". Defaults to 3. */
  rows?: number
  /** Tailwind height class for the primary block. Defaults to "h-32". */
  heightClass?: string
  /** Accessible label. Defaults to "Loading…". */
  label?: string
}

function LoadingState({
  className,
  variant = "block",
  rows = 3,
  heightClass = "h-32",
  label = "Loading…",
  ...props
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      data-slot="loading-state"
      data-variant={variant}
      className={cn("w-full", className)}
      {...props}
    >
      {variant === "block" && (
        <div
          data-slot="loading-skeleton"
          className={cn("motion-skeleton w-full", heightClass)}
        />
      )}

      {variant === "rows" && (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              data-slot="loading-row"
              className={cn(
                "motion-skeleton",
                i === rows - 1 ? "w-2/3" : "w-full"
              )}
            />
          ))}
        </div>
      )}

      {variant === "card" && (
        <div data-slot="loading-card">
          <div
            data-slot="loading-row"
            className="motion-skeleton h-5 w-1/3"
          />
          <div data-slot="loading-row" className="motion-skeleton h-3 w-full" />
          <div
            data-slot="loading-row"
            className="motion-skeleton h-3 w-5/6"
          />
          <div
            data-slot="loading-row"
            className="motion-skeleton h-3 w-2/3"
          />
        </div>
      )}
    </div>
  )
}

export { LoadingState }
