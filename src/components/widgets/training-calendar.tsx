'use client';

import { CalendarDays, Dumbbell, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type Status = 'completed' | 'scheduled' | 'today' | 'rest';

const todayIndex = 2; // Wednesday — anchor for the demo

const week: Array<{ day: number; status: Status; label: string }> = [
  { day: 10, status: 'completed', label: 'Strength' },
  { day: 11, status: 'completed', label: 'Cardio' },
  { day: 12, status: 'today', label: 'Yoga' },
  { day: 13, status: 'scheduled', label: 'Run' },
  { day: 14, status: 'scheduled', label: 'Strength' },
  { day: 15, status: 'rest', label: 'Rest' },
  { day: 16, status: 'rest', label: 'Rest' },
];

const statusStyles: Record<Status, string> = {
  completed: 'bg-habits-emerald text-white',
  scheduled: 'bg-insights-teal-soft text-insights-teal',
  today: 'border-2 border-habits-emerald text-habits-emerald bg-habits-emerald-soft',
  rest: 'text-muted-foreground hover:bg-muted',
};

export function TrainingCalendar() {
  const router = useRouter();
  const today = week[todayIndex];

  return (
    <div className="card card-interactive h-full">
      <header className="mb-3 flex items-center justify-between">
        <span className="card-eyebrow flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-insights-teal" aria-hidden="true" />
          Training
        </span>
        <span className="card-caption">This week</span>
      </header>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-insights-teal-soft px-3 py-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
          <Dumbbell className="h-4.5 w-4.5 text-insights-teal" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Today · {today.label}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            7:00 AM · 45 min
          </p>
        </div>
        <span className="status-pill status-pill--success">Now</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5" aria-label="Weekly training plan">
        {week.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{weekDays[i]}</span>
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all',
                statusStyles[d.status],
              )}
              aria-current={d.status === 'today' ? 'date' : undefined}
            >
              {d.day}
            </div>
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push('/training')}
        className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-insights-teal focus-ring rounded-md px-2 py-1 transition-colors"
      >
        Open calendar
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

