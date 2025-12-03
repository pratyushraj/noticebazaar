/**
 * Native Bottom Sheet Loading Component
 * iOS-style glass bottom sheet with spinner for loading states
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { glass, radius, shadows, spacing } from '@/lib/design-system';

interface NativeLoadingSheetProps {
  isOpen: boolean;
  message?: string;
}

export const NativeLoadingSheet: React.FC<NativeLoadingSheetProps> = ({
  isOpen,
  message = 'Loading...',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[9999]',
              glass.ios17,
              radius.xl,
              shadows.depthStrong,
              'p-6',
              'max-h-[200px]'
            )}
            style={{
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-white/80 text-sm font-medium">{message}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

