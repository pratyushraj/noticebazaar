"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, Shield, FileText, Calculator, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface QuickActionsFABProps {
  onAddDeal?: () => void;
  onLogPayment?: () => void;
  onScanContent?: () => void;
  onUploadContract?: () => void;
  onCalculateRate?: () => void;
}

const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({
  onAddDeal,
  onLogPayment,
  onScanContent,
  onUploadContract,
  onCalculateRate,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const actions = [
    {
      icon: Briefcase,
      label: 'Add New Deal',
      color: 'from-blue-400 to-blue-600',
      onClick: () => {
        onAddDeal?.();
        setShowQuickActions(false);
        setShowRadialMenu(false);
        triggerHaptic(HapticPatterns.medium);
      },
    },
    {
      icon: DollarSign,
      label: 'Log Payment',
      color: 'from-green-400 to-green-600',
      onClick: () => {
        onLogPayment?.();
        setShowQuickActions(false);
        setShowRadialMenu(false);
        navigate('/creator-payments');
        triggerHaptic(HapticPatterns.medium);
      },
    },
    {
      icon: Shield,
      label: 'Scan Content',
      color: 'from-purple-400 to-purple-600',
      onClick: () => {
        onScanContent?.();
        setShowQuickActions(false);
        setShowRadialMenu(false);
        navigate('/creator-contracts');
        triggerHaptic(HapticPatterns.medium);
      },
    },
    {
      icon: FileText,
      label: 'Upload Contract',
      color: 'from-yellow-400 to-yellow-600',
      onClick: () => {
        onUploadContract?.();
        setShowQuickActions(false);
        setShowRadialMenu(false);
        navigate('/contract-analyzer');
        triggerHaptic(HapticPatterns.medium);
      },
    },
    {
      icon: Calculator,
      label: 'Calculate Rate',
      color: 'from-orange-400 to-orange-600',
      onClick: () => {
        onCalculateRate?.();
        setShowQuickActions(false);
        setShowRadialMenu(false);
        navigate('/rate-calculator');
        triggerHaptic(HapticPatterns.medium);
      },
    },
  ];

  // Long-press handler for radial menu
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowRadialMenu(true);
      setShowQuickActions(false);
      triggerHaptic(HapticPatterns.heavy);
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowRadialMenu(true);
      setShowQuickActions(false);
      triggerHaptic(HapticPatterns.heavy);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // One-handed mode: position FAB higher on large screens
  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  return (
    <div className={cn(
      "fixed z-[60]",
      isLargeScreen ? "bottom-24 right-8" : "bottom-20 right-6",
      "md:bottom-6 md:right-6"
    )}>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="relative"
        style={{ transformOrigin: 'center' }}
      >
        {/* Quick actions menu */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-4 w-72 rounded-t-3xl rounded-b-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-xl overflow-hidden relative before:absolute before:inset-0 before:-z-10 before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent)] before:blur-2xl"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                const iconColorClass = cn(
                  action.label === 'Add New Deal' ? 'from-blue-400/20 to-blue-600/20' :
                  action.label === 'Log Payment' ? 'from-green-400/20 to-green-600/20' :
                  action.label === 'Scan Content' ? 'from-purple-400/20 to-purple-600/20' :
                  action.label === 'Upload Contract' ? 'from-yellow-400/20 to-yellow-600/20' :
                  'from-orange-400/20 to-orange-600/20'
                );
                return (
                  <div key={index}>
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.onClick}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left text-white/90 hover:bg-white/5 active:bg-white/10 transition-all"
                    >
                      <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-white/10",
                        iconColorClass
                      )}>
                        <Icon className="h-5 w-5 text-white/90" />
                      </div>
                      <span className="font-medium text-sm">{action.label}</span>
                    </motion.button>
                    {/* Divider */}
                    {index < actions.length - 1 && (
                      <div className="h-px bg-white/10 mx-4" />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (!showRadialMenu) {
              setShowQuickActions(!showQuickActions);
              triggerHaptic(HapticPatterns.light);
            }
          }}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center text-white transition-all relative focus-visible:ring-4 focus-visible:ring-purple-400/50 focus-visible:outline-none min-h-[56px] min-w-[56px] group"
          style={{ 
            boxShadow: '0 0 15px rgba(59,130,246,0.5), 0 4px 6px rgba(0,0,0,0.1)',
            transformOrigin: 'center'
          }}
          aria-label={showQuickActions || showRadialMenu ? "Close quick actions menu" : "Open quick actions menu (long press for radial menu)"}
          aria-expanded={showQuickActions || showRadialMenu}
        >
          <motion.div
            animate={{ rotate: (showQuickActions || showRadialMenu) ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {(showQuickActions || showRadialMenu) ? (
              <X className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </motion.div>
          
          {/* Notification badge with pulse animation */}
          <motion.span
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/50"
          >
            3
          </motion.span>

          {/* Tooltip on hover */}
          {!showQuickActions && !showRadialMenu && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute right-full mr-3 px-3 py-2 bg-black/80 backdrop-blur-xl rounded-lg text-xs text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Quick Actions
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-black/80" />
            </motion.div>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuickActionsFAB;

