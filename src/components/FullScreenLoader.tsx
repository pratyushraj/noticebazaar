"use client";

import { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';
import { triggerHaptic } from '@/lib/utils/haptics';

interface FullScreenLoaderProps {
  message?: string;
  secondaryMessage?: string;
}

export const FullScreenLoader = ({
  message = 'Preparing your protected workspace...',
  secondaryMessage,
}: FullScreenLoaderProps) => {
  const [showRetry, setShowRetry] = useState(false);
  const { refetchProfile, session } = useSession();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 6000); // Show retry after 6 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020D0A] overflow-hidden">
      {/* Animated Emerald Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-500 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {/* Shield with Glow */}
        <div className="relative mb-10">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"
          />
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center relative z-20 backdrop-blur-md">
            <Shield className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <h2 className="text-[13px] font-black text-white tracking-[0.25em] uppercase">
              {message}
            </h2>
          </motion.div>
          
          {secondaryMessage && (
            <p className="text-[13px] text-emerald-100/50 font-medium max-w-[240px] leading-relaxed mx-auto">
              {secondaryMessage}
            </p>
          )}
        </div>

        {/* Retry Actions */}
        <AnimatePresence>
          {showRetry && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <button
                onClick={() => {
                  triggerHaptic?.();
                  if (refetchProfile) refetchProfile();
                  else window.location.reload();
                }}
                className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all backdrop-blur-sm"
              >
                Retry Loading
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="text-[10px] text-emerald-500/40 hover:text-emerald-500/60 font-black uppercase tracking-[0.2em] transition-colors"
              >
                Hard Reload
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OS Branding */}
      <div className="absolute bottom-10 left-0 right-0 text-center opacity-20">
        <p className="text-[10px] uppercase font-black tracking-[0.4em] text-emerald-500">
          CreatorArmour OS
        </p>
      </div>
    </div>
  );
};

export default FullScreenLoader;
