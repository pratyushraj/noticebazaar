"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Sparkles, Shield, TrendingUp, MessageCircle, CheckCircle, Youtube, Instagram, Twitter, Linkedin, Globe, Podcast, ArrowRight, ArrowLeft, Target, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { startTrialOnSignup } from '@/lib/trial';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingAnalytics } from '@/lib/onboarding/analytics';

type WelcomeStep = 0 | 1 | 2 | 3;
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
  }, [setupStep]);

  if (sessionLoading) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
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

  const handleNextWelcome = () => {
    if (welcomeStep < 3) {
      setWelcomeStep((prev) => (prev + 1) as WelcomeStep);
    } else {
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
    
    const totalTime = Date.now() - stepStartTime;
    
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
      
      refetchProfile();
      setSetupStep('success');
    } catch (error: any) {
      toast.error('Failed to complete onboarding', { description: error.message });
      setIsSubmitting(false);
    }
  };

  // Welcome Screens
  if (setupStep === 'name' && welcomeStep < 4) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white relative overflow-hidden">
        {/* Skip Button */}
        <button
          onClick={handleSkipWelcome}
          className="absolute top-6 right-6 z-50 px-4 py-2 text-sm text-purple-200 hover:text-white transition-colors"
        >
          Skip
        </button>

        {/* Progress Dots */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
          {[0, 1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-all ${
                step === welcomeStep ? 'bg-white w-8' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Welcome Screen 1 */}
          {welcomeStep === 0 && (
            <motion.div
              key="welcome-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center nb-screen-height p-6 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-8"
              >
                <Sparkles className="w-12 h-12 text-purple-400" />
              </motion.div>
              
              <h1 className="text-4xl font-bold mb-4">Welcome to NoticeBazaar</h1>
              <p className="text-xl text-purple-200 mb-12">Legal & Tax Services Built for Content Creators</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Contract Review</h3>
                  <p className="text-sm text-purple-200">Get instant analysis in 30 seconds</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Track Earnings</h3>
                  <p className="text-sm text-purple-200">Monitor payments & income</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                    <MessageCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Legal Advisors</h3>
                  <p className="text-sm text-purple-200">Chat with experts anytime</p>
                </div>
              </div>

              <button
                onClick={handleNextWelcome}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Welcome Screen 2 - Protection */}
          {welcomeStep === 1 && (
            <motion.div
              key="welcome-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center nb-screen-height p-6 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-8"
              >
                <Shield className="w-12 h-12 text-green-400" />
              </motion.div>
              
              <h1 className="text-4xl font-bold mb-4">Never Sign a Bad Deal Again</h1>
              <p className="text-xl text-purple-200 mb-12">AI-Powered Contract Protection</p>

              <div className="space-y-4 max-w-md w-full mb-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-green-400 mb-2">10,000+</div>
                  <div className="text-purple-200">Contracts Analyzed</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
                  <div className="text-purple-200">Issues Caught</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                  <div className="text-3xl font-bold text-green-400 mb-2">₹2Cr+</div>
                  <div className="text-purple-200">Creator Value Protected</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackWelcome}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextWelcome}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Welcome Screen 3 - Earnings */}
          {welcomeStep === 2 && (
            <motion.div
              key="welcome-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center nb-screen-height p-6 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-8"
              >
                <TrendingUp className="w-12 h-12 text-blue-400" />
              </motion.div>
              
              <h1 className="text-4xl font-bold mb-4">Track Every Rupee</h1>
              <p className="text-xl text-purple-200 mb-12">Financial Dashboard Benefits</p>

              <div className="space-y-3 max-w-md w-full mb-12">
                {[
                  'Real-time earnings tracking',
                  'Payment reminders',
                  'Tax calculation & filing',
                  'Invoice generation'
                ].map((benefit, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackWelcome}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextWelcome}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Welcome Screen 4 - Support */}
          {welcomeStep === 3 && (
            <motion.div
              key="welcome-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center nb-screen-height p-6 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-8"
              >
                <MessageCircle className="w-12 h-12 text-purple-400" />
              </motion.div>
              
              <h1 className="text-4xl font-bold mb-4">Expert Help When You Need It</h1>
              <p className="text-xl text-purple-200 mb-12">Connect with Legal & Tax Advisors</p>

              <div className="space-y-4 max-w-md w-full mb-12">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Anjali Sharma</div>
                      <div className="text-sm text-purple-200">CA, Creator Taxes</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Prateek Sharma</div>
                      <div className="text-sm text-purple-200">Legal Advisor, Brand Contracts</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBackWelcome}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNextWelcome}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Setup Steps
  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        {setupStep !== 'success' && (
          <div className="mb-8 text-center">
            <div className="text-sm text-purple-200 mb-2">
              Step {setupStep === 'name' ? 1 : setupStep === 'type' ? 2 : setupStep === 'platforms' ? 3 : 4} of 4
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${setupStep === 'name' ? 25 : setupStep === 'type' ? 50 : setupStep === 'platforms' ? 75 : 100}%`
                }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {setupStep === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-3xl font-bold mb-2 text-center">What's your name?</h2>
              <p className="text-purple-200 text-center mb-8">Let's personalize your experience</p>
              
              <input
                type="text"
                value={onboardingData.name}
                onChange={(e) => setOnboardingData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-lg text-white placeholder-purple-300 outline-none focus:border-purple-500 focus:bg-white/10 transition-colors mb-6"
                autoFocus
              />

                <button
                  onClick={handleNameNext}
                  disabled={!onboardingData.name.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
            </motion.div>
          )}

          {/* Step 2: User Type */}
          {setupStep === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-3xl font-bold mb-8 text-center">I am a...</h2>
              
              <div className="space-y-4 mb-6">
                {[
                  { id: 'creator' as UserType, icon: Youtube, title: 'Content Creator', desc: 'YouTuber, Influencer, Social Media' },
                  { id: 'freelancer' as UserType, icon: Users, title: 'Freelancer', desc: 'Independent professional' },
                  { id: 'entrepreneur' as UserType, icon: Target, title: 'Entrepreneur', desc: 'Creator business/agency' }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = onboardingData.userType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setOnboardingData(prev => ({ ...prev, userType: type.id }))}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                        }`}>
                          <Icon className={`w-8 h-8 ${isSelected ? 'text-purple-300' : 'text-purple-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg mb-1">{type.title}</div>
                          <div className="text-sm text-purple-200">{type.desc}</div>
                        </div>
                        {isSelected && <CheckCircle className="w-6 h-6 text-purple-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSetupStep('name')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handleTypeNext}
                  disabled={!onboardingData.userType}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Platforms */}
          {setupStep === 'platforms' && (
            <motion.div
              key="platforms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-3xl font-bold mb-8 text-center">Where do you create?</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'youtube' as Platform, icon: Youtube, label: 'YouTube', color: 'bg-red-500' },
                  { id: 'instagram' as Platform, icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
                  { id: 'twitter' as Platform, icon: Twitter, label: 'Twitter', color: 'bg-blue-400' },
                  { id: 'linkedin' as Platform, icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-600' },
                  { id: 'website' as Platform, icon: Globe, label: 'Website/Blog', color: 'bg-purple-500' },
                  { id: 'podcast' as Platform, icon: Podcast, label: 'Podcast', color: 'bg-orange-500' }
                ].map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = onboardingData.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => {
                        setOnboardingData(prev => ({
                          ...prev,
                          platforms: isSelected
                            ? prev.platforms.filter(p => p !== platform.id)
                            : [...prev.platforms, platform.id]
                        }));
                      }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mb-2 mx-auto`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm font-medium text-center">{platform.label}</div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-purple-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSetupStep('type')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handlePlatformsNext}
                  disabled={onboardingData.platforms.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Goals */}
          {setupStep === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10"
            >
              <h2 className="text-3xl font-bold mb-8 text-center">What are your goals?</h2>
              
              <div className="space-y-3 mb-6">
                {[
                  { id: 'protect' as Goal, icon: Shield, label: 'Protect myself from bad contracts' },
                  { id: 'earnings' as Goal, icon: TrendingUp, label: 'Track my earnings better' },
                  { id: 'taxes' as Goal, icon: Target, label: 'Handle taxes correctly' },
                  { id: 'deals' as Goal, icon: Zap, label: 'Manage brand deals' },
                  { id: 'advice' as Goal, icon: MessageCircle, label: 'Get legal advice' },
                  { id: 'grow' as Goal, icon: TrendingUp, label: 'Grow my creator business' }
                ].map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = onboardingData.goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        setOnboardingData(prev => ({
                          ...prev,
                          goals: isSelected
                            ? prev.goals.filter(g => g !== goal.id)
                            : [...prev.goals, goal.id]
                        }));
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                        isSelected
                          ? 'bg-purple-600/30 border-purple-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-300' : 'text-purple-400'}`} />
                      <span className="flex-1">{goal.label}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSetupStep('platforms')}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <button
                  onClick={handleGoalsNext}
                  disabled={onboardingData.goals.length === 0 || isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Success Screen */}
          {setupStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-400" />
              </motion.div>

              <h1 className="text-4xl font-bold mb-4">You're All Set! 🎉</h1>
              <p className="text-xl text-purple-200 mb-8">
                Welcome to NoticeBazaar, {onboardingData.name}!
              </p>

              {/* Profile Summary */}
              <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">User Type</span>
                    <span className="font-semibold capitalize">{onboardingData.userType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">Platforms</span>
                    <span className="font-semibold">{onboardingData.platforms.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200">Goals</span>
                    <span className="font-semibold">{onboardingData.goals.length}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/creator-dashboard')}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start Protecting My Deals
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorOnboarding;
