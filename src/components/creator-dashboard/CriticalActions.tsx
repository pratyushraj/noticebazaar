"use client";

import React from 'react';
import { AlertTriangle, DollarSign, FileText, Shield, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UrgentAction {
  type: 'payment_overdue' | 'contract_review' | 'content_stolen';
  title: string;
  amount?: number;
  daysOverdue?: number;
  dueDate?: string;
  brand?: string;
  receivedDays?: number;
  hasRedFlags?: boolean;
  matches?: number;
  topThief?: string;
  views?: number;
  platform?: string;
  dealId?: string;
  lastReminderSentDays?: number; // Days since last reminder was sent
}

interface CriticalActionsProps {
  actions: UrgentAction[];
  onSendReminder?: (dealId: string) => void;
  onEscalate?: (dealId: string) => void;
  onAnalyzeContract?: (dealId: string) => void;
  onTakeDown?: () => void;
}

const CriticalActions: React.FC<CriticalActionsProps> = ({
  actions,
  onSendReminder,
  onEscalate,
  onAnalyzeContract,
  onTakeDown,
}) => {
  const navigate = useNavigate();

  const getActionIcon = (type: UrgentAction['type']) => {
    switch (type) {
      case 'payment_overdue':
        return DollarSign;
      case 'contract_review':
        return FileText;
      case 'content_stolen':
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  if (actions.length === 0) {
    return null;
  }

  // Filter payment overdue actions for premium card
  const paymentOverdueActions = actions.filter(a => a.type === 'payment_overdue');
  const otherActions = actions.filter(a => a.type !== 'payment_overdue');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Premium Payment Overdue Card - iOS Style */}
      {paymentOverdueActions.length > 0 && (
        <div className="space-y-3 mb-6">
            {paymentOverdueActions.map((action, index) => {
              const Icon = getActionIcon(action.type);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="relative p-5 rounded-[16px] bg-gradient-to-br from-red-950/50 via-red-950/40 to-red-950/30 
                            backdrop-blur-xl border border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.25)] 
                            space-y-4 active:scale-[0.98] transition-all duration-200
                            hover:bg-gradient-to-br hover:from-red-950/60 hover:via-red-950/50 hover:to-red-950/40 
                            hover:border-red-500/40 hover:shadow-[0_6px_24px_rgba(239,68,68,0.35)] overflow-hidden group"
                  onClick={() => {
                    if (action.dealId) {
                      navigate(`/creator-contracts/${action.dealId}`);
                    }
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-70 transition-opacity" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/20 
                                        flex items-center justify-center backdrop-blur-sm border border-red-500/40 
                                        shadow-[0_0_12px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_16px_rgba(239,68,68,0.4)] 
                                        transition-all duration-200">
                            <Icon className="w-5 h-5 text-red-300" />
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-pulse border-2 border-red-950/50" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[16px] font-semibold text-white leading-tight tracking-[-0.3px] mb-1">
                            {action.brand || 'Payment'} <span className="text-white/60">•</span> Payment Overdue
                          </h3>
                          <p className="text-[13px] text-red-200/90 leading-tight font-medium">
                            Due since: <span className="text-red-300">{action.daysOverdue || 0}</span> {action.daysOverdue === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500/30 to-red-600/20 
                                     text-red-100 text-[11px] font-semibold border border-red-500/50 
                                     shadow-[0_2px_8px_rgba(239,68,68,0.3)] backdrop-blur-sm shrink-0 ml-2">
                        Overdue
                      </span>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-[12px] p-4 border border-white/10 space-y-2.5 mb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[16px] font-bold text-white tabular-nums">
                          ₹{action.amount?.toLocaleString('en-IN')}
                        </p>
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white/80 text-[12px] font-medium">
                          {action.platform || 'N/A'}
                        </span>
          </div>
                      <div className="flex items-center gap-2 text-[13px] text-red-100/80">
                        <span className="text-white/50">Due Date:</span>
                        <span className="font-medium">
                          {action.dueDate ? new Date(action.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </span>
        </div>
                      {action.lastReminderSentDays !== undefined && action.lastReminderSentDays > 0 ? (
                        <div className="flex items-center gap-2 text-[12px] text-red-200/70 pt-1 border-t border-white/5">
                          <span className="text-white/40">Last reminder:</span>
                          <span>{action.lastReminderSentDays} {action.lastReminderSentDays === 1 ? 'day' : 'days'} ago</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[12px] text-red-200/70 pt-1 border-t border-white/5">
                          <span className="text-white/40">Status:</span>
                          <span>Brand hasn't responded yet</span>
                        </div>
                      )}
                    </div>

                    {/* Buttons - Premium Style */}
                    <div className="space-y-2.5 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendReminder?.(action.dealId!);
                        }}
                        className="w-full py-3.5 rounded-[12px] 
                                 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 
                                 text-white font-semibold text-[15px] tracking-tight
                                 active:scale-[0.97] active:opacity-90 transition-all duration-150
                                 shadow-[0_4px_16px_rgba(239,68,68,0.5)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.6)]
                                 border border-red-400/40 backdrop-blur-sm"
                      >
                        Send Reminder
                      </button>

        <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEscalate?.(action.dealId!);
                        }}
                        className="w-full py-3.5 rounded-[12px] 
                                 bg-white/10 backdrop-blur-md hover:bg-white/15 text-white/95 font-semibold text-[15px] tracking-tight
                                 active:scale-[0.97] active:opacity-90 transition-all duration-150
                                 border border-white/30 hover:border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
        >
                        Escalate
        </button>
      </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Other Action Types (Contract Review, Content Stolen) */}
      {otherActions.length > 0 && (
        <Card variant="attention" className="relative">
          <CardContent className="pt-6">
      <div className="space-y-3">
              {otherActions.map((action, index) => {
            const Icon = getActionIcon(action.type);

            // Determine border color and icon color based on action type
                const actionBorderColor = action.type === 'contract_review' 
              ? 'border-yellow-500/30' 
              : 'border-purple-500/30';
            
                const actionIconBg = action.type === 'contract_review' 
              ? 'bg-yellow-500/10' 
              : 'bg-purple-500/10';
            
                const actionIconColor = action.type === 'contract_review' 
              ? 'text-yellow-500' 
              : 'text-purple-500';

                // Original layout for other action types
            return (
              <motion.div
                key={index}
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={cn(
                  "bg-gray-900/60 border rounded-lg p-4 hover:border-opacity-60 transition-all cursor-pointer group",
                  actionBorderColor
                )}
                onClick={() => {
                      if (action.type === 'contract_review' && action.dealId) {
                    navigate(`/creator-contracts/${action.dealId}`);
                  } else if (action.type === 'content_stolen') {
                    navigate('/creator-content-protection');
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    actionIconBg
                  )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          actionIconColor
                        )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                      {action.type === 'contract_review' && action.hasRedFlags && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                          Red flags
                        </span>
                      )}
                      {action.type === 'content_stolen' && action.matches && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                          {action.matches} matches
                        </span>
                      )}
                    </div>

                    {action.type === 'contract_review' && (
                      <p className="text-xs text-gray-400 mb-3">
                        {action.brand || 'Contract'} deal • Received {action.receivedDays} days ago
                      </p>
                    )}

                    {action.type === 'content_stolen' && (
                      <p className="text-xs text-gray-400 mb-3">
                        @{action.topThief || 'fakepage'} • {action.views ? `${(action.views / 1000).toFixed(1)}K` : '12.5K'} views • {action.platform || 'Instagram'}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {action.type === 'contract_review' && action.dealId && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAnalyzeContract?.(action.dealId!);
                            }}
                            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Search className="w-3 h-3" />
                            Analyze Now
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/creator-contracts/${action.dealId}`);
                            }}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            View
                          </button>
                        </>
                      )}

                      {action.type === 'content_stolen' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTakeDown?.();
                            }}
                            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Take Down
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/creator-content-protection');
                            }}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            View All
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
          </CardContent>
        </Card>
      )}
      </motion.div>
    );
};

export default CriticalActions;

