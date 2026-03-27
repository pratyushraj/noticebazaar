"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, CheckCircle2, DollarSign, Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface DealFlow {
  stage: 'draft' | 'active' | 'delivered' | 'payment' | 'completed';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  duration?: string;
}

interface DealStatusFlowProps {
  currentStage?: DealFlow['stage'];
  isDark?: boolean;
  dealCount?: {
    draft: number;
    active: number;
    delivered: number;
    payment: number;
    completed: number;
  };
}

const DealStatusFlow: React.FC<DealStatusFlowProps> = ({
  currentStage = 'active',
  isDark = true,
  dealCount = {
    draft: 2,
    active: 4,
    delivered: 1,
    payment: 2,
    completed: 8,
  },
}) => {
  const flowStages: DealFlow[] = [
    {
      stage: 'draft',
      label: 'Draft',
      description: 'Contract pending signature',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-gray-500 to-slate-600',
      duration: '0-5 days',
    },
    {
      stage: 'active',
      label: 'Active',
      description: 'Content creation phase',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600',
      duration: '5-15 days',
    },
    {
      stage: 'delivered',
      label: 'Delivered',
      description: 'Awaiting brand approval',
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      duration: '1-5 days',
    },
    {
      stage: 'payment',
      label: 'Payment',
      description: 'Payment processing',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      duration: '1-10 days',
    },
    {
      stage: 'completed',
      label: 'Completed',
      description: 'Deal closed & paid',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      duration: 'Final',
    },
  ];

  const currentIndex = flowStages.findIndex((s) => s.stage === currentStage);

  return (
    <Card className={cn(
      'border transition-all duration-300',
      isDark
        ? 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border-slate-700/30'
        : 'bg-white border-slate-200 shadow-sm'
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <h3 className={cn(
          'text-base font-bold tracking-tight mb-6',
          isDark ? 'text-white' : 'text-slate-900'
        )}>
          🎯 Deal Status Flow
        </h3>

        {/* Flow Diagram */}
        <div className="space-y-6">
          {/* Main Flow */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {flowStages.map((stage, idx) => {
              const isCompletedStage = idx <= currentIndex;
              const isPreviousStage = idx < currentIndex;

              return (
                <div key={stage.stage} className="flex items-center gap-2 flex-shrink-0">
                  {/* Stage Node */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="relative"
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all relative',
                        isCompletedStage
                          ? `bg-gradient-to-br ${stage.color} border-white/40`
                          : isDark
                          ? 'bg-white/10 border-white/20'
                          : 'bg-slate-100 border-slate-300'
                      )}
                    >
                      <div className={cn(
                        'text-lg',
                        isCompletedStage ? 'text-white' : isDark ? 'text-white/60' : 'text-slate-600'
                      )}>
                        {stage.icon}
                      </div>

                      {/* Pulse for current stage */}
                      {currentIndex === idx && (
                        <motion.div
                          animate={{ scale: [1, 1.3], opacity: [1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={cn(
                            'absolute inset-0 rounded-full border-2',
                            `border-cyan-400 bg-gradient-to-br ${stage.color}`
                          )}
                        />
                      )}
                    </div>

                    {/* Stage Label */}
                    <div className="absolute top-full mt-2 whitespace-nowrap">
                      <p className={cn(
                        'text-xs font-bold',
                        isCompletedStage
                          ? isDark
                            ? 'text-white'
                            : 'text-slate-900'
                          : isDark
                          ? 'text-white/60'
                          : 'text-slate-600'
                      )}>
                        {stage.label}
                      </p>
                      <p className={cn(
                        'text-[10px] mt-0.5',
                        isDark ? 'text-white/40' : 'text-slate-500'
                      )}>
                        {stage.duration}
                      </p>
                    </div>
                  </motion.div>

                  {/* Arrow */}
                  {idx < flowStages.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: idx * 0.1 + 0.1 }}
                      className="origin-left"
                    >
                      <ArrowRight
                        className={cn(
                          'w-5 h-5 flex-shrink-0',
                          isPreviousStage
                            ? 'text-emerald-500'
                            : isDark
                            ? 'text-white/30'
                            : 'text-slate-300'
                        )}
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stage Details */}
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'p-4 rounded-xl border',
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-slate-50 border-slate-200'
            )}
          >
            {(() => {
              const stage = flowStages[currentIndex];
              return (
                <>
                  <p className={cn(
                    'text-sm font-bold mb-1',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}>
                    {stage.label} Stage
                  </p>
                  <p className={cn(
                    'text-xs mb-3',
                    isDark ? 'text-white/60' : 'text-slate-600'
                  )}>
                    {stage.description}
                  </p>

                  {stage.stage === 'draft' && (
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-blue-200/80' : 'text-blue-900'
                    )}>
                      📋 Next: Send contract to brand for signature
                    </p>
                  )}
                  {stage.stage === 'active' && (
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-blue-200/80' : 'text-blue-900'
                    )}>
                      ⚡ You are here! Create and polish your content
                    </p>
                  )}
                  {stage.stage === 'delivered' && (
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-blue-200/80' : 'text-blue-900'
                    )}>
                      ✅ Content uploaded. Waiting for brand approval
                    </p>
                  )}
                  {stage.stage === 'payment' && (
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-blue-200/80' : 'text-blue-900'
                    )}>
                      💰 Payment is being processed. Should arrive within 7 days
                    </p>
                  )}
                  {stage.stage === 'completed' && (
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-emerald-200/80' : 'text-emerald-900'
                    )}>
                      🎉 Congrats! Deal completed. View in portfolio to showcase
                    </p>
                  )}
                </>
              );
            })()}
          </motion.div>

          {/* Deal Count by Stage */}
          <div className="grid grid-cols-5 gap-2">
            {flowStages.map((stage) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={cn(
                  'p-3 rounded-lg text-center border transition-all',
                  isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-slate-50 border-slate-200 hover:bg-white'
                )}
              >
                <p className={cn(
                  'text-2xl font-bold',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  {dealCount[stage.stage]}
                </p>
                <p className={cn(
                  'text-xs mt-1 font-semibold',
                  isDark ? 'text-white/60' : 'text-slate-600'
                )}>
                  {stage.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DealStatusFlow;
