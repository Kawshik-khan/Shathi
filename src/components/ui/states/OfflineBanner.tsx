"use client"

import * as React from "react"
import { WifiOffIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"

/**
 * OfflineBanner — Section 6.7.
 *
 * Sticky, low-noise strip that mounts at the top of the page when the
 * browser reports offline status. Uses `navigator.onLine` plus
 * `online`/`offline` window events.
 *
 * Mount once near the root of the layout — it self-hides when online.
 * Renders via a portal-free fixed strip; safe inside flex layouts.
 */
export type OfflineBannerProps = React.ComponentProps<"div">

function OfflineBanner({ className, ...props }: OfflineBannerProps) {
  const [online, setOnline] = React.useState(true)

  React.useEffect(() => {
    if (typeof navigator === "undefined") return

    const update = () => setOnline(navigator.onLine)
    update()

    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="offline-banner"
      data-state="offline"
      className={cn("motion-slide-down", className)}
      {...props}
    >
      <Icon icon={WifiOffIcon} size={16} strokeWidth={1.75} />
      <span className="font-medium tracking-wide">You’re offline</span>
      <span data-slot="offline-banner-hint">
        — changes will sync when you reconnect.
      </span>
    </div>
  )
}

export { OfflineBanner }
