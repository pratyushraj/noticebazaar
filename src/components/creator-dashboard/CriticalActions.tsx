"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, FileText, Shield, ArrowRight, Clock, Send, Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';

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

  const getActionColor = (type: UrgentAction['type']) => {
    switch (type) {
      case 'payment_overdue':
        return 'border-red-500 bg-red-500/5';
      case 'contract_review':
        return 'border-yellow-500 bg-yellow-500/5';
      case 'content_stolen':
        return 'border-orange-500 bg-orange-500/5';
      default:
        return 'border-gray-500 bg-gray-500/5';
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-red-950/40 to-red-900/20 border border-white/5 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <h3 className="text-base font-semibold text-white">Needs Your Attention</h3>
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold animate-pulse">
            {actions.length}
          </span>
        </div>
        <button 
          onClick={() => navigate('/creator-contracts')}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = getActionIcon(action.type);

            // Determine border color and icon color based on action type
            const actionBorderColor = action.type === 'payment_overdue' 
              ? 'border-red-500/30' 
              : action.type === 'contract_review' 
              ? 'border-yellow-500/30' 
              : 'border-purple-500/30';
            
            const actionIconBg = action.type === 'payment_overdue' 
              ? 'bg-red-500/10' 
              : action.type === 'contract_review' 
              ? 'bg-yellow-500/10' 
              : 'bg-purple-500/10';
            
            const actionIconColor = action.type === 'payment_overdue' 
              ? 'text-red-500' 
              : action.type === 'contract_review' 
              ? 'text-yellow-500' 
              : 'text-purple-500';

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
                  if (action.type === 'payment_overdue' && action.dealId) {
                    navigate(`/creator-contracts/${action.dealId}`);
                  } else if (action.type === 'contract_review' && action.dealId) {
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
                    <Icon className={cn("w-5 h-5", actionIconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                      {action.type === 'payment_overdue' && action.daysOverdue && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-medium">
                          {action.daysOverdue} days
                        </span>
                      )}
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

                    {/* Action-specific details */}
                    {action.type === 'payment_overdue' && (
                      <p className="text-xs text-gray-400 mb-3">
                        ₹{action.amount?.toLocaleString('en-IN')} • {action.platform || 'N/A'} • Due {action.dueDate ? new Date(action.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    )}

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
                      {action.type === 'payment_overdue' && action.dealId && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendReminder?.(action.dealId!);
                            }}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Send className="w-3 h-3" />
                            Send Reminder
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEscalate?.(action.dealId!);
                            }}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                          >
                            Escalate
                          </button>
                        </>
                      )}

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
      </motion.div>
    );
};

export default CriticalActions;

