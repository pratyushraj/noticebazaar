"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MoneyRainProps {
  lifetimeEarnings: number;
  onComplete?: () => void;
}

const milestones = [
  { amount: 1000000, label: '₹10 Lakh', emoji: '🎉' },
  { amount: 2500000, label: '₹25 Lakh', emoji: '🚀' },
  { amount: 5000000, label: '₹50 Lakh', emoji: '💎' },
];

export const MoneyRain: React.FC<MoneyRainProps> = ({ lifetimeEarnings, onComplete }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [milestone, setMilestone] = useState<typeof milestones[0] | null>(null);
  const [hasTriggered, setHasTriggered] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Check if we've crossed a new milestone
    const crossedMilestone = milestones.find(
      m => lifetimeEarnings >= m.amount && !hasTriggered.has(m.amount)
    );

    if (crossedMilestone) {
      setMilestone(crossedMilestone);
      setShowCelebration(true);
      setHasTriggered(prev => new Set([...prev, crossedMilestone.amount]));

      // Trigger confetti
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Auto-close after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
        onComplete?.();
      }, 5000);
    }
  }, [lifetimeEarnings, hasTriggered, onComplete]);

  if (!showCelebration || !milestone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => {
          setShowCelebration(false);
          onComplete?.();
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-12 rounded-3xl shadow-2xl text-center max-w-md mx-4 border-4 border-yellow-400"
        >
          {/* Animated rupee notes falling */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, x: Math.random() * 400 - 200, rotate: 0, opacity: 0 }}
                animate={{
                  y: 600,
                  rotate: 360,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute text-4xl"
              >
                ₹
              </motion.div>
            ))}
          </div>

          <div className="relative z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-8xl mb-4"
            >
              {milestone.emoji}
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Congratulations!
            </h2>
            <p className="text-2xl font-semibold text-yellow-200 mb-4">
              You just hit {milestone.label} lifetime earnings!
            </p>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white">
              <IndianRupee className="w-8 h-8" />
              <span>{lifetimeEarnings.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-white/80 mt-4 text-sm">
              Click anywhere to continue
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MoneyRain;

