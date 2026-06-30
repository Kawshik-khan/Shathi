"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Slider — PR2 extended with accent-aware track + range.
 *
 * New prop: `accent` — when set, the range fills with the matching
 * `--color-accent-*` instead of sage. Defaults to "primary".
 *
 * Track is now sunken (`--color-bg-sunken`) for clearer depth on the
 * Botanical Dawn canvas.
 */
export type SliderAccent =
  | "primary"
  | "mood"
  | "habit"
  | "journal"
  | "sleep"
  | "energy"

export type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  accent?: SliderAccent
}

const accentVar: Record<SliderAccent, string> = {
  primary: "var(--color-primary)",
  mood: "var(--color-accent-mood)",
  habit: "var(--color-accent-habit)",
  journal: "var(--color-accent-journal)",
  sleep: "var(--color-accent-sleep)",
  energy: "var(--color-accent-energy)",
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  accent = "primary",
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const fillColor = accentVar[accent]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-accent={accent}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-pill bg-bg-sunken data-horizontal:h-1.5 data-horizontal:w-full data-vertical:h-full data-vertical:w-1.5"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute select-none data-horizontal:h-full data-vertical:w-full"
          style={{ backgroundColor: fillColor }}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-4 shrink-0 rounded-full border-2 border-bg-elevated shadow-card transition-colors select-none hover:ring-2 hover:ring-border-focus/30 focus-visible:ring-2 focus-visible:ring-border-focus/40 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          style={{ backgroundColor: fillColor }}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

