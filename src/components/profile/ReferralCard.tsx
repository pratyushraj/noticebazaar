"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Share2, Gift, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';

interface ReferralCardProps {
  profile: Profile;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  const referralCode = profile.referral_code || 'NB-GENERATING';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success('Referral code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  const handleShare = async () => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NoticeBazaar',
          text: `Use my referral code ${referralCode} to join NoticeBazaar!`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback to copy
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/30 rounded-xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-400" />
          Your Referral Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#0F121A] border border-white/10 rounded-lg px-4 py-3">
            <p className="text-2xl font-bold text-white font-mono">{referralCode}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="border-white/20 hover:bg-white/10"
          >
            {copied ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <Copy className="h-5 w-5 text-white" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="border-white/20 hover:bg-white/10"
          >
            <Share2 className="h-5 w-5 text-white" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Users className="h-4 w-4" />
              <span>Referred Users</span>
            </div>
            <p className="text-2xl font-bold text-white">0</p>
            <p className="text-xs text-white/40">Placeholder</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Gift className="h-4 w-4 text-purple-400" />
              <span>Rewards Earned</span>
            </div>
            <p className="text-2xl font-bold text-white">₹0</p>
            <p className="text-xs text-white/40">Placeholder</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;

