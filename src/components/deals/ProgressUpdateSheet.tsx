

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { animations, motion as motionTokens, glass, radius, shadows, typography, iconSizes } from '@/lib/design-system';
import { DealStage, STAGE_TO_PROGRESS } from '@/lib/hooks/useBrandDeals';

interface ProgressUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: DealStage;
  onStageSelect: (stage: DealStage) => void;
  isLoading?: boolean;
  requiresShipping?: boolean;
}

const ProgressUpdateSheet: React.FC<ProgressUpdateSheetProps> = ({
  isOpen,
  onClose,
  currentStage,
  onStageSelect,
  isLoading = false,
  requiresShipping = false,
}) => {
  const progressStages: Array<{
    label: string;
    value: DealStage;
    description: string;
  }> = requiresShipping
    ? [
        // Keep aligned with the shipping-led creator timeline: Contract → Signed → Dispatch → Received → Complete
        { label: 'Contract', value: 'contract_ready', description: 'Agreement is being finalized' },
        { label: 'Signed', value: 'fully_executed', description: 'Contract signed by both parties' },
        { label: 'Dispatch', value: 'content_making', description: 'Product is being shipped or handed off' },
        { label: 'Received', value: 'content_delivered', description: 'Product confirmed by the creator' },
        { label: 'Complete', value: 'completed', description: 'Deal fully completed' },
      ]
    : [
        // Keep this list aligned with the creator content timeline: Contract → Signed → Create → Deliver → Done
        { label: 'Contract', value: 'contract_ready', description: 'Agreement is being finalized' },
        { label: 'Signed', value: 'fully_executed', description: 'Contract signed by both parties' },
        { label: 'Create', value: 'content_making', description: 'You’re producing the content' },
        { label: 'Deliver', value: 'content_delivered', description: 'Content submitted to brand' },
        { label: 'Done', value: 'completed', description: 'Deal fully completed' },
      ];

  const uiStage: DealStage | undefined = (() => {
    // Collapse legacy/internal stages into the simplified UI stages.
    if (!currentStage) return undefined;
    if (currentStage === 'contract_ready') return 'contract_ready';
    if (currentStage === 'fully_executed') return 'fully_executed';
    if (currentStage === 'content_making') return 'content_making';
    if (currentStage === 'content_delivered') return 'content_delivered';
    if (currentStage === 'completed') return 'completed';

    // Legacy/support stages
    if (currentStage === 'negotiation') return 'contract_ready';
    if (currentStage === 'details_submitted') return 'contract_ready';
    if (currentStage === 'brand_signed') return 'contract_ready';
    if (currentStage === 'awaiting_product_shipment') return 'contract_ready';
    if (currentStage === 'needs_changes') return 'contract_ready';
    if (currentStage === 'live_deal') return 'content_making';
    if (currentStage === 'declined') return 'contract_ready';
    return currentStage;
  })();

  const isAutoStage = (stage: DealStage) => stage === 'fully_executed' || stage === 'completed';

  const handleStageClick = (stage: DealStage) => {
    if (isLoading || stage === uiStage) return;
    if (isAutoStage(stage)) return;
    
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
            // High z-index so it can appear above "in-dashboard" detail screens that use z~1100.
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000]"
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
              "fixed bottom-0 left-0 right-0 z-[2001]",
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
              <div className="w-12 h-1.5 rounded-full bg-secondary/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 flex-shrink-0">
              <h2 className={cn(typography.h3, "text-foreground")}>Update Progress</h2>
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
                  "hover:bg-secondary/15 active:scale-95"
                )}
                aria-label="Close"
              >
                <X className={cn(iconSizes.md, "text-foreground")} />
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
                  const isSelected = stageConfig.value === uiStage;
                  const percent = STAGE_TO_PROGRESS[stageConfig.value] ?? 0;
                  const isAuto = isAutoStage(stageConfig.value);
                  
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
                      disabled={isLoading || isSelected || isAuto}
                      whileTap={animations.microTap}
                      className={cn(
                        "w-full",
                        glass.apple,
                        radius.lg,
                        shadows.md,
                        "p-4 flex items-center justify-between",
                        "transition-all duration-200",
                        isSelected
                          ? "bg-secondary/15 border-2 border-border shadow-lg shadow-purple-500/20"
                          : "bg-card border border-border hover:bg-secondary/50 hover:border-border",
                        (isLoading || isAuto) && "opacity-50 cursor-not-allowed",
                        "active:scale-[0.97]"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Progress Circle */}
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          "font-semibold text-sm",
                          isSelected
                            ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-foreground"
                            : "bg-secondary/50 text-foreground/70"
                        )}>
                          {percent}%
                        </div>
                        
                        {/* Stage Info */}
                        <div className="flex-1 text-left">
                          <div className={cn(
                            "font-semibold mb-1 flex items-center gap-2",
                            isSelected ? "text-foreground" : "text-foreground/90"
                          )}>
                            <span>{stageConfig.label}</span>
                            {isAuto && (
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary/50 text-foreground/70 border border-border">
                                Auto
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-foreground/60">
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
                          <Check className={cn(iconSizes.md, "text-secondary")} />
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
