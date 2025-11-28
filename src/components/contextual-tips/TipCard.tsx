"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface TipAction {
  label: string;
  type: 'dismiss' | 'navigate' | 'action';
  target?: string;
  callback?: string;
}

export interface Tip {
  id: string;
  trigger: 'view' | 'condition' | 'hover' | 'event';
  view?: string;
  condition?: () => boolean;
  priority: 'high' | 'medium' | 'low';
  icon: LucideIcon;
  color: string;
  title: string;
  message: string;
  details?: string[];
  action?: TipAction;
  position: 'top' | 'center' | 'bottom';
  persistent?: boolean;
  celebration?: boolean;
  element?: string; // For hover tips
  event?: string; // For event-based tips
}

interface TipCardProps {
  tip: Tip;
  onDismiss: (permanent: boolean) => void;
  onAction: (action: TipAction) => void;
}

export const TipCard: React.FC<TipCardProps> = ({ tip, onDismiss, onAction }) => {
  const Icon = tip.icon;

  const positionClasses = {
    top: 'top-[140px] md:top-24 left-1/2 -translate-x-1/2', // Push down on mobile to avoid welcome banner overlap
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-24 left-1/2 -translate-x-1/2',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed z-[100] ${positionClasses[tip.position]}`}
      >
        <div className="relative w-[calc(100%-2rem)] max-w-sm mx-4">
          {/* Glow effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${tip.color} opacity-20 blur-2xl rounded-2xl`}
          />

          {/* Card */}
          <div
            className={`relative bg-gradient-to-br ${tip.color} rounded-2xl p-5 shadow-2xl border border-white/20`}
          >
            {/* Celebration sparkles */}
            {tip.celebration && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="absolute -top-3 -right-3 text-4xl"
              >
                ✨
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white mb-1">{tip.title}</h3>
              </div>
              {!tip.persistent && (
                <button
                  onClick={() => onDismiss(true)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Dismiss tip"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>

            {/* Message */}
            <p className="text-white/90 text-sm leading-relaxed mb-4">{tip.message}</p>

            {/* Details list */}
            {tip.details && (
              <div className="space-y-2 mb-4">
                {tip.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!tip.persistent && (
                <button
                  onClick={() => onDismiss(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm font-medium py-2.5 px-4 rounded-xl transition-colors text-white text-sm"
                >
                  Later
                </button>
              )}
              {tip.action && (
                <button
                  onClick={() => onAction(tip.action!)}
                  className="flex-1 bg-white hover:bg-white/90 font-semibold py-2.5 px-4 rounded-xl transition-colors text-purple-600 text-sm flex items-center justify-center gap-2"
                >
                  {tip.action.label}
                  {tip.action.type !== 'dismiss' && <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            {/* Persistent tip notice */}
            {tip.persistent && (
              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 text-center">
                This is important - take action to dismiss
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

