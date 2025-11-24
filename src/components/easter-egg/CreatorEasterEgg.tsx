"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface CreatorEasterEggProps {
  onTrigger: () => void;
}

const CreatorEasterEgg: React.FC<CreatorEasterEggProps> = ({ onTrigger }) => {
  const [tapCount, setTapCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    const handleTripleTap = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime;
      
      if (timeSinceLastTap < 500) { // Within 500ms
        setTapCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            setShowDialog(true);
            onTrigger();
            return 0;
          }
          return newCount;
        });
      } else {
        setTapCount(1);
      }
      
      setLastTapTime(now);
    };

    // Listen for clicks on logo area
    const logoElement = document.querySelector('[data-easter-egg-trigger]');
    if (logoElement) {
      logoElement.addEventListener('click', handleTripleTap);
      return () => {
        logoElement.removeEventListener('click', handleTripleTap);
      };
    }
  }, [lastTapTime, onTrigger]);

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px] bg-[#0B0F1A] text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Made by a Creator
          </DialogTitle>
          <DialogDescription className="text-center text-white/70 mt-4">
            <p className="text-base mb-2">
              Built by <span className="font-semibold text-purple-400">Pratyush</span>
            </p>
            <p className="text-sm">
              Fellow creator hustling since 2023 💜
            </p>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mt-4 text-4xl"
            >
              ✨
            </motion.div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorEasterEgg;

