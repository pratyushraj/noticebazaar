
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
  User,
  Star,
  Flame,
  Globe,
  TrendingUp,
  ArrowUpRight,
  Phone,
  Mail,
  LayoutDashboard
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
import { triggerHaptic } from '@/lib/utils/haptics';

type OnboardingStep = 'identity' | 'reach' | 'audience' | 'style' | 'collab' | 'videoSuccess' | 'payout' | 'verification' | 'notifications' | 'finalizing';

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

const STEP_ORDER: OnboardingStep[] = ['identity', 'reach', 'audience', 'style', 'collab', 'payout', 'verification', 'notifications'];
const getOnboardingDraftKey = (userId: string) => `creator-onboarding-draft-v1-${userId}`;

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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [upiId, setUpiId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [baseCity, setBaseCity] = useState('');
  const [audienceGenderSplit, setAudienceGenderSplit] = useState('');
  const [audienceAgeRange, setAudienceAgeRange] = useState<string[]>([]);
  const [legalAddress, setLegalAddress] = useState('');
  const [useShippingAsLegal, setUseShippingAsLegal] = useState(true);
  const [activeCityField, setActiveCityField] = useState<'baseCity' | 'topCity1' | 'topCity2' | 'topCity3' | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [avgReelViews, setAvgReelViews] = useState<string>('');
  const [brandsCount, setBrandsCount] = useState<string>('');
  const [dealPreference, setDealPreference] = useState<'paid_only' | 'barter_only' | 'open_to_both'>('open_to_both');


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
      payout: 5,
      verification: 6,
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
    // Follower count auto-fill disabled to enforce manual entry
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
    if (profile?.pincode && !pincode) {
      setPincode(profile.pincode);
    }
    if (profile?.registered_address && !legalAddress) {
      setLegalAddress(profile.registered_address);
      setUseShippingAsLegal(false);
    }
    if (profile?.phone_verified && !isPhoneVerified) {
      setIsPhoneVerified(true);
    }
    const existingPhoto = profile?.instagram_profile_photo || profile?.avatar_url;
    if (existingPhoto && !profilePhotoUrl) {
      // Only auto-fill if it's not a blocked external Instagram URL
      const isExternalIg = existingPhoto.includes('fbcdn.net') || existingPhoto.includes('instagram.com');
      if (!isExternalIg) {
        setProfilePhotoUrl(existingPhoto);
      }
    }
  }, [profile, instagramHandle, selectedNiches, contentVibes, baseRate, bio, upiId, shippingAddress, topCity1, topCity2, topCity3, phone, followerCount, pincode, legalAddress, isPhoneVerified, profilePhotoUrl]);

  useEffect(() => {
    if (typeof window === 'undefined' || !profile?.id) return;
    try {
      const draftKey = getOnboardingDraftKey(profile.id);
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (typeof draft.step === 'string' && ['identity', 'reach', 'audience', 'style', 'collab', 'videoSuccess', 'payout', 'logistics', 'notifications'].includes(draft.step)) {
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
  }, [profile?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !profile?.id) return;
    try {
      const draftKey = getOnboardingDraftKey(profile.id);
      window.localStorage.setItem(draftKey, JSON.stringify({
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

    upiId,
    shippingAddress,
    pincode,
    phone,
    baseCity,
    audienceGenderSplit,
    audienceAgeRange,
    profile?.id
  ]);

  // Helper to map count to range ID
  const getFollowerRangeId = (count: number): string => {
    if (count < 1000) return '<1k';
    if (count < 10000) return '1k-10k';
    if (count < 50000) return '10k-50k';
    return '50k+';
  };

  // Manual entry only - no automated sync
  useEffect(() => {
    // Disabled
  }, []);

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
    triggerHaptic?.();

    if (step === 'identity') return;
    if (step === 'videoSuccess') {
      setStep('collab');
      return;
    }
    if (step === 'profile') {
      setStep('videoSuccess');
      return;
    }
    if (step === 'verification') {
      setStep('payout');
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
    triggerHaptic?.();
    
    // Identity Check
    if (step === 'identity') {
      if (instagramHandle.length < 3) {
        toast.error('Please enter your Instagram username');
        return;
      }
      
      // Save and validate username availability
      try {
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          instagram_handle: instagramHandle.replace(/^@+/, '').trim().toLowerCase(),
          username: instagramHandle.replace(/^@+/, '').trim().toLowerCase(),
          instagram_profile_photo: profilePhotoUrl || null,
          avatar_url: profilePhotoUrl || null,
        } as any);
        
        // Transition only if successful
        setStep('reach');
      } catch (error: any) {
        if (error?.message?.includes('profiles_username_key')) {
          toast.error('This Instagram handle is already registered. Please use a different one or contact support.');
        } else {
          toast.error(error?.message || 'Failed to update profile');
        }
      }
      return;
    }

    if (step === 'reach') {
      if (!followerCount) {
        toast.error('Please enter your follower count');
        return;
      }
      setStep('audience');
      updateProfileMutation.mutate({
        id: profile!.id,
        instagram_followers: Number(followerCount) || 0,
        follower_count_range: getFollowerRangeId(Number(followerCount)),
        collab_region_label: baseCity || null,
        top_cities: [topCity1, topCity2, topCity3].map(c => c.trim()).filter(Boolean),
        performance_proof: {
          median_reel_views: Number(avgReelViews) || null,
          avg_likes: profile?.performance_proof?.avg_likes || null,
          captured_at: new Date().toISOString(),
        }
      } as any);
      return;
    }

    if (step === 'audience') {
      if (!audienceGenderSplit) {
        toast.error('Please select audience gender split');
        return;
      }
      if (audienceAgeRange.length === 0) {
        toast.error('Please select at least one age range');
        return;
      }
      setStep('style');
      updateProfileMutation.mutate({
        id: profile!.id,
        audience_gender_split: audienceGenderSplit,
        audience_age_range: audienceAgeRange.join(', '),
      } as any);
      return;
    }

    if (step === 'style') {
      if (selectedNiches.length === 0) {
        toast.error('Please select at least one niche');
        return;
      }
      setStep('collab');
      updateProfileMutation.mutate({
        id: profile!.id,
        content_niches: selectedNiches,
        content_vibes: contentVibes,
      } as any);
      return;
    }

    if (step === 'collab') {
      if (!videoUrl) {
        toast.error('Please upload your discovery reel');
        return;
      }
      if (!baseRate || isNaN(Number(baseRate))) {
        toast.error('Please set your collab rate');
        return;
      }

      if (!creatorTitle || creatorTitle.length < 3) {
        toast.error('Please enter your professional title');
        return;
      }
      
      setIsSubmitting(true);
      try {
        await updateProfileMutation.mutateAsync({
          id: profile!.id,
          avg_rate_reel: Number(baseRate),
          reel_price: Number(baseRate),
          bio: creatorTitle || null,
          discovery_video_url: videoUrl,
          collab_brands_count_override: Number(brandsCount) || null,
          collab_deal_preference: dealPreference,
          collab_past_work_items: videoUrl ? [{
            id: crypto.randomUUID(),
            sourceUrl: videoUrl,
            mediaType: 'video',
            title: 'Primary Reel',
            platform: 'internal'
          }] : [],
        } as any);
        setStep('videoSuccess');
      } catch (err: any) {
        toast.error('Failed to save video: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (step === 'payout') {
      if (!upiId) {
        toast.error('Please enter your UPI ID for payments');
        return;
      }
      setStep('verification');
      updateProfileMutation.mutate({
        id: profile!.id,
        payout_upi: upiId || null,
        bank_upi: upiId || null,
        upi_id: upiId || null,
        phone: phone || null,
        location: shippingAddress ? `${shippingAddress}${pincode ? ', ' + pincode : ''}` : null,
      } as any);
      return;
    }

    if (step === 'verification') {
      if (!isPhoneVerified) {
        toast.error('Please verify your identity with OTP');
        return;
      }
      setStep('notifications');
      return;
    }
  };

  const handleSendOtp = async () => {
    if (!user?.email) {
      toast.error('Email address not found');
      return;
    }
    triggerHaptic?.();
    setIsSendingOtp(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(`${apiBaseUrl}/api/otp/onboarding/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSent(true);
        toast.success('OTP sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    triggerHaptic?.();
    setIsVerifyingOtp(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(`${apiBaseUrl}/api/otp/onboarding/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: otpValue }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsPhoneVerified(true);
        toast.success('Identity verified successfully!');
        // Small delay then proceed
        setTimeout(() => {
          setStep('notifications');
        }, 1500);
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Please upload under 5MB');
      return;
    }

    setIsPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/avatars/${fileName}`;

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

      setProfilePhotoUrl(publicUrl);
      await refetchProfile();
      triggerHaptic?.();
      toast.success('Photo uploaded successfully!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsPhotoUploading(false);
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
      triggerHaptic?.();
      toast.success('Video uploaded successfully!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
      setVideoFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFinish = async () => {
    triggerHaptic?.();
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
        registered_address: useShippingAsLegal ? shippingAddress : (legalAddress || shippingAddress),
        phone_verified: isPhoneVerified,
        onboarding_complete: true,
        open_to_collabs: true,
      } as any);

      if (typeof window !== 'undefined' && profile?.id) {
        window.localStorage.removeItem(getOnboardingDraftKey(profile.id));
      }

      await refetchProfile?.();

      // Notify admin of completion
      try {
        const apiBaseUrl = getApiBaseUrl();
        const { data: sessionData } = await supabase.auth.getSession();
        await fetch(`${apiBaseUrl}/api/onboarding-emails/complete`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
            'Content-Type': 'application/json',
          }
        });
      } catch (err) {
        console.warn('Admin notification failed (non-fatal):', err);
      }

      toast.success('Onboarding complete!');
      navigate('/creator-link-ready', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNiche = (id: string) => {
    triggerHaptic?.();
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
    triggerHaptic?.();
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
      <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-2 shadow-2xl shadow-black/40">
        <div className="max-h-56 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={`${field}-${city}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                setUniqueCityValue(city, value, setter);
                setActiveCityField(null);
                triggerHaptic?.();
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold text-white transition-colors",
                normalizeCityValue(value) === city ? "bg-emerald-500 text-white" : "hover:bg-white/5"
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
    triggerHaptic?.();
    setAudienceAgeRange((prev) => (
      prev.includes(age)
        ? prev.filter((value) => value !== age)
        : [...prev, age]
    ));
  };

  const canGoBack = step !== 'identity' && !isSubmitting && !isUploading;
  const hasPayoutDetails = Boolean((upiId || profile?.payout_upi || '').trim());
  const hasLogisticsDetails = Boolean(
    (shippingAddress || profile?.shipping_address || profile?.location || '').trim() ||
    (pincode || profile?.pincode || '').trim()
  );


  if (sessionLoading || !profile) {
    return (
      <OnboardingContainer theme="dark">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="dark" allowScroll>
      {/* Premium Background Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col pt-6 pb-8 px-6 relative z-10">
        {/* Progress Indicator */}
        <div className="mb-8 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={handleBack}
            disabled={!canGoBack}
            className={cn(
              "h-12 w-12 rounded-2xl border border-white/10 bg-white/5 p-0 text-white transition-all flex items-center justify-center",
              canGoBack ? "shadow-sm hover:border-emerald-500/50 hover:text-emerald-400" : "pointer-events-none opacity-0"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1.5">
                {Array.from({ length: STEP_ORDER.length }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      i === currentStepIndex ? "w-10 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : (i < currentStepIndex ? "w-4 bg-emerald-500/40" : "w-4 bg-white/5")
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Step {currentStepIndex + 1} of {STEP_ORDER.length}</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <OnboardingSlide key="identity" slideKey="identity">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <LayoutDashboard className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-3 uppercase italic">Secure the bag</h1>
                <p className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 py-1.5 px-4 rounded-full inline-block tracking-[0.1em] uppercase border border-emerald-500/20">Top creators earned ₹50k+ this month</p>
              </div>

              <div className="w-full space-y-8 text-left">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="relative group">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => photoInputRef.current?.click()}
                      className={cn(
                        "w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer",
                        profilePhotoUrl 
                          ? "border-emerald-500 shadow-[0_10px_20px_rgba(16,185,129,0.2)]" 
                          : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50"
                      )}
                    >
                      {isPhotoUploading ? (
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      ) : profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="w-6 h-6 text-white/30" />
                          <span className="text-[8px] font-black uppercase text-white/30">Photo</span>
                        </div>
                      )}
                    </motion.div>
                    <div 
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-[#020D0A]"
                    >
                      <PenTool className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/30">Professional Photo</p>
                </div>

                {/* Instagram Field */}
                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex justify-between group-focus-within:text-emerald-400 transition-colors">
                    <span>Instagram Username</span>
                    <span className="text-emerald-500/60 lowercase tracking-normal font-medium">Verify account</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-white/20">@</div>
                    <Input
                      value={instagramHandle}
                      onChange={e => setInstagramHandle(e.target.value)}
                      placeholder="e.g. wowvidushi"
                      className="h-[68px] pl-12 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                  </div>
                </div>


              </div>

              <div className="relative mt-auto pt-10 pb-10 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-20 space-y-6">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 group border-none uppercase tracking-widest"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Find brand deals <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-white/20 font-black text-[9px] uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
                  No spam • Only brand collaborations
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 'reach' && (
            <OnboardingSlide key="reach" slideKey="reach">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Reach & Region</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Followers & Locations</p>
              </div>

              <div className="w-full space-y-8 text-left">
                {/* Follower Count */}
                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex justify-between group-focus-within:text-emerald-400">
                    <span>Follower Count</span>
                    <span className="text-emerald-500/60 lowercase tracking-normal font-medium">
                      Manual entry
                    </span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                    <Input
                      type="number"
                      value={followerCount}
                      onChange={e => {
                        setFollowerCount(e.target.value);
                        setFollowersAutoFilled(false);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="e.g. 15400"
                      className="h-[68px] pl-14 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                    {/* Removed sync loader as it is disabled */}
                  </div>
                </div>

                {/* Average Views */}
                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex justify-between group-focus-within:text-emerald-400">
                    <span>Avg Views / Reel</span>
                    <span className="text-emerald-500/60 lowercase tracking-normal font-medium">
                      Estimated reach
                    </span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <Play className="w-6 h-6" />
                    </div>
                    <Input
                      type="number"
                      value={avgReelViews}
                      onChange={e => setAvgReelViews(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="e.g. 25000"
                      className="h-[68px] pl-14 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                  </div>
                </div>

                {/* Base Location */}
                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex justify-between group-focus-within:text-emerald-400">
                    <span>Base City</span>
                    <span className="text-emerald-500/60 lowercase tracking-normal font-medium">For local events</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <MapPin className="w-6 h-6" />
                    </div>
                      <Input
                        value={baseCity}
                      onChange={e => setBaseCity(e.target.value)}
                      onFocus={() => setActiveCityField('baseCity')}
                      onBlur={e => {
                        setUniqueCityValue(e.target.value, baseCity, setBaseCity);
                        window.setTimeout(() => setActiveCityField((current) => current === 'baseCity' ? null : current), 200);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="e.g. Mumbai"
                      autoComplete="off"
                      className="h-[68px] pl-14 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                    {renderCitySuggestions('baseCity', baseCity, setBaseCity)}
                  </div>
                </div>

                {/* Top Cities */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Audience Top Cities</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative">
                      <Input
                        value={topCity1}
                        onChange={e => setTopCity1(e.target.value)}
                        onFocus={() => setActiveCityField('topCity1')}
                        onBlur={e => {
                          setUniqueCityValue(e.target.value, topCity1, setTopCity1);
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity1' ? null : current), 200);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        enterKeyHint="done"
                        placeholder="City 1"
                        autoComplete="off"
                        className="h-[60px] px-4 rounded-[20px] border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
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
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity2' ? null : current), 200);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        enterKeyHint="done"
                        placeholder="City 2"
                        autoComplete="off"
                        className="h-[60px] px-4 rounded-[20px] border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
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
                          window.setTimeout(() => setActiveCityField((current) => current === 'topCity3' ? null : current), 200);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        enterKeyHint="done"
                        placeholder="City 3"
                        autoComplete="off"
                        className="h-[60px] px-4 rounded-[20px] border-white/10 bg-white/5 text-[11px] font-black uppercase tracking-widest text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                      />
                      {renderCitySuggestions('topCity3', topCity3, setTopCity3)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-8 pt-10 pb-6 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-30">
                <Button
                  onClick={handleNext}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest"
                >
                  Continue <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'audience' && (
            <OnboardingSlide key="audience" slideKey="audience">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <Users className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Demographics</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Who follows you?</p>
              </div>

              <div className="w-full space-y-10 text-left">
                <div className="space-y-4">
                  <Label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Gender Split</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {AUDIENCE_GENDER_OPTIONS.map((option) => {
                      const isSelected = audienceGenderSplit === option.storedValue;
                      return (
                        <motion.button
                          key={option.id}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => { triggerHaptic?.(); setAudienceGenderSplit(option.storedValue); }}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-[24px] border h-32 transition-all duration-300",
                            isSelected
                              ? "bg-emerald-500 border-emerald-400 shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <div className={cn("mb-3", isSelected ? "text-white" : "text-white/20")}>
                            {option.icon === 'Users' ? <Users className="h-7 w-7" /> : <User className="h-7 w-7" />}
                          </div>
                          <div className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-white" : "text-white/40")}>
                            {option.label}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Primary Age Range</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {AGE_OPTIONS.map((age) => {
                      const isSelected = audienceAgeRange.includes(age);
                      return (
                        <motion.button
                          key={age}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => toggleAudienceAge(age)}
                          className={cn(
                            "relative flex h-20 items-center justify-center rounded-[24px] border transition-all duration-300",
                            isSelected
                              ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
                              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <span className="text-xl font-black italic">{age}</span>
                          {isSelected && (
                            <div className="absolute right-3 top-3 bg-white/20 rounded-full p-1">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-8 pt-10 pb-6 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-30">
                <Button
                  onClick={handleNext}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest"
                >
                  Save & Continue <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'style' && (
            <OnboardingSlide key="style" slideKey="style">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <Flame className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Brand DNA</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Niches & Vibes</p>
              </div>

              <div className="w-full space-y-10 text-left">
                {/* Niche Selection */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Main Niches (max 3)</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {NICHES.map(niche => (
                      <motion.button
                        key={niche.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleNiche(niche.label)}
                        className={cn(
                          "h-[72px] rounded-[22px] border transition-all text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center px-1 gap-1.5",
                          selectedNiches.includes(niche.label)
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                      >
                        <span className="text-2xl">{niche.icon}</span>
                        {niche.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Vibe Selection */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Visual Vibe (max 3)</Label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {VIBES.map(vibe => (
                      <motion.button
                        key={vibe.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleVibe(vibe.label)}
                        className={cn(
                          "h-[72px] rounded-[22px] border transition-all text-[9px] font-black uppercase tracking-widest flex flex-col items-center justify-center px-1 gap-1.5",
                          contentVibes.includes(vibe.label)
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_15px_30px_rgba(16,185,129,0.2)]"
                            : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                      >
                        <span className="text-2xl">{vibe.icon}</span>
                        {vibe.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 mt-8 pt-10 pb-6 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-30">
                <Button
                  onClick={handleNext}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest"
                >
                  Continue <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'collab' && (
            <OnboardingSlide key="collab" slideKey="collab">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <Star className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Collab Page</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Discovery video & Rates</p>
              </div>

              <div className="w-full space-y-10">

                {/* Video Upload Section */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 block text-left">Primary Discovery Reel</Label>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    accept="video/*"
                    className="hidden"
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      "w-full h-64 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-5 transition-all relative overflow-hidden",
                      isUploading 
                        ? "bg-white/5 border-emerald-500/20" 
                        : (videoUrl 
                            ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_15px_30px_rgba(16,185,129,0.1)]" 
                            : "bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-white/10")
                    )}
                  >
                    {isUploading ? (
                      <div className="space-y-4 text-center z-10">
                        <div className="relative w-12 h-12 mx-auto">
                          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        </div>
                        <p className="text-[10px] font-black italic text-emerald-400 uppercase tracking-[0.2em]">Uploading {uploadProgress}%</p>
                      </div>
                    ) : videoUrl ? (
                      <div className="relative w-full h-full group">
                        <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white text-emerald-600 rounded-full p-4 shadow-xl">
                            <Upload className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="absolute top-6 right-6 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Change Reel</div>
                        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">Video Ready</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-[22px] bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                          <Upload className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black italic text-white uppercase tracking-tight">Tap to upload reel</p>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-1.5">MP4 • Max 60sec • 50MB</p>
                        </div>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Pricing Section */}
                <div className="space-y-4 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 block text-left group-focus-within:text-emerald-400 transition-colors">Starting Rate (per Reel)</Label>
                  <div className="relative">
                    <div className="absolute left-7 top-1/2 -translate-y-1/2 text-3xl font-black italic text-emerald-500/40">₹</div>
                    <Input
                      type="number"
                      value={baseRate}
                      onChange={e => setBaseRate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="5,000"
                      className="h-[84px] pl-16 text-3xl font-black italic bg-white/5 border-white/10 rounded-[28px] text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all shadow-none outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['2000', '5000', '10000'].map(val => (
                      <motion.button
                        key={val}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { triggerHaptic?.(); setBaseRate(val); }}
                        className={cn(
                          "h-12 rounded-[18px] border font-black italic text-sm transition-all",
                          baseRate === val ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                      >
                        ₹{Number(val).toLocaleString()}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Brands Count */}
                <div className="space-y-4 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 block text-left group-focus-within:text-emerald-400 transition-colors">Total Brands Worked With</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <Input
                      type="number"
                      value={brandsCount}
                      onChange={e => setBrandsCount(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="e.g. 12"
                      className="h-[68px] pl-14 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                  </div>
                </div>

                {/* Deal Preference */}
                <div className="space-y-4 text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Deal Preference</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'paid_only', label: 'Paid Only' },
                      { id: 'barter_only', label: 'Barter Only' },
                      { id: 'open_to_both', label: 'Open to Both' }
                    ].map((pref) => (
                      <motion.button
                        key={pref.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { triggerHaptic?.(); setDealPreference(pref.id as any); }}
                        className={cn(
                          "h-14 rounded-[20px] border text-[10px] font-black uppercase tracking-widest transition-all",
                          dealPreference === pref.id 
                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" 
                            : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10"
                        )}
                      >
                        {pref.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Creator Title */}
                <div className="space-y-3 group text-left">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 flex justify-between items-center group-focus-within:text-emerald-400 transition-colors">
                    <span>Professional Title</span>
                    <button 
                      type="button"
                      onClick={() => {
                        triggerHaptic?.();
                        const bios = generateAIBios({
                          name: instagramHandle || 'Creator',
                          niches: selectedNiches,
                          vibes: contentVibes,
                          city: baseCity
                        });
                        const currentIndex = bios.indexOf(creatorTitle);
                        const nextIndex = (currentIndex + 1) % bios.length;
                        setCreatorTitle(bios[nextIndex]);
                        toast.success('AI Bio Generated ✨');
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-900/20 group/ai"
                    >
                      <Sparkles className="w-3.5 h-3.5 group-hover/ai:animate-pulse transition-transform group-hover/ai:scale-110" />
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Magic</span>
                    </button>
                  </Label>
                  <Input
                    value={creatorTitle}
                    onChange={e => setCreatorTitle(e.target.value)}
                    placeholder="e.g. Tech Enthusiast & Reviewer"
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    enterKeyHint="done"
                    className="h-[68px] px-6 rounded-[24px] border-white/10 bg-white/5 text-lg font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                  />
                </div>
              </div>

              <div className="relative mt-auto pt-10 pb-10 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-20">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting || isUploading}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="w-6 h-6" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'videoSuccess' && (
            <OnboardingSlide key="videoSuccess" slideKey="videoSuccess">
              <div className="text-center pt-8">
                <div className="w-24 h-24 rounded-[32px] bg-emerald-500/10 flex items-center justify-center mb-10 mx-auto border border-emerald-500/20">
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }} 
                    animate={{ scale: 1, rotate: 0 }} 
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </motion.div>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-3 uppercase italic">Looks Fire! 🔥</h1>
                <p className="text-white/40 font-bold mb-12 text-sm uppercase tracking-[0.2em]">Your Collab Page is ready</p>

                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-[220px] aspect-[9/16] mx-auto rounded-[36px] bg-white/5 overflow-hidden relative shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-4 border-white/5"
                >
                  {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 text-left">
                    <p className="text-white font-black italic text-lg uppercase tracking-tight">@{instagramHandle}</p>
                    <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">₹{Number(baseRate).toLocaleString()} / Reel</p>
                  </div>
                </motion.div>

                <div className="sticky bottom-0 mt-8 pt-10 pb-6 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-30">
                  <Button
                    onClick={() => { triggerHaptic?.(); setStep('payout'); }}
                    className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all"
                  >
                    Next <ArrowRight className="ml-3 w-6 h-6" />
                  </Button>
                </div>
              </div>
            </OnboardingSlide>
          )}



          {step === 'payout' && (
            <OnboardingSlide key="payout" slideKey="payout">
              <div className="text-center mb-10">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <CreditCard className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Settlements</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Payments & Logistics</p>
              </div>

              <div className="w-full space-y-8 text-left overflow-y-auto max-h-[50vh] pr-2 scrollbar-none">
                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 group-focus-within:text-emerald-400">UPI ID (For Earnings)</Label>
                  <Input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    enterKeyHint="done"
                    placeholder="e.g. name@okhdfcbank"
                    className="h-[68px] px-6 rounded-[24px] border-white/10 bg-white/5 font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 group-focus-within:text-emerald-400">Contact (For Logistics)</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20">
                      <Phone className="w-5 h-5" />
                    </div>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      enterKeyHint="done"
                      placeholder="e.g. +91 98765 43210"
                      className="h-[68px] pl-14 rounded-[24px] border-white/10 bg-white/5 font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 group-focus-within:text-emerald-400">Delivery Address</Label>
                  <Textarea
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    enterKeyHint="done"
                    placeholder="Building, Street, Area..."
                    className="min-h-[100px] p-6 rounded-[28px] border-white/10 bg-white/5 font-semibold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none resize-none outline-none"
                  />
                </div>

                <div className="space-y-3 group">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 group-focus-within:text-emerald-400">Pincode</Label>
                  <Input
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    enterKeyHint="done"
                    placeholder="6-digit Pincode"
                    className="h-[68px] px-6 rounded-[24px] border-white/10 bg-white/5 font-bold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none outline-none"
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <button 
                    type="button"
                    onClick={() => {
                      triggerHaptic?.();
                      setUseShippingAsLegal(!useShippingAsLegal);
                    }}
                    className="flex items-center gap-3 group/check"
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      useShippingAsLegal 
                        ? "bg-emerald-500 border-emerald-400 shadow-[0_5px_15px_rgba(16,185,129,0.3)]" 
                        : "bg-white/5 border-white/10 group-hover/check:border-white/20"
                    )}>
                      {useShippingAsLegal && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/check:text-white/60 transition-colors">
                      Use shipping address for legal contracts
                    </span>
                  </button>

                  <AnimatePresence>
                    {!useShippingAsLegal && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 group pt-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 group-focus-within:text-emerald-400">Registered/Legal Address</Label>
                          <Textarea
                            value={legalAddress}
                            onChange={e => setLegalAddress(e.target.value)}
                            enterKeyHint="done"
                            placeholder="Your permanent home/office address..."
                            className="min-h-[100px] p-6 rounded-[28px] border-white/10 bg-white/5 font-semibold text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all shadow-none resize-none outline-none"
                          />
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-1">
                            Only visible in the deal contract PDF
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="sticky bottom-0 mt-8 pt-10 pb-6 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-30">
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full h-[72px] rounded-[26px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>Save & Continue <ArrowRight className="w-6 h-6" /></>
                  )}
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'verification' && (
            <OnboardingSlide key="verification" slideKey="verification">
              <div className="text-center mb-10">
                <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-emerald-500/20"
                >
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase italic">Verification</h1>
                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">Identity & Legal Address</p>
              </div>

              <div className="w-full space-y-8 text-left">
                {/* Legal Info Summary */}
                <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Verified Email</p>
                      <p className="text-lg font-black text-white italic truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Registered Address</p>
                      <p className="text-xs font-bold text-white/60 leading-relaxed mt-1">
                        {useShippingAsLegal ? shippingAddress : legalAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {!isPhoneVerified ? (
                  <div className="space-y-6">
                    {!otpSent ? (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-center px-4 leading-relaxed">
                          We'll send a 6-digit OTP to your email to verify your identity for legal contracts.
                        </p>
                        <Button
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="w-full h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest shadow-[0_15px_30px_rgba(16,185,129,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
                        >
                          {isSendingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send OTP via Email <ArrowRight className="w-4 h-4" /></>}
                        </Button>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Enter 6-Digit OTP</Label>
                          <div className="relative">
                            <Input
                              value={otpValue}
                              onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="0 0 0 0 0 0"
                              className="h-[72px] text-center text-3xl font-black tracking-[0.5em] bg-white/5 border-white/10 rounded-[26px] text-white focus:border-emerald-500/50 focus:bg-white/10 transition-all outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Button
                            onClick={handleVerifyOtp}
                            disabled={isVerifyingOtp || otpValue.length !== 6}
                            className="w-full h-16 rounded-[24px] bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            {isVerifyingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
                          </Button>
                          <button 
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors py-2"
                          >
                            Resend Code
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                      <Check className="w-8 h-8" strokeWidth={4} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic text-white uppercase">Identity Verified</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mt-1">Legally binding profile ready</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="relative mt-auto pt-10 pb-10 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-20">
                <Button
                  onClick={handleNext}
                  disabled={!isPhoneVerified}
                  className={cn(
                    "w-full h-[72px] rounded-[26px] font-black italic text-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-none uppercase tracking-widest",
                    isPhoneVerified 
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_20px_40px_rgba(16,185,129,0.2)]" 
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  Continue <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'notifications' && (
            <OnboardingSlide key="notifications" slideKey="notifications">
              <div className="text-center pt-8">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-[28px] bg-emerald-500/10 flex items-center justify-center mb-10 mx-auto border border-emerald-500/20"
                >
                  <Bell className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h1 className="text-4xl font-black tracking-tight text-white mb-4 uppercase italic">Stay Alert 🚀</h1>
                <p className="text-white/40 font-bold mb-12 text-sm uppercase tracking-[0.2em] leading-relaxed px-4">Enable notifications to secure brand deals the second they drop.</p>

                <div className="w-full mb-12 relative px-2">
                  <div className="absolute -top-6 -right-2 z-20">
                    <motion.div
                      initial={{ rotate: 15, scale: 0 }}
                      animate={{ rotate: -10, scale: 1 }}
                      transition={{ type: 'spring', delay: 0.5 }}
                      className="bg-emerald-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl border-2 border-[#020D0A] uppercase tracking-widest"
                    >
                      New Offer
                    </motion.div>
                  </div>

                  <div className="p-8 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-left relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />

                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-20 h-20 rounded-[24px] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                        <Zap className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-1.5">Nike India 🇮🇳</p>
                        <h3 className="font-black text-2xl text-white italic tracking-tight truncate">Winter Launch</h3>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Earnings Potential</span>
                        <span className="text-3xl font-black text-white italic font-outfit">₹15,000</span>
                      </div>
                      <div className="h-12 w-12 rounded-[18px] bg-white/10 flex items-center justify-center border border-white/10">
                        <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-auto pt-8 pb-10 w-[calc(100%+3rem)] -mx-6 px-6 bg-gradient-to-t from-[#020D0A] via-[#020D0A] to-transparent z-20 space-y-6">
                  <Button
                    onClick={async () => {
                      triggerHaptic?.();
                      await enableNotifications();
                      handleFinish();
                    }}
                    disabled={isSubmitting}
                    className="w-full h-[76px] rounded-[28px] bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-xl shadow-[0_25px_50px_rgba(16,185,129,0.3)] active:scale-95 transition-all border-none uppercase tracking-widest"
                  >
                    {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : "Enable & Finish"}
                  </Button>
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="w-full text-white/20 font-black uppercase tracking-[0.3em] text-[10px] py-2 hover:text-emerald-400 transition-colors"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </OnboardingSlide>
          )}
        </AnimatePresence>
      </div>
    </OnboardingContainer>
  );
}
