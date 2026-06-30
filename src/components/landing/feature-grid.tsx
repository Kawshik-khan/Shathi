"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { AICompanionCard } from "@/components/widgets/ai-companion-card";
import { SleepTracking } from "@/components/widgets/sleep-tracking";
import { MoodPreviewCard } from "@/components/landing/preview-widgets";

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative section-y page-x"
    >
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
            <Icon icon={Sparkles} size={12} className="text-accent-energy" />
            Comprehensive
          </span>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight lg:text-4xl">
            Comprehensive Wellness Tracking
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary lg:text-lg">
            Monitor every aspect of your mental and physical health with our
            AI-powered dashboard.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8"
        >
          {/* AI Companion - Full width on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <AICompanionCard />
          </motion.div>

          {/* Mood Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <MoodPreviewCard />
          </motion.div>

          {/* Sleep Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <SleepTracking />
          </motion.div>

          {/* Coming Soon placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card
              variant="feature"
              accent="energy"
              className="h-full items-center justify-center text-center"
            >
              <CardHeader className="items-center">
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  More wellness features on the way.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
