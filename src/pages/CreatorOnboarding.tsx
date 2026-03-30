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
import { trackEvent } from '@/lib/utils/analytics';

// Import new components
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingProgressDots } from '@/components/onboarding/OnboardingProgressDots';
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
import { CollabBasicsStep } from '@/components/onboarding/setup/CollabBasicsStep';
import { CollabReadyStep } from '@/components/onboarding/setup/CollabReadyStep';
import { SuccessStep } from '@/components/onboarding/setup/SuccessStep';

type WelcomeStep = 0 | 1 | 2 | 3 | 4 | 5;
type SetupStep = 'name' | 'instagram' | 'niches' | 'reelRate' | 'basics' | 'collabReady' | 'success';
type DealType = 'paid' | 'barter' | 'hybrid' | 'all';

interface OnboardingData {
  name: string;
  instagramUsername: string;
  contentNiches: string[];
  reelRate: string;
  dealType: DealType;
  barterValueMin: string;
  collabCategory: string;
  collabCity: string;
  collabResponseHours: string;
  collabBio: string;
  collabFollowers: string;
  collabBrandsCompleted: string;
  audienceGenderSplit: string;
  primaryAudienceLanguage: string;
  postingFrequency: string;
  avgReelViewsManual: string;
  avgLikesManual: string;
  packageStarterPrice: string;
  packageEngagementPrice: string;
  packageProductValue: string;
  bankAccountName: string;
  bankUpi: string;
}

const normalizeDealType = (value: unknown): DealType => {
  return value === 'paid' || value === 'barter' || value === 'hybrid' || value === 'all'
    ? value
    : 'all';
};

const toTitleCaseName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const isValidUpiId = (value: string) => /^[a-z0-9._-]{2,}@[a-z]{2,}$/i.test(value.trim());

const CreatorOnboarding = () => {
  const { profile, loading: sessionLoading, refetchProfile, user } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const [isNavigating, setIsNavigating] = useState(false);
  const [theme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    document.title = 'Creator Onboarding | Creator Armour';
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute('content', 'Complete your Creator Armour setup to create a stronger deal profile, clearer rates, and a faster creator workflow.');
  }, []);

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
          barterValueMin: '',
          collabCategory: '',
          collabCity: '',
          collabResponseHours: '3',
          collabBio: '',
          collabFollowers: '',
          collabBrandsCompleted: '',
          audienceGenderSplit: '',
          primaryAudienceLanguage: '',
          postingFrequency: '',
          avgReelViewsManual: '',
          avgLikesManual: '',
          packageStarterPrice: '',
          packageEngagementPrice: '',
          packageProductValue: '',
          bankAccountName: '',
          bankUpi: '',
          ...parsed,
          dealType: normalizeDealType(parsed?.dealType),
        };
      } catch (e) {
        console.error('Error parsing saved onboarding data', e);
      }
    }
    return {
      name: '',
      instagramUsername: '',
      contentNiches: [],
      reelRate: '',
      dealType: 'all',
      barterValueMin: '',
      collabCategory: '',
      collabCity: '',
      collabResponseHours: '3',
      collabBio: '',
      collabFollowers: '',
      collabBrandsCompleted: '',
      audienceGenderSplit: '',
      primaryAudienceLanguage: '',
      postingFrequency: '',
      avgReelViewsManual: '',
      avgLikesManual: '',
      packageStarterPrice: '',
      packageEngagementPrice: '',
      packageProductValue: '',
      bankAccountName: '',
      bankUpi: '',
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
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
      } else if (setupStep === 'basics') {
        handleBasicsNext();
      } else if (setupStep === 'collabReady') {
        handleCollabReadyNext();
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
      } else if (setupStep === 'basics') {
        setSetupStep('reelRate');
      } else if (setupStep === 'collabReady') {
        setSetupStep('basics');
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
        reelRate: { name: 'reel_rate', number: 3 },
        basics: { name: 'collab_basics', number: 4 },
        collabReady: { name: 'collab_ready', number: 5 },
      };

      const stepInfo = stepMap[setupStep];
      if (stepInfo) {
        const timeSpent = Date.now() - stepStartTime;
        onboardingAnalytics.trackStep(stepInfo.name, stepInfo.number, 6, timeSpent);
        void trackEvent('onboarding_step_completed', {
          step: stepInfo.name,
          step_number: stepInfo.number,
        });
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
      navigate('/creator-dashboard', { replace: true });
      return;
    }
  }, [sessionLoading, profile, navigate]);

  // Show loading state while session is loading or navigation is happening
  if (sessionLoading || isNavigating) {
    return (
      <OnboardingContainer theme={theme}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500 dark:text-blue-400" />
            <p className="text-slate-600 dark:text-white/80">Preparing your creator workspace...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  // Early return if profile is invalid (navigation will happen in useEffect)
  if (!profile || profile.role !== 'creator') {
    return (
      <OnboardingContainer theme={theme}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500 dark:text-blue-400" />
            <p className="text-slate-600 dark:text-white/80">Redirecting...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  // Early return if onboarding is complete (navigation will happen in useEffect)
  if (profile.onboarding_complete) {
    return (
      <OnboardingContainer theme={theme}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500 dark:text-blue-400" />
            <p className="text-slate-600 dark:text-white/80">Redirecting to your deal dashboard...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

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
      const inferredCategory = onboardingData.contentNiches[0] || '';
      setSetupStep('reelRate');
      setOnboardingData((prev) => ({
        ...prev,
        collabCategory: prev.collabCategory?.trim() || inferredCategory,
      }));
    }
  };

  const handleReelRateNext = () => {
    const parsed = Number.parseFloat(onboardingData.reelRate);
    const parsedBarterMin = Number.parseFloat(onboardingData.barterValueMin);
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

    setSetupStep('basics');
  };

  const handleBasicsNext = () => {
    if (onboardingData.collabCity.trim().length < 2) {
      toast.error('Please enter top audience city');
      return;
    }
    setSetupStep('collabReady');
  };

  const handleCollabReadyNext = () => {
    if (onboardingData.collabBio.trim().length < 20) {
      toast.error('Please add a short bio for brands');
      return;
    }
    if (!Number.isFinite(Number(onboardingData.collabFollowers)) || Number(onboardingData.collabFollowers) <= 0) {
      toast.error('Please enter your Instagram followers');
      return;
    }
    if (!Number.isFinite(Number(onboardingData.collabBrandsCompleted)) || Number(onboardingData.collabBrandsCompleted) < 0) {
      toast.error('Please enter completed brand deals (0 or more)');
      return;
    }
    if (!onboardingData.audienceGenderSplit.trim() && !onboardingData.primaryAudienceLanguage.trim()) {
      toast.error('Please add audience split or primary language');
      return;
    }
    if (!onboardingData.postingFrequency.trim()) {
      toast.error('Please add your posting frequency');
      return;
    }
    if (!(Number(onboardingData.avgReelViewsManual) > 0) && !(Number(onboardingData.avgLikesManual) > 0)) {
      toast.error('Please add average views or average likes');
      return;
    }
    if (!Number.isFinite(Number(onboardingData.packageStarterPrice)) || Number(onboardingData.packageStarterPrice) <= 0) {
      toast.error('Please enter starter package price');
      return;
    }
    if (!Number.isFinite(Number(onboardingData.packageEngagementPrice)) || Number(onboardingData.packageEngagementPrice) <= 0) {
      toast.error('Please enter engagement package price');
      return;
    }
    if (!Number.isFinite(Number(onboardingData.packageProductValue)) || Number(onboardingData.packageProductValue) <= 0) {
      toast.error('Please enter product review value');
      return;
    }
    if (!onboardingData.bankUpi.trim()) {
      toast.error('Please add your UPI ID');
      return;
    }
    if (!isValidUpiId(onboardingData.bankUpi)) {
      toast.error('Enter a valid UPI ID like yourname@upi');
      return;
    }
    handleOnboardingComplete();
  };

  const roundToNearest = (value: number, step: number) => Math.round(value / step) * step;

  const handleAutoSuggestPrices = () => {
    const followers = Number(onboardingData.collabFollowers) || 0;
    const avgViews = Number(onboardingData.avgReelViewsManual) || 0;
    const avgLikes = Number(onboardingData.avgLikesManual) || 0;
    const reelRate = Number(onboardingData.reelRate) || 0;

    let baseReel = reelRate > 0 ? reelRate : 0;
    if (baseReel <= 0 && avgViews > 0) {
      baseReel = avgViews * 0.18;
    }
    if (baseReel <= 0 && avgLikes > 0) {
      baseReel = avgLikes * 8;
    }
    if (baseReel <= 0 && followers > 0) {
      if (followers < 5000) baseReel = 1499;
      else if (followers < 10000) baseReel = 1999;
      else if (followers < 50000) baseReel = 2999;
      else if (followers < 100000) baseReel = 4999;
      else baseReel = 7999;
    }
    if (baseReel <= 0) {
      baseReel = 1999;
    }

    const followerBoost = followers > 100000 ? 1.15 : 1;
    const starter = Math.max(999, roundToNearest(baseReel * followerBoost, 100));
    const engagement = Math.max(starter + 500, roundToNearest(starter * 1.8, 100));
    const barterMin = Math.max(2000, roundToNearest(starter * 1.5, 500));

    setOnboardingData((prev) => ({
      ...prev,
      packageStarterPrice: String(starter),
      packageEngagementPrice: String(engagement),
      packageProductValue: String(barterMin),
    }));
    toast.success('Suggested package prices added');
  };

  const handleGenerateBio = async () => {
    if (isGeneratingBio) return;
    setIsGeneratingBio(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const name = onboardingData.name?.trim() || 'Creator';
      const handle = onboardingData.instagramUsername?.replace(/^@/, '').trim() || 'creator';
      const nicheLine = onboardingData.contentNiches.length > 0
        ? onboardingData.contentNiches.slice(0, 3).join(', ')
        : 'lifestyle content';
      const city = onboardingData.collabCity?.trim() || 'India';
      const dealTypeText = onboardingData.dealType === 'all' ? 'paid, barter, and hybrid collaborations' : `${onboardingData.dealType} collaborations`;
      const reelRateText = Number(onboardingData.reelRate) > 0 ? `Typical reel rate around INR ${Number(onboardingData.reelRate).toLocaleString('en-IN')}.` : '';
      const followersText = Number(onboardingData.collabFollowers) > 0 ? `Audience size about ${Number(onboardingData.collabFollowers).toLocaleString('en-IN')} followers.` : '';

      const input = [
        `Write a concise creator bio for brand collaboration profile.`,
        `Creator: ${name} (@${handle})`,
        `Niches: ${nicheLine}`,
        `Audience city focus: ${city}`,
        `Preferred deal types: ${dealTypeText}`,
        reelRateText,
        followersText,
        `Constraints: 45-70 words, professional, specific, trustworthy, no hashtags, no emojis.`,
      ].filter(Boolean).join('\n');

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/ai/pitch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pitch',
          tone: 55,
          input,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const payload = await response.json().catch(() => ({}));
      const generated = payload?.data?.output?.trim();
      if (!generated) {
        throw new Error('No AI output');
      }

      const cleaned = generated
        .replace(/^subject\s*:\s*.*$/gim, '')
        .replace(/\n{2,}/g, '\n')
        .trim();

      const sentences = cleaned
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map((line: string) => line.trim())
        .filter(Boolean);
      const compactBio = (sentences.length > 0 ? sentences.slice(0, 4) : [cleaned])
        .join('\n')
        .split(' ')
        .slice(0, 70)
        .join(' ')
        .trim();

      setOnboardingData((prev) => ({ ...prev, collabBio: compactBio }));
      toast.success('Bio generated');
    } catch (error) {
      const fallback = [
        `I create ${onboardingData.contentNiches.slice(0, 2).join(' and ') || 'lifestyle'} content for an engaged Indian audience.`,
        `I partner with brands for structured campaigns with clear deliverables and reliable turnaround.`,
        `Open to ${onboardingData.dealType === 'all' ? 'paid, barter, and hybrid' : onboardingData.dealType} collaborations that align with my audience.`,
      ].join('\n');
      setOnboardingData((prev) => ({ ...prev, collabBio: prev.collabBio.trim() || fallback }));
      toast.error('AI unavailable. Added a draft you can edit.');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!profile.id || !user?.id) return;
    setIsSubmitting(true);

    try {
      // Track step completion
      onboardingAnalytics.trackStep('collab_ready', 6, 6, Date.now() - stepStartTime);

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
      const normalizedFullName = toTitleCaseName(onboardingData.name || '');
      const nameParts = normalizedFullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Creator-only onboarding path
      const creatorCategory: string | null = onboardingData.collabCategory?.trim() || 'creator';
      const collabCity = onboardingData.collabCity?.trim();
      const collabResponseHours = Number.parseInt(onboardingData.collabResponseHours || '3', 10);
      const avgReelViewsManual = Math.round(Number(onboardingData.avgReelViewsManual) || 0);
      const avgLikesManual = Math.round(Number(onboardingData.avgLikesManual) || 0);
      const collabBrandsCompleted = Math.max(0, Math.round(Number(onboardingData.collabBrandsCompleted) || 0));
      const packageStarterPrice = Math.round(Number(onboardingData.packageStarterPrice) || 0);
      const packageEngagementPrice = Math.round(Number(onboardingData.packageEngagementPrice) || 0);
      const packageProductValue = Math.round(Number(onboardingData.packageProductValue) || 0);
      const dealTemplates = [
        {
          id: 'starter_package',
          label: 'Starter Creator Package',
          icon: '🎬',
          budget: packageStarterPrice,
          type: 'paid',
          category: creatorCategory || 'Lifestyle',
          description: '1 High-quality Instagram Reel with professional hooks and brand tagging.',
          deliverables: ['Reel'],
          quantities: { Reel: 1 },
          deadlineDays: 7,
          notes: 'Includes 1 revision. Collaborative post included.',
          addons: [
            { id: 'addon_story', label: '+ Extra Story', price: 200 },
            { id: 'addon_revision', label: '+ Extra revision', price: 300 },
          ],
        },
        {
          id: 'engagement_package',
          label: 'Engagement Package',
          icon: '🔥',
          budget: packageEngagementPrice,
          type: 'paid',
          category: creatorCategory || 'Lifestyle',
          description: '1 Reel + 2 Engagement Stories to maximize reach and drive action.',
          deliverables: ['Reel', 'Story'],
          quantities: { Reel: 1, Story: 2 },
          deadlineDays: 10,
          notes: 'Stories include direct link + Polls for engagement.',
          isPopular: true,
        },
        {
          id: 'product_review',
          label: 'Product Review',
          icon: '📦',
          budget: packageProductValue,
          type: 'barter',
          category: creatorCategory || 'Lifestyle',
          description: 'In-depth product unboxing and review with 1 story mention.',
          deliverables: ['Unboxing Video', 'Story'],
          quantities: { 'Unboxing Video': 1, Story: 1 },
          deadlineDays: 14,
          notes: 'Product must be shipped before shoot. Honest review only.',
        },
      ];

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
          top_cities: collabCity ? [collabCity] : null,
          collab_region_label: collabCity || null,
          collab_response_hours_override: Number.isFinite(collabResponseHours) && collabResponseHours > 0 ? collabResponseHours : null,
          open_to_collabs: true,
          bio: onboardingData.collabBio.trim(),
          instagram_followers: Math.round(Number(onboardingData.collabFollowers) || 0),
          audience_gender_split: onboardingData.audienceGenderSplit.trim() || null,
          primary_audience_language: onboardingData.primaryAudienceLanguage.trim() || null,
          posting_frequency: onboardingData.postingFrequency.trim() || null,
          avg_reel_views_manual: avgReelViewsManual > 0 ? avgReelViewsManual : null,
          avg_likes_manual: avgLikesManual > 0 ? avgLikesManual : null,
          collab_brands_count_override: collabBrandsCompleted,
          bank_account_name: onboardingData.bankAccountName.trim() || null,
          bank_upi: onboardingData.bankUpi.trim() || null,
          deal_templates: dealTemplates as any,
          onboarding_complete: true,
          avg_rate_reel: (onboardingData.dealType === 'paid' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.reelRate
            ? parseFloat(onboardingData.reelRate)
            : null,
          suggested_barter_value_min: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.barterValueMin
            ? parseFloat(onboardingData.barterValueMin)
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
            top_cities: collabCity ? [collabCity] : null,
            collab_region_label: collabCity || null,
            collab_response_hours_override: Number.isFinite(collabResponseHours) && collabResponseHours > 0 ? collabResponseHours : null,
            open_to_collabs: true,
            bio: onboardingData.collabBio.trim(),
            instagram_followers: Math.round(Number(onboardingData.collabFollowers) || 0),
            audience_gender_split: onboardingData.audienceGenderSplit.trim() || null,
            primary_audience_language: onboardingData.primaryAudienceLanguage.trim() || null,
            posting_frequency: onboardingData.postingFrequency.trim() || null,
            avg_reel_views_manual: avgReelViewsManual > 0 ? avgReelViewsManual : null,
            avg_likes_manual: avgLikesManual > 0 ? avgLikesManual : null,
            collab_brands_count_override: collabBrandsCompleted,
            bank_account_name: onboardingData.bankAccountName.trim() || null,
            bank_upi: onboardingData.bankUpi.trim() || null,
            deal_templates: dealTemplates as any,
            onboarding_complete: true,
            avg_rate_reel: (onboardingData.dealType === 'paid' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.reelRate
              ? parseFloat(onboardingData.reelRate)
              : null,
            suggested_barter_value_min: (onboardingData.dealType === 'barter' || onboardingData.dealType === 'hybrid' || onboardingData.dealType === 'all') && onboardingData.barterValueMin
              ? parseFloat(onboardingData.barterValueMin)
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

      // Ensure instagram_handle + username are persisted for new creators.
      // This prevents fallback slugs like creator-xxxxxx after onboarding.
      if (collabUsername) {
        try {
          const { data: verifyProfile } = await (supabase as any)
            .from('profiles')
            .select('instagram_handle, username')
            .eq('id', profile.id)
            .single();

          const savedInstagram = ((verifyProfile as any)?.instagram_handle || '').toString().trim().toLowerCase();
          const savedUsername = ((verifyProfile as any)?.username || '').toString().trim().toLowerCase();
          const targetHandle = collabUsername.toLowerCase();

          if (savedInstagram !== targetHandle || savedUsername !== targetHandle) {
            const { error: forceHandleError } = await (supabase as any)
              .from('profiles')
              .update({
                instagram_handle: targetHandle,
                username: targetHandle,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (forceHandleError) {
              console.warn('[CreatorOnboarding] Handle force-save failed:', forceHandleError?.message || forceHandleError);
            }
          }
        } catch (verifyError) {
          console.warn('[CreatorOnboarding] Handle verification step failed (non-fatal):', verifyError);
        }
      }

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
      void trackEvent('onboarding_completed', {
        niches_count: onboardingData.contentNiches.length,
        deal_type: onboardingData.dealType,
      });
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
      <OnboardingContainer theme={theme}>
        <div className="w-full relative z-50 h-12 md:h-14 max-w-3xl mx-auto px-4 md:px-6 flex items-center justify-center">
          <OnboardingProgressDots
            totalSteps={5}
            currentStep={welcomeStep}
            className="!top-1/2 !left-1/2 !-translate-y-1/2"
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
      case 'basics': return 5;
      case 'collabReady': return 6;
      default: return 0;
    }
  };

  return (
    <OnboardingContainer theme={theme}>
      <div className="flex-1 flex flex-col min-h-0 max-w-2xl mx-auto w-full p-4 pb-16 overflow-y-auto overscroll-contain">
        {/* Progress Bar - Add top padding on mobile to account for safe area */}
        {setupStep !== 'success' && (
          <div className="pt-[max(60px,calc(env(safe-area-inset-top,0px)+36px))] md:pt-10 flex-shrink-0">
            <OnboardingProgressBar
              currentStep={getStepNumber()}
              totalSteps={6}
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
                />
              )}

              {/* Step 6: Reel Rate */}
              {setupStep === 'reelRate' && (
                <ReelRateStep
                  key="reelRate"
                  reelRate={onboardingData.reelRate}
                  dealType={onboardingData.dealType}
                  barterValueMin={onboardingData.barterValueMin}
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
                  onNext={handleReelRateNext}
                  onBack={() => setSetupStep('niches')}
                />
              )}

              {/* Step 7: Collab Basics */}
              {setupStep === 'basics' && (
                <CollabBasicsStep
                  key="collab-basics"
                  city={onboardingData.collabCity}
                  responseHours={onboardingData.collabResponseHours}
                  onCityChange={(collabCity) =>
                    setOnboardingData((prev) => ({ ...prev, collabCity }))
                  }
                  onResponseHoursChange={(collabResponseHours) =>
                    setOnboardingData((prev) => ({ ...prev, collabResponseHours }))
                  }
                  onNext={handleBasicsNext}
                  onBack={() => setSetupStep('reelRate')}
                />
              )}

              {setupStep === 'collabReady' && (
                <CollabReadyStep
                  key="collab-ready"
                  bio={onboardingData.collabBio}
                  followers={onboardingData.collabFollowers}
                  brandDealsCompleted={onboardingData.collabBrandsCompleted}
                  audienceGenderSplit={onboardingData.audienceGenderSplit}
                  primaryAudienceLanguage={onboardingData.primaryAudienceLanguage}
                  postingFrequency={onboardingData.postingFrequency}
                  avgReelViewsManual={onboardingData.avgReelViewsManual}
                  avgLikesManual={onboardingData.avgLikesManual}
                  starterPrice={onboardingData.packageStarterPrice}
                  engagementPrice={onboardingData.packageEngagementPrice}
                  productValue={onboardingData.packageProductValue}
                  bankAccountName={onboardingData.bankAccountName}
                  bankUpi={onboardingData.bankUpi}
                  onBioChange={(collabBio) => setOnboardingData((prev) => ({ ...prev, collabBio }))}
                  onFollowersChange={(collabFollowers) => setOnboardingData((prev) => ({ ...prev, collabFollowers }))}
                  onBrandDealsCompletedChange={(collabBrandsCompleted) => setOnboardingData((prev) => ({ ...prev, collabBrandsCompleted }))}
                  onAudienceGenderSplitChange={(audienceGenderSplit) => setOnboardingData((prev) => ({ ...prev, audienceGenderSplit }))}
                  onPrimaryAudienceLanguageChange={(primaryAudienceLanguage) => setOnboardingData((prev) => ({ ...prev, primaryAudienceLanguage }))}
                  onPostingFrequencyChange={(postingFrequency) => setOnboardingData((prev) => ({ ...prev, postingFrequency }))}
                  onAvgReelViewsManualChange={(avgReelViewsManual) => setOnboardingData((prev) => ({ ...prev, avgReelViewsManual }))}
                  onAvgLikesManualChange={(avgLikesManual) => setOnboardingData((prev) => ({ ...prev, avgLikesManual }))}
                  onStarterPriceChange={(packageStarterPrice) => setOnboardingData((prev) => ({ ...prev, packageStarterPrice }))}
                  onEngagementPriceChange={(packageEngagementPrice) => setOnboardingData((prev) => ({ ...prev, packageEngagementPrice }))}
                  onProductValueChange={(packageProductValue) => setOnboardingData((prev) => ({ ...prev, packageProductValue }))}
                  onBankAccountNameChange={(bankAccountName) => setOnboardingData((prev) => ({ ...prev, bankAccountName }))}
                  onBankUpiChange={(bankUpi) => setOnboardingData((prev) => ({ ...prev, bankUpi }))}
                  onGenerateBio={handleGenerateBio}
                  onAutoSuggestPrices={handleAutoSuggestPrices}
                  isGeneratingBio={isGeneratingBio}
                  onBack={() => setSetupStep('basics')}
                  onNext={handleCollabReadyNext}
                />
              )}

              {/* Success Screen */}
              {setupStep === 'success' && (
                <SuccessStep
                  key="success"
                  userName={onboardingData.name}
                  onGoToDashboard={() => navigate('/creator-dashboard')}
                  onCompleteCollabProfile={() => {
                    const handle = profile?.instagram_handle || profile?.username;
                    if (handle) {
                      navigate(`/${handle}?edit=true`);
                    } else {
                      navigate('/creator-dashboard');
                    }
                  }}
                  collabProfile={profile as unknown as Record<string, any>}
                  collabLink={profile?.instagram_handle || profile?.username
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${profile?.instagram_handle || profile?.username}`
                    : undefined}
                  collabShortLabel={profile?.instagram_handle || profile?.username
                    ? `creatorarmour.com/${profile?.instagram_handle || profile?.username}`
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
