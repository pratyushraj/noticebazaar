"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MapPin, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollabPagePreviewProps {
  data: {
    name: string;
    instagramUsername: string;
    contentNiches: string[];
    reelRate: string;
    collabCity: string;
    collabBio: string;
    collabFollowers: string;
    avgReelViewsManual: string;
  };
  isVisible: boolean;
}

/**
 * Live Mobile Mockup Preview of the Collab Page
 */
export const CollabPagePreview: React.FC<CollabPagePreviewProps> = ({ data, isVisible }) => {
  const normalizedHandle = data.instagramUsername.replace(/@/g, '').trim();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="hidden lg:flex flex-col items-center justify-center p-8 bg-slate-900/5 dark:bg-white/5 border-l border-slate-200 dark:border-white/10 w-[400px] h-full overflow-y-auto"
        >
          <div className="text-sm font-semibold text-slate-400 dark:text-white/40 mb-6 flex items-center gap-2 uppercase tracking-wider">
            Live Page Preview
          </div>

          {/* Mobile Frame */}
          <div className="relative w-[300px] h-[600px] bg-white dark:bg-[#0B0F14] rounded-[40px] border-[8px] border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Top Bar / Notch */}
            <div className="h-6 w-full bg-slate-900 dark:bg-slate-800 flex items-center justify-center">
              <div className="h-1.5 w-12 bg-slate-700 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pt-6 bg-slate-50 dark:bg-[#0B0F14]">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-[#0B0F14]">
                    <Instagram className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {data.name || 'Your Name'}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">
                  @{normalizedHandle || 'handle'}
                </p>
                
                {data.contentNiches.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {data.contentNiches.slice(0, 3).map(n => (
                      <span key={n} className="px-2 py-0.5 bg-slate-200 dark:bg-white/10 rounded-full text-[10px] font-semibold text-slate-600 dark:text-white/70">
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
                   <MapPin className="w-3 h-3" />
                   {data.collabCity || 'Your City'}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {data.collabFollowers ? (parseInt(data.collabFollowers) / 1000).toFixed(1) + 'k' : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-white/40 font-medium uppercase">Followers</div>
                </div>
                <div className="text-center border-x border-slate-100 dark:border-white/10">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {data.avgReelViewsManual ? (parseInt(data.avgReelViewsManual) / 1000).toFixed(1) + 'k' : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-white/40 font-medium uppercase">Avg Views</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {data.reelRate ? '₹' + data.reelRate : '—'}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-white/40 font-medium uppercase">Starts at</div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="mb-6 p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                 <div className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase mb-2">About Collaborations</div>
                 <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed italic">
                   {data.collabBio || 'Complete setup to generate your professional collab pitch...'}
                 </p>
              </div>

              {/* Trust Signal */}
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 mb-6">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="text-[10px] font-semibold text-blue-800 dark:text-blue-300">
                  Secured by Creator Armour
                </div>
              </div>

              {/* CTA Button Mock */}
              <div className="w-full py-3 bg-emerald-600 rounded-xl text-[11px] font-bold text-white text-center shadow-lg shadow-emerald-600/20">
                Submit Collaboration Offer
              </div>
            </div>
            
            {/* Bottom Bar */}
            <div className="h-4 w-full bg-slate-900 dark:bg-slate-800" />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400 dark:text-white/40">
              Generated at <span className="font-mono">creatorarmour.com/collab/{normalizedHandle || '...'}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
