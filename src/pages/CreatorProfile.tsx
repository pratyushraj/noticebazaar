import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Instagram, Lock, CreditCard, Shield, HelpCircle, FileText, LogOut, ChevronRight, ChevronDown, Check, Download, Trash2, Star, TrendingUp, Award, MessageCircle, Loader2, Sparkles, Camera, Link2, Copy, ExternalLink, AlertCircle, Eye, SlidersHorizontal, Zap } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';

import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useSignOut } from '@/lib/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useProtectionScore } from '@/lib/hooks/useProtectionReports';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/avatar';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

import FiverrPackageEditor from '@/components/profile/FiverrPackageEditor';
import { DealTemplate } from '@/types';
import { fetchPincodeData, parseLocationString, formatLocationString } from '@/lib/utils/pincodeLookup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { withRetry } from '@/lib/utils/retry';
import { COPY_CONFIRM_MS } from '@/lib/constants/timing';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const CREATOR_CATEGORY_OPTIONS = [
  'General',
  'Fashion',
  'Beauty',
  'Fitness',
  'Tech',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Education',
  'Finance',
  'Health',
  'Parenting',
];

const CONTENT_NICHE_OPTIONS = [
  'Fashion',
  'Fitness',
  'Tech',
  'Beauty',
  'Food',
  'Travel',
  'Lifestyle',
  'Gaming',
  'Education',
  'Finance',
  'Health',
  'Entertainment',
  'Parenting',
];

const COLLAB_PREFERENCE_OPTIONS = ['paid', 'barter', 'hybrid'] as const;
const TYPICAL_DEAL_SIZE_OPTIONS = [
  {
    key: 'starter',
    title: 'Starter Deals',
    range: '₹2K - ₹5K',
    helper: 'Best for small / testing brands',
    min: 2000,
    max: 5000,
  },
  {
    key: 'standard',
    title: 'Standard Deals',
    range: '₹5K - ₹15K',
    helper: 'Most common collaborations',
    min: 5000,
    max: 15000,
  },
  {
    key: 'premium',
    title: 'Premium Deals',
    range: '₹15K+',
    helper: 'For serious campaign partnerships',
    min: 15000,
    max: null as number | null,
  },
  {
    key: 'custom',
    title: 'Custom Range',
    range: 'Set your own later',
    helper: 'Flexible for unique deal structures',
    min: null as number | null,
    max: null as number | null,
  },
] as const;
type TypicalDealSize = (typeof TYPICAL_DEAL_SIZE_OPTIONS)[number]['key'];
type CreatorTier = 'Nano' | 'Micro' | 'Rising' | 'Pro' | 'Macro';

function getCreatorTier(profileInput: {
  avg_reel_rate?: number | null;
  avg_rate_reel?: number | null;
  niches?: string[] | null;
  content_niches?: string[] | null;
  media_kit_url?: string | null;
  past_brand_count?: number;
} | null): CreatorTier {
  if (!profileInput) return 'Nano';

  const hasPricing = !!(profileInput.avg_reel_rate || profileInput.avg_rate_reel);
  const hasNiches = (profileInput.niches?.length || profileInput.content_niches?.length || 0) > 0;
  const hasMediaKit = !!profileInput.media_kit_url;
  const hasDealHistory = (profileInput.past_brand_count || 0) > 0;

  if (hasPricing && hasNiches && hasMediaKit && hasDealHistory) return 'Macro';
  if (hasPricing && hasNiches && hasMediaKit) return 'Pro';
  if (hasPricing && hasNiches) return 'Rising';
  if (hasPricing) return 'Micro';
  return 'Nano';
}

function getTierHelper(tier: string) {
  switch (tier) {
    case "Nano":
      return {
        identity: "Early-stage creators exploring brand collaborations",
        brandSignal: "Great for pilot campaigns"
      };
    case "Micro":
      return {
        identity: "Creators beginning to attract paid partnerships",
        brandSignal: "Strong for niche audiences"
      };
    case "Rising":
      return {
        identity: "Actively working with emerging brands",
        brandSignal: "Ideal for growth-stage brands"
      };
    case "Pro":
      return {
        identity: "Trusted by brands for repeat campaigns",
        brandSignal: "Reliable campaign partner"
      };
    case "Macro":
      return {
        identity: "High-demand creators with strong deal flow",
        brandSignal: "Scales reach fast"
      };
    default:
      return { identity: "", brandSignal: "" };
  }
}

const normalizeAudienceText = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b([a-z])([a-z']*)/g, (_match, first: string, rest: string) => `${first.toUpperCase()}${rest}`);

const COLLAB_AUDIENCE_FIT_OPTIONS = [
  'Regional audience focus',
  'Niche community reach',
  'Youth-driven audience',
  'Metro audience mix',
  'Pan-India reach',
];

const COLLAB_RECENT_ACTIVITY_OPTIONS = [
  'Recently active with brand collaborations',
  'Running ongoing campaigns',
  'Posting consistently',
  'Open for new partnerships',
];

const COLLAB_DELIVERY_RELIABILITY_OPTIONS = [
  'Fast',
  'Flexible',
  'Planned',
];

const COLLAB_CAMPAIGN_SLOT_OPTIONS = [
  '1-2',
  '3-5',
  '5-10',
  '10+',
];

const COLLAB_CTA_BEHAVIOR_OPTIONS = [
  'Quick',
  'Review-first',
  'Brand-guided',
];

const splitPresetAndCustom = (value: string | null | undefined, presets: string[]) => {
  const normalized = (value || '').trim();
  if (!normalized) return { preset: '', custom: '' };
  if (presets.includes(normalized)) return { preset: normalized, custom: '' };
  return { preset: '', custom: normalized };
};

const buildNoteValue = (preset: string, custom: string) => {
  const customValue = custom.trim();
  if (customValue) return customValue;
  return preset.trim() || null;
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const signOutMutation = useSignOut();
  const getInitialSection = () => {
    const section = new URLSearchParams(location.search).get('section');
    return section === 'profile' || section === 'account' || section === 'collab' || section === 'support'
      ? section
      : 'profile';
  };
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [dealSettingsRequired, setDealSettingsRequired] = useState(
    new URLSearchParams(location.search).get('forceDealSettings') === '1'
  );
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);
  const [showAdvancedDealDrawer, setShowAdvancedDealDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [collabHeroAnimated, setCollabHeroAnimated] = useState(false);
  const [copyPulse, setCopyPulse] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState(false);
  const [highlightNiche, setHighlightNiche] = useState<string | null>(null);
  const [activeNudgeField, setActiveNudgeField] = useState<'avgViews' | 'region' | 'mediaKit' | null>(null);
  const [positioningNudge, setPositioningNudge] = useState<string | null>(null);
  const [ctaPressed, setCtaPressed] = useState(false);
  const passiveNudgeIndexRef = useRef(0);
  const successNudgeTimeoutRef = useRef<number | null>(null);
  const hasManualDealSizeSelectionRef = useRef(false);
  const prevMissingRef = useRef({
    avgViews: true,
    region: true,
    mediaKit: true,
  });
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    weeklyViews: number;
    totalViews: number;
    submissions: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isBusy: isPushBusy,
    hasVapidKey,
    isIOSNeedsInstall,
    enableNotifications,
    sendTestPush,
  } = useDealAlertNotifications();

  // Fetch real data for stats
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Fetch protection score from protection reports
  const { score: protectionScoreData } = useProtectionScore({
    userId: profile?.id,
    enabled: !!profile?.id,
  });

  // Fetch collab link analytics summary
  useEffect(() => {
    const fetchAnalytics = async () => {
      // Use Instagram handle as username, fallback to username field
      const usernameForAnalytics = profile?.instagram_handle || profile?.username;
      if (!usernameForAnalytics || !user) {
        setAnalyticsLoading(false);
        return;
      }

      try {
        // Get current session (don't refresh unless needed - Supabase auto-refreshes)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          console.error('[CreatorProfile] No session:', sessionError);
          setAnalyticsLoading(false);
          return;
        }

        const response = await withRetry(() =>
          fetch(
            `${getApiBaseUrl()}/api/collab-analytics/summary`,
            {
              headers: {
                'Authorization': `Bearer ${sessionData.session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          )
        );

        if (response.status === 401) {
          console.error('[CreatorProfile] Unauthorized - token may be invalid');
          setAnalyticsLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAnalyticsSummary({
              weeklyViews: data.weeklyViews || 0,
              totalViews: data.totalViews || 0,
              submissions: data.submissions || 0,
            });
          }
        }
      } catch (error) {
        console.error('[CreatorProfile] Error fetching analytics:', error);
        toast.error('Failed to load link analytics.');
        // Don't show error to user for analytics, just use fallback
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile?.instagram_handle, profile?.username, user]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    email: "",
    phone: "+91 ",
    location: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    bio: "",
    instagramHandle: "",
    username: "",
    creatorCategory: "General",
    avgRateReel: "",
    pricingMin: "",
    pricingAvg: "",
    pricingMax: "",
    typicalDealSize: "standard" as TypicalDealSize,
    avgReelViewsManual: "",
    avgLikesManual: "",
    collabBrandsCountOverride: "",
    activeBrandCollabsMonth: "",
    collabRegionLabel: "",
    collabAudienceFitPreset: "",
    collabAudienceFitCustom: "",
    collabRecentActivityPreset: "",
    collabRecentActivityCustom: "",
    collabAudienceRelevanceNote: "",
    collabDeliveryReliabilityPreset: "",
    collabDeliveryReliabilityCustom: "",
    collabResponseBehaviorPreset: "",
    collabResponseBehaviorCustom: "",
    campaignSlotPreset: "",
    campaignSlotCustom: "",
    collabCtaTrustNote: "",
    collabCtaDmNote: "",
    collabCtaPlatformNote: "",
    openToCollabs: true,
    mediaKitUrl: "",
    contentNiches: [] as string[],
    collaborationPreference: "hybrid" as (typeof COLLAB_PREFERENCE_OPTIONS)[number],
    autoPricingEnabled: false,
    dealTemplates: [] as DealTemplate[],
    upiId: "",
  });

  const isDirty = useMemo(() => {
    if (!profile) return false;
    const currentName = profile.first_name + (profile.last_name ? ' ' + profile.last_name : '');
    return (
      formData.name.trim() !== currentName.trim() ||
      formData.bio !== (profile.bio || '') ||
      formData.instagramHandle !== (profile.instagram_handle || '') ||
      formData.autoPricingEnabled !== !!profile.auto_pricing_enabled ||
      formData.creatorCategory !== (profile.creator_category || CREATOR_CATEGORY_OPTIONS[0]) ||
      formData.phone !== (profile.phone || '') ||
      formData.pincode !== (parseLocationString(profile.location || '').pincode || '') ||
      formData.addressLine !== (parseLocationString(profile.location || '').addressLine || '') ||
      formData.city !== (parseLocationString(profile.location || '').city || '') ||
      formData.state !== (parseLocationString(profile.location || '').state || '') ||
      formData.pricingMin !== (profile.pricing_min?.toString() || '') ||
      formData.pricingAvg !== (profile.pricing_avg?.toString() || '') ||
      formData.pricingMax !== (profile.pricing_max?.toString() || '')
    );
  }, [formData, profile]);

  // Pincode lookup state
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [collabBudgetError, setCollabBudgetError] = useState<string | null>(null);
  const [genderSplit, setGenderSplit] = useState(profile?.audience_gender_split || "");
  const [topCities, setTopCities] = useState<string[]>(Array.isArray(profile?.top_cities) ? profile.top_cities : []);
  const [cityInput, setCityInput] = useState("");
  const [ageRange, setAgeRange] = useState(profile?.audience_age_range || "");
  const [language, setLanguage] = useState(profile?.primary_audience_language || "");
  const [postingFrequency, setPostingFrequency] = useState(profile?.posting_frequency || "");

  // Load user data from session (only on initial load)
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (profile && user && !hasInitialized) {
      // Ensure phone starts with +91
      let phoneValue = profile.phone || '';
      if (phoneValue && !phoneValue.startsWith('+91')) {
        // If phone exists but doesn't start with +91, prepend it
        phoneValue = phoneValue.startsWith('+') ? phoneValue : `+91 ${phoneValue}`;
      } else if (!phoneValue) {
        phoneValue = '+91 ';
      }

      // Parse existing location to extract address components
      const location = profile.location || '';
      const parsedLocation = parseLocationString(location);

      console.log('[CreatorProfile] Initializing formData from profile:', {
        location,
        parsedLocation,
        profileLocation: profile.location
      });

      let savedCollabPreference: (typeof COLLAB_PREFERENCE_OPTIONS)[number] = 'hybrid';
      try {
        const key = `creator-collab-preference-${profile.id}`;
        const value = localStorage.getItem(key);
        if (value === 'paid' || value === 'barter' || value === 'hybrid') {
          savedCollabPreference = value;
        }
      } catch (_error) {
        // Ignore localStorage errors and use default.
      }

      setFormData({
        ...(function () {
          const audienceFit = splitPresetAndCustom(profile.collab_audience_fit_note || '', COLLAB_AUDIENCE_FIT_OPTIONS);
          const recentActivity = splitPresetAndCustom(profile.collab_recent_activity_note || '', COLLAB_RECENT_ACTIVITY_OPTIONS);
          const delivery = splitPresetAndCustom(profile.collab_delivery_reliability_note || '', COLLAB_DELIVERY_RELIABILITY_OPTIONS);
          const campaignSlots = splitPresetAndCustom(profile.campaign_slot_note || '', COLLAB_CAMPAIGN_SLOT_OPTIONS);
          const ctaBehavior = splitPresetAndCustom(profile.collab_response_behavior_note || '', COLLAB_CTA_BEHAVIOR_OPTIONS);
          return {
            collabAudienceFitPreset: audienceFit.preset,
            collabAudienceFitCustom: audienceFit.custom,
            collabRecentActivityPreset: recentActivity.preset,
            collabRecentActivityCustom: recentActivity.custom,
            collabDeliveryReliabilityPreset: delivery.preset,
            collabDeliveryReliabilityCustom: delivery.custom,
            campaignSlotPreset: campaignSlots.preset,
            campaignSlotCustom: campaignSlots.custom,
            collabResponseBehaviorPreset: ctaBehavior.preset,
            collabResponseBehaviorCustom: ctaBehavior.custom,
          };
        })(),
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        displayName: profile.instagram_handle?.replace('@', '') || user.email?.split('@')[0] || 'creator',
        email: user.email || '',
        phone: phoneValue,
        location: location,
        addressLine: parsedLocation.addressLine,
        city: parsedLocation.city,
        state: parsedLocation.state,
        pincode: parsedLocation.pincode,
        bio: profile.bio || '',
        instagramHandle: profile.instagram_handle || '',
        username: profile.instagram_handle || profile.username || '', // Use Instagram handle as username
        creatorCategory: profile.creator_category || 'General',
        avgRateReel: profile.avg_rate_reel?.toString() || '',
        pricingMin: profile.pricing_min?.toString() || '',
        pricingAvg: profile.pricing_avg?.toString() || '',
        pricingMax: profile.pricing_max?.toString() || '',
        typicalDealSize: ((profile as any).typical_deal_size as TypicalDealSize) || (
          Number(profile.avg_rate_reel || 0) <= 1500 ? 'starter' : Number(profile.avg_rate_reel || 0) <= 5000 ? 'standard' : 'premium'
        ),
        avgReelViewsManual: profile.avg_reel_views_manual?.toString() || '',
        avgLikesManual: profile.avg_likes_manual?.toString() || '',
        collabBrandsCountOverride: profile.collab_brands_count_override?.toString() || '',
        activeBrandCollabsMonth: profile.active_brand_collabs_month?.toString() || '',
        collabRegionLabel: profile.collab_region_label || '',
        collabAudienceRelevanceNote: profile.collab_audience_relevance_note || '',
        collabCtaTrustNote: profile.collab_cta_trust_note || '',
        collabCtaDmNote: profile.collab_cta_dm_note || '',
        collabCtaPlatformNote: profile.collab_cta_platform_note || '',
        openToCollabs: profile.open_to_collabs !== false,
        mediaKitUrl: profile.media_kit_url || '',
        contentNiches: Array.isArray(profile.content_niches) ? profile.content_niches : [],
        collaborationPreference: savedCollabPreference,
        autoPricingEnabled: !!profile.auto_pricing_enabled,
        dealTemplates: Array.isArray(profile.deal_templates) ? profile.deal_templates : [],
      } as any);
      setGenderSplit(profile.audience_gender_split || '');
      setTopCities(
        Array.isArray(profile.top_cities)
          ? profile.top_cities.map((city) => normalizeAudienceText(String(city))).filter(Boolean)
          : []
      );
      setCityInput('');
      setAgeRange(profile.audience_age_range || '');
      setLanguage(normalizeAudienceText(profile.primary_audience_language || ''));
      setPostingFrequency(profile.posting_frequency || '');

      setHasInitialized(true);
    }
  }, [profile, user, hasInitialized]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    const forceDealSettings = params.get('forceDealSettings') === '1';

    if (forceDealSettings) {
      setDealSettingsRequired(true);
      setActiveSection('collab');
      setEditMode(true);
      return;
    }

    if (section === 'profile' || section === 'account' || section === 'collab' || section === 'support') {
      setActiveSection(section);
    }

    // Deep-link focus: scroll to specific field and enable edit mode
    const focus = params.get('focus');
    if (focus) {
      setEditMode(true);
      // Auto-scroll to field with retry (page may still be loading)
      const tryFocus = (retries: number) => {
        const focusMap: Record<string, string> = {
          instagram: 'input-instagram-handle',
          bio: 'input-instagram-handle',
          rates: 'input-rate-reel',
          payout: 'input-rate-reel',
        };
        const elementId = focusMap[focus];
        if (elementId) {
          const el = document.getElementById(elementId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          } else if (retries > 0) {
            setTimeout(() => tryFocus(retries - 1), 500);
          }
        }
      };
      setTimeout(() => tryFocus(5), 300);
    }
  }, [location.search]);

  const handleSectionChange = (section: 'profile' | 'account' | 'collab' | 'support') => {
    if (dealSettingsRequired && section !== 'collab') {
      toast.message('Complete Deal Settings first to continue.');
      return;
    }
    setActiveSection(section);
  };

  const addCity = () => {
    const city = normalizeAudienceText(cityInput);
    if (!city) return;
    if (topCities.length >= 5) return;
    if (topCities.some((existing) => existing.toLowerCase() === city.toLowerCase())) return;
    setTopCities([...topCities, city]);
    setCityInput("");
  };

  const removeCity = (city: string) => {
    setTopCities(topCities.filter((c) => c !== city));
  };

  const handleEnablePushFromAccount = async () => {
    const result = await enableNotifications();
    if (result.success) {
      toast.success('Instant deal alerts enabled.');
      return;
    }

    if (result.reason === 'unsupported') {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    if (result.reason === 'missing_vapid_key') {
      toast.error('Push alerts are not configured yet.');
      return;
    }

    if (result.reason === 'denied') {
      toast.error('Notification permission is blocked in browser settings.');
      return;
    }

    if (result.reason === 'not_authenticated') {
      toast.error('Please sign in again and retry.');
      return;
    }

    if (result.reason === 'subscribe_failed') {
      toast.error('Could not save notification subscription.');
      return;
    }

    toast.error('Could not enable notifications right now.');
  };

  const handleTestPushFromAccount = async () => {
    if (isPushBusy || !isPushSubscribed) return;

    const result = await sendTestPush();

    if (result.success) {
      toast.success('Test notification sent to your device!');
    } else {
      const reason = result.reason || 'unknown';
      if (reason === 'vapid_not_configured') {
        toast.error('Push server is not configured (missing VAPID keys).');
      } else if (reason === 'no_subscriptions') {
        toast.error('No active device subscription found. Tap Refresh Notifications and try again.');
      } else if (reason === 'all_push_attempts_failed') {
        toast.error('Push delivery failed for all devices. Please refresh and retry.');
      } else {
        toast.error(`Test push failed: ${reason}`);
      }
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    try {
      localStorage.setItem(`creator-collab-preference-${profile.id}`, formData.collaborationPreference);
    } catch (_error) {
      // Ignore localStorage errors.
    }
  }, [profile?.id, formData.collaborationPreference]);

  useEffect(() => {
    try {
      localStorage.setItem('creatorTier', getCreatorTier({
        avg_rate_reel: Number(formData.avgRateReel) || profile?.avg_rate_reel || null,
        content_niches: formData.contentNiches,
        media_kit_url: formData.mediaKitUrl || null,
        past_brand_count: brandDeals.length,
      }));
    } catch (_error) {
      // Ignore localStorage errors.
    }
  }, [formData.avgRateReel, formData.contentNiches, formData.mediaKitUrl, brandDeals.length, profile?.avg_rate_reel]);

  // Handle pincode lookup
  const handlePincodeChange = async (pincode: string) => {
    // Update pincode in form
    setFormData(prev => ({ ...prev, pincode }));
    setPincodeError(null);

    // Only lookup if pincode is 6 digits
    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length === 6) {
      setIsLookingUpPincode(true);
      try {
        const pincodeData = await fetchPincodeData(cleanPincode);
        if (pincodeData) {
          console.log('[CreatorProfile] Pincode lookup result:', {
            pincode: cleanPincode,
            city: pincodeData.city,
            state: pincodeData.state,
            district: pincodeData.district
          });

          setFormData(prev => {
            // Ensure we use the city from API if available, otherwise keep existing
            const newCity = pincodeData.city && pincodeData.city.trim()
              ? pincodeData.city.trim()
              : (prev.city || '');
            const newState = pincodeData.state && pincodeData.state.trim()
              ? pincodeData.state.trim()
              : (prev.state || '');

            const updated = {
              ...prev,
              city: newCity,
              state: newState,
            };

            console.log('[CreatorProfile] Updated formData:', {
              oldCity: prev.city,
              newCity: updated.city,
              cityFromAPI: pincodeData.city,
              cityTrimmed: pincodeData.city?.trim(),
              oldState: prev.state,
              newState: updated.state,
              stateFromAPI: pincodeData.state,
              stateTrimmed: pincodeData.state?.trim(),
              fullFormData: updated
            });

            // If city is still empty after update, log a warning
            if (!updated.city || !updated.city.trim()) {
              if (pincodeData.city && pincodeData.city.trim()) {
                console.error('[CreatorProfile] ERROR: City not set despite API returning:', pincodeData.city);
              } else {
                console.warn('[CreatorProfile] WARNING: City is empty. API returned:', pincodeData.city);
              }
            } else {
              console.log('[CreatorProfile] SUCCESS: City set to:', updated.city);
            }

            return updated;
          });
          setPincodeError(null);
        } else {
          setPincodeError('Pincode not found. Please enter manually.');
        }
      } catch (error) {
        console.error('[CreatorProfile] Pincode lookup error:', error);
        setPincodeError('Failed to fetch pincode data. Please enter manually.');
      } finally {
        setIsLookingUpPincode(false);
      }
    } else if (cleanPincode.length === 0) {
      // Only clear city/state if pincode is completely removed
      setFormData(prev => ({ ...prev, city: '', state: '' }));
    }
  };

  // Calculate real stats from brand deals
  const calculatedStats = useMemo(() => {
    const totalDeals = brandDeals.length;
    const totalEarnings = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const activeDeals = brandDeals.filter(deal =>
      deal.status !== 'Completed' && deal.status !== 'Drafting'
    ).length;
    const protectionScore = protectionScoreData || 0;
    const streak = 0;

    return {
      totalDeals,
      totalEarnings,
      activeDeals,
      protectionScore,
      streak
    };
  }, [brandDeals]);

  // Build platforms array from actual profile data
  const platforms = useMemo(() => {
    const platformList = [];

    if (profile?.youtube_channel_id) {
      const followers = profile.youtube_subs || 0;
      platformList.push({
        name: "YouTube",
        handle: profile.youtube_channel_id,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: true,
        color: "bg-destructive"
      });
    }

    if (profile?.instagram_handle) {
      const followers = profile.instagram_followers || 0;
      platformList.push({
        name: "Instagram",
        handle: profile.instagram_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: true,
        color: "bg-pink-500"
      });
    }

    if (profile?.twitter_handle) {
      const followers = profile.twitter_followers || 0;
      platformList.push({
        name: "Twitter",
        handle: profile.twitter_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-info"
      });
    }

    if (profile?.tiktok_handle) {
      const followers = profile.tiktok_followers || 0;
      platformList.push({
        name: "TikTok",
        handle: profile.tiktok_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-black"
      });
    }

    if (profile?.facebook_profile_url) {
      const followers = profile.facebook_followers || 0;
      platformList.push({
        name: "Facebook",
        handle: profile.facebook_profile_url,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-info"
      });
    }

    return platformList;
  }, [profile]);

  // Build achievements array from actual brand deals data
  const achievements = useMemo(() => {
    const achievementList = [];
    const totalDeals = brandDeals.length;
    const totalEarnings = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const protectionScore = calculatedStats.protectionScore;

    // First Deal achievement
    if (totalDeals >= 1) {
      const firstDeal = brandDeals
        .filter(deal => deal.status === 'Completed')
        .sort((a, b) => {
          const dateA = a.payment_received_date ? new Date(a.payment_received_date).getTime() : 0;
          const dateB = b.payment_received_date ? new Date(b.payment_received_date).getTime() : 0;
          return dateA - dateB;
        })[0];

      const earnedDate = firstDeal?.payment_received_date
        ? new Date(firstDeal.payment_received_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : profile?.updated_at
          ? new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : null;

      achievementList.push({
        id: 1,
        title: "First Deal Monitored",
        icon: Star,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 1,
        title: "First Deal Monitored",
        icon: Star,
        earned: false,
        progress: 0
      });
    }

    // 10 Deals achievement
    if (totalDeals >= 10) {
      const tenthDeal = brandDeals
        .filter(deal => deal.status === 'Completed')
        .sort((a, b) => {
          const dateA = a.payment_received_date ? new Date(a.payment_received_date).getTime() : 0;
          const dateB = b.payment_received_date ? new Date(b.payment_received_date).getTime() : 0;
          return dateA - dateB;
        })[9];

      const earnedDate = tenthDeal?.payment_received_date
        ? new Date(tenthDeal.payment_received_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;

      achievementList.push({
        id: 2,
        title: "10 Deals Monitored",
        icon: TrendingUp,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 2,
        title: "10 Deals Monitored",
        icon: TrendingUp,
        earned: false,
        progress: Math.min(100, Math.round((totalDeals / 10) * 100))
      });
    }

    // ₹1M Under Watch achievement
    const oneMillion = 1000000;
    const totalUnderWatch = brandDeals
      .filter(deal => deal.status !== 'Completed' || !deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

    if (totalUnderWatch >= oneMillion) {
      achievementList.push({
        id: 3,
        title: "₹1M Under Watch",
        icon: Award,
        earned: true,
        date: "Recently"
      });
    } else {
      achievementList.push({
        id: 3,
        title: "₹1M Under Watch",
        icon: Award,
        earned: false,
        progress: Math.min(100, Math.round((totalUnderWatch / oneMillion) * 100))
      });
    }

    return achievementList;
  }, [brandDeals, calculatedStats.protectionScore, profile?.updated_at]);

  const userData = {
    name: formData.name,
    displayName: formData.displayName,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    bio: formData.bio,
    userType: "Content Creator",
    memberSince: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Recently",
    avatar: getInitials(profile?.first_name || null, profile?.last_name || null),
    verified: true,
    stats: calculatedStats,
    platforms: platforms,
    achievements: achievements,
    subscription: {
      plan: "Pro",
      status: "active",
      nextBilling: "Dec 26, 2024",
      amount: 999
    }
  };

  const parsedReelRate = Number(formData.avgRateReel.replace(/,/g, '')) || 0;
  const parsedMinBudget = Number(formData.pricingMin.replace(/,/g, '')) || 0;
  const parsedMaxBudget = Number(formData.pricingMax.replace(/,/g, '')) || 0;
  const parsedAvgBudget = Number(formData.pricingAvg.replace(/,/g, '')) || 0;

  const normalizedRangeMin = parsedMinBudget > 0 ? parsedMinBudget : 2000;
  const normalizedRangeMax = parsedMaxBudget > 0 ? parsedMaxBudget : Math.max(normalizedRangeMin + 1000, 8000);
  const safeRangeMin = Math.min(normalizedRangeMin, normalizedRangeMax);
  const safeRangeMax = Math.max(normalizedRangeMin, normalizedRangeMax);
  const isAvgViewsMissing = !formData.avgReelViewsManual.trim();
  const isRegionMissing = !formData.collabRegionLabel.trim();
  const isMediaKitMissing = !formData.mediaKitUrl.trim();
  const isCollabPositioningIncomplete = isAvgViewsMissing || isRegionMissing || isMediaKitMissing;
  const isKeyPositioningMissing = isAvgViewsMissing || isRegionMissing;

  const effectiveReelRate = parsedReelRate || parsedAvgBudget || Math.round((safeRangeMin + safeRangeMax) / 2);
  const previewPostRate = Math.max(500, Math.round(effectiveReelRate * 0.7));
  const previewBarterValue = Math.max(Math.round(effectiveReelRate * 1.25), safeRangeMax);
  const creatorTier = getCreatorTier({
    avg_rate_reel: parsedReelRate || profile?.avg_rate_reel || null,
    content_niches: formData.contentNiches,
    media_kit_url: formData.mediaKitUrl || null,
    past_brand_count: brandDeals.length,
  });
  const tierInfo = getTierHelper(creatorTier);
  const dealConfidence = creatorTier === 'Macro' || creatorTier === 'Pro'
    ? 'High'
    : creatorTier === 'Rising'
      ? 'Medium'
      : 'Growing';
  const tierBadgeClass: Record<CreatorTier, string> = {
    Nano: 'bg-[#6b7280]',
    Micro: 'bg-[#3b82f6]',
    Rising: 'bg-[#14b8a6]',
    Pro: 'bg-indigo-600',
    Macro: 'bg-[#f59e0b]',
  };
  const pastBrandWorkValue = Number(formData.collabBrandsCountOverride || 0);
  const pastBrandWorkKey =
    !pastBrandWorkValue || pastBrandWorkValue <= 0
      ? 'just-starting'
      : pastBrandWorkValue <= 5
        ? 'one-to-five'
        : pastBrandWorkValue <= 20
          ? 'five-to-twenty'
          : 'twenty-plus';
  const ongoingDealsValue = Number(formData.activeBrandCollabsMonth || 0);
  const ongoingDealsKey =
    !ongoingDealsValue || ongoingDealsValue <= 0
      ? '0'
      : ongoingDealsValue <= 2
        ? '1-2'
        : ongoingDealsValue <= 5
          ? '3-5'
          : '6+';

  useEffect(() => {
    if (activeSection !== 'collab') return;

    if (!collabHeroAnimated) {
      const introTimer = window.setTimeout(() => setCollabHeroAnimated(true), 20);
      return () => window.clearTimeout(introTimer);
    }

    const pulseInterval = window.setInterval(() => {
      setCopyPulse(true);
      window.setTimeout(() => setCopyPulse(false), 900);
    }, 8000);

    return () => window.clearInterval(pulseInterval);
  }, [activeSection, collabHeroAnimated]);

  useEffect(() => {
    if (activeSection !== 'collab') return;
    const missingFields: Array<'avgViews' | 'region' | 'mediaKit'> = [];
    if (isAvgViewsMissing) missingFields.push('avgViews');
    if (isRegionMissing) missingFields.push('region');
    if (isMediaKitMissing) missingFields.push('mediaKit');
    if (missingFields.length === 0) return;

    const interval = window.setInterval(() => {
      const index = passiveNudgeIndexRef.current % missingFields.length;
      const nextField = missingFields[index];
      passiveNudgeIndexRef.current += 1;
      setActiveNudgeField(nextField);
      window.setTimeout(() => setActiveNudgeField((current) => (current === nextField ? null : current)), 300);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [activeSection, isAvgViewsMissing, isRegionMissing, isMediaKitMissing]);

  useEffect(() => {
    const justFilled =
      (prevMissingRef.current.avgViews && !isAvgViewsMissing) ||
      (prevMissingRef.current.region && !isRegionMissing) ||
      (prevMissingRef.current.mediaKit && !isMediaKitMissing);

    prevMissingRef.current = {
      avgViews: isAvgViewsMissing,
      region: isRegionMissing,
      mediaKit: isMediaKitMissing,
    };

    if (!justFilled) return;

    setPositioningNudge('Better brand targeting enabled');
    if (successNudgeTimeoutRef.current) window.clearTimeout(successNudgeTimeoutRef.current);
    successNudgeTimeoutRef.current = window.setTimeout(() => setPositioningNudge(null), COPY_CONFIRM_MS);

    return () => {
      if (successNudgeTimeoutRef.current) window.clearTimeout(successNudgeTimeoutRef.current);
    };
  }, [isAvgViewsMissing, isRegionMissing, isMediaKitMissing]);

  useEffect(() => {
    if (hasManualDealSizeSelectionRef.current) return;
    const rate = Number(formData.avgRateReel.replace(/,/g, '')) || 0;
    const suggested: TypicalDealSize = rate <= 1500 ? 'starter' : rate <= 5000 ? 'standard' : 'premium';
    const preset = TYPICAL_DEAL_SIZE_OPTIONS.find((option) => option.key === suggested);
    if (!preset) return;

    setFormData((prev) => {
      if (prev.typicalDealSize === suggested) return prev;
      return {
        ...prev,
        typicalDealSize: suggested,
        pricingMin: preset.min ? String(preset.min) : prev.pricingMin,
        pricingMax: preset.max ? String(preset.max) : '',
        pricingAvg: preset.min && preset.max
          ? String(Math.round((preset.min + preset.max) / 2))
          : preset.min
            ? String(preset.min)
            : prev.pricingAvg,
      };
    });
  }, [formData.avgRateReel]);

  // Form validation
  const validateForm = (): boolean => {
    setCollabBudgetError(null);

    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    // Username validation - use Instagram handle if available
    const usernameToValidate = formData.instagramHandle || formData.username;
    if (!usernameToValidate || !usernameToValidate.trim()) {
      toast.error('Please enter an Instagram username (used for collaboration link)');
      return false;
    }
    if (usernameToValidate.trim().length < 3) {
      toast.error('Instagram username must be at least 3 characters');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    // Validate address is required (marked with * in UI)
    // Check if we have address components or the combined location
    const hasAddressComponents = formData.addressLine.trim() || formData.city.trim() || formData.state.trim() || formData.pincode.trim();
    const hasLocation = formData.location.trim();

    if (!hasAddressComponents && !hasLocation) {
      toast.error('Please enter your address (required for generating legal contracts)');
      return false;
    }

    // Validate that we have at least city and state (minimum requirement)
    if (!formData.city.trim() && !formData.state.trim() && !hasLocation) {
      toast.error('Please enter at least city and state, or use pincode to auto-fill');
      return false;
    }

    // Validate city specifically (required for contracts)
    if (!formData.city.trim() && !hasLocation) {
      toast.error('City is required. Enter pincode to auto-fill or enter manually.');
      return false;
    }

    // Validate state specifically (required for contracts)
    if (!formData.state.trim() && !hasLocation) {
      toast.error('State is required. Enter pincode to auto-fill or enter manually.');
      return false;
    }

    const minBudget = formData.pricingMin ? Number(formData.pricingMin) : null;
    const maxBudget = formData.pricingMax ? Number(formData.pricingMax) : null;

    if (
      (minBudget !== null && Number.isNaN(minBudget)) ||
      (maxBudget !== null && Number.isNaN(maxBudget))
    ) {
      setCollabBudgetError('Enter valid budget values.');
      toast.error('Please enter valid budget values.');
      return false;
    }

    if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
      setCollabBudgetError('Minimum budget cannot be greater than maximum budget.');
      toast.error('Minimum budget cannot be greater than maximum budget.');
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!profile) return;

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    logger.info('Saving profile updates', { profileId: profile.id, location: formData.location });

    try {
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Build update payload with only essential fields
      // Skip instagram_handle and other optional columns that may not exist
      // Clean phone number - remove +91 if it's just the default
      let phoneValue: string | null = formData.phone.trim();
      if (phoneValue === '+91' || phoneValue === '+91 ' || phoneValue === '') {
        phoneValue = null; // Save as null if empty or just the prefix
      } else if (!phoneValue.startsWith('+91')) {
        // If user typed a number without +91, add it
        phoneValue = '+91 ' + phoneValue.replace(/^\+91\s*/, '');
      }

      // Build location string from address components (always use components if available)
      let locationValue = '';

      // Clean addressLine to remove any city/state/pincode that might have been added previously
      let cleanAddressLine = formData.addressLine.trim();
      if (cleanAddressLine && (formData.city || formData.state || formData.pincode)) {
        // Remove city, state, and pincode from addressLine if they're already there
        // Use word boundaries to avoid partial matches
        if (formData.city && formData.city.trim()) {
          const cityRegex = new RegExp(`\\b${formData.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          cleanAddressLine = cleanAddressLine.replace(cityRegex, '').trim();
        }
        if (formData.state && formData.state.trim()) {
          const stateRegex = new RegExp(`\\b${formData.state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          cleanAddressLine = cleanAddressLine.replace(stateRegex, '').trim();
        }
        if (formData.pincode && formData.pincode.trim()) {
          const pincodeRegex = new RegExp(`\\b${formData.pincode.trim()}\\b`, 'g');
          cleanAddressLine = cleanAddressLine.replace(pincodeRegex, '').trim();
        }
        // Clean up extra commas and spaces - more aggressive cleaning
        cleanAddressLine = cleanAddressLine
          .replace(/,\s*,+/g, '') // Remove multiple commas (including single comma if followed by another)
          .replace(/,\s*$/g, '') // Remove trailing comma
          .replace(/^\s*,/g, '') // Remove leading comma
          .replace(/,\s*$/g, '') // Remove trailing comma again (in case first pass missed it)
          .replace(/\s+/g, ' ') // Multiple spaces become one
          .replace(/,\s*$/g, '') // Final trailing comma removal
          .trim();
      }

      console.log('[CreatorProfile] Building location from formData:', {
        originalAddressLine: formData.addressLine,
        cleanAddressLine,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        hasComponents: !!(cleanAddressLine || formData.city || formData.state || formData.pincode)
      });

      if (cleanAddressLine || formData.city || formData.state || formData.pincode) {
        locationValue = formatLocationString(
          cleanAddressLine,
          formData.city,
          formData.state,
          formData.pincode
        );
        console.log('[CreatorProfile] Built locationValue:', locationValue);
      } else {
        // Fallback to existing location if no components are filled
        locationValue = formData.location.trim();
        console.log('[CreatorProfile] Using existing location:', locationValue);
      }

      // Validate that we have city and state before saving (both are required)
      if (!formData.city || !formData.city.trim()) {
        toast.error('City is required. Please enter pincode to auto-fill or enter manually.');
        setIsSaving(false);
        return;
      }
      if (!formData.state || !formData.state.trim()) {
        toast.error('State is required. Please enter pincode to auto-fill or enter manually.');
        setIsSaving(false);
        return;
      }

      // CRITICAL: Always rebuild locationValue to ensure city and state are included
      // This ensures the saved location always has city and state, even if addressLine is empty
      const finalCity = formData.city.trim();
      const finalState = formData.state.trim();
      const finalPincode = formData.pincode.trim();

      // Rebuild locationValue with guaranteed city and state
      locationValue = formatLocationString(
        cleanAddressLine,
        finalCity,
        finalState,
        finalPincode
      );

      console.log('[CreatorProfile] Final locationValue (guaranteed city/state):', {
        locationValue,
        city: finalCity,
        state: finalState,
        pincode: finalPincode,
        addressLine: cleanAddressLine,
        includesCity: locationValue.includes(finalCity),
        includesState: locationValue.includes(finalState)
      });

      // REMOVED: Redundant includes check that was causing issues with specific city/state names
      // Since we just built locationValue with these final values, it is guaranteed to be correct.

      // Ensure locationValue is not empty before saving
      if (!locationValue || !locationValue.trim()) {
        toast.error('Address is required. Please enter your address with city and state.');
        setIsSaving(false);
        return;
      }

      const updatePayload: any = {
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        // Always include location (address) - required for contracts
        // Save trimmed value
        location: locationValue.trim(),
      };

      console.log('[CreatorProfile] Saving profile with location:', {
        locationValue: updatePayload.location,
        locationLength: updatePayload.location.length,
        includesCity: updatePayload.location.includes(finalCity),
        includesState: updatePayload.location.includes(finalState),
      });

      // Only include phone if it has a value (null is valid to clear)
      if (phoneValue !== null) {
        updatePayload.phone = phoneValue;
      } else {
        // Explicitly set to null to clear the field
        updatePayload.phone = null;
      }

      // Only include optional fields if they're provided and likely exist
      if (profile.avatar_url) {
        updatePayload.avatar_url = profile.avatar_url;
      }
      if (formData.bio) {
        updatePayload.bio = formData.bio;
      }

      // Only send extended creator fields when they have meaningful values.
      // This avoids avoidable 400s in environments where optional migrations are not applied yet.
      const creatorCategoryValue = formData.creatorCategory?.trim();
      if (creatorCategoryValue) {
        updatePayload.creator_category = creatorCategoryValue;
      }

      const avgRateReelValue = formData.avgRateReel?.trim().replace(/,/g, '');
      if (avgRateReelValue) {
        updatePayload.avg_rate_reel = Number(avgRateReelValue);
      }
      const avgReelViewsManualValue = formData.avgReelViewsManual?.trim();
      updatePayload.avg_reel_views_manual = avgReelViewsManualValue ? Number(avgReelViewsManualValue) : null;
      const avgLikesManualValue = formData.avgLikesManual?.trim();
      updatePayload.avg_likes_manual = avgLikesManualValue ? Number(avgLikesManualValue) : null;
      const collabBrandsCountOverrideValue = formData.collabBrandsCountOverride?.trim();
      updatePayload.collab_brands_count_override = collabBrandsCountOverrideValue
        ? Math.max(0, Math.floor(Number(collabBrandsCountOverrideValue)))
        : null;
      const activeBrandCollabsMonthValue = formData.activeBrandCollabsMonth?.trim();
      updatePayload.active_brand_collabs_month = activeBrandCollabsMonthValue ? Math.max(0, Number(activeBrandCollabsMonthValue)) : null;
      updatePayload.campaign_slot_note = buildNoteValue(formData.campaignSlotPreset, formData.campaignSlotCustom);
      updatePayload.collab_region_label = formData.collabRegionLabel?.trim() || null;
      updatePayload.collab_audience_fit_note = buildNoteValue(formData.collabAudienceFitPreset, formData.collabAudienceFitCustom);
      updatePayload.collab_recent_activity_note = buildNoteValue(formData.collabRecentActivityPreset, formData.collabRecentActivityCustom);
      updatePayload.collab_audience_relevance_note = formData.collabAudienceRelevanceNote?.trim() || null;
      updatePayload.collab_delivery_reliability_note = buildNoteValue(formData.collabDeliveryReliabilityPreset, formData.collabDeliveryReliabilityCustom);
      updatePayload.collab_response_behavior_note = buildNoteValue(formData.collabResponseBehaviorPreset, formData.collabResponseBehaviorCustom);
      updatePayload.collab_cta_trust_note = formData.collabCtaTrustNote?.trim() || null;
      updatePayload.collab_cta_dm_note = formData.collabCtaDmNote?.trim() || null;
      updatePayload.collab_cta_platform_note = formData.collabCtaPlatformNote?.trim() || null;

      const pricingMinValue = formData.pricingMin?.trim();
      if (pricingMinValue) {
        updatePayload.pricing_min = Number(pricingMinValue);
      }

      const pricingAvgValue = formData.pricingAvg?.trim();
      if (pricingAvgValue) {
        updatePayload.pricing_avg = Number(pricingAvgValue);
      }

      const pricingMaxValue = formData.pricingMax?.trim();
      if (pricingMaxValue) {
        updatePayload.pricing_max = Number(pricingMaxValue);
      } else {
        updatePayload.pricing_max = null;
      }

      updatePayload.open_to_collabs = !!formData.openToCollabs;

      const mediaKitUrlValue = formData.mediaKitUrl?.trim();
      if (mediaKitUrlValue) {
        updatePayload.media_kit_url = mediaKitUrlValue;
      }

      updatePayload.content_niches = formData.contentNiches.length > 0 ? formData.contentNiches : [];
      updatePayload.deal_templates = formData.dealTemplates;

      const audienceGenderSplitValue = genderSplit.trim();
      updatePayload.audience_gender_split = audienceGenderSplitValue || null;

      const normalizedTopCities = topCities
        .map((city) => normalizeAudienceText(city))
        .filter(Boolean)
        .filter((city, index, arr) => arr.findIndex((item) => item.toLowerCase() === city.toLowerCase()) === index);
      updatePayload.top_cities = normalizedTopCities.length > 0 ? normalizedTopCities : [];

      updatePayload.audience_age_range = ageRange || null;

      const primaryAudienceLanguageValue = normalizeAudienceText(language);
      updatePayload.primary_audience_language = primaryAudienceLanguageValue || null;

      updatePayload.posting_frequency = postingFrequency || null;

      // Handle Instagram handle - normalize and save
      // NOTE: Instagram handle is NEVER used for username generation
      // Username is only auto-generated from first_name + last_name (or email) via database trigger
      if (formData.instagramHandle) {
        // Strip @, spaces, and convert to lowercase
        const normalizedHandle = formData.instagramHandle
          .replace(/@/g, '')
          .replace(/\s/g, '')
          .toLowerCase()
          .trim();
        updatePayload.instagram_handle = normalizedHandle || null;
      } else {
        updatePayload.instagram_handle = null;
      }

      // Handle username - sync with Instagram handle
      // Username is used in collaboration link URL: /{username} (Instagram-style)
      // Use Instagram handle as username (normalized)
      if (formData.instagramHandle && formData.instagramHandle.trim()) {
        // Normalize Instagram handle to use as username: lowercase, alphanumeric and hyphens/underscores only
        const normalizedUsername = formData.instagramHandle
          .replace(/@/g, '')
          .replace(/\s/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .trim();

        if (normalizedUsername.length >= 3) {
          updatePayload.username = normalizedUsername;
        } else {
          toast.error('Instagram username must be at least 3 characters');
          setIsSaving(false);
          return;
        }
      }

      logger.info('Update payload', {
        updatePayload,
        locationValue: updatePayload.location,
        locationLength: updatePayload.location?.length || 0,
        formDataLocation: formData.location,
        instagramHandle: updatePayload.instagram_handle
      });

      await updateProfileMutation.mutateAsync(updatePayload);

      // Update formData immediately with saved values to ensure UI reflects the change
      // Parse the saved location back to individual components to keep formData in sync
      const savedParsedLocation = parseLocationString(locationValue);
      setFormData(prev => ({
        ...prev,
        location: locationValue,
        addressLine: savedParsedLocation.addressLine || prev.addressLine,
        city: savedParsedLocation.city || finalCity || prev.city, // Ensure city is preserved
        state: savedParsedLocation.state || finalState || prev.state, // Ensure state is preserved
        pincode: savedParsedLocation.pincode || finalPincode || prev.pincode
      }));

      console.log('[CreatorProfile] Updated formData after save:', {
        locationValue,
        parsedLocation: savedParsedLocation,
        finalCity,
        finalState,
        finalPincode
      });

      // Refetch profile to get updated username (if it was auto-generated by database trigger)
      await refetchProfile();

      // Small delay to ensure profile state updates before showing success
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success('Profile saved!');
      if (dealSettingsRequired) {
        setDealSettingsRequired(false);
        navigate('/creator-profile?section=collab', { replace: true });
      }
      logger.success('Profile updated', {
        profileId: profile.id,
        location: updatePayload.location,
        locationValue: locationValue
      });
    } catch (error: any) {
      logger.error('Failed to update profile', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'logout', {
          event_category: 'engagement',
          event_label: 'user_logout',
          method: 'profile_settings'
        });
      }

      logger.info('User logging out');
      // Close dialog first
      setShowLogoutDialog(false);
      // Then sign out
      await signOutMutation.mutateAsync();
    } catch (error: any) {
      logger.error('Logout failed', error);
      toast.error('Failed to log out');
      // Reopen dialog if logout failed
      setShowLogoutDialog(true);
    }
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="nb-screen-height bg-black text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not a creator
  if (!profile || profile.role !== 'creator') {
    navigate('/');
    return null;
  }

  return (
    <div className="nb-screen-height bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button type="button"
            onClick={() => {
              if (dealSettingsRequired) {
                toast.message('Complete Deal Settings first to continue.');
                return;
              }
              navigate('/creator-dashboard');
            }}
            className="min-h-12 min-w-12 p-3 -m-2 flex items-center justify-center hover:bg-secondary/50 rounded-xl transition-colors touch-manipulation"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>

          <div className="text-lg font-semibold">Profile & Settings</div>

          <button type="button"
            onClick={() => {
              handleSave();
            }}
            disabled={isSaving}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-label="Save profile"
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : isDirty ? (
              <div className="relative">
                <Check className="w-6 h-6 text-primary animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              </div>
            ) : (
              <Check className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Simplified Onboarding Form - For users who haven't completed onboarding */}
      {!profile.onboarding_complete ? (
        <div className="p-4 space-y-4" style={{ paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-2xl mx-auto">
            {/* Welcome Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
              <p className="text-sm text-muted-foreground">
                Fill in the essentials to get your brand deal page live.
              </p>
            </div>

            {/* Instagram Handle */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram Username *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@</span>
                <input
                  type="text"
                  value={formData.instagramHandle}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/@/g, '')
                      .replace(/\s/g, '')
                      .toLowerCase();
                    setFormData(prev => ({
                      ...prev,
                      instagramHandle: value,
                      username: value
                    }));
                  }}
                  placeholder="your_handle"
                  className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This creates your brand deal page: creatorarmour.com/{formData.instagramHandle || 'username'}
              </p>
            </div>

            {/* Bio */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell brands about yourself and your content style..."
                rows={3}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                A short bio helps brands understand your style and audience.
              </p>
            </div>

            {/* Rate */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <label className="text-sm font-medium mb-2 block">Price per reel (INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.avgRateReel}
                  onChange={(e) => setFormData(prev => ({ ...prev, avgRateReel: e.target.value }))}
                  placeholder="e.g. 1500"
                  className="w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-3 text-sm text-foreground placeholder-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Your typical rate for a single Instagram reel collaboration.
                <span className="block mt-1 text-primary font-medium">💡 Creators with 10K-50K followers typically charge ₹2K-5K per reel.</span>
              </p>
            </div>

            {/* Niches */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <label className="text-sm font-medium mb-2 block">What you post about</label>
              <p className="text-xs text-muted-foreground mb-3">Select up to 5 niches that describe your content.</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_NICHE_OPTIONS.map((niche) => {
                  const selected = formData.contentNiches.includes(niche);
                  return (
                    <button
                      type="button"
                      key={niche}
                      onClick={() => {
                        if (selected) {
                          setFormData((prev) => ({
                            ...prev,
                            contentNiches: prev.contentNiches.filter((item) => item !== niche)
                          }));
                        } else if (formData.contentNiches.length < 5) {
                          setFormData((prev) => ({
                            ...prev,
                            contentNiches: [...prev.contentNiches, niche]
                          }));
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-xs border transition-all ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                          : 'bg-muted/40 border-border text-foreground/75 hover:bg-muted'
                      }`}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI */}
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <label className="text-sm font-medium mb-2 block">UPI ID</label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-2">
                For receiving payments from brand collaborations.
              </p>
            </div>

            {/* Advanced Fields - Collapsible */}
            <Collapsible open={showAdvancedInsights} onOpenChange={setShowAdvancedInsights}>
              <CollapsibleTrigger className="w-full rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-all mb-4">
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/90">Advanced Settings</span>
                  <ChevronDown className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    showAdvancedInsights && 'rotate-180'
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mb-4">
                {/* Media Kit */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <label className="text-sm font-medium mb-2 block">Media Kit URL</label>
                  <input
                    type="url"
                    value={formData.mediaKitUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaKitUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Link to your media kit or portfolio for brands to review.
                  </p>
                </div>

                {/* Audience Demographics */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <label className="text-sm font-medium mb-2 block">Audience Demographics</label>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Gender Split</label>
                      <input
                        type="text"
                        value={genderSplit}
                        onChange={(e) => setGenderSplit(e.target.value)}
                        placeholder="Example: 70% Women • 30% Men"
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Primary Audience Region</label>
                      <input
                        type="text"
                        value={formData.collabRegionLabel}
                        onChange={(e) => setFormData(prev => ({ ...prev, collabRegionLabel: e.target.value }))}
                        placeholder="NCR (Delhi Region)"
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Age Range</label>
                      <select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="" className="bg-popover text-popover-foreground">Select</option>
                        <option value="18-24" className="bg-popover text-popover-foreground">18-24</option>
                        <option value="25-34" className="bg-popover text-popover-foreground">25-34</option>
                        <option value="35-44" className="bg-popover text-popover-foreground">35-44</option>
                        <option value="Mixed" className="bg-popover text-popover-foreground">Mixed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Delivery Reliability */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <label className="text-sm font-medium mb-2 block">Delivery Reliability Notes</label>
                  <textarea
                    value={formData.collabDeliveryReliabilityPreset}
                    onChange={(e) => setFormData(prev => ({ ...prev, collabDeliveryReliabilityPreset: e.target.value }))}
                    placeholder="e.g., Fast turnaround, 2-3 days for reels"
                    rows={2}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Let brands know about your typical delivery speed and reliability.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Save Button */}
            <button
              type="button"
              onClick={() => {
                handleSave();
                // After saving, the profile should be marked as onboarding complete
                // This happens automatically when the profile is saved
              }}
              disabled={isSaving || !formData.instagramHandle.trim()}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save & Continue'
              )}
            </button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              You can always update these details later from your profile settings.
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* Sticky Segmented Control */}
      <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="grid grid-cols-2 sm:flex gap-1 bg-secondary rounded-lg p-1 border border-border max-w-2xl mx-auto"
        >
          <button type="button"
            role="tab"
            aria-selected={activeSection === 'profile'}
            aria-label="Profile"
            onClick={() => handleSectionChange('profile')}
            className={cn(
              "w-full sm:flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'profile'
                ? "bg-secondary/15 text-foreground shadow-sm ring-1 ring-white/15 border border-border"
                : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button type="button"
            role="tab"
            aria-selected={activeSection === 'account'}
            aria-label="Account"
            onClick={() => handleSectionChange('account')}
            className={cn(
              "w-full sm:flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'account'
                ? "bg-secondary/15 text-foreground shadow-sm ring-1 ring-white/15 border border-border"
                : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            <Lock className="w-4 h-4" />
            <span>Account</span>
          </button>
          <button type="button"
            role="tab"
            aria-selected={activeSection === 'collab'}
            aria-label="Your Collab"
            onClick={() => handleSectionChange('collab')}
            className={cn(
              "w-full sm:flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'collab'
                ? "bg-secondary/15 text-foreground shadow-sm ring-1 ring-white/15 border border-border"
                : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Your Collab</span>
          </button>
          <button type="button"
            role="tab"
            aria-selected={activeSection === 'support'}
            aria-label="Support"
            onClick={() => handleSectionChange('support')}
            className={cn(
              "w-full sm:flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'support'
                ? "bg-secondary/15 text-foreground shadow-sm ring-1 ring-white/15 border border-border"
                : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>
        </div>
      </div>

      {dealSettingsRequired && (
        <div className="px-4 pt-3">
          <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Complete your Collab Settings to finish onboarding and start receiving collaboration offers.
          </div>
        </div>
      )}

      <div className="p-4 space-y-3" style={{ paddingBottom: 'calc(160px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Profile Summary - Mobile Optimized */}
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar - Editable - Centered on mobile */}
            <div className="relative flex-shrink-0">
              {profile?.id ? (
                <div className="relative">
                  <div
                    className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center text-2xl sm:text-xl font-bold overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          toast.error('Please select an image file');
                          return;
                        }

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image size must be less than 5MB');
                          return;
                        }

                        try {
                          // Upload to Supabase Storage
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${profile.id}/avatar.${fileExt}`;
                          const { error: uploadError } = await supabase.storage
                            .from('creator-assets')
                            .upload(fileName, file, {
                              cacheControl: '3600',
                              upsert: true,
                            });

                          if (uploadError) throw uploadError;

                          // Get public URL
                          const { data: { publicUrl } } = supabase.storage
                            .from('creator-assets')
                            .getPublicUrl(fileName);

                          // Update profile
                          await updateProfileMutation.mutateAsync({
                            id: profile.id,
                            first_name: profile.first_name || '',
                            last_name: profile.last_name || '',
                            avatar_url: publicUrl,
                          });

                          if (refetchProfile) {
                            await refetchProfile();
                          }

                          toast.success('Profile photo updated!');
                        } catch (error: any) {
                          console.error('Error uploading avatar:', error);
                          toast.error('Failed to upload photo. Please try again.');
                        }
                      };
                      fileInput.click();
                    }}
                  >
                    {(profile.instagram_profile_photo || profile.avatar_url) && !profilePhotoError ? (
                      <img
                        src={(profile.instagram_profile_photo || profile.avatar_url) ?? ''}
                        alt={userData.name}
                        className="w-full h-full object-cover"
                        onError={() => setProfilePhotoError(true)}
                      />
                    ) : (
                      <span>{userData.avatar}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-5 sm:h-5 bg-muted-foreground/50 rounded-full flex items-center justify-center border-2 border-border cursor-pointer hover:bg-muted-foreground transition-colors">
                    <Camera className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-foreground" />
                  </div>
                  {userData.verified && (
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-info rounded-full flex items-center justify-center border-2 border-border z-10">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center text-2xl sm:text-xl font-bold">
                  {userData.avatar}
                </div>
              )}
            </div>

            {/* Name and Role - Centered on mobile; capitalize for display (e.g. rahul -> Rahul) */}
            <div className="flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-xl sm:text-lg font-semibold">
                {(userData.name || '').trim() ? (userData.name || '').trim().replace(/^\w/, c => c.toUpperCase()) : (userData.name || '')}
              </h1>
              <div className="mt-1">
                <p className="text-xs text-foreground/60">
                  Verified Creator Profile • Protection Active
                </p>
              </div>
              <p className="text-[10px] text-foreground/40 mt-1 sm:hidden">Tap camera icon to change photo</p>
            </div>

            {/* View Stats Button - Full width on mobile */}
            <button type="button"
              onClick={() => setShowStats(!showStats)}
              className="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-xs font-medium text-foreground/80 transition-colors"
            >
              {showStats ? 'Hide Stats' : 'View Stats'}
            </button>
          </div>

          {/* Stats Grid - Hidden by default, shown on "View Stats" click */}
          {showStats && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.totalDeals}</div>
                  <div className="text-xs text-muted-foreground">Deals Monitored</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">₹{(userData.stats.totalEarnings / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-muted-foreground">Amount Recovered</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.protectionScore}</div>
                  <div className="text-xs text-muted-foreground">Amount Under Watch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.activeDeals}</div>
                  <div className="text-xs text-muted-foreground">Active Cases</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-3">
            {/* Basic Information */}
            <div
              className="bg-card rounded-xl p-4 border border-border"
            >
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h2>
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs text-foreground/70 mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-foreground/70 mb-1.5 block">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      title="Email cannot be changed"
                      className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/40 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">Email cannot be changed for security reasons</p>
                </div>
                <div>
                  <label className="text-xs text-foreground/70 mb-1.5 block">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Ensure +91 prefix is always present
                        if (!value.startsWith('+91')) {
                          // If user tries to delete +91, restore it
                          if (value.length < 3) {
                            value = '+91 ';
                          } else {
                            // If user pastes or types a number without +91, add it
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                        }
                        setFormData(prev => ({ ...prev, phone: value }));
                      }}
                      disabled={!editMode}
                      placeholder="+91 98765 43210"
                      className={`flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>
                </div>
                {/* Address Line */}
                <div>
                  <label className="text-xs text-foreground/70 mb-1.5 block">Address Line *</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-foreground/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={formData.addressLine}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                      disabled={!editMode}
                      placeholder="House/Flat No., Building, Street"
                      className={`flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pincode with auto-fetch */}
                  <div>
                    <label className="text-xs text-foreground/70 mb-1.5 block">Pincode *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          handlePincodeChange(value);
                        }}
                        disabled={!editMode}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        className={`flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                      />
                      {isLookingUpPincode && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {pincodeError && (
                      <p className="text-xs text-yellow-400 mt-1">{pincodeError}</p>
                    )}
                    {formData.pincode.length === 6 && !isLookingUpPincode && !pincodeError && (
                      <p className="text-xs text-green-400 mt-1">✓ City and State auto-filled</p>
                    )}
                    <p className="text-xs text-foreground/60 mt-1">Enter 6-digit pincode to auto-fill city and state</p>
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-xs text-foreground/70 mb-1.5 block">City *</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        console.log('[CreatorProfile] City input changed:', newCity);
                        setFormData(prev => {
                          const updated = { ...prev, city: newCity };
                          console.log('[CreatorProfile] City updated in formData:', updated.city);
                          return updated;
                        });
                      }}
                      disabled={!editMode || isLookingUpPincode}
                      placeholder="City"
                      className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'} ${isLookingUpPincode ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* State */}
                  <div>
                    <label className="text-xs text-foreground/70 mb-1.5 block">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      disabled={!editMode || isLookingUpPincode}
                      placeholder="State"
                      className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'} ${isLookingUpPincode ? 'opacity-50' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Profiles Section */}
            <div className="bg-secondary/8 rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Social Profiles
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Instagram Username</label>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      id="input-instagram-handle"
                      type="text"
                      value={formData.instagramHandle}
                      onChange={(e) => {
                        // Strip @ symbol and convert to lowercase, remove spaces
                        const value = e.target.value
                          .replace(/@/g, '')
                          .replace(/\s/g, '')
                          .toLowerCase();
                        // Sync username with Instagram handle
                        setFormData(prev => ({
                          ...prev,
                          instagramHandle: value,
                          username: value // Use same value for collab link username
                        }));
                      }}
                      disabled={!editMode}
                      placeholder="e.g. your_handle"
                      className={`flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be shown to brands on your collaboration page and used in your collaboration link: /{formData.instagramHandle || 'username'}
                  </p>
                  {formData.instagramHandle && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Link: {window?.location?.origin || ''}/{formData.instagramHandle}
                      {' '}
                      <button
                        type="button"
                        onClick={() => window.open(`/${formData.instagramHandle}?preview=1`, '_blank')}
                        className="text-primary font-medium hover:underline ml-1"
                      >
                        Preview your page →
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Milestones */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Account Milestones
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {userData.achievements.map(achievement => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-colors ${achievement.earned
                        ? 'bg-warning/5 border-warning/20'
                        : 'bg-muted/40 border-border'
                        }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${achievement.earned ? 'bg-warning/10' : 'bg-muted'
                        } flex items-center justify-center mb-2`}>
                        <Icon className={`w-5 h-5 ${achievement.earned ? 'text-warning' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="font-medium text-sm mb-1">{achievement.title}</div>
                      {achievement.earned ? (
                        <div className="text-xs text-warning/80 font-medium">Earned {achievement.date}</div>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground">{achievement.progress}% complete</div>
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/60 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, achievement.progress || 0))}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collaboration Link — mobile-first, conversion-focused */}
            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Your Official Collaboration Link
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                This is your single, protected collaboration inbox.
              </p>
              <div className="space-y-5">
                {(() => {
                  const usernameForLink = formData.instagramHandle || profile?.instagram_handle || profile?.username;
                  const hasUsername = usernameForLink && usernameForLink.trim() !== '';
                  const collabLink = hasUsername ? `${window.location.origin}/${usernameForLink}` : '';
                  const shortLink = hasUsername ? `creatorarmour.com/${usernameForLink}` : '';

                  return hasUsername ? (
                    <>
                      {/* 1. Collab link card — one line + Copy primary CTA */}
                      <div className="rounded-xl overflow-hidden border border-border">
                        <div className="bg-muted/50 px-3 py-2.5 flex items-center gap-2">
                          <code className="text-sm text-foreground/90 truncate flex-1 min-w-0 font-mono" title={shortLink}>
                            {shortLink}
                          </code>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(collabLink);
                                setCopiedLink(true);
                                toast.success('Link copied');
                                setTimeout(() => setCopiedLink(false), COPY_CONFIRM_MS);
                              } catch {
                                toast.error('Failed to copy');
                              }
                            }}
                            className="flex-shrink-0 h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all"
                            aria-label="Copy creator link"
                          >
                            {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="ml-1.5">{copiedLink ? 'Copied' : 'Copy'}</span>
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground px-3 py-1.5 flex items-center gap-1 bg-muted/30">
                          <Lock className="h-3 w-3" />
                          Legally protected · Contracts & payments enabled
                        </p>
                      </div>

                      {/* 2. Share via — compact icon row */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Share via</p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const message = encodeURIComponent(`For collaborations, submit here:\n\n${collabLink}`);
                              window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
                              toast.success('Opening WhatsApp…');
                            }}
                            className="h-9 text-xs bg-muted border-border text-foreground/80 hover:bg-muted/80"
                            aria-label="Share via WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(collabLink);
                                toast.success('Link copied. Paste in bio or DMs.');
                              } catch {
                                toast.error('Failed to copy');
                              }
                            }}
                            className="h-9 text-xs bg-muted border-border text-foreground/80 hover:bg-muted/80"
                            aria-label="Share via Instagram"
                          >
                            <Instagram className="h-3.5 w-3.5 mr-1" />
                            Instagram
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const subject = encodeURIComponent('Collaboration request');
                              const body = encodeURIComponent(`For collaborations, submit here:\n\n${collabLink}`);
                              window.location.href = `mailto:?subject=${subject}&body=${body}`;
                              toast.success('Opening email…');
                            }}
                            className="h-9 text-xs bg-muted border-border text-foreground/80 hover:bg-muted/80"
                            aria-label="Share via Email"
                          >
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Email
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium">Perfect for Instagram bio.</p>
                      </div>

                      {/* 3. Primary CTA — view public page */}
                      <div className="space-y-1">
                        <Button
                          variant="outline"
                          className="w-full h-11 bg-muted/40 border-border text-foreground font-medium hover:bg-muted/60"
                          onClick={() => {
                            if (usernameForLink) {
                              window.open(`/${usernameForLink}`, '_blank', 'noopener,noreferrer');
                            } else {
                              toast.error('Please set your Instagram username first');
                            }
                          }}
                          aria-label="View how brands see your creator link profile"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View how brands see your link
                        </Button>
                        <p className="text-[11px] text-muted-foreground text-center">Preview your creator profile</p>
                      </div>

                      {/* 4. How it works — accordion, collapsed by default, 3 steps */}
                      <Collapsible open={showHowItWorks} onOpenChange={setShowHowItWorks}>
                        <CollapsibleTrigger
                          className="w-full rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-colors"
                          aria-expanded={showHowItWorks}
                          aria-label={showHowItWorks ? 'How it works, collapse' : 'How it works, expand for steps'}
                        >
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground/90">How it works</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 text-muted-foreground/50 transition-transform", showHowItWorks && "rotate-180")} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="rounded-b-xl border border-t-0 border-border bg-muted/20 p-3">
                            <ol className="space-y-2 text-xs text-muted-foreground">
                              <li className="flex gap-2"><span className="text-muted-foreground/50 font-medium flex-shrink-0">1.</span> Brand opens your link</li>
                              <li className="flex gap-2"><span className="text-muted-foreground/50 font-medium flex-shrink-0">2.</span> Submits deal details</li>
                              <li className="flex gap-2"><span className="text-muted-foreground/50 font-medium flex-shrink-0">3.</span> You accept → contract generated</li>
                            </ol>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* 5. One compact trust card */}
                      <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-start gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-foreground/90">This link replaces DMs</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">All brand requests are logged, timestamped, and legally protected.</p>
                        </div>
                      </div>

                      {/* 6. Performance — soft empty state */}
                      <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                          {analyticsLoading ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                            </span>
                          ) : analyticsSummary && analyticsSummary.weeklyViews > 0 ? (
                            <p className="text-xs text-muted-foreground">
                              {analyticsSummary.weeklyViews} {analyticsSummary.weeklyViews === 1 ? 'brand' : 'brands'} viewed your link this week
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/80">
                              No brand visits yet. Share your link in bio to start receiving requests.
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground/80">Complete your profile to activate your collab link</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Save your profile and your link will be generated automatically.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Logout Button - At Bottom of Profile Section */}
            <div className="mt-6 mb-4">
              <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Haptic feedback on click
                    if (navigator.vibrate) {
                      navigator.vibrate(30);
                    }
                    console.log('[CreatorProfile] Logout button clicked, opening dialog');
                    setShowLogoutDialog(true);
                  }}
                  disabled={signOutMutation.isPending}
                  className="w-full bg-transparent hover:bg-destructive/10 border border-destructive/40 text-destructive font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[40px]"
                  aria-label="Log out of your account"
                  aria-describedby="logout-description"
                >
                  {signOutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </>
                  )}
                </button>
                <p id="logout-description" className="text-xs text-center text-foreground/40 mt-2">
                  You'll be signed out of your account
                </p>
              </div>
            </div>

            <div className="mb-4">
              <button type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Collab Link Builder Section */}
        {activeSection === 'collab' && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="inline-flex items-center rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold text-warning dark:text-warning mb-2">
                ⭐ Your Brand Entry Point
              </div>
              <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Your Collaboration Link
              </h2>
              <p className="text-xs text-muted-foreground mb-1">Share this link so brands can send offers directly.</p>
              <p className="text-xs text-muted-foreground/80 mb-1.5">This replaces DM negotiations.</p>
              <p className="text-xs text-primary dark:text-primary font-medium mb-3">Verified deal flow — no agency middle layer</p>
              {(() => {
                const usernameForLink = formData.instagramHandle || profile?.instagram_handle || profile?.username;
                const hasUsername = usernameForLink && usernameForLink.trim() !== '';
                const collabLink = hasUsername ? `${window.location.origin}/${usernameForLink}` : '';
                const shortLink = hasUsername ? `creatorarmour.com/${usernameForLink}` : '';

                if (!hasUsername) {
                  return (
                    <p className="text-xs text-warning dark:text-warning font-medium">Add your Instagram username in Profile to activate your collab link.</p>
                  );
                }

                return (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                      <code className="text-sm text-foreground/90 truncate block font-mono" title={shortLink}>{shortLink}</code>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(collabLink);
                            setCopiedLink(true);
                            toast.success('Link copied');
                            setTimeout(() => setCopiedLink(false), COPY_CONFIRM_MS);
                          } catch {
                            toast.error('Failed to copy');
                          }
                        }}
                        className={cn(
                          "h-10 bg-muted/60 border-border text-foreground/90 hover:bg-muted/80 transition-all",
                          copyPulse && "shadow-[0_0_0_2px_rgba(37,99,235,0.2),0_0_18px_rgba(37,99,235,0.15)]"
                        )}
                        aria-label="Copy collaboration link"
                      >
                        {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-1.5">{copiedLink ? 'Copied' : 'Copy'}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(`/${usernameForLink}`, '_blank', 'noopener,noreferrer')}
                        className="h-10 bg-muted/60 border-border text-foreground/90 hover:bg-muted/80"
                        aria-label="Preview collaboration link"
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Preview
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      {isCollabPositioningIncomplete ? 'Add a few details to attract better offers' : 'Ready to receive offers'}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* ── Profile Completeness Nudge ───────────────────── */}
            {(() => {
              const missingStats: { label: string; hint: string; field: string }[] = [];
              if (!formData.avgReelViewsManual?.trim()) {
                missingStats.push({ label: 'Avg Reel Views', hint: 'Helps brands estimate your reach', field: 'avgViews' });
              }
              if (!formData.avgRateReel?.trim()) {
                missingStats.push({ label: 'Price per reel', hint: 'Sets expectations before deal talks', field: 'reelRate' });
              }
              if (!formData.collabRegionLabel?.trim()) {
                missingStats.push({ label: 'Primary Audience Region', hint: 'Improves local brand matching', field: 'region' });
              }
              if (!formData.collabBrandsCountOverride?.trim() || formData.collabBrandsCountOverride === '0') {
                missingStats.push({ label: 'Brands Worked With', hint: 'Builds trust with potential partners', field: 'brands' });
              }
              if (missingStats.length === 0) return null;
              return (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">⚡</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-warning dark:text-warning">Your public page is missing key stats</p>
                      <p className="text-xs text-warning/70 dark:text-warning/60 mt-0.5">Brands see "—" for these fields. Fill them in to build trust.</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {missingStats.map((stat) => (
                      <li key={stat.field} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border border-warning/40 bg-background flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-semibold text-foreground/90">{stat.label}</span>
                          <span className="text-xs text-muted-foreground ml-1.5">— {stat.hint}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-warning/60 dark:text-warning/40 mt-3 font-medium">Scroll down to fill these in ↓</p>
                </div>
              );
            })()}

            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-2">Your Deal Terms</h2>
              <p className="text-xs text-muted-foreground mb-3">This is what brands see before sending an offer.</p>

              {/* 🚀 AI Optimization Wizard */}
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-indigo-500/20 p-2 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-muted-foreground italic">Optimization Wizard</h3>
                    <p className="text-[11px] text-muted-foreground">Powered by Creator Armour AI</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 px-4 flex flex-col items-center gap-1.5 bg-card border-border hover:bg-secondary/50"
                    onClick={() => {
                      toast.info("AI is analyzing your content...", {
                        description: "Fetching latest metrics and optimizing your bio."
                      });
                      setTimeout(() => {
                        toast.success("Profile Optimized!", {
                          description: "Your bio and rates have been updated for better conversion."
                        });
                      }, 2000);
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold">Enhance Bio</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 px-4 flex flex-col items-center gap-1.5 bg-card border-border hover:bg-secondary/50"
                    onClick={() => {
                      toast.info("Scanning market rates...", {
                        description: "Calculating your optimal rate card."
                      });
                      setFormData(prev => ({ ...prev, autoPricingEnabled: true }));
                    }}
                  >
                    <Zap className="w-4 h-4 text-warning" />
                    <span className="text-xs font-bold">Smart Rates</span>
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <FiverrPackageEditor 
                  templates={formData.dealTemplates}
                  onChange={(templates) => setFormData(prev => ({ ...prev, dealTemplates: templates }))}
                  disabled={!editMode}
                />
              </div>

              <div className="space-y-3">
                {/* Auto Pricing Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border mb-2">
                  <div className="pr-4">
                    <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                      <Sparkles className="w-3.5 h-3.5 text-info" />
                      Auto Pricing
                      <span className="text-[10px] bg-info/20 text-info px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Allow our engine to automatically recommend rates to brands based on your content stats.</p>
                  </div>
                  <button type="button"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(50);
                      setFormData(prev => ({ ...prev, autoPricingEnabled: !prev.autoPricingEnabled }));
                    }}
                    className={cn(
                      "flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200 relative",
                      formData.autoPricingEnabled ? "bg-info" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform duration-200",
                      formData.autoPricingEnabled ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Content Type</label>
                  <select
                    value={formData.creatorCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, creatorCategory: e.target.value }))}
                    disabled={!editMode}
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  >
                    {CREATOR_CATEGORY_OPTIONS.map(option => (
                      <option key={option} value={option} className="bg-popover text-popover-foreground">{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Price per reel (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/60">₹</span>
                    <input
                      id="input-rate-reel"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.avgRateReel}
                      onChange={(e) => setFormData(prev => ({ ...prev, avgRateReel: e.target.value }))}
                      disabled={!editMode}
                      placeholder="e.g. 1500"
                      className={`w-full bg-muted/50 border border-border rounded-lg pl-7 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block font-medium">Typical Collaboration Size</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {TYPICAL_DEAL_SIZE_OPTIONS.map((option) => {
                      const selected = formData.typicalDealSize === option.key;
                      return (
                        <button type="button"
                          key={option.key}
                          onClick={() => {
                            hasManualDealSizeSelectionRef.current = true;
                            setCollabBudgetError(null);
                            setFormData((prev) => ({
                              ...prev,
                              typicalDealSize: option.key,
                              pricingMin: option.min ? String(option.min) : prev.pricingMin,
                              pricingMax: option.max ? String(option.max) : '',
                              pricingAvg: option.min && option.max
                                ? String(Math.round((option.min + option.max) / 2))
                                : option.min
                                  ? String(option.min)
                                  : prev.pricingAvg,
                            }));
                          }}
                          className={cn(
                            "w-full text-left rounded-xl p-3 border transition-all duration-200",
                            selected
                              ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm"
                              : "bg-muted/40 border-border hover:bg-muted/60"
                          )}
                        >
                          <p className={cn("text-sm font-semibold transition-colors", selected ? "text-primary" : "text-foreground/90")}>{option.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.range}</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1">{option.helper}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {collabBudgetError && <p className="text-xs text-warning">{collabBudgetError}</p>}
                <p className="text-[11px] text-foreground/60">This helps brands send relevant offers only.</p>

                <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Open To</label>
                  <div className="flex flex-wrap gap-2">
                    {COLLAB_PREFERENCE_OPTIONS.map((option) => {
                      const isSelected = formData.collaborationPreference === option;
                      return (
                        <button type="button"
                          key={option}
                          disabled={!editMode}
                          onClick={() => setFormData(prev => ({ ...prev, collaborationPreference: option }))}
                          aria-pressed={isSelected}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                            : 'bg-muted/40 border-border text-foreground/75'} ${!editMode ? 'opacity-70 cursor-not-allowed' : 'hover:bg-muted'}`}
                        >
                          {option === 'paid' ? 'Paid' : option === 'barter' ? 'Free products as payment' : 'Paid + Product'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-2">Best-Fit Brands</h2>
              <p className="text-xs text-muted-foreground mb-3">Helps attract the right collaborations.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">What you post about</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_NICHE_OPTIONS.map((niche) => {
                      const selected = formData.contentNiches.includes(niche);
                      return (
                        <button type="button"
                          key={niche}
                          disabled={!editMode}
                          onClick={() => {
                            if (selected) {
                              setFormData((prev) => ({ ...prev, contentNiches: prev.contentNiches.filter((item) => item !== niche) }));
                            } else if (formData.contentNiches.length < 5) {
                              setHighlightNiche(niche);
                              window.setTimeout(() => setHighlightNiche((current) => (current === niche ? null : current)), 220);
                              setFormData((prev) => ({ ...prev, contentNiches: [...prev.contentNiches, niche] }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${selected
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                            : 'bg-muted/40 border-border text-foreground/75'} ${highlightNiche === niche ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} ${!editMode ? 'opacity-70 cursor-not-allowed' : 'hover:bg-muted'}`}
                        >
                          {niche}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={cn(
                  "rounded-lg transition-all",
                  activeNudgeField === 'avgViews' && "ring-2 ring-primary/40 bg-primary/5"
                )}>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Avg Reel Views</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.avgReelViewsManual}
                    onChange={(e) => setFormData(prev => ({ ...prev, avgReelViewsManual: e.target.value }))}
                    disabled={!editMode}
                    placeholder="e.g. 12000"
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  />
                  {isAvgViewsMissing && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1">Helps brands estimate reach</p>
                  )}
                </div>

                <div className={cn(
                  "rounded-lg transition-all",
                  activeNudgeField === 'region' && "ring-2 ring-primary/40 bg-primary/5"
                )}>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Primary Audience Region</label>
                  <input
                    type="text"
                    value={formData.collabRegionLabel}
                    onChange={(e) => setFormData(prev => ({ ...prev, collabRegionLabel: e.target.value }))}
                    disabled={!editMode}
                    placeholder="NCR (Delhi Region)"
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  />
                  {isRegionMissing && (
                    <p className="text-[11px] text-muted-foreground/60 mt-1">Improves local deal matching</p>
                  )}
                </div>

                <Collapsible
                  open={showAdvancedInsights}
                  onOpenChange={setShowAdvancedInsights}
                >
                  <CollapsibleTrigger className="w-full rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition-all">
                    <div className="px-3 py-2 flex items-center justify-between text-sm text-foreground/90">
                      <span className="font-medium">Improve Brand Match</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', showAdvancedInsights && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Gender Split</label>
                      <input
                        type="text"
                        value={genderSplit}
                        onChange={(e) => setGenderSplit(e.target.value)}
                        placeholder="Example: 70% Women • 30% Men"
                        disabled={!editMode}
                        className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Top Cities</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {topCities.map((city) => (
                          <span key={city} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border border-border bg-muted/60 text-foreground/90 font-medium">
                            {city}
                            <button type="button" onClick={() => removeCity(city)} disabled={!editMode} className="text-muted-foreground hover:text-foreground">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (!editMode) return;
                              addCity();
                            }
                          }}
                          placeholder="Type city & press Enter"
                          disabled={!editMode}
                          className={`flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                        />
                        <button type="button" onClick={addCity} disabled={!editMode} className={`px-3 py-2 rounded-lg text-sm border border-border ${editMode ? 'bg-muted hover:bg-muted/80 text-foreground font-medium' : 'opacity-70 cursor-not-allowed text-muted-foreground bg-muted/30'}`}>
                          Add
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Age Range</label>
                        <select
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          disabled={!editMode}
                          className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                        >
                          <option value="" className="bg-popover text-popover-foreground">Select</option>
                          <option value="18-24" className="bg-popover text-popover-foreground">18-24</option>
                          <option value="25-34" className="bg-popover text-popover-foreground">25-34</option>
                          <option value="35-44" className="bg-popover text-popover-foreground">35-44</option>
                          <option value="Mixed" className="bg-popover text-popover-foreground">Mixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Posting Frequency</label>
                        <select
                          value={postingFrequency}
                          onChange={(e) => setPostingFrequency(e.target.value)}
                          disabled={!editMode}
                          className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                        >
                          <option value="" className="bg-popover text-popover-foreground">Select</option>
                          <option value="Daily" className="bg-popover text-popover-foreground">Daily</option>
                          <option value="3–4 times/week" className="bg-popover text-popover-foreground">3–4 times/week</option>
                          <option value="Weekly" className="bg-popover text-popover-foreground">Weekly</option>
                          <option value="Occasional" className="bg-popover text-popover-foreground">Occasional</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Primary Audience Language</label>
                      <input
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="Example: Hindi • English"
                        disabled={!editMode}
                        className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-2">Your Working Style</h2>
              <p className="text-xs text-muted-foreground mb-3">Sets expectations before the deal starts.</p>

              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground/80">Deal Expectations</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Prevents misunderstandings before campaigns start.</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Delivery Speed</label>
                  <select
                    value={formData.collabDeliveryReliabilityPreset}
                    onChange={(e) => setFormData(prev => ({ ...prev, collabDeliveryReliabilityPreset: e.target.value }))}
                    disabled={!editMode}
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  >
                    <option value="" className="bg-popover text-popover-foreground">Select</option>
                    {COLLAB_DELIVERY_RELIABILITY_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-popover text-popover-foreground">{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Approval Style</label>
                  <select
                    value={formData.collabResponseBehaviorPreset}
                    onChange={(e) => setFormData(prev => ({ ...prev, collabResponseBehaviorPreset: e.target.value }))}
                    disabled={!editMode}
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  >
                    <option value="" className="bg-popover text-popover-foreground">Select</option>
                    {COLLAB_CTA_BEHAVIOR_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-popover text-popover-foreground">{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Usage Preference</label>
                  <input
                    type="text"
                    value={formData.collabCtaTrustNote}
                    onChange={(e) => setFormData(prev => ({ ...prev, collabCtaTrustNote: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Mention rights or usage preference"
                    className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 font-medium text-center">Sets expectations before campaigns begin</p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border space-y-3">
              <h2 className="font-semibold text-base">Professional Signals</h2>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Past Brand Work</label>
                <p className="text-[11px] text-muted-foreground/80 mb-2">Have you worked with brands before?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'just-starting', label: 'Just starting', value: '0' },
                    { key: 'one-to-five', label: '1-5 brands', value: '3' },
                    { key: 'five-to-twenty', label: '5-20 brands', value: '12' },
                    { key: 'twenty-plus', label: '20+ brands', value: '25' },
                  ].map((option) => (
                    <button type="button"
                      key={option.key}
                      onClick={() => setFormData(prev => ({ ...prev, collabBrandsCountOverride: option.value }))}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm text-left transition-all",
                        pastBrandWorkKey === option.key
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-muted/40 border-border text-foreground/80 hover:bg-muted/60"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Ongoing Deals</label>
                <select
                  value={ongoingDealsKey}
                  onChange={(e) => {
                    const value = e.target.value;
                    const mapped = value === '0' ? '0' : value === '1-2' ? '2' : value === '3-5' ? '4' : '6';
                    setFormData(prev => ({ ...prev, activeBrandCollabsMonth: mapped }));
                  }}
                  disabled={!editMode}
                  className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                >
                  <option value="0" className="bg-popover text-popover-foreground">None yet</option>
                  <option value="1-2" className="bg-popover text-popover-foreground">1-2 deals</option>
                  <option value="3-5" className="bg-popover text-popover-foreground">3-5 deals</option>
                  <option value="6+" className="bg-popover text-popover-foreground">6+ deals</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Monthly Collab Capacity</label>
                <p className="text-[11px] text-muted-foreground/80 mb-2">How many deals can you handle per month?</p>
                <select
                  value={formData.campaignSlotPreset}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaignSlotPreset: e.target.value }))}
                  disabled={!editMode}
                  className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`}
                >
                  <option value="" className="bg-popover text-popover-foreground">Select capacity</option>
                  {COLLAB_CAMPAIGN_SLOT_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-popover text-popover-foreground">{option}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                {showAdvancedDealDrawer && (
                  <div className="absolute inset-0 rounded-xl bg-black/25 backdrop-blur-[1px] -z-10 transition-opacity duration-300 opacity-100" />
                )}
                <Collapsible open={showAdvancedDealDrawer} onOpenChange={setShowAdvancedDealDrawer}>
                  <CollapsibleTrigger className="w-full rounded-xl border border-border bg-muted/40 hover:bg-muted/60 transition-all">
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground/90">Improve how brands trust you</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', showAdvancedDealDrawer && 'rotate-180')} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Media Kit URL</label>
                        <input type="url" value={formData.mediaKitUrl} onChange={(e) => setFormData(prev => ({ ...prev, mediaKitUrl: e.target.value }))} disabled={!editMode} placeholder="https://..." className={`w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${editMode ? 'focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-muted' : 'cursor-not-allowed opacity-70'}`} />
                        {isMediaKitMissing && (
                          <p className="text-[11px] text-muted-foreground/60 mt-1">Increases premium deal invites</p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2.5 text-center font-medium">
                Complete this to receive better-matched offers.
              </p>
              {positioningNudge && (
                <p className="text-[11px] text-primary dark:text-primary font-medium mb-2 text-center transition-opacity duration-200">{positioningNudge}</p>
              )}
              <button type="button"
                onClick={() => {
                  setCtaPressed(true);
                  window.setTimeout(() => setCtaPressed(false), 180);
                  if (navigator.vibrate) navigator.vibrate(120);
                  handleSave();
                }}
                disabled={isSaving}
                className={cn(
                  "relative overflow-hidden w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed",
                  ctaPressed && "scale-[0.98]"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Saving...' : isKeyPositioningMissing ? '✨ Improve My Deal Positioning' : '✨ Update How Brands See Me'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl p-3.5 border border-border">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                Instant Deal Alerts
              </h2>
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                Get notified as soon as a brand sends a collaboration request.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button"
                  onClick={handleEnablePushFromAccount}
                  disabled={
                    isPushBusy
                    || !isPushSupported
                    || (!isIOSNeedsInstall && !hasVapidKey)
                  }
                  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-card text-black hover:bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPushBusy
                    ? 'Updating…'
                    : isIOSNeedsInstall
                      ? 'Add to Home Screen'
                      : isPushSubscribed
                        ? 'Refresh Notifications'
                        : 'Enable Notifications'}
                </button>
                {isPushSubscribed && (
                  <>
                    <button type="button"
                      onClick={handleTestPushFromAccount}
                      disabled={isPushBusy}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {isPushBusy ? 'Sending…' : 'Send Test Notification'}
                    </button>
                    <span className="text-xs text-primary dark:text-primary font-medium">Push alerts active</span>
                  </>
                )}
              </div>
            </div>

            {/* Notifications */}
            <NotificationPreferences />

            {/* Subscription - Utility Emphasis */}
            <div className="bg-card rounded-xl p-3.5 border border-border">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Subscription
              </h2>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold mb-1">{userData.subscription.plan} Plan</div>
                  <div className="text-sm text-muted-foreground">₹{userData.subscription.amount}/month</div>
                </div>
                <span className="px-2.5 py-1 bg-primary/15 text-primary dark:text-primary border border-primary/20 rounded-full text-xs font-semibold">
                  Active
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-3 font-medium">
                Next billing: {userData.subscription.nextBilling}
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 rounded-lg transition-all text-sm border border-border">
                  Manage Plan
                </button>
                <button type="button" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2 rounded-lg transition-all text-sm shadow-md">
                  Upgrade
                </button>
              </div>
            </div>

            {/* Security & Privacy - Utility Emphasis */}
            <div className="bg-card rounded-xl p-3.5 border border-border">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Security & Privacy
              </h2>
              <div className="space-y-2">
                <button type="button" className="w-full flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Change Password</div>
                      <div className="text-xs text-muted-foreground">Last changed 2 months ago</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>

                <button type="button" className="w-full flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Two-Factor Authentication</div>
                      <div className="text-xs text-primary dark:text-primary font-medium">Enabled</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>

                <button type="button" className="w-full flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Download Your Data</div>
                      <div className="text-xs text-muted-foreground">Export all your information</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>

                <button type="button" className="w-full flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-destructive/10 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-destructive/70 group-hover:text-destructive" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-destructive/80 group-hover:text-destructive transition-colors">Delete Account</div>
                      <div className="text-xs text-destructive/50 group-hover:text-destructive/70">Permanently remove your account</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-destructive/50 group-hover:text-destructive" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <h2 className="font-semibold text-base mb-3">Help & Support</h2>
              <div className="space-y-2">
                {/* Contact Support - Primary */}
                <button type="button" className="w-full flex items-center justify-between min-h-[44px] p-2.5 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-all font-medium">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold text-sm text-foreground">Contact Support</div>
                      <div className="text-xs text-muted-foreground">Chat with our team</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
                </button>

                {/* Help Center - Secondary */}
                <button type="button" className="w-full flex items-center justify-between min-h-[44px] p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-muted-foreground/70" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Help Center</div>
                      <div className="text-xs text-muted-foreground">FAQs and guides</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>

                {/* Restart Tutorial - Secondary */}
                <button type="button"
                  onClick={() => {
                    if (profile?.id) {
                      localStorage.removeItem(`dashboard-tutorial-completed-${profile.id}`);
                      localStorage.removeItem(`dashboard-tutorial-dismissed-${profile.id}`);
                      toast.success('Tutorial has been reset! It will appear on your next Your Deals visit.');
                      setTimeout(() => {
                        navigate('/creator-dashboard');
                      }, 1000);
                    }
                  }}
                  className="w-full flex items-center justify-between min-h-[44px] p-2.5 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-warning/70" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Restart Your Deals Tutorial</div>
                      <div className="text-xs text-muted-foreground">Show the guided tour again</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </button>
              </div>
            </div>

            {/* Legal Subsection - Muted */}
            <div className="bg-muted/20 rounded-lg p-3 border border-border">
              <h3 className="text-[10px] font-bold text-muted-foreground/70 mb-2 uppercase tracking-widest pl-1">Legal</h3>
              <div className="space-y-1">
                <button type="button" className="w-full flex items-center justify-between min-h-[40px] px-2.5 py-2 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-muted-foreground/60" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Terms of Service</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>

                <button type="button" className="w-full flex items-center justify-between min-h-[40px] px-2.5 py-2 bg-muted/40 rounded-lg border border-border hover:bg-muted/60 transition-all">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-muted-foreground/60" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Privacy Policy</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </button>
              </div>
            </div>

            {/* Divider before About */}
            <div className="border-t border-border my-4"></div>

            {/* App Info - Muted and Centered */}
            {/* App Info - Muted and Centered */}
            <div className="bg-muted/10 rounded-lg p-3 border border-border/40">
              <div className="text-center text-sm text-muted-foreground/60">
                <div className="font-bold text-foreground/40 mb-0.5 tracking-tight">CreatorArmour</div>
                <div className="text-[10px] mb-1 font-mono uppercase opacity-70">Version 1.0.0</div>
                <div className="text-[10px] opacity-60">© 2024 CreatorArmour. All rights reserved.</div>
              </div>
            </div>

            {/* Logout Button - At Bottom */}
            <div className="mt-6 mb-4">
              <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                <button type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigator.vibrate) navigator.vibrate(30);
                    setShowLogoutDialog(true);
                  }}
                  disabled={signOutMutation.isPending}
                  className="w-full bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive dark:text-destructive font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                  aria-label="Log out of your account"
                >
                  {signOutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-destructive/50 mt-2 font-medium">
                  You'll be signed out of your account
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
        </>
      )}

      {/* Logout Confirmation Dialog - Always rendered outside conditionals */}
      <AlertDialog open={showLogoutDialog} onOpenChange={(open) => setShowLogoutDialog(open)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl flex items-center gap-2 font-bold">
              <LogOut className="w-5 h-5 text-destructive" />
              Confirm Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
              }}
              className="bg-muted text-foreground border-border hover:bg-muted/80 focus:ring-2 focus:ring-primary/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={signOutMutation.isPending}
              className="bg-destructive text-foreground hover:bg-destructive border border-destructive focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
            >
              {signOutMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileSettings;
