'use client';

import { GlassCard } from '@/components/shared/glass-card';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// Generate June 2024 calendar data
const generateCalendar = () => {
  const daysInMonth = 30;
  const firstDayOfWeek = 6; // June 1, 2024 is Saturday (0=Sun, 6=Sat)
  
  const days: Array<{ day: number | null; status: 'completed' | 'scheduled' | 'today' | 'none' }> = [];
  
  // Empty cells for days before June 1
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ day: null, status: 'none' });
  }
  
  // Days of June
  const completedDays = [5, 14, 18, 22]; // From screenshot
  const today = 11;
  
  for (let i = 1; i <= daysInMonth; i++) {
    let status: 'completed' | 'scheduled' | 'today' | 'none' = 'none';
    if (completedDays.includes(i)) status = 'completed';
    else if (i === today) status = 'today';
    else if (i > today && i <= today + 7) status = 'scheduled';
    
    days.push({ day: i, status });
  }
  
  return days;
};

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function TrainingCalendar() {
  const calendarDays = generateCalendar();
  const router = useRouter();

  return (
    <GlassCard className="h-full" delay={0.3}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#4A90A4]" />
          <span className="text-sm font-medium text-foreground">Training Days</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">June 2024</span>
          <div className="flex gap-0.5">
            <button
              className="p-1 rounded hover:bg-[#F1F5F7] transition-colors"
              onClick={() => alert('Previous month coming soon!')}
            >
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              className="p-1 rounded hover:bg-[#F1F5F7] transition-colors"
              onClick={() => alert('Next month coming soon!')}
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center">
            <span className="text-[10px] text-muted-foreground font-medium">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayObj, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.01 }}
            className="aspect-square flex items-center justify-center"
          >
            {dayObj.day && (
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  dayObj.status === 'completed' && "bg-[#4A90A4] text-white",
                  dayObj.status === 'scheduled' && "bg-[#E3F0F3] text-[#4A90A4]",
                  dayObj.status === 'today' && "border-2 border-[#4A90A4] text-[#4A90A4]",
                  dayObj.status === 'none' && "text-muted-foreground hover:bg-[#F1F5F7]"
                )}
              >
                {dayObj.day}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-black/5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4A90A4]" />
          <span className="text-[10px] text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#E3F0F3]" />
          <span className="text-[10px] text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-[#4A90A4]" />
          <span className="text-[10px] text-muted-foreground">Today</span>
        </div>
      </div>
    </GlassCard>
  );
}

