"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export const usePratyushMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      const newSequence = [...sequence, key].slice(-KONAMI_CODE.length);
      setSequence(newSequence);

      if (newSequence.length === KONAMI_CODE.length) {
        const isMatch = newSequence.every((k, i) => k === KONAMI_CODE[i]);
        if (isMatch) {
          setIsActive(true);
          setSequence([]);
          
          // Play 8-bit sound effect (using Web Audio API)
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 440;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
          } catch (e) {
            console.warn('Audio not supported');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sequence]);

  return { isActive, setIsActive };
};

export const PratyushModeOverlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 3s ease infinite',
        }}
      >
        <style>{`
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-6xl font-bold text-white drop-shadow-2xl"
            style={{ fontFamily: 'monospace', textShadow: '0 0 20px #000' }}
          >
            PRATYUSH MODE ACTIVATED
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

