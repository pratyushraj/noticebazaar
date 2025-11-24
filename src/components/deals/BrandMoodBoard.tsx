"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, X } from 'lucide-react';

interface BrandMoodBoardProps {
  brandName: string;
  platform?: string;
  isVisible: boolean;
  onClose: () => void;
}

const BrandMoodBoard: React.FC<BrandMoodBoardProps> = ({
  brandName,
  platform,
  isVisible,
  onClose,
}) => {
  // Mock Instagram posts - in real app, fetch from API
  const mockPosts = [
    { id: 1, image: `https://logo.clearbit.com/${brandName.toLowerCase().replace(/\s+/g, '')}.com`, caption: 'Latest post' },
    { id: 2, image: `https://logo.clearbit.com/${brandName.toLowerCase().replace(/\s+/g, '')}.com`, caption: 'Recent content' },
    { id: 3, image: `https://logo.clearbit.com/${brandName.toLowerCase().replace(/\s+/g, '')}.com`, caption: 'Brand style' },
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute top-full left-0 mt-2 w-80 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 z-50"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-semibold text-white">{brandName}</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close mood board"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {mockPosts.map((post) => (
            <div
              key={post.id}
              className="aspect-square rounded-lg bg-white/5 border border-white/10 overflow-hidden"
            >
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-white/50 mt-2 text-center">
          Recent {platform || 'Instagram'} posts
        </p>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrandMoodBoard;

