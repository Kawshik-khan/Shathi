"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Toggle — sage-track Radix primitive.
 *
 * When `pressed` is true, the track fills with `--color-primary` and a
 * thumb slides to the right via `data-[state=on]:translate-x-*`. When
 * off, the track is sunken and the thumb is neutral. Honors `disabled`
 * and dark mode automatically.
 *
 * The thumb is rendered with a `::before` pseudo-element so callers can
 * wrap any children (icons, status text) without losing the switch
 * affordance.
 */
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(function Toggle({ className, children, ...props }, ref) {
  return (
    <TogglePrimitive.Root
      ref={ref}
      data-slot="toggle"
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-pill border border-transparent bg-bg-sunken transition-colors outline-none before:absolute before:left-0.5 before:size-5 before:rounded-full before:bg-bg-elevated before:shadow-card before:transition-transform before:content-[''] data-disabled:cursor-not-allowed data-disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-border-focus/40 data-[state=on]:bg-primary data-[state=on]:before:translate-x-[22px]",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive.Root>
  )
})

export { Toggle }