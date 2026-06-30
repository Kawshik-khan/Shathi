"use client";

import { motion } from "framer-motion";
import { BookHeart, Target, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { DailyCheckIn } from "@/components/widgets/daily-check-in";
import { JournalPreviewCard } from "@/components/landing/preview-widgets";

export function JournalSection() {
  return (
    <section
      id="journal"
      className="relative section-y page-x bg-bg-card/50"
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
            <Icon icon={BookHeart} size={12} className="text-accent-journal" />
            Reflect &amp; Grow
          </span>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight lg:text-4xl">
            Reflect &amp; Grow
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary lg:text-lg">
            Document your journey and gain insights into your emotional
            well-being.
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
          {/* Journal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <JournalPreviewCard />
          </motion.div>

          {/* Wellness Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card variant="feature" accent="energy" className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Wellness Score</CardTitle>
                <div className="ml-auto">
                  <Icon icon={Target} size={20} className="text-accent-energy" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="font-display text-5xl font-medium tracking-tight text-text-primary">
                    85
                  </div>
                  <div className="text-sm text-text-secondary">Out of 100</div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Mood</span>
                    <span className="font-medium text-text-primary">8/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Sleep</span>
                    <span className="font-medium text-text-primary">7.5h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Habits</span>
                    <span className="font-medium text-text-primary">90%</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-sm text-feedback-success">
                  <Icon icon={TrendingUp} size={12} />
                  <span>+5% from last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Daily Check-in */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <DailyCheckIn />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
