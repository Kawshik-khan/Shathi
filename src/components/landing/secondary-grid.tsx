"use client";

import { motion } from "framer-motion";
import { DailyGoals } from "@/components/widgets/daily-goals";
import { HabitsTracker } from "@/components/widgets/habits-tracker";
import { TrainingCalendar } from "@/components/widgets/training-calendar";
import { AIInsight } from "@/components/widgets/ai-insight";

export function SecondaryGrid() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Build Healthy Habits
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your progress and stay motivated with personalized goals and insights
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Daily Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <DailyGoals />
          </motion.div>

          {/* Habits Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <HabitsTracker />
          </motion.div>

          {/* Training Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <TrainingCalendar />
          </motion.div>

          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <AIInsight />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
