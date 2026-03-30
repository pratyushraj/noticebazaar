"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DealEvent {
  date: Date;
  deals: Array<{
    id: string;
    brandName: string;
    amount: number;
    status: 'draft' | 'active' | 'pending' | 'completed';
  }>;
}

interface DealTimelineViewProps {
  events?: DealEvent[];
  isDark?: boolean;
}

const DealTimelineView: React.FC<DealTimelineViewProps> = ({
  events = [],
  isDark = true,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const defaultEvents: DealEvent[] = [
    {
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deals: [
        { id: '1', brandName: 'Zepto', amount: 35000, status: 'completed' },
      ],
    },
    {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deals: [
        { id: '2', brandName: 'Spotify', amount: 45000, status: 'active' },
        { id: '3', brandName: 'Nike', amount: 52000, status: 'pending' },
      ],
    },
    {
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      deals: [
        { id: '4', brandName: 'Amazon', amount: 60000, status: 'draft' },
      ],
    },
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventForDate = (date: Date) => {
    return displayEvents.find(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const statusConfig = {
    draft: { color: 'bg-gray-500/20 text-gray-300', label: 'Draft', icon: '📝' },
    active: { color: 'bg-blue-500/20 text-blue-300', label: 'Active', icon: '⚡' },
    pending: { color: 'bg-yellow-500/20 text-yellow-300', label: 'Pending', icon: '⏳' },
    completed: { color: 'bg-emerald-500/20 text-emerald-300', label: 'Completed', icon: '✅' },
  };

  return (
    <Card className={cn(
      'border transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30'
        : 'bg-white border-slate-200 shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            📅 Deal Timeline
          </h3>
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={cn(
              'text-sm font-semibold min-w-[120px] text-center',
              isDark ? 'text-white' : 'text-slate-900'
            )}>
              {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mb-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className={cn(
                  'text-center text-xs font-bold py-2 rounded',
                  isDark ? 'text-white/60' : 'text-slate-600'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const event = getEventForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'p-2 rounded-lg text-sm font-semibold transition-all relative overflow-hidden cursor-pointer',
                    isToday
                      ? isDark
                        ? 'bg-blue-600/20 border-blue-500/50 border-2'
                        : 'bg-blue-100 border-blue-300 border-2'
                      : selectedDate?.toDateString() === date.toDateString()
                      ? isDark
                        ? 'bg-white/20 border-white/30 border'
                        : 'bg-slate-100 border-slate-300 border'
                      : isDark
                      ? 'bg-white/5 border-white/10 border hover:bg-white/10'
                      : 'bg-slate-50 border-slate-200 border hover:bg-white',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  <div className="text-center">
                    {day}
                    {event && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'p-4 rounded-lg border',
                isDark
                  ? 'bg-white/5 border-white/10'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <h4 className={cn(
                'text-sm font-bold mb-3',
                isDark ? 'text-white' : 'text-slate-900'
              )}>
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h4>

              {getEventForDate(selectedDate) ? (
                <div className="space-y-2">
                  {getEventForDate(selectedDate)?.deals.map((deal) => {
                    const config = statusConfig[deal.status];
                    return (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          'p-3 rounded-lg border flex items-start justify-between gap-3',
                          isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                        )}
                      >
                        <div>
                          <p className={cn(
                            'text-sm font-semibold',
                            isDark ? 'text-white' : 'text-slate-900'
                          )}>
                            {deal.brandName}
                          </p>
                          <p className={cn(
                            'text-xs mt-0.5',
                            isDark ? 'text-white/60' : 'text-slate-600'
                          )}>
                            ₹{deal.amount.toLocaleString()}
                          </p>
                        </div>
                        <Badge className={cn('text-xs', config.color)}>
                          {config.icon} {config.label}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-white/60' : 'text-slate-600'
                )}>
                  No deals scheduled
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DealTimelineView;
