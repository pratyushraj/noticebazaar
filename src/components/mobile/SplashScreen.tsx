/**
 * Splash Screen Component
 * Provides smooth fade-in animation when app loads
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 150-200ms
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete after fade-out animation completes
      setTimeout(onComplete, 300);
    }, 180);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1], // ease-out-quart
          }}
          className="fixed inset-0 z-[99999] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          {/* App Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 mx-auto shadow-2xl">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                NB
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">NoticeBazaar</h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

