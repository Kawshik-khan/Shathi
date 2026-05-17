"use client"

import Header from "@/components/insights/Header"
import OverviewGrid from "@/components/insights/OverviewGrid"
import AdvancedGrid from "@/components/insights/AdvancedGrid"
import Recommendations from "@/components/insights/Recommendations"

export function InsightsContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Header />
      <OverviewGrid />
      <AdvancedGrid />
      <Recommendations />
    </div>
  )
}
