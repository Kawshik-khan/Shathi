"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export function MobileCTA() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [100, 0]);
  const opacity = useTransform(scrollY, [0, 50, 100], [0, 0.5, 1]);

  return (
    <motion.div
      style={{ y, opacity }}
      className="fixed bottom-6 left-4 right-4 z-40 md:hidden"
    >
      <div className="glass-card-strong p-4 rounded-2xl shadow-soft-lg">
        <Link href="/auth/login">
          <Button className="w-full btn-primary-gradient py-3 text-lg">
            Start Your Journey
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
