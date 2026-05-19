"use client"
import React from "react";
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function LineChartSoft({ data }: { data: Array<{ name: string; value: number }> }) {
  const sample = data && data.length ? data : [{ name: 'M', value: 60 }, { name: 'T', value: 70 }, { name: 'W', value: 72 }, { name: 'T', value: 68 }, { name: 'F', value: 75 }];
  return (
    <motion.div role="img" aria-label="Line chart showing weekly metric" className="h-44 min-h-[176px] min-w-0" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <ResponsiveContainer width="100%" height={176}>
        <LineChart data={sample}>
          <XAxis dataKey="name" tick={{ fill: '#94A3B8' }} />
          <YAxis hide />
           <Tooltip wrapperStyle={{ pointerEvents: 'none' }} />
          <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={3} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

