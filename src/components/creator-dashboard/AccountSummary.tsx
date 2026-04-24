

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

const AccountSummary: React.FC = () => {
  const { profile, trialStatus } = useSession();

  const planStatus = React.useMemo(() => {
    if (trialStatus.isTrial && !trialStatus.trialLocked) {
      return {
        label: `Free Trial (${trialStatus.daysLeft} days left)`,
        status: 'trial' as const,
      };
    }
    if (trialStatus.trialLocked) {
      return {
        label: 'Trial Expired',
        status: 'expired' as const,
      };
    }
    return {
      label: 'No active plan',
      status: 'none' as const,
    };
  }, [trialStatus]);

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-border/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-info" />
          Account Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {/* Plan Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-info" />
              <span className="text-sm text-foreground/70">Plan</span>
            </div>
            <div className="flex items-center gap-2">
              {planStatus.status === 'trial' ? (
                <span className="text-sm font-semibold text-orange-400">{planStatus.label}</span>
              ) : planStatus.status === 'expired' ? (
                <span className="text-sm font-semibold text-destructive">{planStatus.label}</span>
              ) : (
                <span className="text-sm font-semibold text-foreground/60">{planStatus.label}</span>
              )}
            </div>
          </div>

          {/* GST Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/70">GST</span>
            </div>
            <div className="flex items-center gap-2">
              {profile?.gstin ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Set up</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-400">Not set up</span>
                </>
              )}
            </div>
          </div>

          {/* PAN Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/70">PAN</span>
            </div>
            <div className="flex items-center gap-2">
              {profile?.pan ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-400">Not verified</span>
                </>
              )}
            </div>
          </div>

          {/* Bank Status (Mock - would need to check from payment integration) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/70">Bank</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">Connected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSummary;
