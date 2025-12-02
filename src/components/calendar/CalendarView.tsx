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
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#0F121A] via-[#1A1D2E] to-[#0F121A] pb-4 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white w-full md:w-auto">Your Deadlines</h2>
          
          {/* Navigation Controls - Stack on mobile */}
          <div className="flex items-center gap-1 md:gap-2 w-full md:w-auto">
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
            <div className="text-white font-semibold text-center flex-1 min-w-0 text-sm md:text-base px-2">
              <span className="truncate block">{monthYearLabel}</span>
            </div>
          </div>
        </div>

        {/* Sticky View Mode Selector - Centered Segmented Control */}
        <div className="w-full flex justify-center pb-2">
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.value;
              
              return (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
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
            <Card className="bg-[rgba(255,255,255,0.06)] backdrop-blur-xl border-0 md:border md:border-white/8 md:shadow-lg md:shadow-black/20 overflow-hidden rounded-none md:rounded-2xl">
              <CardContent 
                className="p-0 md:p-4" 
                style={{ 
                  paddingBottom: 'max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))' 
                }}
              >
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
                  className="grid grid-cols-7 gap-[2px] md:gap-2 w-full"
                  style={{
                    marginBottom: 'env(safe-area-inset-bottom, 0px)',
                  }}
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
                          "min-h-[72px] md:min-h-[80px] p-1 md:p-2 rounded-md md:rounded-[14px] border-0 md:border transition-all cursor-pointer relative flex flex-col",
                          "md:hover:bg-white/10",
                          isCurrentMonth 
                            ? "bg-white/[0.07] md:border-white/10" 
                            : "bg-white/[0.02] md:border-white/5 opacity-50",
                          isToday && "border md:border-2 border-[#A855F7] bg-[rgba(168,85,247,0.15)]",
                          isSelected && "border md:border-2 border-[#A855F7] bg-[rgba(168,85,247,0.15)]",
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
                          "text-sm md:text-base font-semibold leading-tight mb-auto",
                          isToday ? "text-[#A855F7]" : isCurrentMonth ? "text-white" : "text-white/40"
                        )}>
                          {day.getDate()}
                        </div>
                        
                        {/* Mobile: Centered event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex md:hidden items-center justify-center gap-1 mt-auto pt-1">
                            {dayEvents.slice(0, 2).map((event, idx) => {
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
                                    "w-2 h-2 rounded-full",
                                    colorMap[event.type] || 'bg-purple-400'
                                  )}
                                />
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] text-white/70 font-semibold leading-none">
                                +{dayEvents.length - 2}
                              </span>
                            )}
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {viewMode === 'week' && (
          <motion.div
            key={`week-${currentDate.getTime()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="bg-[rgba(255,255,255,0.06)] backdrop-blur-xl border border-white/8 shadow-lg shadow-black/20">
              <CardContent className="p-3 md:p-4">
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {weekDays.map((day, index) => {
                    const isToday = 
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear();
                    const dayEvents = getEventsForDate(day);

                    return (
                      <div key={index} className="min-h-[300px] md:min-h-[400px]">
                        <div className={cn(
                          "text-center p-1.5 md:p-2 mb-2 rounded-lg",
                          isToday ? "bg-purple-500/20 text-purple-400" : "text-white/60"
                        )}>
                          <div className="text-xs font-semibold">
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-base md:text-lg font-bold">
                            {day.getDate()}
                          </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                          {dayEvents.map((event) => (
                            <motion.div
                              key={event.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
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
                            </motion.div>
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
