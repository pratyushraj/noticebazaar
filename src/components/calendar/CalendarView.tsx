"use client";

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deal' | 'payment' | 'tax' | 'deliverable';
  color: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  initialDate?: Date;
  viewMode?: CalendarViewMode;
}

export function CalendarView({ 
  events, 
  onEventClick, 
  initialDate = new Date(),
  viewMode: initialViewMode = 'month'
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);

  // Get first day of month
  const monthStart = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date;
  }, [currentDate]);

  // Get last day of month
  const monthEnd = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return date;
  }, [currentDate]);

  // Get first day of week for month start
  const startDate = useMemo(() => {
    const start = new Date(monthStart);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Start from Sunday
    return start;
  }, [monthStart]);

  // Get last day of week for month end
  const endDate = useMemo(() => {
    const end = new Date(monthEnd);
    const day = end.getDay();
    end.setDate(end.getDate() + (6 - day)); // End on Saturday
    return end;
  }, [monthEnd]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [startDate, endDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format month/year
  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Week view days
  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [];
    
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentDate, viewMode]);

  // Day view
  const dayEvents = useMemo(() => {
    if (viewMode !== 'day') return [];
    return getEventsForDate(currentDate);
  }, [currentDate, viewMode, events]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Calendar</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-white font-semibold min-w-[200px] text-center">
              {monthYearLabel}
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('month')}
            className={cn(
              "text-xs",
              viewMode === 'month' 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:text-white"
            )}
          >
            <Grid className="w-4 h-4 mr-1" />
            Month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('week')}
            className={cn(
              "text-xs",
              viewMode === 'week' 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:text-white"
            )}
          >
            <List className="w-4 h-4 mr-1" />
            Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('day')}
            className={cn(
              "text-xs",
              viewMode === 'day' 
                ? "bg-white/10 text-white" 
                : "text-white/60 hover:text-white"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-1" />
            Day
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'month' && (
          <motion.div
            key="month"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/[0.08] backdrop-blur-[40px] border-white/15">
              <CardContent className="p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-white/60 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = 
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();
                    const dayEvents = getEventsForDate(day);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[100px] p-2 rounded-lg border transition-all",
                          isCurrentMonth 
                            ? "bg-white/[0.05] border-white/10" 
                            : "bg-white/[0.02] border-white/5 opacity-50",
                          isToday && "ring-2 ring-purple-500/50 bg-purple-500/10",
                          dayEvents.length > 0 && "hover:bg-white/[0.08] cursor-pointer"
                        )}
                        onClick={() => {
                          if (dayEvents.length > 0 && onEventClick) {
                            onEventClick(dayEvents[0]);
                          }
                        }}
                      >
                        <div className={cn(
                          "text-sm font-semibold mb-1",
                          isToday ? "text-purple-400" : isCurrentMonth ? "text-white" : "text-white/40"
                        )}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs px-2 py-0.5 rounded truncate",
                                event.color
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(event);
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-white/40">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewMode === 'week' && (
          <motion.div
            key="week"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/[0.08] backdrop-blur-[40px] border-white/15">
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => {
                    const isToday = 
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();
                    const dayEvents = getEventsForDate(day);

                    return (
                      <div key={index} className="min-h-[400px]">
                        <div className={cn(
                          "text-center p-2 mb-2 rounded-lg",
                          isToday ? "bg-purple-500/20 text-purple-400" : "text-white/60"
                        )}>
                          <div className="text-xs font-semibold">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-lg font-bold">
                            {day.getDate()}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "p-2 rounded-lg text-sm cursor-pointer hover:opacity-80 transition-opacity",
                                event.color
                              )}
                              onClick={() => onEventClick?.(event)}
                            >
                              <div className="font-semibold truncate">{event.title}</div>
                              {event.description && (
                                <div className="text-xs opacity-80 mt-1 line-clamp-2">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewMode === 'day' && (
          <motion.div
            key="day"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-white/[0.08] backdrop-blur-[40px] border-white/15">
              <CardContent className="p-4">
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-white mb-1">
                    {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className="text-white/60">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {dayEvents.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No events scheduled for this day</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity",
                          event.color
                        )}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white mb-1">{event.title}</div>
                            {event.description && (
                              <div className="text-sm text-white/80">{event.description}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="bg-white/10 text-white/60 border-white/20">
                                {event.type}
                              </Badge>
                              <span className="text-xs text-white/40">
                                {event.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

