"use client";

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MadeWithDyad } from '@/components/made-with-dyad';

interface FullScreenLoaderProps {
  message?: string;
  secondaryMessage?: string;
}

export const FullScreenLoader = ({
  message = 'Preparing your protected workspace...',
  secondaryMessage,
}: FullScreenLoaderProps) => {
  const [showFooter, setShowFooter] = useState(false);

  // Fade in footer after a delay to keep focus on loader initially
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFooter(true);
    }, 800); // Show footer after 800ms

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 px-4">
      {/* Branded Loader - Shield with pulse animation */}
      <div className="relative">
        {/* Outer gradient ring with pulse */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4), rgba(99, 102, 241, 0.4))',
            filter: 'blur(8px)',
          }}
        />
        
        {/* Shield icon with subtle rotation */}
        <motion.div
          className="relative w-16 h-16 flex items-center justify-center"
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shield className="w-12 h-12 text-purple-400 drop-shadow-lg" strokeWidth={2} />
          
          {/* Inner glow */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent)',
            }}
          />
        </motion.div>
      </div>

      {/* Loading message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mt-6 text-lg text-white/90 text-center font-medium"
      >
        {message}
      </motion.p>
      
      {secondaryMessage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-2 text-sm text-white/70 text-center max-w-md"
        >
          {secondaryMessage}
        </motion.p>
      )}

      {/* Footer - Fades in after delay */}
      <AnimatePresence>
        {showFooter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-12"
          >
            <MadeWithDyad />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FullScreenLoader;


