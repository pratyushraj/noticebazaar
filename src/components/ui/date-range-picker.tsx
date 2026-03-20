"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  open,
  onOpenChange,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  // Get first day of month
  const monthStart = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  }, [currentMonth]);

  // Get last day of month
  const monthEnd = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  }, [currentMonth]);

  // Get first day of week for month start
  const calendarStart = useMemo(() => {
    const start = new Date(monthStart);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Start from Sunday
    return start;
  }, [monthStart]);

  // Get last day of week for month end
  const calendarEnd = useMemo(() => {
    const end = new Date(monthEnd);
    const day = end.getDay();
    end.setDate(end.getDate() + (6 - day)); // End on Saturday
    return end;
  }, [monthEnd]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(calendarStart);
    
    while (current <= calendarEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [calendarStart, calendarEnd]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!startDate && !endDate) return false;
    if (startDate && date.getTime() === startDate.getTime()) return true;
    if (endDate && date.getTime() === endDate.getTime()) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart || !startDate) {
      // Selecting start date
      onDateRangeChange(date, endDate);
      setSelectingStart(false);
    } else {
      // Selecting end date
      if (date < startDate) {
        // If end date is before start date, swap them
        onDateRangeChange(date, startDate);
      } else {
        onDateRangeChange(startDate, date);
      }
      setSelectingStart(true);
    }
  };

  const handleClear = () => {
    onDateRangeChange(null, null);
    setSelectingStart(true);
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onOpenChange(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Date Range</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-lg">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday =
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();
              const isSelected = isDateSelected(day);
              const inRange = isDateInRange(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "h-9 rounded-md text-sm transition-colors",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isCurrentMonth && "hover:bg-accent",
                    isToday && "font-bold ring-1 ring-primary",
                    isSelected && "bg-primary text-primary-foreground",
                    inRange && !isSelected && "bg-primary/20"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selected Range Display */}
          {(startDate || endDate) && (
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Start: </span>
                <span className="font-medium">
                  {startDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }) || 'Not selected'}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">End: </span>
                <span className="font-medium">
                  {endDate?.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }) || 'Not selected'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleClear} size="sm">
              Clear
            </Button>
            <Button
              onClick={handleApply}
              size="sm"
              disabled={!startDate || !endDate}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

