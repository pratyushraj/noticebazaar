"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionTileProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

export const ActionTile: React.FC<ActionTileProps> = ({
  icon: Icon,
  label,
  onClick,
  iconBgColor = 'bg-purple-500/20',
  iconColor = 'text-purple-400',
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/15 shadow-lg shadow-black/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 active:scale-95"
    >
      <div className={`${iconBgColor} w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="text-xs font-semibold text-center text-white/90">{label}</div>
    </motion.button>
  );
};

