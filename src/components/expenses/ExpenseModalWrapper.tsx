import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpenseModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const ExpenseModalWrapper: React.FC<ExpenseModalWrapperProps> = ({
  open,
  onClose,
  title,
  description,
  children,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-2xl",
          "bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl",
          "shadow-[0_8px_40px_rgba(0,0,0,0.6)]",
          "px-6 py-6",
          "text-white",
          "[&>button]:hidden", // Hide default close button
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "max-h-[90vh] flex flex-col"
        )}
      >
        {/* Custom close icon - top right */}
        <button
          onClick={onClose}
          className={cn(
            "absolute right-4 top-4 z-10",
            "bg-white/10 backdrop-blur-xl rounded-full p-2",
            "border border-white/20 text-white/90",
            "hover:bg-white/15 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-white/20"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader className="pr-8">
          <DialogTitle className="text-white text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-white/70">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Scrollable body */}
        <div 
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            "max-h-[calc(100vh-200px)]",
            "pr-2 -mr-2", // Account for scrollbar
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-white/20",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:hover:bg-white/30"
          )}
        >
          <AnimatePresence mode="wait">
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

