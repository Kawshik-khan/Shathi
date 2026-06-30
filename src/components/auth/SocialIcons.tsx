"use client";

import React from "react";

/**
 * Single-color brand glyphs for Apple and Microsoft.
 *
 * Kept separate from ``LoginForm.tsx`` so the main form payload stays
 * small enough to survive any single-tool transport limit; both
 * glyphs are 20×20, no animation, ignore focus since the buttons that
 * wrap them already have ``aria-label``.
 */
export function AppleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.41 2.18-1.23 3.12-.94 1.07-2.07 1.69-3.39 1.69-.07-1.16.39-2.27 1.18-3.22.79-.95 2.13-1.62 3.44-1.59zM20.5 17.18c-.55 1.27-1.21 2.46-2 3.55-1.05 1.46-1.92 2.46-2.6 2.99-.99.74-2.05 1.13-3.16 1.16-.81 0-1.79-.24-2.92-.71-1.13-.48-2.18-.71-3.13-.73-.99.02-2.07.25-3.22.73-1.16.47-2.09.71-2.81.73-1.07-.05-2.12-.43-3.15-1.16-.74-.59-1.65-1.62-2.74-3.11-1.17-1.6-2.13-3.46-2.87-5.57-.81-2.32-1.21-4.55-1.21-6.69 0-2.47.53-4.6 1.6-6.38 1.07-1.79 2.49-2.99 4.27-3.62.84-.21 1.94-.31 3.3-.31.81 0 1.83.25 3.05.74 1.22.49 2 .74 2.34.74.26 0 1.13-.29 2.6-.87 1.4-.52 2.58-.74 3.55-.65 2.62.21 4.59 1.25 5.91 3.13-2.35 1.43-3.51 3.43-3.48 6 .03 2.13.79 3.9 2.28 5.31.68.65 1.43 1.15 2.27 1.51-.18.51-.37 1-.59 1.46z" />
    </svg>
  );
}

export function MicrosoftGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}
