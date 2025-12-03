"use client";

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Grid, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
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

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextMonth(),
    onSwipedRight: () => goToPreviousMonth(),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  // View mode options
  const viewModes: { value: CalendarViewMode; label: string; icon: typeof Grid }[] = [
    { value: 'month', label: 'Month', icon: Grid },
    { value: 'week', label: 'Week', icon: List },
    { value: 'day', label: 'Day', icon: CalendarIcon },
  ];

  return (
    <div className="w-full space-y-4 overflow-hidden" {...swipeHandlers} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Sticky Header with Navigation */}
      <div className="sticky top-0 z-10 pb-4 backdrop-blur-xl">
        <div className="w-full rounded-2xl bg-white/5 backdrop-blur-xl p-4 sm:p-6 flex flex-col gap-4 mx-auto max-w-[900px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-white flex-shrink-0">Your Deadlines</h2>
            
            {/* Navigation Controls and Month/Year - All in one line */}
            <div className="flex items-center gap-1 md:gap-2 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0 h-9 w-9 p-0 rounded-lg transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-white/80 hover:text-white hover:bg-white/10 flex-shrink-0 text-xs md:text-sm px-2 md:px-3 h-9 rounded-lg transition-all active:scale-95"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0 h-9 w-9 p-0 rounded-lg transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="text-white font-semibold text-sm md:text-base px-2 flex-shrink-0">
                {monthYearLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky View Mode Selector - Centered Segmented Control */}
        <div className="w-full flex justify-center pb-2">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-1.5 sm:p-2 mx-auto sm:mx-0">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.value;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[12px] sm:text-sm font-medium transition-all duration-200",
                    "active:scale-95",
                    isActive
                      ? "bg-gradient-to-r from-[#7B2FF7] to-[#A855F7] text-white md:shadow-lg md:shadow-purple-500/20"
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'month' && (
          <motion.div
            key={`month-${currentDate.getMonth()}-${currentDate.getFullYear()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="w-full">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 mb-1 w-full">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-[10px] md:text-sm font-semibold text-white/60 py-1.5 md:py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid - Mobile Optimized - Ensure last row visible */}
              <div 
                className="calendar-grid w-full max-w-[900px] mx-auto grid grid-cols-7 gap-1.5 sm:gap-2 mt-4 px-1 sm:px-2 min-w-0"
              >
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = 
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();
                    const dayEvents = getEventsForDate(day);
                    const isSelected = false; // Can be enhanced with selection state

                    return (
                      <div
                        key={index}
                        className={cn(
                          "aspect-square rounded-xl bg-white/5 backdrop-blur-md flex flex-col items-center justify-center min-w-0 text-[13px] sm:text-[15px] font-medium transition-all cursor-pointer relative",
                          "md:hover:bg-white/10",
                          isCurrentMonth 
                            ? "text-white" 
                            : "text-white/40 opacity-50",
                          isToday && "ring-2 ring-white/40 bg-white/10 shadow-lg shadow-black/20",
                          isSelected && "ring-2 ring-white/40 bg-white/10 shadow-lg shadow-black/20",
                          dayEvents.length > 0 && "cursor-pointer"
                        )}
                        onClick={() => {
                          if (dayEvents.length > 0 && onEventClick) {
                            onEventClick(dayEvents[0]);
                          }
                        }}
                      >
                        {/* Date number */}
                        <div className={cn(
                          "text-[13px] sm:text-[15px] font-medium",
                          isToday ? "text-white" : isCurrentMonth ? "text-white" : "text-white/40"
                        )}>
                          {day.getDate()}
                        </div>
                        
                        {/* Mobile: Centered event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex gap-1 justify-center mt-1">
                            {dayEvents.slice(0, 3).map((event, idx) => {
                              const colorMap: Record<string, string> = {
                                payment: 'bg-green-400',
                                deliverable: 'bg-blue-400',
                                tax: 'bg-yellow-400',
                                deal: 'bg-purple-400',
                              };
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    colorMap[event.type] || 'bg-sky-400'
                                  )}
                                />
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Desktop: Show event badges */}
                        <div className="hidden md:block space-y-1 max-h-[60px] overflow-hidden mt-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded truncate transition-all hover:opacity-80",
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
                          {dayEvents.length > 2 && dayEvents.length <= 3 && (
                            <div
                              key={dayEvents[2].id}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded truncate transition-all hover:opacity-80",
                                dayEvents[2].color
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEventClick?.(dayEvents[2]);
                              }}
                            >
                              {dayEvents[2].title}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'week' && (
          <motion.div
            key={`week-${currentDate.getTime()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[900px] mx-auto px-4 sm:px-6 min-w-0"
          >
            <div className="w-full rounded-2xl bg-white/5 backdrop-blur-xl p-4 sm:p-6 min-w-0 mx-auto">
              {/* Week-day header row */}
              <div className="grid grid-cols-7 w-full text-center text-sm sm:text-base font-medium min-w-0 mb-4">
                {weekDays.map((day, index) => (
                  <div key={index} className="py-2 min-w-0 truncate text-white/60">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                ))}
              </div>

              {/* Day-box grid */}
              <div className="grid grid-cols-7 gap-2 w-full min-w-0">
                {weekDays.map((day, index) => {
                  const isToday = 
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear();
                  const dayEvents = getEventsForDate(day);

                  return (
                    <div key={index} className="min-h-[300px] md:min-h-[400px] flex flex-col">
                      {/* Day header */}
                      <div className={cn(
                        "rounded-xl bg-white/5 backdrop-blur-md aspect-square flex flex-col justify-center items-center min-w-0 mb-2",
                        isToday && "ring-2 ring-white/40 bg-white/10 shadow-lg shadow-black/20"
                      )}>
                        <div className={cn(
                          "text-base md:text-lg font-bold",
                          isToday ? "text-white" : "text-white/60"
                        )}>
                          {day.getDate()}
                        </div>
                      </div>
                      
                      {/* Events list */}
                      <div className="space-y-1.5 md:space-y-2 flex-1">
                        {dayEvents.map((event) => (
                          <motion.div
                            key={event.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-blue-500/20 text-blue-200 px-2 py-1 rounded-lg text-xs font-semibold min-w-0 truncate cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => onEventClick?.(event)}
                          >
                            {event.title}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'day' && (
          <motion.div
            key={`day-${currentDate.getTime()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="bg-[rgba(255,255,255,0.06)] backdrop-blur-xl border border-white/8 md:shadow-lg md:shadow-black/20">
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
                      <motion.div
                        key={event.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
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
                      </motion.div>
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
