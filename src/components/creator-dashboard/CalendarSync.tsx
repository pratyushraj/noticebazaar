"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle2, Link2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CalendarSyncProps {
  brandDeals?: any[];
}

type SyncProvider = 'google' | 'apple' | 'outlook' | null;
type SyncStatus = 'not_connected' | 'connecting' | 'connected' | 'error';

interface SyncState {
  provider: SyncProvider;
  status: SyncStatus;
  lastSync?: Date;
  eventsSynced?: number;
}

const CalendarSync: React.FC<CalendarSyncProps> = ({ brandDeals = [] }) => {
  const [syncState, setSyncState] = useState<SyncState>({
    provider: null,
    status: 'not_connected',
  });

  // Calculate upcoming events to sync
  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    const events = [];

    // Add payment deadlines
    brandDeals?.forEach(deal => {
      if (deal.status === 'Payment Pending' && deal.payment_expected_date) {
        const dueDate = new Date(deal.payment_expected_date);
        if (dueDate >= now) {
          events.push({
            type: 'payment',
            title: `Payment Due: ${deal.brand_name}`,
            date: dueDate,
            amount: deal.deal_amount,
          });
        }
      }

      // Add deliverables deadlines
      if (deal.due_date && deal.status === 'Approved') {
        const dueDate = new Date(deal.due_date);
        if (dueDate >= now) {
          events.push({
            type: 'deliverable',
            title: `Deliverable Due: ${deal.brand_name}`,
            date: dueDate,
          });
        }
      }
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
  }, [brandDeals]);

  const handleConnect = async (provider: 'google' | 'apple' | 'outlook') => {
    setSyncState(prev => ({ ...prev, provider, status: 'connecting' }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo, simulate successful connection
    setSyncState({
      provider,
      status: 'connected',
      lastSync: new Date(),
      eventsSynced: upcomingEvents.length,
    });

    toast.success(`${provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Outlook'} Calendar connected!`);
  };

  const handleSync = async () => {
    if (syncState.status !== 'connected') return;

    toast.info('Syncing calendar events...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setSyncState(prev => ({
      ...prev,
      lastSync: new Date(),
      eventsSynced: upcomingEvents.length,
    }));

    toast.success(`${upcomingEvents.length} events synced to your calendar!`);
  };

  const handleDisconnect = () => {
    setSyncState({
      provider: null,
      status: 'not_connected',
    });
    toast.info('Calendar disconnected');
  };

  const getProviderIcon = (provider: SyncProvider) => {
    switch (provider) {
      case 'google':
        return '📅';
      case 'apple':
        return '🍎';
      case 'outlook':
        return '📧';
      default:
        return '📅';
    }
  };

  const getProviderName = (provider: SyncProvider) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'apple':
        return 'Apple Calendar';
      case 'outlook':
        return 'Outlook';
      default:
        return 'Calendar';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/5 border-blue-500/30 shadow-inner hover:border-blue-500/40 transition-all">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none opacity-50" />
        
        <CardContent className="relative z-10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 
                            flex items-center justify-center border border-blue-500/30 backdrop-blur-sm
                            shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                <Calendar className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide block">
                  Calendar Sync
                </span>
                <span className="text-sm font-medium text-white">
                  {syncState.status === 'connected' ? getProviderName(syncState.provider) : 'Not Connected'}
                </span>
              </div>
            </div>
            
            {syncState.status === 'connected' && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-2 py-0.5">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            )}
          </div>

          {/* Sync Status */}
          {syncState.status === 'connected' ? (
            <div className="space-y-3">
              {/* Last Sync Info */}
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Last synced:</span>
                <span className="text-white/80 font-medium">
                  {syncState.lastSync?.toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) || 'Never'}
                </span>
              </div>

              {/* Events Count */}
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Events synced:</span>
                <span className="text-white font-semibold">{syncState.eventsSynced || 0}</span>
              </div>

              {/* Upcoming Events Preview */}
              {upcomingEvents.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 uppercase tracking-wide mb-2">
                    Next {Math.min(3, upcomingEvents.length)} Events
                  </div>
                  <div className="space-y-1.5">
                    {upcomingEvents.slice(0, 3).map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-white/70">
                        <Clock className="h-3 w-3 text-blue-300 shrink-0" />
                        <span className="truncate flex-1">{event.title}</span>
                        <span className="text-white/50 shrink-0">
                          {event.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSync}
                  disabled={syncState.status === 'connecting'}
                  className="flex-1 h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold
                           shadow-[0_2px_8px_rgba(59,130,246,0.3)] border border-blue-500/30
                           active:scale-[0.98] transition-all duration-150"
                >
                  {syncState.status === 'connecting' ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-3 w-3 mr-1.5" />
                      Sync Now
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDisconnect}
                  className="h-8 px-3 text-xs border-white/20 hover:bg-white/10 text-white/80
                           active:scale-[0.98] transition-all duration-150"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connect Options */}
              <div className="text-xs text-white/60 mb-3">
                Sync deadlines, payments & deliverables to your calendar
              </div>

              <div className="space-y-2">
                {(['google', 'apple', 'outlook'] as const).map((provider) => (
                  <TooltipProvider key={provider}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleConnect(provider)}
                          disabled={syncState.status === 'connecting'}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150",
                            "hover:bg-white/5 active:scale-[0.98]",
                            syncState.status === 'connecting' 
                              ? "opacity-50 cursor-not-allowed border-white/10"
                              : "border-white/10 hover:border-white/20"
                          )}
                        >
                          <span className="text-lg">{getProviderIcon(provider)}</span>
                          <span className="flex-1 text-left text-sm font-medium text-white">
                            {getProviderName(provider)}
                          </span>
                          {syncState.status === 'connecting' && syncState.provider === provider ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          ) : (
                            <Link2 className="h-4 w-4 text-white/40" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#0F121A] border-white/10 text-white">
                        <p className="text-xs">Connect {getProviderName(provider)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>

              {/* Events Preview */}
              {upcomingEvents.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <div className="text-[10px] text-white/50 uppercase tracking-wide mb-2">
                    {upcomingEvents.length} Events Ready to Sync
                  </div>
                  <div className="text-xs text-white/70">
                    Payments, deadlines & deliverables will be automatically added to your calendar
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {syncState.status === 'error' && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Sync failed. Please try again.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CalendarSync;

