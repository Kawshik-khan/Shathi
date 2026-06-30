import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Icon — unified lucide-react facade (PR2).
 *
 * Enforces a consistent visual weight across the app:
 *   - strokeWidth = 1.75 by default (tighter than lucide's 2 default)
 *   - sizes snap to the design scale: 12 / 16 / 20 / 24
 *   - aria handling: if no aria-label/title, it is aria-hidden by default
 *
 * Existing call sites that import icons directly from "lucide-react" keep
 * working. New code should prefer:
 *
 *     import { Icon } from "@/components/ui/icon"
 *     import { Heart } from "lucide-react"
 *     <Icon icon={Heart} size={20} aria-label="Mood" />
 */
type IconSize = 12 | 16 | 20 | 24 | 32

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "children"> & {
  /** The lucide-react icon component to render. */
  icon: LucideIcon
  /** Design-system size in px. Defaults to 16. */
  size?: IconSize
  /** Stroke width. Defaults to 1.75 (lighter than lucide's 2). */
  strokeWidth?: number
  /** Accessible label. If provided, icon is announced. */
  "aria-label"?: string
  /** Decorative-only mode (default when no label is set). */
  "aria-hidden"?: boolean
}

const sizeMap: Record<IconSize, string> = {
  12: "size-3",
  16: "size-4",
  20: "size-5",
  24: "size-6",
  32: "size-8",
}

function Icon({
  icon: IconComponent,
  size = 16,
  strokeWidth = 1.75,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  ...props
}: IconProps) {
  const a11yProps = ariaLabel
    ? { "aria-label": ariaLabel, role: "img" as const }
    : { "aria-hidden": ariaHidden ?? true, focusable: false }

  return (
    <IconComponent
      data-slot="icon"
      data-size={size}
      strokeWidth={strokeWidth}
      className={cn(sizeMap[size], "shrink-0", className)}
      {...a11yProps}
      {...props}
    />
  )
}

export { Icon }
