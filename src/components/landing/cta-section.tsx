"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card-strong rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary-light/5 rounded-3xl" />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">
                Start Your Wellness Journey{" "}
                <span className="text-gradient-green">Today</span>
              </h2>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Join thousands of users who have transformed their lives with Shathi&apos;s AI-powered wellness companion.
              </p>
            </motion.div>

            {/* Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="mb-8"
            >
              <div className="relative w-48 h-48 mx-auto">
                {/* Girl and AI companion illustration placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-primary-muted to-accent rounded-full flex items-center justify-center relative">
                  <div className="text-center">
                    <Heart className="w-16 h-16 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Girl + AI Hug</p>
                  </div>

                  {/* Floating hearts */}
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2"
                  >
                    <Heart className="w-6 h-6 text-red-400 fill-red-400" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/auth/login">
                <Button size="lg" className="btn-primary-gradient text-xl px-12 py-6 mb-4">
                  Get Started for Free
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No credit card required • 14-day free trial
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
