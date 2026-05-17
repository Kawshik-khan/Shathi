"use client"
import React from "react";
import { motion } from 'framer-motion';

interface EmotionHeatmapProps {
  data?: number[][];
  days?: number;
  weeks?: number;
}

export default function EmotionHeatmap({ 
  days = 7, 
  weeks = 4 
}: EmotionHeatmapProps) {
  // Generate sample data with intensity levels (0-4)
  const sampleData: number[][] = [
    [2, 3, 1, 4, 3, 2, 4],
    [1, 2, 3, 2, 4, 3, 3],
    [3, 4, 2, 3, 2, 4, 2],
    [2, 1, 3, 4, 3, 2, 3],
  ];

  const getColor = (intensity: number) => {
    const colors = [
      'bg-[#F3FAF4]', // 0 - No data
      'bg-[#BBF7D0]', // 1 - Low
      'bg-[#86EFAC]', // 2 - Medium-Low
      'bg-[#4ADE80]', // 3 - Medium-High
      'bg-[#22C55E]', // 4 - High
    ];
    return colors[intensity] || colors[0];
  };

  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <motion.div 
      role="img" 
      aria-label="Emotion heatmap showing wellness patterns"
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Day labels */}
      <div className="flex gap-1 ml-8">
        {dayLabels.map((day, i) => (
          <div key={i} className="w-8 text-center text-xs text-[#94A3B8]">{day}</div>
        ))}
      </div>
      
      {/* Heatmap grid */}
      {sampleData.slice(0, weeks).map((week, weekIndex) => (
        <div key={weekIndex} className="flex items-center gap-1">
          <div className="w-16 text-xs text-[#94A3B8]">{weekLabels[weekIndex]}</div>
          <div className="flex gap-1">
            {week.map((intensity, dayIndex) => (
              <motion.div
                key={dayIndex}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.03, duration: 0.2 }}
                className={`w-8 h-8 rounded-lg ${getColor(intensity)} transition-all duration-200 hover:ring-2 hover:ring-[#22C55E] hover:ring-offset-1`}
                title={`${weekLabels[weekIndex]} ${dayLabels[dayIndex]}: ${intensity === 0 ? 'No data' : intensity >= 3 ? 'Positive' : 'Moderate'}`}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-[#64748B]">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-4 h-4 rounded ${getColor(i)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
}
