"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface Deadline {
  date: string;
  task: string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
  isLoading?: boolean;
}

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ deadlines, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-[12px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-blue-500/15 backdrop-blur-sm">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            Coming Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="No upcoming deadlines"
            description="All caught up! Deadlines will appear here when you have upcoming tasks or payment due dates."
          />
        </CardContent>
      </Card>
    );
  }

  const getDaysUntil = (dateString: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysUntil: number): { bg: string; border: string; text: string; dateBg: string; dateBorder: string; dateText: string } => {
    if (daysUntil < 0) {
      return { 
        bg: 'bg-red-500/15', 
        border: 'border-red-500/30', 
        text: 'text-red-400',
        dateBg: 'bg-red-500/20',
        dateBorder: 'border-red-500/40',
        dateText: 'text-red-400'
      };
    }
    if (daysUntil <= 3) {
      return { 
        bg: 'bg-amber-500/15', 
        border: 'border-amber-500/30', 
        text: 'text-amber-400',
        dateBg: 'bg-amber-500/20',
        dateBorder: 'border-amber-500/40',
        dateText: 'text-amber-400'
      };
    }
    if (daysUntil <= 7) {
      return { 
        bg: 'bg-orange-500/15', 
        border: 'border-orange-500/30', 
        text: 'text-orange-400',
        dateBg: 'bg-orange-500/20',
        dateBorder: 'border-orange-500/40',
        dateText: 'text-orange-400'
      };
    }
    return { 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20', 
      text: 'text-blue-300',
      dateBg: 'bg-blue-500/15',
      dateBorder: 'border-blue-500/30',
      dateText: 'text-blue-300'
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
    };
  };

  // Extract platform from task (simple parsing)
  const getPlatform = (task: string): string => {
    if (task.toLowerCase().includes('instagram')) return 'Instagram';
    if (task.toLowerCase().includes('youtube')) return 'YouTube';
    if (task.toLowerCase().includes('tiktok')) return 'TikTok';
    if (task.toLowerCase().includes('facebook')) return 'Facebook';
    if (task.toLowerCase().includes('tax') || task.toLowerCase().includes('finance')) return 'Finance';
    return 'General';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-blue-500/15 backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              Coming Up
            </CardTitle>
            <button className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors font-medium active:scale-[0.97]">
              View Calendar →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            {deadlines.map((deadline, index) => {
              const daysUntil = getDaysUntil(deadline.date);
              const urgency = getUrgencyColor(daysUntil);
              const dateFormatted = formatDate(deadline.date);
              const platform = getPlatform(deadline.task);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.9 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex gap-3 p-3.5 rounded-[12px] border backdrop-blur-sm",
                    "hover:bg-white/5 active:bg-white/5 transition-all duration-150 cursor-pointer group",
                    urgency.bg,
                    urgency.border
                  )}
                >
                  {/* Premium Date Badge */}
                  <div className={cn(
                    "flex flex-col items-center justify-center w-14 h-14 rounded-[12px] shrink-0 backdrop-blur-sm border",
                    urgency.dateBg,
                    urgency.dateBorder
                  )}>
                    <div className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide leading-tight",
                      urgency.dateText
                    )}>
                      {dateFormatted.month}
                    </div>
                    <div className={cn(
                      "text-[20px] font-bold leading-tight tracking-tight mt-0.5",
                      urgency.dateText
                    )}>
                      {dateFormatted.day}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-white mb-1 leading-tight tracking-[-0.2px]">
                      {deadline.task}
                    </div>
                    <div className={cn(
                      "text-[12px] leading-relaxed font-medium",
                      urgency.text
                    )}>
                      {platform} • {daysUntil >= 0 ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''} left` : `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`}
                    </div>
                  </div>
                  
                  {/* Arrow Icon */}
                  <div className="flex items-center shrink-0">
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all duration-150" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpcomingDeadlines;
