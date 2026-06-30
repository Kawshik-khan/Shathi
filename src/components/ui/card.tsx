import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — PR2 extended variant set.
 *
 * Adds two new props:
 *   - `variant`: "flat" | "elevated" | "feature" | "sunken" (default: "elevated")
 *   - `accent`:  "none" | "mood" | "habit" | "journal" | "sleep" | "energy"
 *
 * Existing call sites that pass `size="default|sm"` continue to work —
 * the original glass-card surface is now the "elevated" variant.
 * "sunken" is reserved for non-input recessed surfaces (e.g. greeting strip).
 */
type CardVariant = "flat" | "elevated" | "feature" | "sunken"
type CardAccent =
  | "none"
  | "mood"
  | "habit"
  | "journal"
  | "sleep"
  | "energy"

export type CardProps = React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  variant?: CardVariant
  accent?: CardAccent
}

const variantClass: Record<CardVariant, string> = {
  flat: "surface-card-flat",
  elevated: "surface-card-elevated",
  feature: "surface-card-feature",
  sunken: "surface-card-sunken",
}

function Card({
  className,
  size = "default",
  variant = "elevated",
  accent = "none",
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-accent={accent}
      className={cn(
        variantClass[variant],
        "group/card flex flex-col gap-8 overflow-hidden py-8 text-sm text-card-foreground has-[>img:first-child]:pt-0 data-[size=sm]:gap-5 data-[size=sm]:py-5 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-none px-8 group-data-[size=sm]/card:px-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-8 group-data-[size=sm]/card:[.border-b]:pb-5",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-wider uppercase",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-8 group-data-[size=sm]/card:px-5", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-8 group-data-[size=sm]/card:px-5 [.border-t]:pt-8 group-data-[size=sm]/card:[.border-t]:pt-5",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  type CardVariant,
  type CardAccent,
}

