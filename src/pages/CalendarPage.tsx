"use client";

import { useState, useMemo } from 'react';
import { Download, ExternalLink, MoreVertical } from 'lucide-react';
import { DeadlineCalendar } from '@/components/calendar/DeadlineCalendar';
import { CalendarViewMode } from '@/components/calendar/CalendarView';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useTaxFilings } from '@/lib/hooks/useTaxFilings';
import { downloadICalFile, openGoogleCalendar } from '@/lib/utils/calendarExport';
import { CalendarEvent } from '@/components/calendar/CalendarView';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { motion } from 'framer-motion';
import { spacing, typography, iconSizes, radius, shadows, glass, vision, motion as motionTokens, animations, gradients } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';

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
      initial={motionTokens.slide.up.initial}
      animate={motionTokens.slide.up.animate}
      exit={motionTokens.fade.out}
      transition={motionTokens.slide.up.transition}
      className={cn("min-h-screen text-white relative overflow-hidden", gradients.page)}
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        minHeight: '100dvh',
      }}
    >
      {/* Vision Pro depth elevation */}
      <div className={vision.depth.elevation} />
      
      {/* Spotlight gradient */}
      <div className={cn(vision.spotlight.base, "opacity-30")} />
      
      <div className={cn("max-w-7xl mx-auto", spacing.page, spacing.section, "overflow-hidden relative z-10")}>
        {/* Header - iOS 17 + visionOS */}
        <div className={cn("flex items-start justify-between gap-3")}>
          <div className="flex-1 min-w-0">
            <h1 className={cn(typography.h1, "mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent")}>
              Calendar
            </h1>
            <p className={cn(typography.body, "text-white/60 leading-relaxed")}>
              View and manage all your deadlines in one place
            </p>
          </div>

          {/* Export Actions - Desktop: Buttons, Mobile: 3-dot Menu - iOS 17 + visionOS */}
          <div className={cn("hidden md:flex items-center gap-2 flex-shrink-0")}>
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                handleExportICal();
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                glass.apple,
                radius.md,
                spacing.cardPadding.secondary,
                typography.bodySmall,
                "text-white transition-all",
                shadows.sm
              )}
            >
              <Download className={cn(iconSizes.sm, "mr-1.5")} />
              Export iCal
            </motion.button>
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                handleSyncGoogleCalendar();
              }}
              whileTap={animations.microTap}
              whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
              className={cn(
                glass.apple,
                radius.md,
                spacing.cardPadding.secondary,
                typography.bodySmall,
                "text-white transition-all",
                shadows.sm
              )}
            >
              <ExternalLink className={cn(iconSizes.sm, "mr-1.5")} />
              Google Calendar
            </motion.button>
          </div>

          {/* Mobile: 3-dot Menu Button - iOS 17 + visionOS */}
          <motion.button
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setShowExportSheet(true);
            }}
            whileTap={animations.microTap}
            className={cn(
              "md:hidden",
              glass.apple,
              radius.md,
              "text-white h-10 w-10 p-0 transition-all",
              shadows.sm
            )}
            aria-label="Export options"
          >
            <MoreVertical className={iconSizes.md} />
          </motion.button>
        </div>

        {/* Calendar View */}
        <DeadlineCalendar viewMode={viewMode} />

        {/* Mobile Export Action Sheet - iOS 17 + visionOS */}
        <BottomSheet open={showExportSheet} onClose={() => setShowExportSheet(false)}>
          <div className={cn(spacing.page, spacing.card)}>
            <h3 className={cn(typography.h3, "text-white mb-4")}>Export Calendar</h3>
            
            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                handleExportICal();
              }}
              whileTap={animations.microTap}
              className={cn(
                "w-full flex items-center gap-3",
                glass.apple,
                radius.lg,
                spacing.cardPadding.secondary,
                "text-white transition-all",
                shadows.sm
              )}
            >
              <Download className={iconSizes.md} />
              <span className={cn(typography.body, "font-medium")}>Export iCal</span>
            </motion.button>

            <motion.button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                handleSyncGoogleCalendar();
              }}
              whileTap={animations.microTap}
              className={cn(
                "w-full flex items-center gap-3",
                glass.apple,
                radius.lg,
                spacing.cardPadding.secondary,
                "text-white transition-all",
                shadows.sm
              )}
            >
              <ExternalLink className={iconSizes.md} />
              <span className={cn(typography.body, "font-medium")}>Google Calendar</span>
            </motion.button>
          </div>
        </BottomSheet>
      </div>
    </motion.div>
  );
}
