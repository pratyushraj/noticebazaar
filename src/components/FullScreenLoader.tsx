

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
  message = '',
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
        {/* Advanced Brand Animation */}
        <div className="relative mb-12">
          {/* Sonar Pulse Effects */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"
            />
          ))}

          {/* Rotating Orbital Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 rounded-full border-2 border-dashed border-emerald-500/10"
          />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 rounded-full border border-emerald-500/5"
          />

          {/* Shield Core */}
          <motion.div
            animate={{ 
              y: [0, -4, 0],
              filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex items-center justify-center relative z-20 backdrop-blur-xl overflow-hidden group"
          >
            {/* Internal Scanning Light */}
            <motion.div 
              animate={{ y: [-100, 100] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent -rotate-45"
            />
            
            <Shield className="w-11 h-11 text-emerald-400" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Dynamic Status Display */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/30" />
              <h2 className="text-[12px] font-black text-white tracking-[0.4em] uppercase">
                {message || "Preparing Workspace"}
              </h2>
              <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/30" />
            </div>
            
            <div className="flex items-center gap-1.5 h-4">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full bg-emerald-500" 
              />
              <p className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">
                {secondaryMessage || "Securing encrypted session"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Retry Actions */}
        <AnimatePresence>
          {showRetry && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <button
                onClick={() => {
                  triggerHaptic?.();
                  if (refetchProfile) refetchProfile();
                  else window.location.reload();
                }}
                className="group relative px-8 py-3.5 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                <span className="relative">Retry Connection</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OS Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 left-0 right-0 text-center"
      >
        <p className="text-[10px] uppercase font-black tracking-[0.5em] text-emerald-500/20">
          Creator Armour Enterprise
        </p>
      </motion.div>
    </div>
  );
};

export default FullScreenLoader;
