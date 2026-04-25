

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Check,
  Instagram,
  Link2,
  Loader2,
  Zap,
  IndianRupee,
  Video,
  Bell,
  ArrowLeft,
  ArrowRight,
  Upload,
  Play,
  X,
  Users,
  ShieldCheck,
  MapPin,
  CreditCard,
  Target,
  PenTool,
  Sparkles,
  User
} from 'lucide-react';
import { generateAIBios } from '@/utils/aiBioGenerator';
import { CITY_OPTIONS } from '@/constants/cities';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { getApiBaseUrl } from '@/lib/utils/api';

type OnboardingStep = 'identity' | 'reach' | 'audience' | 'style' | 'collab' | 'videoSuccess' | 'profile' | 'payout' | 'logistics' | 'notifications' | 'finalizing';

const NICHES = [
  { id: 'beauty', label: 'Beauty', icon: '💄' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🏠' },
  { id: 'tech', label: 'Tech & Gadgets', icon: '💻' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'food', label: 'Food', icon: '🍳' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'parenting', label: 'Parenting', icon: '👪' },
  { id: 'pets', label: 'Pets', icon: '🐕' },
  { id: 'finance', label: 'Finance', icon: '📈' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'wellness', label: 'Wellness', icon: '🧘' },
  { id: 'automotive', label: 'Automotive', icon: '🏎️' },
  { id: 'spirituality', label: 'Spirituality', icon: '✨' },
];

const VIBES = [
  { id: 'aesthetic', label: 'Aesthetic', icon: '✨' },
  { id: 'relatable', label: 'Relatable', icon: '🤝' },
  { id: 'informative', label: 'Informative', icon: '💡' },
  { id: 'high_energy', label: 'High Energy', icon: '⚡' },
  { id: 'minimalist', label: 'Minimalist', icon: '⚪' },
  { id: 'luxury', label: 'Luxury', icon: '💎' },
  { id: 'bold', label: 'Bold', icon: '💥' },
  { id: 'fun', label: 'Fun', icon: '🎉' },
  { id: 'professional', label: 'Professional', icon: '👩‍💼' },
  { id: 'authentic', label: 'Authentic', icon: '🌱' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎥' },
  { id: 'experimental', label: 'Experimental', icon: '🧪' },
];

const normalizeNicheValue = (value: string) => {
  const raw = String(value || '').trim().toLowerCase();
  const match = NICHES.find((niche) => niche.id === raw || niche.label.toLowerCase() === raw);
  return match?.label || value;
};

const normalizeVibeValue = (value: string) => {
  const raw = String(value || '').trim().toLowerCase();
  const match = VIBES.find((vibe) => vibe.id === raw || vibe.label.toLowerCase() === raw);
  return match?.label || value;
};

const FOLLOWER_RANGES = [
  { id: '<1k', label: '<1k' },
  { id: '1k-10k', label: '1k–10k' },
  { id: '10k-50k', label: '10k–50k' },
  { id: '50k+', label: '50k+' }
];

// CITY_OPTIONS is now imported from '@/constants/cities'


const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  delhi: 'Delhi',
  'new delhi': 'New Delhi',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  madras: 'Chennai',
  chennai: 'Chennai',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  noida: 'Noida',
  'greater noida': 'Greater Noida',
  poona: 'Pune',
  pune: 'Pune',
  cochin: 'Kochi',
  kochi: 'Kochi',
  hubli: 'Hubballi',
  mangalore: 'Mangaluru',
  calicut: 'Kozhikode',
  trivandrum: 'Thiruvananthapuram',
  baroda: 'Vadodara',
  allahabad: 'Prayagraj',
};

const STEP_ORDER: OnboardingStep[] = ['identity', 'reach', 'audience', 'style', 'collab', 'payout', 'logistics', 'notifications'];
const ONBOARDING_DRAFT_KEY = 'creator-onboarding-draft-v1';

const normalizeCityValue = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const aliasMatch = CITY_ALIASES[cleaned.toLowerCase()];
  if (aliasMatch) return aliasMatch;
  const exactMatch = CITY_OPTIONS.find((city) => city.toLowerCase() === cleaned.toLowerCase());
  return exactMatch ?? cleaned;
};

const AUDIENCE_GENDER_OPTIONS = [
  {
    id: 'women-majority',
    label: 'Mostly Women',
    storedValue: 'Women 70%+',
    icon: 'User'
  },
  {
    id: 'balanced',
    label: 'Balanced Mix',
    storedValue: 'Balanced Mix',
    icon: 'Users'
  },
  {
    id: 'men-majority',
    label: 'Mostly Men',
    storedValue: 'Men 70%+',
    icon: 'User'
  },
] as const;

const AGE_OPTIONS = ['13–17', '18–24', '25–34', '35–44', '45+'];

export default function CreatorOnboarding() {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const { enableNotifications } = useDealAlertNotifications();

  const [step, setStep] = useState<OnboardingStep>('identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [instagramHandle, setInstagramHandle] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState<string>('');
  const [creatorTitle, setCreatorTitle] = useState('');
  const [topCity1, setTopCity1] = useState('');
  const [topCity2, setTopCity2] = useState('');
  const [topCity3, setTopCity3] = useState('');
  const [bio, setBio] = useState('');

  const [baseRate, setBaseRate] = useState<string>('');
  const [contentVibes, setContentVibes] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [instagramLink, setInstagramLink] = useState('');

  const [upiId, setUpiId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [baseCity, setBaseCity] = useState('');
  const [audienceGenderSplit, setAudienceGenderSplit] = useState('');
  const [audienceAgeRange, setAudienceAgeRange] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [followersAutoFilled, setFollowersAutoFilled] = useState(false);
  const [activeCityField, setActiveCityField] = useState<'baseCity' | 'topCity1' | 'topCity2' | 'topCity3' | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const lastFetchedHandleRef = useRef<string>('');

  // Current Step Index for progress
  const currentStepIndex = useMemo(() => {
    const progressIndexByStep: Record<OnboardingStep, number> = {
      identity: 0,
      reach: 1,
      audience: 2,
      style: 3,
      collab: 4,
      videoSuccess: 4,
      profile: 5,
      payout: 6,
      logistics: 6,
      notifications: 7,
      finalizing: 7,
    };

    return progressIndexByStep[step] ?? 0;
  }, [step]);

  // Auto-fill from profile/metadata
  useEffect(() => {
    if (profile?.instagram_handle && !instagramHandle) {
      setInstagramHandle(profile.instagram_handle.replace(/^@+/, ''));
    }
    if (profile?.content_niches?.length && selectedNiches.length === 0) {
      setSelectedNiches(profile.content_niches.map(normalizeNicheValue));
    }
    if (profile?.content_vibes?.length && contentVibes.length === 0) {
      setContentVibes(profile.content_vibes.map(normalizeVibeValue));
    }
    if (profile?.avg_rate_reel && !baseRate) {
      setBaseRate(profile.avg_rate_reel.toString());
    }
    if (typeof profile?.instagram_followers === 'number' && profile.instagram_followers > 0 && !followerCount) {
      setFollowerCount(String(profile.instagram_followers));
      setFollowersAutoFilled(true);
    }
    if (profile?.bio && !bio) {
      setBio(profile.bio);
    }
    if (profile?.payout_upi && !upiId) {
      setUpiId(profile.payout_upi);
    }
    if (profile?.location && !shippingAddress) {
      const pincodeMatch = profile.location.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        setPincode(pincodeMatch[0]);
        setShippingAddress(profile.location.replace(pincodeMatch[0], '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
      } else {
        setShippingAddress(profile.location);
      }
    }
    if (profile?.top_cities?.length && !topCity1 && !topCity2 && !topCity3) {
      setTopCity1(profile.top_cities[0] || '');
      setTopCity2(profile.top_cities[1] || '');
      setTopCity3(profile.top_cities[2] || '');
    }
    if (profile?.phone && !phone) {
      setPhone(profile.phone);
    }
    if (profile?.collab_region_label && !baseCity) {
      setBaseCity(profile.collab_region_label);
    }
    if (profile?.audience_gender_split && !audienceGenderSplit) {
      setAudienceGenderSplit(profile.audience_gender_split);
    }
    if (profile?.audience_age_range && audienceAgeRange.length === 0) {
      setAudienceAgeRange(
        String(profile.audience_age_range)
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      );
    }
  }, [profile, instagramHandle, selectedNiches, contentVibes, baseRate, bio, upiId, shippingAddress, topCity1, topCity2, topCity3, phone, followerCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.step === 'string' && ['identity', 'reach', 'audience', 'style', 'collab', 'videoSuccess', 'profile', 'payout', 'logistics', 'notifications'].includes(draft.step)) {
        setStep(draft.step as OnboardingStep);
      }
      if (draft.instagramHandle && !instagramHandle) setInstagramHandle(draft.instagramHandle);
      if (Array.isArray(draft.selectedNiches) && selectedNiches.length === 0) setSelectedNiches(draft.selectedNiches.map(normalizeNicheValue));
      if (draft.followerCount && !followerCount) setFollowerCount(draft.followerCount);
      if (draft.creatorTitle && !creatorTitle) setCreatorTitle(draft.creatorTitle);
      if (draft.topCity1 && !topCity1) setTopCity1(draft.topCity1);
      if (draft.topCity2 && !topCity2) setTopCity2(draft.topCity2);
      if (draft.topCity3 && !topCity3) setTopCity3(draft.topCity3);
      if (draft.bio && !bio) setBio(draft.bio);
      if (draft.baseRate && !baseRate) setBaseRate(draft.baseRate);
      if (Array.isArray(draft.contentVibes) && contentVibes.length === 0) setContentVibes(draft.contentVibes.map(normalizeVibeValue));
      if (draft.videoUrl && !videoUrl) setVideoUrl(draft.videoUrl);
      if (draft.instagramLink && !instagramLink) setInstagramLink(draft.instagramLink);
      if (draft.upiId && !upiId) setUpiId(draft.upiId);
      if (draft.shippingAddress && !shippingAddress) setShippingAddress(draft.shippingAddress);
      if (draft.pincode && !pincode) setPincode(draft.pincode);
      if (draft.phone && !phone) setPhone(draft.phone);
      if (draft.baseCity && !baseCity) setBaseCity(draft.baseCity);
      if (draft.audienceGenderSplit && !audienceGenderSplit) setAudienceGenderSplit(draft.audienceGenderSplit);
      if (Array.isArray(draft.audienceAgeRange) && audienceAgeRange.length === 0) setAudienceAgeRange(draft.audienceAgeRange);
    } catch (error) {
      console.warn('Failed to restore onboarding draft', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
        step,
        instagramHandle,
        selectedNiches,
        followerCount,
        creatorTitle,
        topCity1,
        topCity2,
        topCity3,
        bio,
        baseRate,
        contentVibes,
        videoUrl,
        instagramLink,
        upiId,
        shippingAddress,
        pincode,
        phone,
        baseCity,
        audienceGenderSplit,
        audienceAgeRange,
      }));
    } catch (error) {
      console.warn('Failed to persist onboarding draft', error);
    }
  }, [
    step,
    instagramHandle,
    selectedNiches,
    followerCount,
    creatorTitle,
    topCity1,
    topCity2,
    topCity3,
    bio,
    baseRate,
    contentVibes,
    videoUrl,
    instagramLink,
    upiId,
    shippingAddress,
    pincode,
    phone,
    baseCity,
    audienceGenderSplit,
    audienceAgeRange,
  ]);

  // Helper to map count to range ID
  const getFollowerRangeId = (count: number): string => {
    if (count < 1000) return '<1k';
    if (count < 10000) return '1k-10k';
    if (count < 50000) return '10k-50k';
    return '50k+';
  };

  // Auto-fetch followers when handle changes
  useEffect(() => {
    const cleanHandle = instagramHandle.replace(/^@+/, '').trim();
    if (!cleanHandle || cleanHandle.length < 3) return;
    if (profile?.instagram_followers && profile.instagram_followers > 0) return;
    if (lastFetchedHandleRef.current === cleanHandle) return;

    const timer = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const apiBaseUrl = getApiBaseUrl();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const response = await fetch(`${apiBaseUrl}/api/profile/instagram-sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instagram_username: cleanHandle,
          }),
        });

        const data = await response.json().catch(() => null);
        if (response.ok && data?.success && Number(data?.followers) > 0) {
          lastFetchedHandleRef.current = cleanHandle;
          setFollowerCount(String(data.followers));
          setFollowersAutoFilled(true);
        }
      } catch (err) {
        console.warn('Auto-fetch failed', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1200); // 1.2s debounce

    return () => clearTimeout(timer);
  }, [instagramHandle, profile?.instagram_followers]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!profile || profile.role !== 'creator') {
      navigate('/login', { replace: true });
      return;
    }
    if (profile.onboarding_complete) {
      navigate('/creator-dashboard', { replace: true });
      return;
    }
  }, [sessionLoading, profile, navigate]);

  const handleBack = () => {
    if (isSubmitting || isUploading) return;

    if (step === 'identity') return;
    if (step === 'videoSuccess') {
      setStep('collab');
      return;
    }
    if (step === 'profile') {
      setStep('videoSuccess');
      return;
    }
    if (step === 'finalizing') {
      setStep('notifications');
      return;
    }

    const currentIndex = STEP_ORDER.indexOf(step as OnboardingStep);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
        if (step === 'identity') {
        if (instagramHandle.length < 3) {
          toast.error('Please enter your Instagram username');
          return;
        }

        // Save progress for Step 1
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          instagram_handle: instagramHandle.replace(/^@+/, '').trim().toLowerCase(),
          username: instagramHandle.replace(/^@+/, '').trim().toLowerCase(),
          bio: creatorTitle || null,
        } as any);

        setStep('reach');
      } else if (step === 'reach') {
        if (!followerCount) {
          toast.error('Please enter your follower count');
          return;
        }

        // Save progress for Step 2
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          instagram_followers: Number(followerCount) || 0,
          follower_count_range: getFollowerRangeId(Number(followerCount)),
          collab_region_label: baseCity || null,
          top_cities: [topCity1, topCity2, topCity3].map(c => c.trim()).filter(Boolean),
        } as any);

        setStep('audience');
      } else if (step === 'audience') {
        if (!audienceGenderSplit) {
          toast.error('Please select audience gender split');
          return;
        }
        if (audienceAgeRange.length === 0) {
          toast.error('Please select at least one age range');
          return;
        }

        // Save progress for Step 3
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          audience_gender_split: audienceGenderSplit,
          audience_age_range: audienceAgeRange.join(', '),
        } as any);

        setStep('style');
      } else if (step === 'style') {
        if (selectedNiches.length === 0) {
          toast.error('Please select at least one niche');
          return;
        }

        // Save progress for Step 4
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          content_niches: selectedNiches,
          content_vibes: contentVibes,
        } as any);

        setStep('collab');
      } else if (step === 'collab') {
        if (!videoUrl) {
          toast.error('Please upload your discovery reel');
          return;
        }
        if (!baseRate || isNaN(Number(baseRate))) {
          toast.error('Please set your collab rate');
          return;
        }

        // Save progress for Step 5
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          avg_rate_reel: Number(baseRate),
          reel_price: Number(baseRate),
          discovery_video_url: videoUrl,
          collab_past_work_items: videoUrl ? [{
            id: crypto.randomUUID(),
            sourceUrl: videoUrl,
            mediaType: 'video',
            title: 'Primary Reel',
            platform: 'internal'
          }] : [],
        } as any);

        setStep('videoSuccess');
      } else if (step === 'payout') {
        if (!upiId) {
          toast.error('Please enter your UPI ID for payments');
          return;
        }
        if (shippingAddress && !pincode) {
          toast.error('Please enter your pincode');
          return;
        }
        if (pincode && !/^\d{6}$/.test(pincode)) {
          toast.error('Please enter a valid 6-digit pincode');
          return;
        }

        // Save progress for Step 6
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          payout_upi: upiId || null,
          bank_upi: upiId || null,
          phone: phone || null,
          location: shippingAddress ? `${shippingAddress}${pincode ? ', ' + pincode : ''}` : null,
          shipping_address: shippingAddress || null,
          pincode: pincode || null,
        } as any);

        setStep('notifications');
      }

      await refetchProfile?.();
    } catch (err: any) {
      toast.error('Failed to save progress: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video too large. Please upload under 50MB');
      return;
    }

    setVideoFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(20);
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/videos/${fileName}`;

      const { data, error } = await supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      setUploadProgress(100);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
      setVideoFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const cleanHandle = instagramHandle.replace(/^@+/, '').trim().toLowerCase();

      const portfolioItems: any[] = [];

      if (videoUrl) {
        portfolioItems.push({
          id: crypto.randomUUID(),
          sourceUrl: videoUrl,
          mediaType: 'video',
          title: 'Primary Reel',
          platform: 'internal'
        });
      }

      if (instagramLink) {
        portfolioItems.push({
          id: crypto.randomUUID(),
          sourceUrl: instagramLink,
          mediaType: 'link',
          title: 'Instagram Reference',
          platform: 'instagram'
        });
      }

      // Map follower range strings to representative numbers for the database
      const followerCountMap: Record<string, number> = {
        '<1k': 500,
        '1k-10k': 5000,
        '10k-50k': 25000,
        '50k+': 75000
      };

      const numericFollowerCount = followerCountMap[followerCount] || Number(followerCount) || 0;

      await updateProfileMutation.mutateAsync({
        id: profile!.id,
        instagram_handle: cleanHandle,
        username: cleanHandle,
        content_niches: selectedNiches,
        avg_rate_reel: Number(baseRate),
        reel_price: Number(baseRate),
        discovery_video_url: videoUrl,
        instagram_followers: numericFollowerCount,
        follower_count_range: getFollowerRangeId(numericFollowerCount),
        bio: creatorTitle || null,
        top_cities: [topCity1, topCity2, topCity3].map(c => c.trim()).filter(Boolean),
        content_vibes: contentVibes,
        payout_upi: upiId || null,
        phone: phone || null,
        location: shippingAddress ? `${shippingAddress}${pincode ? ', ' + pincode : ''}` : null,
        city: baseCity || null,
        collab_region_label: baseCity || null,
        shipping_address: shippingAddress || null,
        pincode: pincode || null,
        audience_gender_split: audienceGenderSplit || null,
        audience_age_range: audienceAgeRange.length ? audienceAgeRange.join(', ') : null,
        collab_past_work_items: portfolioItems,
        onboarding_complete: true,
        open_to_collabs: true,
      } as any);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      }

      await refetchProfile?.();
      toast.success('Onboarding complete!');
      navigate('/creator-link-ready', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNiche = (id: string) => {
    setSelectedNiches(prev => {
      const label = normalizeNicheValue(id);
      if (prev.includes(label)) return prev.filter(n => n !== label);
      if (prev.length >= 3) {
        toast.error('Please select up to 3 niches');
        return prev;
      }
      return [...prev, label];
    });
  };

  const toggleVibe = (id: string) => {
    setContentVibes(prev => {
      const label = normalizeVibeValue(id);
      if (prev.includes(label)) return prev.filter(v => v !== label);
      if (prev.length >= 3) {
        toast.error('Please select up to 3 vibes');
        return prev;
      }
      return [...prev, label];
    });
  };

  const getNormalizedCityFields = () => {
    const values = [
      normalizeCityValue(topCity1),
      normalizeCityValue(topCity2),
      normalizeCityValue(topCity3),
    ].filter(Boolean);

    return values;
  };

  const isCityDuplicate = (nextCity: string, currentValue: string) => {
    const normalizedNextCity = normalizeCityValue(nextCity);
    const normalizedCurrentValue = normalizeCityValue(currentValue);
    if (!normalizedNextCity) return false;

    return getNormalizedCityFields().some(
      (city) => city === normalizedNextCity && city !== normalizedCurrentValue
    );
  };

  const setUniqueCityValue = (
    value: string,
    currentValue: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const normalizedValue = normalizeCityValue(value);
    if (!normalizedValue) {
      setter('');
      return;
    }

    if (isCityDuplicate(normalizedValue, currentValue)) {
      toast.error('Pick a different city. Each audience city must be unique.');
      return;
    }

    setter(normalizedValue);
  };

  const getCitySuggestions = (query: string) => {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) return CITY_OPTIONS.slice(0, 12);
    return CITY_OPTIONS.filter((city) => city.toLowerCase().includes(cleaned)).slice(0, 12);
  };

  const renderCitySuggestions = (
    field: 'baseCity' | 'topCity1' | 'topCity2' | 'topCity3',
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (activeCityField !== field) return null;

    const suggestions = getCitySuggestions(value);
    if (suggestions.length === 0) return null;

    return (
      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/80">
        <div className="max-h-56 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={`${field}-${city}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                setUniqueCityValue(city, value, setter);
                setActiveCityField(null);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 transition-colors",
                normalizeCityValue(value) === city ? "bg-emerald-50 text-emerald-700" : "hover:bg-slate-50"
              )}
            >
              <span>{city}</span>
              {normalizeCityValue(value) === city && <CheckCircle2 className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const toggleAudienceAge = (age: string) => {
    setAudienceAgeRange((prev) => (
      prev.includes(age)
        ? prev.filter((value) => value !== age)
        : [...prev, age]
    ));
  };

  const handleInstagramAudienceImport = async () => {
    const cleanHandle = instagramHandle.replace(/^@+/, '').trim();
    if (!cleanHandle) {
      toast.error('Enter your Instagram username first');
      return;
    }

    try {
      setIsSyncing(true);
      const apiBaseUrl = getApiBaseUrl();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Sign in again to import Instagram data');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/profile/instagram-sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instagram_username: cleanHandle,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        toast.error('Could not import from Instagram right now');
        return;
      }

      if (Number(data?.followers) > 0) {
        setFollowerCount(String(data.followers));
        setFollowersAutoFilled(true);
      }

      await refetchProfile?.();
      toast.success('Imported your latest Instagram profile stats');
    } catch (error) {
      console.warn('Instagram audience import failed', error);
      toast.error('Could not import from Instagram right now');
    } finally {
      setIsSyncing(false);
    }
  };

  const canGoBack = step !== 'identity' && !isSubmitting && !isUploading;
  const hasPayoutDetails = Boolean((upiId || profile?.payout_upi || '').trim());
  const hasLogisticsDetails = Boolean(
    (shippingAddress || profile?.shipping_address || profile?.location || '').trim() ||
    (pincode || profile?.pincode || '').trim()
  );
  const isProfileFinalStep = hasPayoutDetails && hasLogisticsDetails;

  if (sessionLoading || !profile) {
    return (
      <OnboardingContainer theme="light">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="light" allowScroll>
      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col pt-6 pb-20 px-6">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={!canGoBack}
            className={cn(
              "h-10 w-10 rounded-full border border-slate-200 bg-white p-0 text-slate-500 transition-all",
              canGoBack ? "shadow-sm hover:border-primary hover:text-primary" : "pointer-events-none opacity-0"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentStepIndex ? "w-8 bg-primary" : (i < currentStepIndex ? "w-4 bg-primary/40" : "w-4 bg-slate-100")
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {currentStepIndex + 1} of 8</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <OnboardingSlide key="identity" slideKey="identity">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">💸 Start earning from brand deals</h1>
                <p className="text-emerald-600 font-bold text-xs bg-emerald-50 py-1.5 px-4 rounded-full inline-block tracking-tight">Top creators earned ₹50k+ this month</p>
              </div>

              <div className="w-full space-y-6 text-left">
                {/* Instagram Field */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Instagram Username</span>
                    <span className="text-primary tracking-normal">Match with brands</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">@</div>
                    <Input
                      value={instagramHandle}
                      onChange={e => setInstagramHandle(e.target.value)}
                      placeholder="e.g. wowvidushi"
                      className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                  </div>
                </div>

                {/* Creator Title */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between items-center">
                    <span>Professional Title</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const bios = generateAIBios({
                          name: instagramHandle || 'Creator',
                          niches: selectedNiches,
                          vibes: contentVibes,
                          city: baseCity
                        });
                        // Cycle through bios
                        const currentIndex = bios.indexOf(creatorTitle);
                        const nextIndex = (currentIndex + 1) % bios.length;
                        setCreatorTitle(bios[nextIndex]);
                        toast.success('AI Bio Generated ✨');
                      }}
                      className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Generate</span>
                    </button>
                  </Label>
                  <Input
                    value={creatorTitle}
                    onChange={e => setCreatorTitle(e.target.value)}
                    placeholder="e.g. Tech Enthusiast & Reviewer"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue <span className="text-primary">→</span> Find brand deals</>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  No spam • Only brand collaborations
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 'reach' && (
            <OnboardingSlide key="reach" slideKey="reach">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">📊 Your Reach</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Followers & Locations</p>
              </div>

              <div className="w-full space-y-6 text-left">
                {/* Follower Count */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Number of Followers</span>
                    <span className="text-primary tracking-normal">
                      {followersAutoFilled ? 'Auto-fetched from Instagram' : 'Auto-fetched if available'}
                    </span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <Input
                      type="number"
                      value={followerCount}
                      onChange={e => {
                        setFollowerCount(e.target.value);
                        setFollowersAutoFilled(false);
                      }}
                      placeholder="e.g. 15400"
                      className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                    {isSyncing && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Syncing...</span>
                      </div>
                    )}
                  </div>
                  <p className="px-1 text-[10px] font-medium leading-relaxed text-slate-400">
                    {followersAutoFilled
                      ? 'Fetched from your Instagram handle. You can still edit it manually if needed.'
                      : 'We will try to fetch this from your Instagram handle. If it does not load, enter it manually.'}
                  </p>
                </div>

                {/* Base Location */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Your Base City</span>
                    <span className="text-primary tracking-normal">For local brand deals</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                      <MapPin className="w-5 h-5" />
                    </div>
                      <Input
                        value={baseCity}
                      onChange={e => setBaseCity(e.target.value)}
                      onFocus={() => setActiveCityField('baseCity')}
                      onBlur={e => {
                        setUniqueCityValue(e.target.value, baseCity, setBaseCity);
                        window.setTimeout(() => setActiveCityField((current) => current === 'baseCity' ? null : current), 100);
                      }}
                      placeholder="e.g. Mumbai"
                      autoComplete="off"
                      className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                    {renderCitySuggestions('baseCity', baseCity, setBaseCity)}
                  </div>
                  <p className="px-1 text-[10px] font-medium leading-relaxed text-slate-400">
                    Start typing and pick the city from the dropdown so brands can filter you correctly.
                  </p>
                </div>

                {/* Top Cities */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Audience Top 3 Cities</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <Input
                        value={topCity1}
                        onChange={e => setTopCity1(e.target.value)}
                        onFocus={() => setActiveCityField('topCity1')}
                        onBlur={e => {
                          setUniqueCityValue(e.target.value, topCity1, setTopCity1);
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity1' ? null : current), 100);
                        }}
                        placeholder="City 1"
                        autoComplete="off"
                        className="h-14 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xs font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                      />
                      {renderCitySuggestions('topCity1', topCity1, setTopCity1)}
                    </div>
                    <div className="relative">
                      <Input
                        value={topCity2}
                        onChange={e => setTopCity2(e.target.value)}
                        onFocus={() => setActiveCityField('topCity2')}
                        onBlur={e => {
                          setUniqueCityValue(e.target.value, topCity2, setTopCity2);
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity2' ? null : current), 100);
                        }}
                        placeholder="City 2"
                        autoComplete="off"
                        className="h-14 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xs font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                      />
                      {renderCitySuggestions('topCity2', topCity2, setTopCity2)}
                    </div>
                    <div className="relative">
                      <Input
                        value={topCity3}
                        onChange={e => setTopCity3(e.target.value)}
                        onFocus={() => setActiveCityField('topCity3')}
                        onBlur={e => {
                          setUniqueCityValue(e.target.value, topCity3, setTopCity3);
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity3' ? null : current), 100);
                        }}
                        placeholder="City 3"
                        autoComplete="off"
                        className="h-14 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xs font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                      />
                      {renderCitySuggestions('topCity3', topCity3, setTopCity3)}
                    </div>
                  </div>
                  <p className="px-1 text-[10px] font-medium leading-relaxed text-slate-400">
                    Use the suggested city names to avoid spelling mismatches in brand search.
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'audience' && (
            <OnboardingSlide key="audience" slideKey="audience">
              <div className="space-y-8 text-left">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">👥 Who follows you?</h1>
                  <p className="mt-3 text-lg font-medium leading-relaxed text-slate-500">
                    This helps brands match you with better deals
                  </p>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <Label className="px-1 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Gender Split</Label>
                    <div className="flex flex-wrap justify-center gap-3">
                      {AUDIENCE_GENDER_OPTIONS.map((option) => {
                        const isSelected = audienceGenderSplit === option.storedValue;
                        const iconColor = option.id.includes('women')
                          ? 'text-emerald-500'
                          : option.id.includes('men')
                            ? 'text-sky-500'
                            : 'text-violet-500';

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setAudienceGenderSplit(option.storedValue)}
                            className={cn(
                              "flex min-h-[110px] min-w-[100px] flex-1 flex-col items-center justify-center rounded-[26px] border bg-white px-4 py-4 text-center transition-all duration-200 active:scale-[0.985]",
                              isSelected
                                ? "border-emerald-400 shadow-[0_16px_36px_rgba(34,197,94,0.12)]"
                                : "border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                            )}
                          >
                            <div className={cn("mb-2", iconColor)}>
                              {option.icon === 'Users' ? <Users className="h-6 w-6" /> : <User className="h-6 w-6" />}
                            </div>
                            <div className="text-[13px] font-black leading-tight tracking-tight text-slate-900">
                              {option.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="px-1 text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Primary Age Range</Label>
                      <p className="px-1 text-base font-medium leading-relaxed text-slate-500">
                        Select all age buckets that represent your audience.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {AGE_OPTIONS.map((age) => {
                        const isSelected = audienceAgeRange.includes(age);
                        return (
                          <button
                            key={age}
                            type="button"
                            onClick={() => toggleAudienceAge(age)}
                            className={cn(
                              "relative flex h-20 items-center justify-center rounded-[24px] border bg-white px-4 text-[18px] font-black tracking-tight transition-all duration-200 active:scale-[0.98]",
                              isSelected
                                ? "border-emerald-400 text-slate-900 shadow-[0_16px_36px_rgba(34,197,94,0.12)]"
                                : "border-slate-200 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                            )}
                          >
                            {age}
                            {isSelected && (
                              <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                                <Check className="h-5 w-5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </div>

              <div className="sticky bottom-4 mt-auto pt-8">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="h-16 w-full rounded-[24px] border border-emerald-300/20 bg-[linear-gradient(90deg,#22c55e_0%,#0ea5e9_100%)] text-base font-black text-white shadow-[0_22px_55px_rgba(14,165,233,0.18)] transition-all active:scale-[0.985] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Save & Continue <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'style' && (
            <OnboardingSlide key="style" slideKey="style">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">✨ Your Content Style</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Niches & Visual Vibes</p>
              </div>

              <div className="w-full space-y-8 text-left">
                {/* Niche Selection */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Main Niches (max 3)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {NICHES.map(niche => (
                      <motion.button
                        key={niche.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleNiche(niche.label)}
                        className={cn(
                          "h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-[9px] font-black uppercase tracking-tighter text-center px-1",
                          selectedNiches.includes(niche.label)
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white border-slate-100 text-slate-400"
                        )}
                      >
                        <span className="text-base mb-0.5">{niche.icon}</span>
                        {niche.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Vibe Selection */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Visual Vibe (max 3)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {VIBES.map(vibe => (
                      <motion.button
                        key={vibe.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleVibe(vibe.label)}
                        className={cn(
                          "h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-[9px] font-black uppercase tracking-tighter text-center px-1",
                          contentVibes.includes(vibe.label)
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20"
                            : "bg-white border-slate-100 text-slate-400"
                        )}
                      >
                        <span className="text-base mb-0.5">{vibe.icon}</span>
                        {vibe.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  No spam • Only brand collaborations
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 'collab' && (
            <OnboardingSlide key="collab" slideKey="collab">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">🚀 Build your Collab Page</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Discovery video + Collaboration Rate</p>
              </div>

              <div className="w-full space-y-8">
                {/* Video Upload Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block text-left">Primary Discovery Reel</Label>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    accept="video/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      "w-full h-56 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden",
                      isUploading ? "bg-slate-50 border-slate-200" : (videoUrl ? "border-emerald-500/20 bg-emerald-50/10" : "bg-primary/5 border-primary/20 hover:border-primary/40")
                    )}
                  >
                    {isUploading ? (
                      <div className="space-y-3 text-center z-10">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                        <p className="text-[10px] font-black italic text-slate-900 uppercase tracking-widest">Uploading...</p>
                      </div>
                    ) : videoUrl ? (
                      <div className="relative w-full h-full">
                        <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Change Video</div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black italic text-slate-900 uppercase">Tap to upload reel</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MP4 • Max 60sec • 50MB</p>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                {/* Pricing Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block text-left">Your Starting Rate (per Reel)</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black italic text-slate-400">₹</div>
                    <Input
                      type="number"
                      value={baseRate}
                      onChange={e => setBaseRate(e.target.value)}
                      placeholder="5,000"
                      className="h-20 pl-14 text-3xl font-black italic bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-900 focus:bg-white focus:border-primary transition-all shadow-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['2000', '5000', '10000'].map(val => (
                      <button
                        key={val}
                        onClick={() => setBaseRate(val)}
                        className={cn(
                          "h-10 rounded-xl border-2 font-black italic text-xs transition-all",
                          baseRate === val ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-400"
                        )}
                      >
                        ₹{Number(val).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'videoSuccess' && (
            <OnboardingSlide key="videoSuccess" slideKey="videoSuccess">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 mx-auto">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                  <Check className="w-12 h-12 text-emerald-600" />
                </motion.div>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">🔥 Looks Great!</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm">Your Collab Page is live in the discovery feed.</p>

              <div className="w-[200px] aspect-[9/16] mx-auto rounded-3xl bg-slate-100 overflow-hidden relative shadow-2xl border-4 border-white mb-10">
                {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button
                  onClick={() => setStep('profile')}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Amazing, Next <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'profile' && (
            <OnboardingSlide key="profile" slideKey="profile">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                <PenTool className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Complete your profile</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm italic">Add links to boost your brand trust.</p>

              <div className="w-full space-y-6 text-left">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Reference Reel/Post Link</Label>
                  <Input
                    value={instagramLink}
                    onChange={e => setInstagramLink(e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                  <p className="text-[10px] text-slate-400 px-1">Share a link to your best performing content.</p>
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button
                  onClick={isProfileFinalStep ? handleFinish : () => setStep('payout')}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  {isProfileFinalStep ? (
                    <>
                      Finish Onboarding <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
                {!isProfileFinalStep && (
                  <button onClick={() => setStep('payout')} className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] py-2">
                    Skip for now
                  </button>
                )}
              </div>
            </OnboardingSlide>
          )}

          {step === 'payout' && (
            <OnboardingSlide key="payout" slideKey="payout">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Payment & Logistics</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm italic">So brands can pay you and ship products.</p>

              <div className="w-full space-y-6 text-left">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Your UPI ID (For Earnings)</Label>
                  <div className="relative">
                    <Input
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. name@okhdfcbank"
                      className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Contact Number (For Logistics)</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                  <p className="text-[10px] text-slate-400 px-1 font-medium leading-relaxed italic">Note: Avoid sharing personal numbers; providing an alternate number is recommended for brand communications.</p>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Delivery Address (For PR Packages)</Label>
                  <Textarea
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Building, Street, Area..."
                    className="min-h-[80px] p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none resize-none"
                  />
                  <p className="text-[10px] text-slate-400 px-1 font-medium leading-relaxed italic">If you have privacy concerns, feel free to provide an alternate delivery address for brand shipments.</p>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Pincode</Label>
                  <Input
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit Pincode"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Save & Continue <ArrowRight className="ml-2 w-5 h-5" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'notifications' && (
            <OnboardingSlide key="notifications" slideKey="notifications">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 mx-auto">
                <Bell className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4 italic">Never miss a deal</h1>
              <p className="text-slate-600 font-medium mb-12">Enable alerts to get notified instantly when a brand makes you an offer.</p>

              <div className="w-full mb-8 relative">
                <div className="absolute -top-4 -right-2 z-10">
                  <motion.div
                    initial={{ rotate: 12, scale: 0 }}
                    animate={{ rotate: -12, scale: 1 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white uppercase tracking-widest"
                  >
                    New Offer
                  </motion.div>
                </div>

                <div className="p-6 rounded-[32px] border-2 border-slate-100 bg-white shadow-xl shadow-slate-100 text-left relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                      <Zap className="w-8 h-8 text-primary fill-primary/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Mellow Prints 🚀</p>
                      <h3 className="font-black text-xl text-slate-900 italic tracking-tight truncate">Campaign Invitation</h3>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Potential Earnings</span>
                      <span className="text-2xl font-black text-slate-900 font-outfit">₹5,000.00</span>
                    </div>
                    <div className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-50 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[
                          { label: 'MP', className: 'bg-emerald-500 text-white' },
                          { label: 'SC', className: 'bg-sky-500 text-white' },
                          { label: 'BL', className: 'bg-violet-500 text-white' },
                        ].map((brand) => (
                          <div
                            key={brand.label}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[9px] font-black uppercase shadow-sm ${brand.className}`}
                          >
                            {brand.label}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Brand activity</p>
                        <p className="text-xs font-semibold text-slate-500">Mellow Prints, Skin Club, BlueLeaf</p>
                      </div>
                    </div>
                    <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-slate-400">+12 active</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-12 w-full space-y-4">
                <Button
                  onClick={async () => {
                    await enableNotifications();
                    handleFinish();
                  }}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-primary text-white font-black italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enable & Finish"}
                </Button>
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="w-full text-slate-400 font-bold text-sm py-2"
                >
                  Skip for now
                </button>
              </div>
            </OnboardingSlide>
          )}
        </AnimatePresence>
      </div>
    </OnboardingContainer>
  );
}
