"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Share2, Gift, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReferralCardProps {
  profile: Profile;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  const [copyAnimation, setCopyAnimation] = useState(false);
  const referralCode = profile.referral_code || 'NB-GENERATING';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setCopyAnimation(true);
      toast.success('Referral code copied!');
      setTimeout(() => {
        setCopied(false);
        setCopyAnimation(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy referral code');
    }
  };

  const handleShare = async () => {
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
      // Fallback to copy link
      await navigator.clipboard.writeText(referralLink);
      toast.success('Referral link copied to clipboard!');
    }
  };

  return (
    <Card variant="partner" className="relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10 pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-purple-500/20 backdrop-blur-sm border border-purple-500/30">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          Referral Program
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {/* Referral Code Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-3.5 w-3.5 text-purple-400 opacity-80" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Your Referral Code</span>
          </div>
          
          <div className="relative group">
            <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent rounded-xl p-4 border border-white/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <code className="block text-lg font-mono font-bold text-white tracking-wider break-all leading-relaxed">
                    {referralCode}
                  </code>
                  <p className="text-xs text-white/40 mt-1.5">Share this code with friends</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    "flex-shrink-0 relative transition-all duration-300 rounded-xl h-9 px-3",
                    "bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50",
                    "text-purple-300 hover:text-purple-200",
                    copyAnimation && "scale-105 bg-green-600/30 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  )}
                >
                  {copyAnimation ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-400 animate-in fade-in zoom-in duration-300" />
                      <span className="text-xs text-green-400 font-semibold">Copied!</span>
                    </div>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      <span className="text-xs font-medium">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="w-full h-9 rounded-xl border-white/10 hover:border-purple-500/30 bg-white/5 hover:bg-purple-500/10 text-white/70 hover:text-white transition-all duration-200"
          >
            <Share2 className="h-4 w-4 mr-2" />
            <span className="text-xs font-medium">Share Referral Link</span>
          </Button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
                <Users className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Referred</span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">0</p>
            <p className="text-xs text-white/40">users joined</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-purple-500/20 border border-purple-500/30">
                <Gift className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Rewards</span>
            </div>
            <p className="text-2xl font-bold text-white tracking-tight">₹0</p>
            <p className="text-xs text-white/40">total earned</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;

