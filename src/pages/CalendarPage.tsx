"use client";

import { useState } from 'react';
import { Download, ExternalLink, MoreVertical } from 'lucide-react';
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
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const { profile } = useSession();
  const [viewMode] = useState<CalendarViewMode>('month');
  const [showExportSheet, setShowExportSheet] = useState(false);

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
      setShowExportSheet(false);
    } catch (error: any) {
      toast.error('Failed to export calendar', {
        description: error.message,
      });
    }
  };

  const handleSyncGoogleCalendar = () => {
    if (events.length === 0) {
      toast.info('No events to sync');
      setShowExportSheet(false);
      return;
    }

    // Open first event in Google Calendar (user can add more manually)
    openGoogleCalendar(events[0]);
    toast.info('Opening Google Calendar', {
      description: 'Add this event and repeat for other events, or export iCal file for bulk import.',
    });
    setShowExportSheet(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-gradient-to-br from-[#0F121A] via-[#1A1D2E] to-[#0F121A] text-white"
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        minHeight: '100dvh',
      }}
    >
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-3 md:space-y-6 overflow-hidden">
        {/* Header - Premium Typography Hierarchy */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-sm md:text-base text-white/60 leading-relaxed">
              View and manage all your deadlines in one place
            </p>
          </div>

          {/* Export Actions - Desktop: Buttons, Mobile: 3-dot Menu */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleExportICal}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-auto py-2 px-3.5 text-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export iCal
            </Button>
            <Button
              onClick={handleSyncGoogleCalendar}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-auto py-2 px-3.5 text-sm transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Google Calendar
            </Button>
          </div>

          {/* Mobile: 3-dot Menu Button */}
          <Button
            onClick={() => setShowExportSheet(true)}
            variant="ghost"
            size="sm"
            className="md:hidden bg-white/10 border border-white/20 text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl transition-all active:scale-95"
            aria-label="Export options"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar View */}
        <DeadlineCalendar viewMode={viewMode} />

        {/* Mobile Export Action Sheet */}
        <BottomSheet open={showExportSheet} onClose={() => setShowExportSheet(false)}>
          <div className="px-4 py-6 space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Export Calendar</h3>
            
            <button
              onClick={handleExportICal}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Export iCal</span>
            </button>

            <button
              onClick={handleSyncGoogleCalendar}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all active:scale-[0.98]"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="font-medium">Google Calendar</span>
            </button>
          </div>
        </BottomSheet>
      </div>
    </motion.div>
  );
}
