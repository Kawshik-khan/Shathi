import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * EmptyState — Section 6.7 of UI_REDESIGN_PLAN.
 *
 * A centered, low-density affordance for empty views. Uses Fraunces for
 * the headline (serif warmth) and Inter for the helper. Single CTA only.
 *
 * No illustrations are bundled — callers supply the line-art icon as
 * `icon` (lucide-react component). Color is controlled via `tone` which
 * resolves to a `.tone-*` utility (see globals.css).
 */
export type EmptyStateTone =
  | "neutral"
  | "mood"
  | "habit"
  | "journal"
  | "sleep"
  | "energy"

export type EmptyStateProps = React.ComponentProps<"div"> & {
  /** Headline (Fraunces). */
  title: React.ReactNode
  /** Helper text (Inter). */
  description?: React.ReactNode
  /** Single primary CTA. */
  action?: React.ReactNode
  /** Line-art lucide icon. Rendered at 48px inside a 96px frame. */
  icon?: LucideIcon
  /** Color tone for the icon + frame. Defaults to "neutral". */
  tone?: EmptyStateTone
}

const toneClass: Record<EmptyStateTone, string> = {
  neutral: "tone-neutral",
  mood: "tone-mood",
  habit: "tone-habit",
  journal: "tone-journal",
  sleep: "tone-sleep",
  energy: "tone-energy",
}

function EmptyState({
  className,
  title,
  description,
  action,
  icon: IconComponent,
  tone = "neutral",
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      data-tone={tone}
      className={cn("motion-fade-in", className)}
      {...props}
    >
      {IconComponent && (
        <div data-slot="empty-state-frame">
          <IconComponent
            strokeWidth={1.5}
            className={cn("size-12", toneClass[tone])}
            aria-hidden
          />
        </div>
      )}

      <div className="space-y-2">
        <h2 data-slot="empty-state-title">{title}</h2>
        {description && <p data-slot="empty-state-description">{description}</p>}
      </div>

      {action && <div className="motion-slide-up pt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
