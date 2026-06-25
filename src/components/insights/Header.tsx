"use client"
import React from "react";
import { motion } from 'framer-motion';
import { Calendar, Download, Filter, TrendingUp } from 'lucide-react';

export default function Header() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 6 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="p-6 rounded-[28px] bg-white/60 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-[28px] font-semibold text-[#0F172A] tracking-tight">Your Wellness Insights</h1>
          <span className="text-2xl">🌿</span>
        </div>
        <p className="mt-1 text-sm text-[#64748B]">Understand your emotional patterns and wellness growth over time.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5FAF5] border border-[#DCFCE7] text-[#0F172A] text-sm font-medium hover:bg-[#EEF7EF] transition-colors"
          aria-label="Select date range"
          onClick={() => alert('Date range selection coming soon!')}
        >
          <Calendar className="w-4 h-4 text-[#5DBB63]" />
          <span>This Week</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5FAF5] border border-[#DCFCE7] text-[#0F172A] text-sm font-medium hover:bg-[#EEF7EF] transition-colors"
          aria-label="Filter insights"
          onClick={() => alert('Filter functionality coming soon!')}
        >
          <Filter className="w-4 h-4 text-[#5DBB63]" />
          <span>Filter</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7ED957] to-[#22C55E] text-white text-sm font-medium shadow-[0_4px_14px_rgba(34,197,94,0.25)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.35)] transition-shadow"
          aria-label="Export insights report"
          onClick={() => alert('Export functionality coming soon!')}
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
