"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Deal {
  id: string;
  brandName: string;
  amount: number;
  status: string;
  deliverables: string[];
  dueDate: Date;
  paymentDate: Date;
  platform: string;
  category: string;
  description?: string;
}

interface DealComparisonProps {
  deals?: Deal[];
  isDark?: boolean;
}

const DealComparison: React.FC<DealComparisonProps> = ({
  deals = [],
  isDark = true,
}) => {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const defaultDeals: Deal[] = [
    {
      id: '1',
      brandName: 'Zepto',
      amount: 35000,
      status: 'completed',
      deliverables: ['1 Reel', '2 Stories', '1 Post'],
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      platform: 'Instagram',
      category: 'Quick Commerce',
    },
    {
      id: '2',
      brandName: 'Spotify',
      amount: 45000,
      status: 'active',
      deliverables: ['3 Stories', '1 Reel', '2 Posts'],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      platform: 'Instagram',
      category: 'Music/Entertainment',
    },
    {
      id: '3',
      brandName: 'Nike',
      amount: 52000,
      status: 'pending',
      deliverables: ['2 Reels', '4 Stories', '1 Blog Post'],
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      paymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      platform: 'YouTube',
      category: 'Sportswear',
    },
  ];

  const displayDeals = deals.length > 0 ? deals : defaultDeals;
  const selectedDealObjects = selectedDeals
    .map((id) => displayDeals.find((d) => d.id === id))
    .filter(Boolean) as Deal[];

  const comparisonFields = [
    {
      label: 'Brand',
      key: 'brandName',
      type: 'text',
    },
    {
      label: 'Amount',
      key: 'amount',
      type: 'currency',
    },
    {
      label: 'Platform',
      key: 'platform',
      type: 'text',
    },
    {
      label: 'Category',
      key: 'category',
      type: 'text',
    },
    {
      label: 'Status',
      key: 'status',
      type: 'badge',
    },
    {
      label: 'Deliverables',
      key: 'deliverables',
      type: 'list',
    },
    {
      label: 'Due Date',
      key: 'dueDate',
      type: 'date',
    },
    {
      label: 'Payment Date',
      key: 'paymentDate',
      type: 'date',
    },
  ];

  const getFieldValue = (deal: Deal, key: string) => {
    const value = (deal as any)[key];
    if (key === 'amount') {
      return `₹${value.toLocaleString()}`;
    }
    if (key === 'dueDate' || key === 'paymentDate') {
      return new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    return value;
  };

  return (
    <Card className={cn(
      'border transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30'
        : 'bg-white border-slate-200 shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={cn(
            'text-base font-bold tracking-tight',
            isDark ? 'text-white' : 'text-slate-900'
          )}>
            ⚖️ Deal Comparison
          </h3>
          <div className="relative">
            <motion.button
              onClick={() => setShowSelector(!showSelector)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                showSelector
                  ? isDark
                    ? 'bg-blue-600/30 text-blue-300'
                    : 'bg-blue-100 text-blue-700'
                  : isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/15'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              <span>Select Deals</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', showSelector && 'rotate-180')} />
            </motion.button>

            <AnimatePresence>
              {showSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'absolute right-0 top-full mt-2 rounded-lg border shadow-lg backdrop-blur-sm z-10 min-w-[180px]',
                    isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'
                  )}
                >
                  {displayDeals.map((deal) => (
                    <motion.button
                      key={deal.id}
                      onClick={() => {
                        setSelectedDeals((prev) =>
                          prev.includes(deal.id)
                            ? prev.filter((id) => id !== deal.id)
                            : prev.length < 3
                            ? [...prev, deal.id]
                            : prev
                        );
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors flex items-center justify-between first:rounded-t-lg last:rounded-b-lg',
                        selectedDeals.includes(deal.id)
                          ? isDark
                            ? 'bg-blue-600/30 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                          : isDark
                          ? 'text-white/70 hover:bg-white/10'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span>{deal.brandName}</span>
                      {selectedDeals.includes(deal.id) && <Check className="w-4 h-4" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Comparison Table */}
        {selectedDealObjects.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6"
          >
            <table className="w-full">
              <tbody>
                {comparisonFields.map((field, idx) => {
                  const isHighlightRow = idx % 2 === 0;
                  return (
                    <tr
                      key={field.key}
                      className={cn(
                        'border-b',
                        isDark
                          ? isHighlightRow
                            ? 'border-white/5 bg-white/2'
                            : 'border-white/5'
                          : isHighlightRow
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-200'
                      )}
                    >
                      <td className={cn(
                        'py-3 px-4 font-semibold text-sm sticky left-0 w-36 min-w-[140px] z-10',
                        isDark
                          ? 'bg-white/5 text-white'
                          : 'bg-slate-100 text-slate-900'
                      )}>
                        {field.label}
                      </td>
                      {selectedDealObjects.map((deal) => (
                        <td
                          key={deal.id}
                          className={cn(
                            'py-3 px-4 text-sm font-medium',
                            isDark ? 'text-white/80' : 'text-slate-700'
                          )}
                        >
                          {field.type === 'list' ? (
                            <div className="space-y-1">
                              {((deal as any)[field.key] as string[]).map((item, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    isDark
                                      ? 'bg-white/10 text-white/70 border-white/20'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  )}
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          ) : field.type === 'badge' ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                ((deal as any)[field.key] as string).toLowerCase() === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : ((deal as any)[field.key] as string).toLowerCase() === 'active'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                              )}
                            >
                              {((deal as any)[field.key] as string).toUpperCase()}
                            </Badge>
                          ) : (
                            getFieldValue(deal, field.key)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'text-center py-8',
              isDark ? 'text-white/60' : 'text-slate-600'
            )}
          >
            <p className="text-sm">Select 2-3 deals to compare</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default DealComparison;
