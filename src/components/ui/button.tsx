import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button — PR2 extended variant set.
 *
 * New canonical variant names: `primary | secondary | ghost | outline | danger`.
 * Legacy variant names (`default`, `outline`, `secondary`, `ghost`,
 * `destructive`, `link`) are kept as exact aliases of the new ones so
 * every existing caller keeps working.
 *
 * Visual upgrades (additive):
 *   - pill radius (via `rounded-pill`)
 *   - `motion-press` feedback on click
 *   - `focus-visible:ring` uses the semantic `--color-border-focus`
 *   - feature-tone variants (`mood`, `habit`, `journal`, `sleep`,
 *     `energy`) tint via `--color-accent-*`
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-pill border border-transparent bg-clip-padding text-xs font-semibold tracking-widest whitespace-nowrap uppercase transition-all outline-none select-none motion-press focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        // --- PR2 canonical names ---
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/85 shadow-flat hover:shadow-card",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        outline:
          "border-border bg-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-input/30",
        danger:
          "bg-[var(--color-feedback-danger)] text-[var(--color-text-inverse)] hover:bg-[color:var(--color-feedback-danger)]/90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-feedback-danger)]/30",

        // --- legacy aliases (preserved so existing call sites keep working) ---
        default: "bg-primary text-primary-foreground hover:bg-primary/85 shadow-flat hover:shadow-card",
        destructive:
          "bg-[var(--color-feedback-danger)] text-[var(--color-text-inverse)] hover:bg-[color:var(--color-feedback-danger)]/90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-feedback-danger)]/30",
        link: "text-primary underline underline-offset-4 hover:underline bg-transparent",

        // --- feature-tone variants (new — opt-in per page) ---
        "tone-mood":
          "bg-[var(--color-accent-mood)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-accent-mood)]/30",
        "tone-habit":
          "bg-[var(--color-accent-habit)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-accent-habit)]/30",
        "tone-journal":
          "bg-[var(--color-accent-journal)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-accent-journal)]/30",
        "tone-sleep":
          "bg-[var(--color-accent-sleep)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-accent-sleep)]/30",
        "tone-energy":
          "bg-[var(--color-accent-energy)] text-[var(--color-text-inverse)] hover:opacity-90 shadow-flat hover:shadow-card focus-visible:ring-[var(--color-accent-energy)]/30",
      },
      size: {
        default:
          "h-10 gap-1.5 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 gap-1.5 px-8 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }


