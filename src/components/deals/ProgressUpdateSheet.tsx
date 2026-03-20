"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { animations, motion as motionTokens, glass, radius, shadows, typography, iconSizes } from '@/lib/design-system';
import { DealStage, STAGE_TO_PROGRESS, STAGE_LABELS } from '@/lib/hooks/useBrandDeals';

interface ProgressUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: DealStage;
  onStageSelect: (stage: DealStage) => void;
  isLoading?: boolean;
}

const progressStages = [
  {
    label: 'Negotiation',
    value: 'negotiation' as DealStage,
    percent: 30,
    description: 'Terms being discussed',
  },
  {
    label: 'Signed',
    value: 'signed' as DealStage,
    percent: 70,
    description: 'Contract signed by both parties',
  },
  {
    label: 'Content Making',
    value: 'content_making' as DealStage,
    percent: 80,
    description: 'Creator is producing content',
  },
  {
    label: 'Content Delivered',
    value: 'content_delivered' as DealStage,
    percent: 90,
    description: 'Content delivered to brand',
  },
  {
    label: 'Completed',
    value: 'completed' as DealStage,
    percent: 100,
    description: 'Deal fully completed',
  },
];

const ProgressUpdateSheet: React.FC<ProgressUpdateSheetProps> = ({
  isOpen,
  onClose,
  currentStage,
  onStageSelect,
  isLoading = false,
}) => {
  const handleStageClick = (stage: DealStage) => {
    if (isLoading || stage === currentStage) return;
    
    triggerHaptic(HapticPatterns.medium);
    onStageSelect(stage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={motionTokens.spring.ios17}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                triggerHaptic(HapticPatterns.light);
                onClose();
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[101]",
              glass.ios17,
              radius.xl,
              shadows.depthStrong,
              "max-h-[85vh] overflow-hidden flex flex-col",
              "pb-[max(env(safe-area-inset-bottom,0px),0px)]" // Add safe area padding to container
            )}
            style={{
              maxHeight: 'calc(85vh - env(safe-area-inset-bottom, 0px))',
            }}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
              <h2 className={cn(typography.h3, "text-white")}>Update Progress</h2>
              <motion.button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  onClose();
                }}
                whileTap={animations.microTap}
                className={cn(
                  "w-10 h-10 rounded-full",
                  glass.apple,
                  "flex items-center justify-center transition-colors",
                  "hover:bg-white/15 active:scale-95"
                )}
                aria-label="Close"
              >
                <X className={cn(iconSizes.md, "text-white")} />
              </motion.button>
            </div>

            {/* Content - Scrollable area */}
            <div className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              "px-6",
              "min-h-0" // Critical for flex scrolling
            )}
            style={{
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px) + 100px)',
              WebkitOverflowScrolling: 'touch',
            }}>
              <div className="space-y-3">
                {progressStages.map((stageConfig, index) => {
                  const isSelected = stageConfig.value === currentStage;
                  
                  return (
                    <motion.button
                      key={stageConfig.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        ...motionTokens.spring.ios17,
                        delay: index * 0.05,
                      }}
                      onClick={() => handleStageClick(stageConfig.value)}
                      disabled={isLoading || isSelected}
                      whileTap={animations.microTap}
                      className={cn(
                        "w-full",
                        glass.apple,
                        radius.lg,
                        shadows.md,
                        "p-4 flex items-center justify-between",
                        "transition-all duration-200",
                        isSelected
                          ? "bg-white/15 border-2 border-white/30 shadow-lg shadow-purple-500/20"
                          : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                        isLoading && "opacity-50 cursor-not-allowed",
                        "active:scale-[0.97]"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Progress Circle */}
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          "font-semibold text-sm",
                          isSelected
                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                            : "bg-white/10 text-white/70"
                        )}>
                          {stageConfig.percent}%
                        </div>
                        
                        {/* Stage Info */}
                        <div className="flex-1 text-left">
                          <div className={cn(
                            "font-semibold mb-1",
                            isSelected ? "text-white" : "text-white/90"
                          )}>
                            {stageConfig.label}
                          </div>
                          <div className="text-xs text-white/60">
                            {stageConfig.description}
                          </div>
                        </div>
                      </div>
                      
                      {/* Check Icon */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={motionTokens.spring.ios17}
                          className="flex-shrink-0"
                        >
                          <Check className={cn(iconSizes.md, "text-purple-400")} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProgressUpdateSheet;

