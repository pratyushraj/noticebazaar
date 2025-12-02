"use client";

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { VerifiedItem } from '@/types/contractAnalysis';
import { motion } from 'framer-motion';

interface VerifiedListProps {
  verified: VerifiedItem[];
}

export const VerifiedList: React.FC<VerifiedListProps> = ({ verified }) => {
  if (verified.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)] text-center py-8"
      >
        <div className="text-white/60">No positive protections</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
    >
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
        <CheckCircle className="w-5 h-5 text-green-400" />
        Verified Safe Clauses ({verified.length})
      </h3>
      <div className="space-y-3">
        {verified.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">
                    {item.category}
                  </span>
                  {item.section && (
                    <span className="text-xs text-white/50">{item.section}</span>
                  )}
                </div>
                <p className="text-sm text-white/80">{item.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

