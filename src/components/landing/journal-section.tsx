"use client";

import { motion } from "framer-motion";
import { JournalPreview } from "@/components/widgets/journal-preview";
import { DailyCheckIn } from "@/components/widgets/daily-check-in";
import { Target, TrendingUp } from "lucide-react";

export function JournalSection() {
  return (
    <section id="journal" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Reflect & Grow
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Document your journey and gain insights into your emotional well-being
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {/* Journal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <JournalPreview />
          </motion.div>

          {/* Wellness Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 hover-lift"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Wellness Score</h3>
              <Target className="w-5 h-5 text-primary" />
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary mb-2">85</div>
              <div className="text-sm text-muted-foreground">Out of 100</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Mood</span>
                <span className="text-primary">8/10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Sleep</span>
                <span className="text-primary">7.5h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Habits</span>
                <span className="text-primary">90%</span>
              </div>
            </div>

            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+5% from last week</span>
            </div>
          </motion.div>

          {/* Daily Check-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <DailyCheckIn />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
