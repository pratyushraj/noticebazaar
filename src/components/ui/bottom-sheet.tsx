

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollLock } from '@/hooks/useScrollLock';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  className,
}) => {
  // Prevent background scroll when sheet is open (targets #root on mobile)
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-card text-foreground rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]",
              "max-h-[92vh] overflow-hidden flex flex-col border-t border-border",
              "safe-area-inset-bottom",
              className
            )}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Handle Bar */}
            <div className="flex items-center justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-secondary/50 rounded-full" />
            </div>

            {/* Header */}
            <div className={cn("flex items-center justify-between px-6 pb-6 pt-2", !title && "justify-end")}>
              {title && (
                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase italic">{title}</h2>
              )}
              <button type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-secondary/30 hover:bg-secondary/50 flex items-center justify-center transition-all active:scale-90"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

