"use client";

import React from 'react';
import { Moon } from 'lucide-react';
import { useNightMode } from '@/hooks/useNightMode';
import { motion } from 'framer-motion';

export const NightOwlBadge: React.FC = () => {
  const { hasNightOwlBadge, nightCount } = useNightMode();

  if (!hasNightOwlBadge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold"
    >
      <Moon className="w-3 h-3" />
      <span>Night Owl</span>
      {nightCount >= 20 && <span className="text-[10px]">({nightCount} nights)</span>}
    </motion.div>
  );
};

export default NightOwlBadge;

