

import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = '90vh',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 400) {
      triggerHaptic(HapticPatterns.light);
      onClose();
    }
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[101]",
              "bg-card border-t border-border",
              "rounded-t-2xl shadow-xl",
              "max-h-[90vh] overflow-hidden flex flex-col"
            )}
            style={{ maxHeight }}
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-2 shrink-0">
              <div className="w-9 h-1 rounded-full bg-secondary" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <button
                  type="button"
                  onClick={() => { triggerHaptic(HapticPatterns.light); onClose(); }}
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
