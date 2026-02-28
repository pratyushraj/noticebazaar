"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { startTrialOnSignup } from '@/lib/trial';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence } from 'framer-motion';
import { onboardingAnalytics } from '@/lib/onboarding/analytics';
import { useSwipeGesture } from '@/components/onboarding/useSwipeGesture';
import { getApiBaseUrl } from '@/lib/utils/api';

// Import new components
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { SkipButton } from '@/components/onboarding/SkipButton';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { WelcomeScreen1 } from '@/components/onboarding/welcome/WelcomeScreen1';
import { WelcomeScreen2 } from '@/components/onboarding/welcome/WelcomeScreen2';
import { WelcomeScreen3 } from '@/components/onboarding/welcome/WelcomeScreen3';
import { WelcomeScreen4 } from '@/components/onboarding/welcome/WelcomeScreen4';
import { WelcomeScreen5 } from '@/components/onboarding/welcome/WelcomeScreen5';
import { NameStep } from '@/components/onboarding/setup/NameStep';
import { InstagramStep } from '@/components/onboarding/setup/InstagramStep';
import { NicheStep } from '@/components/onboarding/setup/NicheStep';
import { ReelRateStep } from '@/components/onboarding/setup/ReelRateStep';
import { SuccessStep } from '@/components/onboarding/setup/SuccessStep';

type WelcomeStep = 0 | 1 | 2 | 3 | 4 | 5;
type SetupStep = 'name' | 'instagram' | 'niches' | 'reelRate' | 'success';
type DealType = 'paid' | 'barter' | 'hybrid' | 'all';

interface OnboardingData {
  name: string;
  instagramUsername: string;
  contentNiches: string[];
  reelRate: string;
  dealType: DealType;
  barterValueMin: string;
  barterValueMax: string;
}

const CreatorOnboarding = () => {
  const { profile, loading: sessionLoading, refetchProfile, user } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [isNavigating, setIsNavigating] = useState(false);

  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>(0);
  const [setupStep, setSetupStep] = useState<SetupStep>('name');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Auto-save: Load from localStorage
    const saved = localStorage.getItem('onboarding-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: '',
          instagramUsername: '',
          contentNiches: [],
          reelRate: '',
          dealType: 'paid',
          barterValueMin: '',
          barterValueMax: '',
          ...parsed
        };
      } catch {
        return { name: '', instagramUsername: '', contentNiches: [], reelRate: '', dealType: 'paid', barterValueMin: '', barterValueMax: '' };
      }
    }
    return { name: '', instagramUsername: '', contentNiches: [], reelRate: '', dealType: 'paid', barterValueMin: '', barterValueMax: '' };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Swipe gesture support for all screens
  useSwipeGesture({
    onSwipeLeft: () => {
      // Welcome screens
      if (setupStep === 'name' && welcomeStep < 5) {
        handleNextWelcome();
      }
      // Setup steps - navigate forward
      else if (setupStep === 'name') {
        if (onboardingData.name.trim()) handleNameNext();
      } else if (setupStep === 'instagram') {
        if (onboardingData.instagramUsername.trim().length >= 3) handleInstagramNext();
      } else if (setupStep === 'niches') {
        if (onboardingData.contentNiches.length > 0) handleNichesNext();
      } else if (setupStep === 'reelRate') {
        handleReelRateNext();
      }
    },
    onSwipeRight: () => {
      // Welcome screens
      if (setupStep === 'name' && welcomeStep > 0) {
        handleBackWelcome();
      }
      // Setup steps - navigate back
      else if (setupStep === 'instagram') {
        setSetupStep('name');
      } else if (setupStep === 'niches') {
        setSetupStep('instagram');
      } else if (setupStep === 'reelRate') {
        setSetupStep('niches');
      }
    },
  });

  // Auto-save onboarding data
  useEffect(() => {
    localStorage.setItem('onboarding-data', JSON.stringify(onboardingData));
  }, [onboardingData]);

  // Track onboarding start
  useEffect(() => {
    onboardingAnalytics.track('onboarding_started');
    setStepStartTime(Date.now());
  }, []);

  // Track step changes
  useEffect(() => {
    if (setupStep !== 'name' && setupStep !== 'success') {
      const stepMap: Record<string, { name: string; number: number }> = {
        instagram: { name: 'instagram_username', number: 1 },
        niches: { name: 'niches', number: 2 },
        reelRate: { name: 'reel_rate', number: 3 }
      };

      const stepInfo = stepMap[setupStep];
      if (stepInfo) {
        const timeSpent = Date.now() - stepStartTime;
        onboardingAnalytics.trackStep(stepInfo.name, stepInfo.number, 5, timeSpent);
        setStepStartTime(Date.now());
      }
    }
  }, [setupStep, stepStartTime]);

  // Handle navigation in useEffect to avoid render-time navigation warnings
  useEffect(() => {
    if (sessionLoading) return;

    if (!profile || profile.role !== 'creator') {
      setIsNavigating(true);
      navigate('/login');
      return;
    }

    if (profile.onboarding_complete) {
      setIsNavigating(true);
      navigate('/creator-profile?section=collab&forceDealSettings=1', { replace: true });
      return;
    }
  }, [sessionLoading, profile, navigate]);

  // Show loading state while session is loading or navigation is happening
  if (sessionLoading || isNavigating) {
    return (
      <OnboardingContainer>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-white/80">Loading...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  // Early return if profile is invalid (navigation will happen in useEffect)
  if (!profile || profile.role !== 'creator') {
    return (
      <OnboardingContainer>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-white/80">Redirecting...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  // Early return if onboarding is complete (navigation will happen in useEffect)
  if (profile.onboarding_complete) {
    return (
      <OnboardingContainer>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-white/80">Redirecting to dashboard...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  const handleSkipWelcome = () => {
    onboardingAnalytics.track('welcome_skipped', { step: welcomeStep });
    setSetupStep('name');
  };

  const handleSkipSetup = () => {
    // Skip to completion with default values
    onboardingAnalytics.track('setup_skipped', { step: setupStep });

    // Set defaults if missing
    const defaultData: OnboardingData = {
      name: onboardingData.name || 'Creator',
      instagramUsername: onboardingData.instagramUsername || '',
      contentNiches: onboardingData.contentNiches.length > 0 ? onboardingData.contentNiches : ['Lifestyle'],
      reelRate: onboardingData.reelRate || '',
      dealType: onboardingData.dealType || 'paid',
      barterValueMin: onboardingData.barterValueMin || '',
      barterValueMax: onboardingData.barterValueMax || '',
    };

    setOnboardingData(defaultData);

    // Complete onboarding with defaults
    handleOnboardingComplete();
  };

  const handleNextWelcome = () => {
    if (welcomeStep < 4) {
      setWelcomeStep((prev) => (prev + 1) as WelcomeStep);
    } else {
      // Move from welcome screens to setup steps
      // Set welcomeStep to 5 so the welcome screen condition becomes false
      setWelcomeStep(5 as WelcomeStep);
      setSetupStep('name');
    }
  };

  const handleBackWelcome = () => {
    if (welcomeStep > 0) {
      setWelcomeStep((prev) => (prev - 1) as WelcomeStep);
    }
  };

  const handleNameNext = () => {
    if (onboardingData.name.trim()) {
      setSetupStep('instagram');
    }
  };

  const handleInstagramNext = () => {
    if (onboardingData.instagramUsername.trim().length >= 3) {
      setSetupStep('niches');
    }
  };

  const handleNichesNext = () => {
    if (onboardingData.contentNiches.length > 0) {
      setSetupStep('reelRate');
    }
  };

  const handleReelRateNext = () => {
    const parsed = Number.parseFloat(onboardingData.reelRate);
    const parsedBarterMin = Number.parseFloat(onboardingData.barterValueMin);
    const parsedBarterMax = Number.parseFloat(onboardingData.barterValueMax);
    const requiresPaid = onboardingData.dealType === 'paid' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all';
    const requiresBarter = onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all';

    if (requiresPaid && (!Number.isFinite(parsed) || parsed <= 0)) {
      toast.error('Please enter your Reel price in INR');
      return;
    }
    if (requiresBarter && (!Number.isFinite(parsedBarterMin) || parsedBarterMin <= 0)) {
      toast.error('Please enter minimum barter value');
      return;
    }
    if (onboardingData.barterValueMax.trim().length > 0 && (!Number.isFinite(parsedBarterMax) || parsedBarterMax < parsedBarterMin)) {
      toast.error('Maximum barter value should be greater than or equal to minimum');
      return;
    }

    handleOnboardingComplete();
  };

  const handleOnboardingComplete = async () => {
    if (!profile.id || !user?.id) return;
    setIsSubmitting(true);

    try {
      // Track step completion
      onboardingAnalytics.trackStep('reel_rate', 4, 4, Date.now() - stepStartTime);

      // Handle referral tracking
      const referralCode = sessionStorage.getItem('referral_code');
      if (referralCode) {
        try {
          const { data: referralLink } = await (supabase
            .from('referral_links') as any)
            .select('user_id')
            .eq('code', referralCode)
            .single();

          if (referralLink) {
            const { data: existingReferral } = await (supabase
              .from('referrals') as any)
              .select('id')
              .eq('referrer_id', (referralLink as any).user_id)
              .eq('referred_user_id', user.id)
              .single();

            if (!existingReferral) {
              await (supabase.from('referrals') as any).insert({
                referrer_id: (referralLink as any).user_id,
                referred_user_id: user.id,
                subscribed: false,
              });

              await (supabase.rpc('refresh_partner_stats', {
                p_user_id: (referralLink as any).user_id,
              }) as any);
            }
          }
          sessionStorage.removeItem('referral_code');
        } catch (referralError: any) {
          console.error('Error tracking referral:', referralError);
        }
      }

      // Start trial if not already started
      if (!profile.is_trial) {
        await startTrialOnSignup(user.id);
      }

      // Update profile with onboarding data
      const nameParts = onboardingData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Creator-only onboarding path
      const creatorCategory: string | null = 'creator';

      // Normalize Instagram username for collab link (same as username so link = /collab/username)
      const instagramHandle = onboardingData.instagramUsername
        ? onboardingData.instagramUsername.replace(/@/g, '').replace(/\s/g, '').toLowerCase().trim()
        : null;
      const collabUsername = instagramHandle && instagramHandle.length >= 3 ? instagramHandle : null;

      // Try to update with all fields first
      try {
        await updateProfileMutation.mutateAsync({
          id: profile.id,
          first_name: firstName,
          last_name: lastName,
          avatar_url: profile.avatar_url || null,
          creator_category: creatorCategory,
          content_niches: onboardingData.contentNiches.length > 0 ? onboardingData.contentNiches : null,
          onboarding_complete: true,
          avg_rate_reel: (onboardingData.dealType === 'paid' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.reelRate
            ? parseFloat(onboardingData.reelRate)
            : null,
          suggested_barter_value_min: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.barterValueMin
            ? parseFloat(onboardingData.barterValueMin)
            : null,
          suggested_barter_value_max: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all')
            ? (onboardingData.barterValueMax ? parseFloat(onboardingData.barterValueMax) : (onboardingData.barterValueMin ? parseFloat(onboardingData.barterValueMin) : null))
            : null,
          ...(collabUsername && {
            instagram_handle: collabUsername,
            username: collabUsername,
          }),
        });
      } catch (firstError: any) {
        // If error is due to missing creator_category column, retry without it
        const isColumnError = firstError?.message?.includes('creator_category') ||
          firstError?.message?.includes('column') ||
          firstError?.message?.includes('does not exist') ||
          (firstError as any)?.code === '42703';

        if (isColumnError) {
          // Retry without creator_category (migration not run yet)
          await updateProfileMutation.mutateAsync({
            id: profile.id,
            first_name: firstName,
            last_name: lastName,
            avatar_url: profile.avatar_url || null,
            // Skip creator_category if column doesn't exist
            content_niches: onboardingData.contentNiches.length > 0 ? onboardingData.contentNiches : null,
            onboarding_complete: true,
            avg_rate_reel: (onboardingData.dealType === 'paid' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.reelRate
              ? parseFloat(onboardingData.reelRate)
              : null,
            suggested_barter_value_min: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.barterValueMin
              ? parseFloat(onboardingData.barterValueMin)
              : null,
            suggested_barter_value_max: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all')
              ? (onboardingData.barterValueMax ? parseFloat(onboardingData.barterValueMax) : (onboardingData.barterValueMin ? parseFloat(onboardingData.barterValueMin) : null))
              : null,
            ...(collabUsername && {
              instagram_handle: collabUsername,
              username: collabUsername,
            }),
          });
        } else {
          // Re-throw if it's a different error
          throw firstError;
        }
      }

      // Save completion to localStorage
      localStorage.setItem('onboarding-complete', 'true');
      localStorage.setItem('onboarding-completed-at', Date.now().toString());
      localStorage.removeItem('onboarding-data'); // Clean up

      // Best effort: attach pre-onboarding collab leads to this account immediately
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (accessToken) {
          await fetch(`${getApiBaseUrl()}/api/collab-requests/attach-leads`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch (attachError) {
        console.warn('[CreatorOnboarding] Failed to attach pre-onboarding collab leads (non-fatal):', attachError);
      }

      refetchProfile();
      setSetupStep('success');
    } catch (error: any) {
      // User-friendly error message
      const errorMessage = error?.message || 'An unexpected error occurred';
      const isColumnError = errorMessage.includes('column') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('creator_category');

      if (isColumnError) {
        toast.error('Database migration required', {
          description: 'Please contact support. Some database columns are missing. Your data was saved, but some fields may not be available yet.',
          duration: 8000
        });
      } else {
        toast.error('Failed to complete onboarding', {
          description: errorMessage,
          duration: 5000
        });
      }
      setIsSubmitting(false);
    }
  };

  // Welcome Screens
  if (setupStep === 'name' && welcomeStep < 5 && !onboardingData.name) {
    return (
      <OnboardingContainer>
        <div className="w-full relative z-50 h-12 md:h-14 max-w-3xl mx-auto px-4 md:px-6 flex items-center justify-center">
          <OnboardingProgressDots
            totalSteps={5}
            currentStep={welcomeStep}
            className="!top-1/2 !left-1/2 !-translate-y-1/2"
          />
          <SkipButton
            onClick={handleSkipWelcome}
            className="!top-1/2 !right-0 !-translate-y-1/2 !px-2 md:!px-3"
          />
        </div>

        <AnimatePresence mode="wait">
          {welcomeStep === 0 && (
            <WelcomeScreen1 key="welcome-0" onNext={handleNextWelcome} />
          )}
          {welcomeStep === 1 && (
            <WelcomeScreen2
              key="welcome-1"
              onNext={handleNextWelcome}
              onBack={handleBackWelcome}
            />
          )}
          {welcomeStep === 2 && (
            <WelcomeScreen3
              key="welcome-2"
              onNext={handleNextWelcome}
              onBack={handleBackWelcome}
            />
          )}
          {welcomeStep === 3 && (
            <WelcomeScreen4
              key="welcome-3"
              onNext={handleNextWelcome}
              onBack={handleBackWelcome}
            />
          )}
          {welcomeStep === 4 && (
            <WelcomeScreen5
              key="welcome-4"
              onNext={handleNextWelcome}
              onBack={handleBackWelcome}
            />
          )}
        </AnimatePresence>
      </OnboardingContainer>
    );
  }

  // Setup Steps
  const getStepNumber = () => {
    switch (setupStep) {
      case 'name': return 1;
      case 'instagram': return 2;
      case 'niches': return 3;
      case 'reelRate': return 4;
      default: return 0;
    }
  };

  return (
    <OnboardingContainer>
      <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full p-4 pb-16 overflow-y-auto overscroll-contain">
        {/* Progress Bar - Add top padding on mobile to account for safe area */}
        {setupStep !== 'success' && (
          <div className="pt-[max(60px,calc(env(safe-area-inset-top,0px)+36px))] md:pt-10 flex-shrink-0">
            <OnboardingProgressBar
              currentStep={getStepNumber()}
              totalSteps={4}
            />
          </div>
        )}

        {/* Calculate suggested India-market rate based on followers if available */}
        {(() => {
          const followers = profile?.instagram_followers || 0;
          let suggestedRate = followers > 0 ? Math.round(followers * 0.06) : undefined;
          if (followers > 5000000) suggestedRate = Math.max(suggestedRate || 0, 150000);
          else if (followers > 1000000) suggestedRate = Math.max(suggestedRate || 0, 80000);
          else if (followers > 500000) suggestedRate = Math.max(suggestedRate || 0, 40000);
          if (followers >= 10000) suggestedRate = Math.max(suggestedRate || 0, 2000);
          else if (followers >= 5000) suggestedRate = Math.max(suggestedRate || 0, 1500);
          if (suggestedRate) suggestedRate = Math.max(1500, Math.min(800000, suggestedRate));

          return (
            <AnimatePresence mode="wait">
              {/* Step 1: Name */}
              {setupStep === 'name' && (
                <NameStep
                  key="name"
                  name={onboardingData.name}
                  onNameChange={(name) =>
                    setOnboardingData((prev) => ({ ...prev, name }))
                  }
                  onNext={handleNameNext}
                  onSkip={handleSkipSetup}
                />
              )}

              {/* Step 2: Instagram username (collab link) */}
              {setupStep === 'instagram' && (
                <InstagramStep
                  key="instagram"
                  instagramUsername={onboardingData.instagramUsername}
                  onUsernameChange={(username) =>
                    setOnboardingData((prev) => ({ ...prev, instagramUsername: username }))
                  }
                  onNext={handleInstagramNext}
                  onBack={() => setSetupStep('name')}
                  onSkip={handleSkipSetup}
                />
              )}

              {/* Step 5: Niches */}
              {setupStep === 'niches' && (
                <NicheStep
                  key="niches"
                  selectedNiches={onboardingData.contentNiches}
                  onNicheToggle={(niche) => {
                    setOnboardingData((prev) => ({
                      ...prev,
                      contentNiches: prev.contentNiches.includes(niche)
                        ? prev.contentNiches.filter((n) => n !== niche)
                        : [...prev.contentNiches, niche],
                    }));
                  }}
                  onNext={handleNichesNext}
                  onBack={() => setSetupStep('instagram')}
                  onSkip={handleSkipSetup}
                />
              )}

              {/* Step 6: Reel Rate */}
              {setupStep === 'reelRate' && (
                <ReelRateStep
                  key="reelRate"
                  reelRate={onboardingData.reelRate}
                  dealType={onboardingData.dealType}
                  barterValueMin={onboardingData.barterValueMin}
                  barterValueMax={onboardingData.barterValueMax}
                  suggestedRate={suggestedRate}
                  onRateChange={(rate) =>
                    setOnboardingData((prev) => ({ ...prev, reelRate: rate }))
                  }
                  onDealTypeChange={(dealType) =>
                    setOnboardingData((prev) => ({ ...prev, dealType }))
                  }
                  onBarterValueMinChange={(barterValueMin) =>
                    setOnboardingData((prev) => ({ ...prev, barterValueMin }))
                  }
                  onBarterValueMaxChange={(barterValueMax) =>
                    setOnboardingData((prev) => ({ ...prev, barterValueMax }))
                  }
                  onNext={handleReelRateNext}
                  onBack={() => setSetupStep('niches')}
                />
              )}

              {/* Success Screen */}
              {setupStep === 'success' && (
                <SuccessStep
                  key="success"
                  userName={onboardingData.name}
                  onGoToDashboard={() => navigate('/creator-profile?section=collab&forceDealSettings=1')}
                  onCompleteCollabProfile={() => navigate('/creator-profile?section=collab&forceDealSettings=1')}
                  collabProfile={profile as unknown as Record<string, any>}
                  collabLink={profile?.instagram_handle || profile?.username
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/collab/${profile?.instagram_handle || profile?.username}`
                    : undefined}
                  collabShortLabel={profile?.instagram_handle || profile?.username
                    ? `creatorarmour.com/collab/${profile?.instagram_handle || profile?.username}`
                    : undefined}
                />
              )}
            </AnimatePresence>
          );
        })()}
      </div>
    </OnboardingContainer>
  );
};

export default CreatorOnboarding;
