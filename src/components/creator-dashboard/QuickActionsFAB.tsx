"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, DollarSign, Shield, FileText, Calculator, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const actions = [
    {
      icon: Briefcase,
      label: 'Add New Deal',
      onClick: () => {
        onAddDeal?.();
        setShowQuickActions(false);
      },
    },
    {
      icon: DollarSign,
      label: 'Log Payment',
      onClick: () => {
        onLogPayment?.();
        setShowQuickActions(false);
        navigate('/creator-payments');
      },
    },
    {
      icon: Shield,
      label: 'Scan Content',
      onClick: () => {
        onScanContent?.();
        setShowQuickActions(false);
        navigate('/creator-content-protection');
      },
    },
    {
      icon: FileText,
      label: 'Upload Contract',
      onClick: () => {
        onUploadContract?.();
        setShowQuickActions(false);
        navigate('/contract-analyzer');
      },
    },
    {
      icon: Calculator,
      label: 'Calculate Rate',
      onClick: () => {
        onCalculateRate?.();
        setShowQuickActions(false);
        navigate('/rate-calculator');
      },
    },
  ];

  return (
    <div className="fixed bottom-20 right-6 z-[60]">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="relative"
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
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center text-white transition-all relative"
          style={{ boxShadow: '0 0 15px rgba(59,130,246,0.5), 0 4px 6px rgba(0,0,0,0.1)' }}
          aria-label="Quick Actions"
        >
          <motion.div
            animate={{ rotate: showQuickActions ? 0 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {showQuickActions ? (
              <X className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </motion.div>
          
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            3
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default QuickActionsFAB;

