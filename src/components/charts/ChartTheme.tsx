import * as React from "react"

/**
 * ChartTheme — recharts-compatible theming tokens (PR2).
 *
 * Existing chart files (BarChartSoft, LineChartSoft, etc.) read the
 * `--chart-1..5` CSS variables directly from `:root`, so this provider
 * is OPTIONAL. It exists for two purposes:
 *
 *   1. To give feature code a typed handle for "mood / habit / journal /
 *      sleep / energy" colors when building custom recharts payloads.
 *   2. To expose grid / axis / tooltip / motion tokens so chart code
 *      doesn't have to hand-roll them.
 *
 * Usage:
 *
 *     import { useChartTheme, chartColors } from "@/components/charts/ChartTheme"
 *     const theme = useChartTheme()
 *     <Line stroke={theme.series.mood} strokeWidth={2} />
 */

export type ChartFeatureColor =
  | "mood"
  | "habit"
  | "journal"
  | "sleep"
  | "energy"
  | "crisis"

export type ChartTheme = {
  /** Five chart series colors, in `--chart-1..5` order. */
  series: {
    primary: string
    secondary: string
    tertiary: string
    quaternary: string
    quinary: string
  }
  /** Feature-tinted series (semantic: "this line is mood data"). */
  feature: Record<ChartFeatureColor, string>
  /** Grid, axis, tooltip, label colors. Read from CSS vars at runtime. */
  grid: string
  axis: string
  axisLabel: string
  tooltipBg: string
  tooltipBorder: string
  tooltipText: string
  /** Recharts-compatible animation durations. */
  motion: {
    enter: number
    update: number
    leave: number
  }
}

const featureVar: Record<ChartFeatureColor, string> = {
  mood: "var(--color-accent-mood)",
  habit: "var(--color-accent-habit)",
  journal: "var(--color-accent-journal)",
  sleep: "var(--color-accent-sleep)",
  energy: "var(--color-accent-energy)",
  crisis: "var(--color-accent-crisis)",
}

function readVar(el: Element | null, name: string, fallback: string): string {
  if (typeof window === "undefined" || !el) return fallback
  const v = getComputedStyle(el).getPropertyValue(name).trim()
  return v || fallback
}

function buildTheme(root: Element | null): ChartTheme {
  return {
    series: {
      primary: readVar(root, "--chart-1", "var(--p-sage-500)"),
      secondary: readVar(root, "--chart-2", "var(--p-mood)"),
      tertiary: readVar(root, "--chart-3", "var(--p-journal)"),
      quaternary: readVar(root, "--chart-4", "var(--p-habit)"),
      quinary: readVar(root, "--chart-5", "var(--p-sleep)"),
    },
    feature: featureVar,
    grid: readVar(root, "--color-border-subtle", "rgba(0,0,0,0.08)"),
    axis: readVar(root, "--color-border-strong", "rgba(0,0,0,0.16)"),
    axisLabel: readVar(root, "--color-text-secondary", "var(--p-ink-600)"),
    tooltipBg: readVar(root, "--color-bg-elevated", "#FFFBF3"),
    tooltipBorder: readVar(root, "--color-border-subtle", "rgba(0,0,0,0.08)"),
    tooltipText: readVar(root, "--color-text-primary", "var(--p-ink-900)"),
    motion: {
      enter: 500,
      update: 300,
      leave: 200,
    },
  }
}

/**
 * useChartTheme — returns the current chart theme by reading CSS vars
 * from the nearest [data-chart-root] (or document root) and observing
 * the theme attribute for live dark-mode updates.
 */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = React.useState<ChartTheme>(() => {
    if (typeof document === "undefined") {
      return buildTheme(null)
    }
    const root = document.querySelector("[data-chart-root]") ?? document.documentElement
    return buildTheme(root)
  })

  React.useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.querySelector("[data-chart-root]") ?? document.documentElement

    const refresh = () => setTheme(buildTheme(root))

    // Refresh on theme / daytime transitions (CSS vars may have changed).
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-daytime", "data-theme"],
    })

    // Refresh when fonts load (text reflow can shift axes).
    if ("fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => undefined)
    }

    return () => observer.disconnect()
  }, [])

  return theme
}

/**
 * ChartThemeProvider — convenience wrapper. Re-themes child charts on
 * data-daytime / dark mode switches. Renders nothing.
 */
export function ChartThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useChartTheme()
  return (
    <ChartThemeContext.Provider value={theme}>{children}</ChartThemeContext.Provider>
  )
}

const ChartThemeContext = React.createContext<ChartTheme | null>(null)

/** Reads the chart theme from context. Falls back to the bare defaults. */
export function useChartThemeContext(): ChartTheme {
  return React.useContext(ChartThemeContext) ?? buildTheme(null)
}

/**
 * Static convenience map — use when you only need a color and don't
 * want to subscribe to the theme. These reference CSS vars directly,
 * so they update live without re-renders.
 */
export const chartColors = {
  series: {
    1: "var(--chart-1)",
    2: "var(--chart-2)",
    3: "var(--chart-3)",
    4: "var(--chart-4)",
    5: "var(--chart-5)",
  },
  feature: featureVar,
} as const

export { ChartThemeContext }
