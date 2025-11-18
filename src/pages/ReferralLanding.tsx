"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Gift, ArrowRight } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, profile } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string>('');

  useEffect(() => {
    const handleReferral = async () => {
      if (!code) {
        setError('Invalid referral code');
        setLoading(false);
        return;
      }

      try {
        // Get referrer info
        const { data: referralLink, error: linkError } = await supabase
          .from('referral_links')
          .select('user_id, profiles:user_id (first_name, last_name)')
          .eq('code', code)
          .single();

        if (linkError || !referralLink) {
          setError('Invalid referral code');
          setLoading(false);
          return;
        }

        const referrerProfile = (referralLink as any).profiles;
        if (referrerProfile) {
          setReferrerName(`${referrerProfile.first_name || ''} ${referrerProfile.last_name || ''}`.trim() || 'Your friend');
        }

        // If user is already logged in, store referral and redirect to dashboard
        if (user && profile) {
          // Check if referral already exists
          // @ts-expect-error - Table types will be updated after migration
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
          }

          // Store referral code in sessionStorage for later use (in case user signs up later)
          sessionStorage.setItem('referral_code', code);
          navigate('/creator-dashboard');
          return;
        }

        // If not logged in, store referral code and redirect to signup
        sessionStorage.setItem('referral_code', code);
        setLoading(false);
      } catch (err: any) {
        console.error('Error handling referral:', err);
        setError('Failed to process referral link');
        setLoading(false);
      }
    };

    handleReferral();
  }, [code, user, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing referral link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-500">Invalid Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full bg-[#0A0F1C] border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-white">You've Been Invited!</CardTitle>
          <p className="text-muted-foreground mt-2">
            {referrerName} invited you to join NoticeBazaar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-white/80">
              Sign up using this link and you'll both get rewards when you subscribe!
            </p>
          </div>
          <Button
            onClick={() => {
              // Navigate to signup with referral code
              navigate('/login?ref=' + code);
            }}
            className="w-full"
            size="lg"
          >
            Continue to Sign Up
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Learn More First
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralLanding;

