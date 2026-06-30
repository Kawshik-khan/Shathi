import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — PR2 rebuilt as sunken-surface form field.
 *
 * Defaults to the new style:
 *   - 44px height (h-11)
 *   - sunken background (--color-bg-sunken)
 *   - 1px subtle inset border + focus ring in --color-border-focus
 *   - error shake via motion-shake
 *
 * Pass `variant="underline"` to opt back into the original shadcn
 * underline style. Pass `helperText` / `errorText` for inline feedback.
 * Existing callers that don't pass these props are unaffected.
 */
export type InputProps = React.ComponentProps<"input"> & {
  variant?: "sunken" | "underline"
  helperText?: React.ReactNode
  errorText?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    type = "text",
    variant = "sunken",
    helperText,
    errorText,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref
) {
  const isInvalid =
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    Boolean(errorText)

  const input = (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      data-variant={variant}
      aria-invalid={isInvalid ? "true" : undefined}
      className={cn(
        variant === "sunken" && "input-sunken",
        variant === "underline" &&
          "h-10 w-full min-w-0 border border-transparent border-b-input bg-transparent px-0 py-1 text-base transition-[color,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-b-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm dark:aria-invalid:border-b-destructive/50",
        "w-full min-w-0 text-base md:text-sm",
        className
      )}
      {...props}
    />
  )

  if (!helperText && !errorText) return input

  return (
    <div className="w-full">
      {input}
      {errorText ? (
        <p className="input-error-text">{errorText}</p>
      ) : helperText ? (
        <p className="input-helper">{helperText}</p>
      ) : null}
    </div>
  )
})

export { Input }

