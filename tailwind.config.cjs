/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Legacy brand palette — kept working for the migration window.
           New code should prefer the `bg-bg-card`, `text-text-primary`,
           `bg-accent-mood`, etc. semantic utilities exposed from
           globals.css via @theme inline. */
        primary: {
          DEFAULT: '#5A8D7B',
          light: '#8AB7A6',
          soft: '#CDE2DA',
          muted: '#EBF5F1',
        },
        Sathity: {
          50: '#F8F6F2',
          100: '#F2EFE9',
          200: '#E8E4DD',
        },
      },
      fontFamily: {
        /* `font-display` and `font-stats` resolve to the CSS variables
           wired in layout.tsx. Fallbacks are intentionally broad so we
           degrade gracefully if the variable is unset. */
        display: [
          'var(--font-fraunces)',
          'var(--font-geist)',
          'Georgia',
          'serif',
        ],
        stats: [
          'var(--font-jetbrains)',
          'var(--font-geist-mono)',
          'ui-monospace',
          'monospace',
        ],
      },
      borderRadius: {
        '4xl': '2.5rem',
        pill: 'var(--radius-pill)',
        card: 'var(--radius-card)',
        tile: 'var(--radius-tile)',
      },
      boxShadow: {
        soft: '0 10px 40px rgba(0,0,0,0.04)',
        glow: '0 6px 20px rgba(34,197,94,0.12)',
        flat: 'var(--shadow-flat)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        overlay: 'var(--shadow-overlay)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      transitionDuration: {
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
      },
      zIndex: {
        base: '0',
        raised: '10',
        sticky: '100',
        overlay: '1000',
        toast: '1100',
        tooltip: '1200',
        drag: '1300',
        crisis: '9999',
      },
    },
  },
  plugins: [],
};

