"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import CreatorBusinessDetailsForm from '@/components/creator-onboarding/CreatorBusinessDetailsForm';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { startTrialOnSignup } from '@/lib/trial';
import { supabase } from '@/integrations/supabase/client';

const CreatorOnboarding = () => {
  const { profile, loading: sessionLoading, refetchProfile, user } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (sessionLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile || profile.role !== 'creator') {
    // Should be caught by ProtectedRoute, but good fallback
    navigate('/login');
    return null;
  }

  if (profile.onboarding_complete) {
    navigate('/creator-dashboard', { replace: true });
    return null;
  }

  const handleOnboardingComplete = async () => {
    if (!profile.id || !user?.id) return;
    setIsSubmitting(true);
    try {
      // Handle referral tracking if user signed up via referral link
      const referralCode = sessionStorage.getItem('referral_code');
      if (referralCode) {
        try {
          // Get referrer's user_id from referral code
          const { data: referralLink } = await (supabase
            // @ts-expect-error - Table types will be updated after migration
            .from('referral_links') as any)
            .select('user_id')
            .eq('code', referralCode)
            .single();

          if (referralLink) {
            // Check if referral already exists (might have been created during signup)
            const { data: existingReferral } = await (supabase
              // @ts-expect-error - Table types will be updated after migration
              .from('referrals') as any)
              .select('id')
              .eq('referrer_id', (referralLink as any).user_id)
              .eq('referred_user_id', user.id)
              .single();

            if (!existingReferral) {
              // Create referral record
              // @ts-expect-error - Table types will be updated after migration
              await (supabase.from('referrals') as any).insert({
                referrer_id: (referralLink as any).user_id,
                referred_user_id: user.id,
                subscribed: false, // Will be updated on subscription
              });

              // Refresh referrer's stats
              // @ts-expect-error - Function types will be updated after migration
              await (supabase.rpc('refresh_partner_stats', {
                p_user_id: (referralLink as any).user_id,
              }) as any);
            }
          }
          // Clear referral code from session storage
          sessionStorage.removeItem('referral_code');
        } catch (referralError: any) {
          console.error('Error tracking referral:', referralError);
          // Don't block onboarding if referral tracking fails
        }
      }

      // Start trial if not already started
      if (!profile.is_trial) {
        await startTrialOnSignup(user.id);
      }

      // This mutation sets onboarding_complete to true, which triggers the tax filing generation inside the hook.
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || null,
        onboarding_complete: true,
      });
      toast.success('Onboarding complete! Your 30-day free trial has started.');
      refetchProfile(); // Refetch to update session context
      navigate('/creator-dashboard', { replace: true });
    } catch (error: any) {
      toast.error('Failed to finalize onboarding', { description: error.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-lg w-full bg-card shadow-lg rounded-xl border border-border">
        <CardHeader className="text-center">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold text-foreground">Creator Onboarding</CardTitle>
          <p className="text-muted-foreground">Just a few steps to set up your legal and tax profile.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-secondary rounded-lg border border-border">
            <h3 className="font-semibold text-foreground flex items-center mb-2">
              <UserCheck className="h-4 w-4 mr-2 text-green-500" /> Step 1: Business Details
            </h3>
            <CreatorBusinessDetailsForm
              initialData={profile}
              onSaveSuccess={handleOnboardingComplete}
              onClose={() => {}}
            />
          </div>
          
          <div className="text-center">
            <Button 
              onClick={handleOnboardingComplete} 
              disabled={isSubmitting || !profile.business_name || !profile.business_entity_type}
              className="w-full cta-primary py-3 rounded-lg font-bold text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing Setup...
                </>
              ) : (
                'Finalize Setup & Go to Dashboard'
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              (This step triggers your tax calendar generation.)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorOnboarding;