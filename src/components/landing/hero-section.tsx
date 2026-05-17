"use client";

import { motion } from "framer-motion";
import { Star, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="glass-card p-8 lg:p-12 hover-lift"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-primary-muted px-3 py-1 rounded-full text-sm font-medium text-primary mb-6"
            >
              <Star className="w-4 h-4" />
              <span>#1 AI Wellness Companion</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Your AI-Powered{" "}
              <span className="text-gradient-green">Wellness</span>{" "}
              Companion
            </motion.h1>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              Track your mood, sleep, and habits with personalized AI insights.
              Achieve your wellness goals with the help of your intelligent companion.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <Button size="lg" className="btn-primary-gradient text-lg px-8 py-4">
                Start Your Journey
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light border-2 border-background"
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">50K+</span> users
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Illustration Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 hover-lift relative overflow-hidden"
          >
            <div className="aspect-square relative">
              {/* Placeholder for 3D illustration */}
              <div className="w-full h-full bg-gradient-to-br from-primary-muted to-accent rounded-2xl flex items-center justify-center relative">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto glow-green">
                    <Users className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">3D Illustration Here</p>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-4 right-4 w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center"
                >
                  <TrendingUp className="w-6 h-6 text-primary" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-4 left-4 w-8 h-8 bg-accent rounded-full flex items-center justify-center"
                >
                  <Star className="w-4 h-4 text-primary" />
                </motion.div>
              </div>
            </div>

            {/* Speech bubble */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="absolute -top-4 -right-4 bg-background border border-border rounded-2xl p-4 shadow-soft max-w-xs"
            >
              <p className="text-sm text-foreground">
                &ldquo;Sathi helped me understand my sleep patterns and improve my mood tracking!&rdquo;
              </p>
              <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-background"></div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
