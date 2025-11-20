"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PINK_THEME } from '@/constants/colors';

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
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card className="bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/30 shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-white">Coming Up</CardTitle>
          </div>
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
        bg: 'bg-[#FFB3BA]/20', 
        border: 'border-[#FF6B9D]/40', 
        text: 'text-[#FF6B9D]',
        dateBg: 'bg-[#FF6B9D]/30',
        dateBorder: 'border-[#FF6B9D]/50',
        dateText: 'text-white'
      };
    }
    if (daysUntil <= 3) {
      return { 
        bg: 'bg-[#FFD89B]/20', 
        border: 'border-[#FFB84D]/40', 
        text: 'text-[#FFB84D]',
        dateBg: 'bg-[#FFB84D]/30',
        dateBorder: 'border-[#FFB84D]/50',
        dateText: 'text-white'
      };
    }
    if (daysUntil <= 7) {
      return { 
        bg: 'bg-[#FF8FAB]/20', 
        border: 'border-[#FF6B9D]/40', 
        text: 'text-[#FF6B9D]',
        dateBg: 'bg-[#FF6B9D]/30',
        dateBorder: 'border-[#FF6B9D]/50',
        dateText: 'text-white'
      };
    }
    return { 
      bg: 'bg-[#E879F9]/20', 
      border: 'border-[#F472B6]/40', 
      text: 'text-[#F472B6]',
      dateBg: 'bg-[#F472B6]/30',
      dateBorder: 'border-[#F472B6]/50',
      dateText: 'text-white'
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl shadow-lg hover:bg-[#3D2A3F] transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/30 shadow-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-white">Coming Up</CardTitle>
            </div>
            <button className="text-body text-[#F472B6] hover:text-[#FF8FAB] hover:bg-[#F472B6]/10 transition-fast font-medium active:scale-[0.97] focus-ring rounded-lg px-3 py-2">
              View Calendar →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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
                  transition={{ duration: 0.3, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl border backdrop-blur-sm card-interactive",
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
