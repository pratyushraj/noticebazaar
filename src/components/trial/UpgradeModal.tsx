"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'trial_expired' | 'chat_limit' | 'feature_restricted';
  message?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onOpenChange,
  reason = 'trial_expired',
  message,
}) => {
  const { profile, trialStatus } = useSession();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/creator-profile?tab=billing');
  };

  const getTitle = () => {
    switch (reason) {
      case 'trial_expired':
        return 'Your free trial has ended';
      case 'chat_limit':
        return 'Chat limit reached';
      case 'feature_restricted':
        return 'Feature requires upgrade';
      default:
        return 'Upgrade required';
    }
  };

  const getDescription = () => {
    if (message) return message;
    
    switch (reason) {
      case 'trial_expired':
        return 'Unlock full access to CA + Lawyer support & advanced tools';
      case 'chat_limit':
        return 'Upgrade to continue chatting with your CA and Lawyer. Free trial includes 1 message each.';
      case 'feature_restricted':
        return 'This feature is available after upgrading your account.';
      default:
        return 'Upgrade your account to access this feature.';
    }
  };

  const features = [
    'Unlimited CA & Lawyer chat',
    'Contract drafting & review',
    'Legal notices & GST/ITR filing',
    'CA document review',
    'Voice notes & attachments',
    'Export PDF/Excel reports',
    'Advanced analytics & insights',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {reason === 'trial_expired' ? (
              <Lock className="h-6 w-6 text-orange-400" />
            ) : (
              <Sparkles className="h-6 w-6 text-blue-400" />
            )}
            <DialogTitle className="text-2xl font-bold">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-gray-300 text-base">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm font-semibold text-white mb-3">What you'll get:</p>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {reason === 'trial_expired' && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Maybe later
            </Button>
          )}
          <Button
            onClick={handleUpgrade}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
          >
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;

