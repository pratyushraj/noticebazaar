"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Instagram, FileText, Shield, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fireRealisticConfetti } from '@/lib/utils/confetti';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useOriginalContent } from '@/lib/hooks/useCopyrightScanner';

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  checkFn: () => boolean;
}

const OnboardingChecklist: React.FC = () => {
  const { profile, user } = useSession();
  const navigate = useNavigate();
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  
  const { data: brandDeals } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });
  
  const { data: originalContent } = useOriginalContent({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Check if user has completed onboarding
  const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
  
  // Don't show if already completed
  if (hasCompletedOnboarding) return null;

  const checklistItems: ChecklistItem[] = [
    {
      id: 'connect-instagram',
      label: 'Connect Instagram',
      icon: Instagram,
      path: '/creator-profile?tab=social',
      checkFn: () => {
        return !!(profile?.instagram_handle || profile?.instagram_followers);
      },
    },
    {
      id: 'upload-contract',
      label: 'Upload first contract',
      icon: FileText,
      path: '/creator-contracts',
      checkFn: () => {
        return !!(brandDeals && brandDeals.length > 0 && brandDeals.some(d => d.contract_file_url));
      },
    },
    {
      id: 'run-scan',
      label: 'Run protection scan',
      icon: Shield,
      path: '/creator-content-protection',
      checkFn: () => {
        return !!(originalContent && originalContent.length > 0);
      },
    },
    {
      id: 'invite-friend',
      label: 'Invite friend',
      icon: UserPlus,
      path: '/partner-program',
      checkFn: () => {
        // Check if user has shared referral link (stored in localStorage)
        return localStorage.getItem('referral_shared') === 'true';
      },
    },
  ];

  const completedCount = checklistItems.filter(item => item.checkFn()).length;
  const allCompleted = completedCount === checklistItems.length;

  useEffect(() => {
    if (allCompleted && !isCompleted && !hasShownConfetti) {
      setIsCompleted(true);
      setHasShownConfetti(true);
      fireRealisticConfetti();
      localStorage.setItem('onboarding_completed', 'true');
    }
  }, [allCompleted, isCompleted, hasShownConfetti]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-pink-500/20 backdrop-blur-[40px] border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
            <span>Get Started</span>
            <span className="text-sm font-medium text-white/60">
              {completedCount}/{checklistItems.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 space-y-3">
          {checklistItems.map((item, index) => {
            const Icon = item.icon;
            const isItemCompleted = item.checkFn();
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                  isItemCompleted
                    ? "bg-green-500/10 border border-green-500/20 hover:bg-green-500/15"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
              >
                {isItemCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-white/40 flex-shrink-0" />
                )}
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isItemCompleted ? "text-green-400" : "text-white/60"
                )} />
                <span className={cn(
                  "flex-1 font-medium",
                  isItemCompleted ? "text-white line-through" : "text-white/80"
                )}>
                  {item.label}
                </span>
                {!isItemCompleted && (
                  <span className="text-xs text-white/40">→</span>
                )}
              </motion.button>
            );
          })}
          
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center"
            >
              <p className="text-sm font-semibold text-green-400">
                🎉 All set! You're ready to go!
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OnboardingChecklist;

