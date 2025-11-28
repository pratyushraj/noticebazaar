"use client";

import { useState } from 'react';
import { Download, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { DeadlineCalendar } from '@/components/calendar/DeadlineCalendar';
import { CalendarViewMode } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useTaxFilings } from '@/lib/hooks/useTaxFilings';
import { downloadICalFile, openGoogleCalendar } from '@/lib/utils/calendarExport';
import { CalendarEvent } from '@/components/calendar/CalendarView';
import { useMemo } from 'react';
import { toast } from 'sonner';

export default function CalendarPage() {
  const { profile } = useSession();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

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

  // Generate events for export
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add deal deadlines
    brandDeals.forEach((deal) => {
      if (deal.payment_expected_date && deal.status === 'Payment Pending') {
        calendarEvents.push({
          id: `payment-${deal.id}`,
          title: `Payment Due: ${deal.brand_name}`,
          date: new Date(deal.payment_expected_date),
          type: 'payment',
          color: 'bg-green-500/20 text-green-400 border border-green-500/30',
          description: `₹${deal.deal_amount?.toLocaleString('en-IN') || '0'} expected`,
          metadata: { deal },
        });
      }

      if (deal.due_date && (deal.status === 'Approved' || deal.status === 'Drafting')) {
        calendarEvents.push({
          id: `deliverable-${deal.id}`,
          title: `Deliverable Due: ${deal.brand_name}`,
          date: new Date(deal.due_date),
          type: 'deliverable',
          color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          description: deal.platform || 'Multiple platforms',
          metadata: { deal },
        });
      }
    });

    // Add tax filings
    taxFilings.forEach((filing) => {
      calendarEvents.push({
        id: `tax-${filing.id}`,
        title: `Tax Filing: ${filing.filing_type.replace(/_/g, ' ').toUpperCase()}`,
        date: new Date(filing.due_date),
        type: 'tax',
        color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        description: filing.details || 'Tax compliance deadline',
        metadata: { filing },
      });
    });

    return calendarEvents;
  }, [brandDeals, taxFilings]);

  const handleExportICal = () => {
    try {
      downloadICalFile(events, 'noticebazaar-deadlines.ics');
      toast.success('Calendar exported successfully!', {
        description: 'You can import this file into any calendar app.',
      });
    } catch (error: any) {
      toast.error('Failed to export calendar', {
        description: error.message,
      });
    }
  };

  const handleSyncGoogleCalendar = () => {
    if (events.length === 0) {
      toast.info('No events to sync');
      return;
    }

    // Open first event in Google Calendar (user can add more manually)
    openGoogleCalendar(events[0]);
    toast.info('Opening Google Calendar', {
      description: 'Add this event and repeat for other events, or export iCal file for bulk import.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F121A] via-[#1A1D2E] to-[#0F121A] text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Calendar</h1>
            <p className="text-white/60">
              View and manage all your deadlines in one place
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportICal}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Export iCal
            </Button>
            <Button
              onClick={handleSyncGoogleCalendar}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Google Calendar
            </Button>
          </div>
        </div>

        {/* Calendar View */}
        <DeadlineCalendar viewMode={viewMode} />
      </div>
    </div>
  );
}

