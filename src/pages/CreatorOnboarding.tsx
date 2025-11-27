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

// Import new components
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
import { SkipButton } from '@/components/onboarding/SkipButton';
import { OnboardingProgressBar } from '@/components/onboarding/OnboardingProgressBar';
import { WelcomeScreen1 } from '@/components/onboarding/welcome/WelcomeScreen1';
import { WelcomeScreen2 } from '@/components/onboarding/welcome/WelcomeScreen2';
import { WelcomeScreen3 } from '@/components/onboarding/welcome/WelcomeScreen3';
import { WelcomeScreen4 } from '@/components/onboarding/welcome/WelcomeScreen4';
import { NameStep } from '@/components/onboarding/setup/NameStep';
import { UserTypeStep } from '@/components/onboarding/setup/UserTypeStep';
import { PlatformsStep } from '@/components/onboarding/setup/PlatformsStep';
import { GoalsStep } from '@/components/onboarding/setup/GoalsStep';
import { SuccessStep } from '@/components/onboarding/setup/SuccessStep';

type WelcomeStep = 0 | 1 | 2 | 3 | 4;
type SetupStep = 'name' | 'type' | 'platforms' | 'goals' | 'success';

type UserType = 'creator' | 'freelancer' | 'entrepreneur';
type Platform = 'youtube' | 'instagram' | 'twitter' | 'linkedin' | 'website' | 'podcast';
type Goal = 'protect' | 'earnings' | 'taxes' | 'deals' | 'advice' | 'grow';

interface OnboardingData {
  name: string;
  userType: UserType | '';
  platforms: Platform[];
  goals: Goal[];
}

const CreatorOnboarding = () => {
  const { profile, loading: sessionLoading, refetchProfile, user } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>(0);
  const [setupStep, setSetupStep] = useState<SetupStep>('name');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Auto-save: Load from localStorage
    const saved = localStorage.getItem('onboarding-data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { name: '', userType: '', platforms: [], goals: [] };
      }
    }
    return { name: '', userType: '', platforms: [], goals: [] };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  // Swipe gesture support for all screens
  useSwipeGesture({
    onSwipeLeft: () => {
      // Welcome screens
      if (setupStep === 'name' && welcomeStep < 3) {
        handleNextWelcome();
      }
      // Setup steps - navigate forward
      else if (setupStep === 'name') {
        if (onboardingData.name.trim()) handleNameNext();
      } else if (setupStep === 'type') {
        if (onboardingData.userType) handleTypeNext();
      } else if (setupStep === 'platforms') {
        if (onboardingData.platforms.length > 0) handlePlatformsNext();
      } else if (setupStep === 'goals') {
        if (onboardingData.goals.length > 0) handleGoalsNext();
      }
    },
    onSwipeRight: () => {
      // Welcome screens
      if (setupStep === 'name' && welcomeStep > 0) {
        handleBackWelcome();
      }
      // Setup steps - navigate back
      else if (setupStep === 'type') {
        setSetupStep('name');
      } else if (setupStep === 'platforms') {
        setSetupStep('type');
      } else if (setupStep === 'goals') {
        setSetupStep('platforms');
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
        type: { name: 'user_type', number: 1 },
        platforms: { name: 'platforms', number: 2 },
        goals: { name: 'goals', number: 3 }
      };
      
      const stepInfo = stepMap[setupStep];
      if (stepInfo) {
        const timeSpent = Date.now() - stepStartTime;
        onboardingAnalytics.trackStep(stepInfo.name, stepInfo.number, 4, timeSpent);
        setStepStartTime(Date.now());
      }
    }
  }, [setupStep, stepStartTime]);

  if (sessionLoading) {
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

  if (!profile || profile.role !== 'creator') {
    navigate('/login');
    return null;
  }

  if (profile.onboarding_complete) {
    navigate('/creator-dashboard', { replace: true });
    return null;
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
      userType: onboardingData.userType || 'creator',
      platforms: onboardingData.platforms.length > 0 ? onboardingData.platforms : ['youtube'],
      goals: onboardingData.goals.length > 0 ? onboardingData.goals : ['protect'],
    };
    
    setOnboardingData(defaultData);
    
    // Complete onboarding with defaults
    handleOnboardingComplete();
  };

  const handleNextWelcome = () => {
    if (welcomeStep < 3) {
      setWelcomeStep((prev) => (prev + 1) as WelcomeStep);
    } else {
      // Move from welcome screens to setup steps
      // Set welcomeStep to 4 so the welcome screen condition becomes false
      setWelcomeStep(4 as WelcomeStep);
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
      setSetupStep('type');
    }
  };

  const handleTypeNext = () => {
    if (onboardingData.userType) {
      setSetupStep('platforms');
    }
  };

  const handlePlatformsNext = () => {
    if (onboardingData.platforms.length > 0) {
      setSetupStep('goals');
    }
  };

  const handleGoalsNext = async () => {
    if (onboardingData.goals.length > 0) {
      await handleOnboardingComplete();
    }
  };

  const handleOnboardingComplete = async () => {
    if (!profile.id || !user?.id) return;
    setIsSubmitting(true);
    
    try {
      // Track step completion
      onboardingAnalytics.trackStep('goals', 4, 4, Date.now() - stepStartTime);
      
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

      // Map user type to creator_category
      let creatorCategory: string | null = onboardingData.userType || null;
      if (onboardingData.userType === 'freelancer') {
        creatorCategory = 'freelancer';
      } else if (onboardingData.userType === 'entrepreneur') {
        creatorCategory = 'business';
      } else if (onboardingData.userType === 'creator') {
        creatorCategory = 'creator';
      }

      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: profile.avatar_url || null,
        creator_category: creatorCategory,
        platforms: onboardingData.platforms.length > 0 ? onboardingData.platforms : null,
        goals: onboardingData.goals.length > 0 ? onboardingData.goals : null,
        onboarding_complete: true,
      });
      
      // Save completion to localStorage
      localStorage.setItem('onboarding-complete', 'true');
      localStorage.setItem('onboarding-completed-at', Date.now().toString());
      localStorage.removeItem('onboarding-data'); // Clean up
      
      refetchProfile();
      setSetupStep('success');
    } catch (error: any) {
      toast.error('Failed to complete onboarding', { description: error.message });
      setIsSubmitting(false);
    }
  };

  // Welcome Screens
  if (setupStep === 'name' && welcomeStep < 4 && !onboardingData.name) {
    return (
      <OnboardingContainer>
        <SkipButton onClick={handleSkipWelcome} />
        <OnboardingProgressDots totalSteps={4} currentStep={welcomeStep} />

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
        </AnimatePresence>
      </OnboardingContainer>
    );
  }

  // Setup Steps
  const getStepNumber = () => {
    switch (setupStep) {
      case 'name': return 1;
      case 'type': return 2;
      case 'platforms': return 3;
      case 'goals': return 4;
      default: return 0;
    }
  };

  return (
    <OnboardingContainer>
      <div className="max-w-2xl mx-auto p-4 pt-10 pb-16">
        {/* Progress Bar */}
        {setupStep !== 'success' && (
          <OnboardingProgressBar
            currentStep={getStepNumber()}
            totalSteps={4}
          />
        )}

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

          {/* Step 2: User Type */}
          {setupStep === 'type' && (
            <UserTypeStep
              key="type"
              selectedType={onboardingData.userType}
              onTypeSelect={(type) =>
                setOnboardingData((prev) => ({ ...prev, userType: type }))
              }
              onNext={handleTypeNext}
              onBack={() => setSetupStep('name')}
              onSkip={handleSkipSetup}
            />
          )}

          {/* Step 3: Platforms */}
          {setupStep === 'platforms' && (
            <PlatformsStep
              key="platforms"
              selectedPlatforms={onboardingData.platforms}
              onPlatformToggle={(platform) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  platforms: prev.platforms.includes(platform)
                    ? prev.platforms.filter((p) => p !== platform)
                    : [...prev.platforms, platform],
                }));
              }}
              onNext={handlePlatformsNext}
              onBack={() => setSetupStep('type')}
              onSkip={handleSkipSetup}
            />
          )}

          {/* Step 4: Goals */}
          {setupStep === 'goals' && (
            <GoalsStep
              key="goals"
              selectedGoals={onboardingData.goals}
              onGoalToggle={(goal) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  goals: prev.goals.includes(goal)
                    ? prev.goals.filter((g) => g !== goal)
                    : [...prev.goals, goal],
                }));
              }}
              onNext={handleGoalsNext}
              onBack={() => setSetupStep('platforms')}
              isSubmitting={isSubmitting}
              onSkip={handleSkipSetup}
            />
          )}

          {/* Success Screen */}
          {setupStep === 'success' && (
            <SuccessStep
              key="success"
              userName={onboardingData.name}
              userType={onboardingData.userType}
              platformsCount={onboardingData.platforms.length}
              goalsCount={onboardingData.goals.length}
              onGoToDashboard={() => navigate('/creator-dashboard')}
            />
          )}
        </AnimatePresence>
      </div>
    </OnboardingContainer>
  );
};

export default CreatorOnboarding;

