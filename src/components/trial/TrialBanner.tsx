"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, AlertCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { getTrialStatus } from '@/lib/trial';

const TrialBanner: React.FC = () => {
  const { profile, trialStatus } = useSession();
  const navigate = useNavigate();

  // Don't show if not a trial user or if locked (will show modal instead)
  if (!profile?.is_trial || trialStatus.trialLocked) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/creator-profile?tab=billing');
  };

  // Calculate days left (use trialStatus from context which is already computed)
  const daysRemaining = trialStatus.daysLeft;

  if (daysRemaining <= 0) {
    return null; // Modal will handle expired state
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/15 via-orange-600/15 to-orange-500/15 border border-orange-500/40 rounded-xl p-4 mb-6 shadow-[0_0_20px_-6px_rgba(255,165,0,0.3)] relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent animate-pulse"></div>
      
      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="h-6 w-6 text-orange-400 animate-pulse" />
            <div className="absolute inset-0 bg-orange-400/20 blur-xl"></div>
          </div>
          <div>
            <p className="text-base font-bold text-white flex items-center gap-2">
              You're on a 30-day free trial
              <span className="text-orange-300 font-semibold">•</span>
              <span className="text-orange-300">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</span>
            </p>
            <p className="text-sm text-white/70 mt-1">
              Upgrade to unlock full CA + Lawyer support & advanced tools
            </p>
          </div>
        </div>
        <Button
          onClick={handleUpgrade}
          className="bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap font-semibold shadow-lg hover:shadow-orange-500/30 transition-all"
          size="default"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default TrialBanner;

