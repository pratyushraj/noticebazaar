"use client";

import { useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useTaxFilings } from '@/lib/hooks/useTaxFilings';
import { CalendarView, CalendarEvent, CalendarViewMode } from './CalendarView';
import { CalendarEventModal } from './CalendarEventModal';
import { useState } from 'react';
import { BrandDeal } from '@/types';

interface DeadlineCalendarProps {
  viewMode?: CalendarViewMode;
}

export function DeadlineCalendar({ viewMode = 'month' }: DeadlineCalendarProps) {
  const { profile } = useSession();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch deals
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Fetch tax filings
  const { data: taxFilings = [] } = useTaxFilings({
    creatorId: profile?.id,
    enabled: !!profile?.id,
    statusFilter: 'Pending',
  });

  // Transform data into calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add deal deadlines
    brandDeals.forEach((deal) => {
      // Payment due dates
      if (deal.payment_expected_date && deal.status === 'Payment Pending') {
        const dueDate = new Date(deal.payment_expected_date);
        const isOverdue = dueDate < new Date();
        
        calendarEvents.push({
          id: `payment-${deal.id}`,
          title: `Payment Due: ${deal.brand_name}`,
          date: dueDate,
          type: 'payment',
          color: isOverdue 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
            : 'bg-green-500/20 text-green-400 border border-green-500/30',
          description: `₹${deal.deal_amount?.toLocaleString('en-IN') || '0'} expected`,
          metadata: { deal, eventType: 'payment' },
        });
      }

      // Deliverable due dates
      if (deal.due_date && (deal.status === 'Approved' || deal.status === 'Drafting')) {
        const dueDate = new Date(deal.due_date);
        const isOverdue = dueDate < new Date();
        
        calendarEvents.push({
          id: `deliverable-${deal.id}`,
          title: `Deliverable Due: ${deal.brand_name}`,
          date: dueDate,
          type: 'deliverable',
          color: isOverdue 
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          description: deal.platform || 'Multiple platforms',
          metadata: { deal, eventType: 'deliverable' },
        });
      }
    });

    // Add tax filing deadlines
    taxFilings.forEach((filing) => {
      const dueDate = new Date(filing.due_date);
      const isOverdue = dueDate < new Date();
      const filingType = filing.filing_type.replace(/_/g, ' ').toUpperCase();
      
      calendarEvents.push({
        id: `tax-${filing.id}`,
        title: `Tax Filing: ${filingType}`,
        date: dueDate,
        type: 'tax',
        color: isOverdue 
          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        description: filing.details || 'Tax compliance deadline',
        metadata: { filing, eventType: 'tax' },
      });
    });

    return calendarEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [brandDeals, taxFilings]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  return (
    <>
      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        viewMode={viewMode}
      />

      {selectedEvent && (
        <CalendarEventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

