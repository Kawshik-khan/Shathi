"use client";

import { motion } from "framer-motion";
import { AICompanionCard } from "@/components/widgets/ai-companion-card";
import { SleepTracking } from "@/components/widgets/sleep-tracking";
import { MoodPreviewCard } from "@/components/landing/preview-widgets";

// Note: Using existing widgets which handle their own mock data

export function FeatureGrid() {
  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Comprehensive Wellness Tracking
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Monitor every aspect of your mental and physical health with our AI-powered dashboard
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
          {/* AI Companion - Full width on mobile, 3 cols on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <AICompanionCard />
          </motion.div>

          {/* Mood Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <MoodPreviewCard />
          </motion.div>

          {/* Sleep Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <SleepTracking />
          </motion.div>

          {/* Placeholder for third column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 hover-lift"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground">More wellness features on the way</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
