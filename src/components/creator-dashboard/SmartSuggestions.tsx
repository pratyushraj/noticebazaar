"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, DollarSign, FileCheck, X, ChevronDown, Check, Clock, Zap } from 'lucide-react';
import { BrandDeal } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartSuggestionsProps {
  brandDeals?: BrandDeal[];
  onSuggestionAction?: (suggestionId: string) => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  count: number;
  estimatedTime?: string;
  impact?: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ brandDeals = [], onSuggestionAction }) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const suggestions: Suggestion[] = React.useMemo(() => {
    const items: Suggestion[] = [];
    const now = new Date();

    // Check for pending payments due soon
    const paymentsDueSoon = brandDeals.filter(deal => {
      if (deal.status !== 'Payment Pending') return false;
      const dueDate = new Date(deal.payment_expected_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7 && daysUntilDue > 0;
    });

    if (paymentsDueSoon.length > 0) {
      items.push({
        id: 'send-reminder',
        title: 'Collect Pending Payments',
        description: `${paymentsDueSoon.length} payment(s) due within a week`,
        action: 'Send reminders',
        icon: <DollarSign className="h-5 w-5" />,
        priority: 'high',
        count: paymentsDueSoon.length,
        estimatedTime: '2 min',
        impact: 'Recover up to ₹5L+ in pending revenue',
      });
    }

    // Check for contracts needing review
    const contractsNeedingReview = brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    );

    if (contractsNeedingReview.length > 0) {
      items.push({
        id: 'review-contracts',
        title: 'Review & Sign Contracts',
        description: `${contractsNeedingReview.length} contract(s) awaiting your signature to activate deals`,
        action: 'Review now',
        icon: <FileCheck className="h-5 w-5" />,
        priority: 'high',
        count: contractsNeedingReview.length,
        estimatedTime: '5 min',
        impact: 'Unlock legal protection on all deals',
      });
    }

    // General suggestion based on earnings trend
    const completedThisMonth = brandDeals.filter(deal => {
      if (deal.status !== 'Completed' || !deal.payment_received_date) return false;
      const receivedDate = new Date(deal.payment_received_date);
      return receivedDate.getMonth() === now.getMonth() && 
             receivedDate.getFullYear() === now.getFullYear();
    }).length;

    if (completedThisMonth >= 3) {
      items.push({
        id: 'pitch-more',
        title: 'Scale Your Income',
        description: 'You\'re closing deals consistently! Time to increase pitch frequency and land more brands',
        action: 'Find opportunities',
        icon: <TrendingUp className="h-5 w-5" />,
        priority: 'medium',
        count: completedThisMonth,
        estimatedTime: '10 min',
        impact: '2-3x your monthly earnings',
      });
    }

    return items.slice(0, 4); // Limit to 4 suggestions
  }, [brandDeals]);

  const activeSuggestions = suggestions.filter(s => !dismissedIds.has(s.id));

  if (activeSuggestions.length === 0) {
    return null;
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-500/20 text-red-600 border-red-500/30',
          border: 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5',
          icon: 'text-red-500',
          gradient: 'from-red-600 to-orange-600',
          label: 'Urgent',
        };
      case 'medium':
        return {
          badge: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
          border: 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5',
          icon: 'text-blue-500',
          gradient: 'from-blue-600 to-cyan-600',
          label: 'Important',
        };
      case 'low':
        return {
          badge: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
          border: 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5',
          icon: 'text-purple-500',
          gradient: 'from-purple-600 to-pink-600',
          label: 'Opportunity',
        };
      default:
        return {
          badge: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
          border: 'border-gray-500/20 bg-gray-500/5',
          icon: 'text-gray-500',
          gradient: 'from-gray-600 to-slate-600',
          label: 'Tip',
        };
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]));
  };

  const handleAction = (id: string) => {
    onSuggestionAction?.(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl shadow-lg">
        <CardHeader className="pb-4 pt-5 px-5 sm:px-6 border-b border-slate-700/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20"
                />
                <div className="relative bg-purple-600/20 p-2 rounded-xl border border-purple-500/30">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white">Smart Suggestions</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSuggestions.length} actionable items
                </p>
              </div>
            </div>
            {activeSuggestions.length > 0 && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {activeSuggestions.map((suggestion, index) => {
              const config = getPriorityConfig(suggestion.priority);
              const isExpanded = expandedId === suggestion.id;

              return (
                <motion.div
                  key={suggestion.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`group relative rounded-2xl border ${config.border} transition-all duration-300 overflow-hidden hover:border-opacity-100`}
                  >
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative p-4 sm:p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn("flex-shrink-0 mt-1 p-2 rounded-lg bg-white/5 border border-white/10", config.icon)}>
                            {suggestion.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white">{suggestion.title}</h3>
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-semibold border", config.badge)}
                              >
                                {suggestion.priority === 'high' && <Zap className="w-3 h-3 mr-1" />}
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{suggestion.description}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDismiss(suggestion.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                          aria-label="Dismiss suggestion"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-400">
                        {suggestion.estimatedTime && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{suggestion.estimatedTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{suggestion.count}</span>
                          <span>{suggestion.count === 1 ? 'item' : 'items'}</span>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      <AnimatePresence>
                        {isExpanded && suggestion.impact && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mb-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                          >
                            <div className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-emerald-400">Estimated Impact</p>
                                <p className="text-xs text-slate-300 mt-1">{suggestion.impact}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Button */}
                      <div className="flex gap-2 pt-3 border-t border-white/10">
                        <Button
                          size="sm"
                          onClick={() => handleAction(suggestion.id)}
                          className={cn(
                            "flex-1 gap-1.5 font-semibold text-white shadow-lg transition-all",
                            suggestion.priority === 'high'
                              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-red-600/20'
                              : suggestion.priority === 'medium'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-600/20'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-600/20'
                          )}
                        >
                          {suggestion.action}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                          className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-slate-300 hover:text-white"
                          aria-label={isExpanded ? 'Show less' : 'Show more'}
                        >
                          {isExpanded ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeSuggestions.length === 0 && dismissedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <p className="text-sm text-slate-400">All suggestions dismissed!</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissedIds(new Set())}
                className="mt-2 text-xs"
              >
                Restore All
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SmartSuggestions;

