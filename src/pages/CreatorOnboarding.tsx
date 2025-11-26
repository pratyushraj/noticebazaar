"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, UserCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import CreatorBusinessDetailsForm from '@/components/creator-onboarding/CreatorBusinessDetailsForm';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { startTrialOnSignup } from '@/lib/trial';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from '@/components/creator-onboarding/WelcomeScreen';
import OnboardingSuccess from '@/components/creator-onboarding/OnboardingSuccess';

type OnboardingStep = 'welcome' | 'business-details' | 'success';

const CreatorOnboarding = () => {
  const { profile, loading: sessionLoading, refetchProfile, user } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
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
          // @ts-ignore - Table types will be updated after migration
          const { data: referralLink } = await (supabase
            .from('referral_links') as any)
            .select('user_id')
            .eq('code', referralCode)
            .single();

          if (referralLink) {
            // Check if referral already exists (might have been created during signup)
            // @ts-ignore - Table types will be updated after migration
            const { data: existingReferral } = await (supabase
              .from('referrals') as any)
              .select('id')
              .eq('referrer_id', (referralLink as any).user_id)
              .eq('referred_user_id', user.id)
              .single();

            if (!existingReferral) {
              // Create referral record
              // @ts-ignore - Table types will be updated after migration
              await (supabase.from('referrals') as any).insert({
                referrer_id: (referralLink as any).user_id,
                referred_user_id: user.id,
                subscribed: false, // Will be updated on subscription
              });

              // Refresh referrer's stats
              // @ts-ignore - Function types will be updated after migration
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
      
      refetchProfile(); // Refetch to update session context
      setCurrentStep('success'); // Show success screen instead of navigating immediately
    } catch (error: any) {
      toast.error('Failed to finalize onboarding', { description: error.message });
      setIsSubmitting(false);
    }
  };

  const userName = profile?.first_name || user?.email?.split('@')[0] || 'Creator';

  // Progress indicator
  const getProgress = () => {
    switch (currentStep) {
      case 'welcome': return 0;
      case 'business-details': return 50;
      case 'success': return 100;
      default: return 0;
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'welcome': return 1;
      case 'business-details': return 2;
      case 'success': return 3;
      default: return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        {currentStep !== 'success' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-200">Step {getStepNumber()} of 2</span>
              <span className="text-sm text-purple-200">{getProgress()}% Complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WelcomeScreen
                onNext={() => setCurrentStep('business-details')}
                userName={userName}
              />
            </motion.div>
          )}

          {currentStep === 'business-details' && (
            <motion.div
              key="business-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                <CardContent className="p-8">
                  {/* Step Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                      <UserCheck className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Business Details</h2>
                    <p className="text-purple-200">Let's set up your business profile</p>
                  </div>

                  {/* Business Form */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <CreatorBusinessDetailsForm
                      initialData={profile}
                      onSaveSuccess={handleOnboardingComplete}
                      onClose={() => {}}
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep('welcome')}
                      className="text-purple-200 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleOnboardingComplete}
                      disabled={isSubmitting || !profile.business_name || !profile.business_entity_type}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Finalizing...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <OnboardingSuccess userName={userName} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorOnboarding;