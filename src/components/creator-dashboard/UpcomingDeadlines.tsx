"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Deadline {
  date: string;
  task: string;
}

interface UpcomingDeadlinesProps {
  deadlines: Deadline[];
}

const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({ deadlines }) => {
  if (deadlines.length === 0) {
    return null;
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

  const getUrgencyColor = (daysUntil: number): { bg: string; border: string; text: string } => {
    if (daysUntil < 0) {
      return { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-500' };
    }
    if (daysUntil <= 3) {
      return { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-500' };
    }
    if (daysUntil <= 7) {
      return { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-500' };
    }
    return { bg: 'bg-muted/50', border: 'border-border/40', text: 'text-muted-foreground' };
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
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card className="bg-card border-border/40 hover:border-border/60 transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Calendar className="w-5 h-5 text-blue-500" />
              Coming Up
            </CardTitle>
            <button className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.9 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-all cursor-pointer group",
                    urgency.bg,
                    urgency.border
                  )}
                >
                  <div className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0",
                    daysUntil <= 3 ? "bg-yellow-500/10" : "bg-muted"
                  )}>
                    <div className={cn("text-xs font-medium", urgency.text)}>
                      {dateFormatted.month}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      daysUntil <= 3 ? urgency.text : "text-foreground"
                    )}>
                      {dateFormatted.day}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground mb-1">
                      {deadline.task}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {platform} • {daysUntil >= 0 ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''} left` : `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
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
