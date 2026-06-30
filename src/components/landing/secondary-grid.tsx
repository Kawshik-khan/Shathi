"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { DailyGoals } from "@/components/widgets/daily-goals";
import { TrainingCalendar } from "@/components/widgets/training-calendar";
import { AIInsight } from "@/components/widgets/ai-insight";
import { HabitsPreviewCard } from "@/components/landing/preview-widgets";

export function SecondaryGrid() {
  return (
    <section id="how-it-works" className="relative section-y page-x">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="section-eyebrow mb-4">
            <Icon icon={Target} size={12} className="text-accent-energy" />
            Habits &amp; Goals
          </span>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight lg:text-4xl">
            Build Healthy Habits
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary lg:text-lg">
            Track your progress and stay motivated with personalized goals and
            insights.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Daily Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <DailyGoals />
          </motion.div>

          {/* Habits Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <HabitsPreviewCard />
          </motion.div>

          {/* Training Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <TrainingCalendar />
          </motion.div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <AIInsight />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
