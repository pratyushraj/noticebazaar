"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, DollarSign, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';

const ReferAndEarn: React.FC = () => {
  const { profile } = useSession();
  const [copied, setCopied] = useState(false);

  const referralLink = React.useMemo(() => {
    if (!profile?.id) return window.location.origin;
    return `${window.location.origin}?ref=${profile.id}`;
  }, [profile?.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 rounded-2xl shadow-[0_0_20px_-6px_rgba(147,51,234,0.2)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-400" />
          Refer & Earn
        </CardTitle>
        <p className="text-sm text-white/60 mt-1">Invite creators & get rewards</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Gift className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Free 7 days for every referral</p>
              <p className="text-xs text-white/60 mt-0.5">Both you and your friend get extended trial</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <DollarSign className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">10% commission when they upgrade</p>
              <p className="text-xs text-white/60 mt-0.5">Earn recurring revenue from every referral</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <Button
            onClick={handleCopyLink}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center justify-center gap-2"
            size="lg"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Get Invite Link
              </>
            )}
          </Button>
          {copied && (
            <p className="text-xs text-purple-300 text-center mt-2">
              Share this link: {referralLink.substring(0, 40)}...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferAndEarn;

