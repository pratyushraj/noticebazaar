"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Shield, FileText, Calculator, Briefcase } from 'lucide-react';
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
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="relative">
        {/* Quick actions menu */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-4 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
            >
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={action.onClick}
                    className="w-full px-4 py-3 hover:bg-gray-700 text-left text-sm text-white transition-colors flex items-center gap-3 border-b border-gray-700/50 last:border-b-0"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      action.label === 'Add New Deal' ? 'bg-blue-500/10' :
                      action.label === 'Log Payment' ? 'bg-emerald-500/10' :
                      action.label === 'Scan Content' ? 'bg-purple-500/10' :
                      action.label === 'Upload Contract' ? 'bg-yellow-500/10' :
                      'bg-orange-500/10'
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        action.label === 'Add New Deal' ? 'text-blue-500' :
                        action.label === 'Log Payment' ? 'text-emerald-500' :
                        action.label === 'Scan Content' ? 'text-purple-500' :
                        action.label === 'Upload Contract' ? 'text-yellow-500' :
                        'text-orange-500'
                      )} />
                    </div>
                    <span>{action.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center text-white transition-all relative"
          aria-label="Quick Actions"
        >
          <motion.div
            animate={{ rotate: showQuickActions ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-6 h-6" />
          </motion.div>
          
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            3
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuickActionsFAB;

