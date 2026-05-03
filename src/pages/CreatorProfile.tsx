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

import { optimizeImage } from '@/lib/utils/image';
import { buildCollabLink, normalizeCollabHandle } from '@/lib/utils/collabLink';
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
  const isDark = true; // Elite interface uses dark mode for premium aesthetic
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
    registered_address: "",
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
      formData.pricingMax !== (profile.pricing_max?.toString() || '') ||
      formData.registered_address !== (profile.registered_address || '')
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

  // Profile completeness calculation
  const profileCompleteness = useMemo(() => {
    const fields = [
      !!formData.name.trim(),
      !!formData.bio.trim(),
      !!formData.instagramHandle.trim(),
      !!formData.avgRateReel.trim(),
      !!formData.pricingMin.trim() || !!formData.pricingAvg.trim() || !!formData.pricingMax.trim(),
      !!formData.contentNiches.length,
      !!formData.avgReelViewsManual.trim(),
      !!formData.collabRegionLabel.trim(),
      !!formData.collabBrandsCountOverride.trim(),
      !!formData.mediaKitUrl.trim(),
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

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
        registered_address: profile.registered_address || '',
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
        registered_address: formData.registered_address?.trim() || null,
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
        pincode: savedParsedLocation.pincode || finalPincode || prev.pincode,
        registered_address: formData.registered_address
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
    <div className={cn("nb-screen-height transition-colors duration-700", isDark ? "bg-[#020617] text-white" : "bg-[#F8FAFC] text-slate-900")}>
      {/* Floating Cinematic Header */}
      <div className="sticky top-0 z-[100] px-4 pt-4 pb-2">
        <div className={cn(
          "max-w-4xl mx-auto rounded-[2rem] border backdrop-blur-3xl shadow-2xl transition-all duration-500",
          isDark ? "bg-white/[0.03] border-white/10 shadow-black/40" : "bg-white/80 border-slate-200/50 shadow-slate-200/40"
        )}>
          <div className="flex items-center justify-between p-3 px-5">
            <div className="flex items-center gap-4">
              <button type="button"
                onClick={() => {
                  if (dealSettingsRequired) {
                    toast.message('Complete Deal Settings first to continue.');
                    return;
                  }
                  navigate('/creator-dashboard');
                }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95",
                  isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"
                )}
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col">
                <span className={cn("text-[16px] font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>Identity</span>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1", isDark ? "text-white" : "text-slate-900")}>Profile & Settings</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isDirty && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  Unsaved
                </div>
              )}
              <button type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                  isDirty 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                    : (isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-400")
                )}
                aria-label="Save profile"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className={cn("w-6 h-6", isDirty ? "stroke-[3]" : "")} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Onboarding Form - For users who haven't completed onboarding */}
      {!profile.onboarding_complete ? (
        <div className="px-5 pt-4 pb-32 max-w-4xl mx-auto space-y-8">
            {/* Welcome Hero */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="py-10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className={cn("text-3xl font-black tracking-tighter italic uppercase mb-3", isDark ? "text-white" : "text-slate-900")}>Complete Your Identity</h2>
              <p className={cn("text-[15px] font-medium opacity-50 max-w-xs mx-auto leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
                Fill in the essentials to get your brand deal page live and ready for collaborations.
              </p>
            </motion.div>


            {/* Instagram Handle - Glassmorphic Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-6 block flex items-center gap-3 opacity-40", isDark ? "text-white" : "text-slate-900")}>
                <Instagram className="w-4 h-4" />
                Instagram Namespace
              </label>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black opacity-20">@</span>
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
                  placeholder="username"
                  className={cn(
                    "w-full bg-transparent border-b-2 py-6 pl-14 text-2xl font-black tracking-tighter transition-all outline-none focus:placeholder-transparent",
                    isDark ? "border-white/10 focus:border-emerald-500 text-white" : "border-slate-200 focus:border-emerald-500 text-slate-900"
                  )}
                />
              </div>
              <div className={cn("mt-6 p-4 rounded-2xl flex items-center justify-between", isDark ? "bg-white/5" : "bg-slate-50")}>
                 <div className="flex items-center gap-3">
                    <Link2 className="w-4 h-4 opacity-40" />
                    <p className={cn("text-[13px] font-bold truncate", isDark ? "text-white/60" : "text-slate-500")}>
                      creatorarmour.com/{formData.instagramHandle || 'username'}
                    </p>
                 </div>
                 <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    Your URL
                 </div>
              </div>
            </motion.div>

            {/* Profile Briefing - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Profile Briefing</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell brands about yourself and your content style..."
                rows={3}
                className={cn(
                  "w-full bg-transparent border-none p-0 text-lg font-bold leading-relaxed transition-all outline-none resize-none focus:placeholder-transparent",
                  isDark ? "text-white/80" : "text-slate-700"
                )}
              />
              <div className="mt-8 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className={cn("text-[11px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Brands read this first</p>
              </div>
            </motion.div>

            {/* Commercial Value - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Commercial Value (Per Reel)</label>
              <div className="relative group flex items-center">
                <span className={cn("text-3xl font-black mr-2 opacity-20", isDark ? "text-white" : "text-slate-900")}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.avgRateReel}
                  onChange={(e) => setFormData(prev => ({ ...prev, avgRateReel: e.target.value }))}
                  placeholder="0"
                  className={cn(
                    "w-full bg-transparent border-none p-0 text-5xl font-black tracking-tighter transition-all outline-none focus:placeholder-transparent",
                    isDark ? "text-white" : "text-slate-900"
                  )}
                />
              </div>
              <div className={cn("mt-8 p-5 rounded-3xl border", isDark ? "bg-white/5 border-white/10" : "bg-emerald-50/50 border-emerald-100")}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <Zap className="w-5 h-5 text-white fill-current" />
                  </div>
                  <div>
                    <p className={cn("text-[13px] font-black tracking-tight mb-1", isDark ? "text-emerald-400" : "text-emerald-700")}>Creator Insight</p>
                    <p className={cn("text-[11px] font-bold leading-relaxed opacity-60", isDark ? "text-white" : "text-slate-600")}>
                      Creators with your reach typically charge ₹2K - ₹5K. Setting a fair price increases your conversion by 40%.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Creative Niche - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Creative Focus</label>
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
                      className={cn(
                        "px-6 py-3 rounded-2xl text-[13px] font-black tracking-tight transition-all active:scale-95",
                        selected
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : (isDark ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                      )}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Payout Command - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <label className={cn("text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Payout Settlement (UPI)</label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                placeholder="yourname@upi"
                className={cn(
                  "w-full bg-transparent border-b-2 py-4 text-xl font-black tracking-tighter transition-all outline-none focus:placeholder-transparent",
                  isDark ? "border-white/10 focus:border-emerald-500 text-white" : "border-slate-200 focus:border-emerald-500 text-slate-900"
                )}
              />
              <div className="mt-6 flex items-center justify-between">
                 <div className="flex items-center gap-2 opacity-40">
                    <Shield className="w-4 h-4" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Secure Settlement</p>
                 </div>
                 <div className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                    Verified
                 </div>
              </div>
            </motion.div>

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
      ) : (
        <>
      {/* Floating Cinematic Navigation Dock */}
      <div className="sticky top-[75px] z-[90] px-4 py-3">
        <div className={cn(
          "max-w-4xl mx-auto rounded-[1.75rem] p-1.5 border backdrop-blur-2xl transition-all duration-500",
          isDark ? "bg-white/[0.03] border-white/10 shadow-2xl shadow-black/40" : "bg-white/90 border-slate-200/50 shadow-xl shadow-slate-200/20"
        )}>
          <div
            role="tablist"
            aria-label="Profile sections"
            className="flex items-center gap-1"
          >
            {[
              { id: 'profile', label: 'Identity', icon: User },
              { id: 'account', label: 'Security', icon: Lock },
              { id: 'collab', label: 'Deals', icon: SlidersHorizontal },
              { id: 'support', label: 'Support', icon: HelpCircle }
            ].map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSectionChange(section.id as any)}
                  className={cn(
                    "flex-1 relative h-12 rounded-[1.25rem] text-[13px] font-black tracking-tight transition-all duration-500 flex items-center justify-center gap-2",
                    isActive 
                      ? (isDark ? "text-white" : "text-slate-900") 
                      : (isDark ? "text-white/40 hover:text-white/60" : "text-slate-400 hover:text-slate-600")
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className={cn(
                        "absolute inset-0 rounded-[1.25rem] shadow-lg",
                        isDark ? "bg-white/10 shadow-black/20" : "bg-slate-100 shadow-slate-200/40"
                      )}
                    />
                  )}
                  <Icon className={cn("w-4 h-4 relative z-10", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                  <span className="relative z-10 hidden sm:inline">{section.label}</span>
                </button>
              );
            })}
          </div>
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
        {/* Identity Summary Hero - Glass Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500 overflow-hidden relative",
            isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
          )}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            {/* Avatar - Elite Treatment */}
            <div className="relative group shrink-0">
              <div
                className={cn(
                  "w-28 h-28 sm:w-24 sm:h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black overflow-hidden cursor-pointer transition-all duration-500 border-4",
                  isDark ? "bg-white/5 border-white/10 group-hover:border-emerald-500/50" : "bg-slate-100 border-white group-hover:border-emerald-500/30 shadow-lg"
                )}
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'image/*';
                  fileInput.onchange = async (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
                    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${profile.id}/avatar.${fileExt}`;
                      const { error: uploadError } = await supabase.storage.from('creator-assets').upload(fileName, file, { cacheControl: '3600', upsert: true });
                      if (uploadError) throw uploadError;
                      const { data: { publicUrl } } = supabase.storage.from('creator-assets').getPublicUrl(fileName);
                      await updateProfileMutation.mutateAsync({ id: profile.id, first_name: profile.first_name || '', last_name: profile.last_name || '', avatar_url: publicUrl });
                      if (refetchProfile) { await refetchProfile(); }
                      toast.success('Profile photo updated!');
                    } catch (error: any) {
                      console.error('Error uploading avatar:', error);
                      toast.error('Failed to upload photo.');
                    }
                  };
                  fileInput.click();
                }}
              >
                {(profile.instagram_profile_photo || profile.avatar_url) && !profilePhotoError ? (
                  <img
                    src={optimizeImage((profile.instagram_profile_photo || profile.avatar_url) ?? '', { width: 400, height: 400 }) ?? ''}
                    alt={formData.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={() => setProfilePhotoError(true)}
                  />
                ) : (
                  <span>{getInitials(formData.name)}</span>
                )}
                
                {/* Camera Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              
              {/* Verification Badge */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-white dark:border-[#0F172A] flex items-center justify-center shadow-lg transform transition-transform group-hover:rotate-12">
                <Check className="w-5 h-5 text-white stroke-[4]" />
              </div>
            </div>

            {/* Identity Details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className={cn("text-3xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                  {formData.name || 'Creator'}
                </h1>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                  {getCreatorTier(profile)}
                </div>
              </div>
              <p className={cn("text-[13px] font-bold opacity-40 uppercase tracking-widest mb-6", isDark ? "text-white" : "text-slate-900")}>
                {formData.creatorCategory} Creator • Protection Active
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                 <button 
                  onClick={() => setShowStats(!showStats)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[13px] font-black tracking-tight transition-all active:scale-95 flex items-center gap-2",
                    showStats 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : (isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  )}
                 >
                   <Eye className="w-4 h-4" />
                   {showStats ? 'Hide Intelligence' : 'Visual Intelligence'}
                 </button>
              </div>
            </div>
          </div>

          {/* Expanded Stats - Intelligence Grid */}
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-10 pt-8 border-t border-white/5"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Deals Active', value: calculatedStats.activeDeals, color: 'text-emerald-500' },
                  { label: 'Total Value', value: `₹${(calculatedStats.totalEarnings / 1000).toFixed(1)}k`, color: 'text-blue-500' },
                  { label: 'Protection Score', value: calculatedStats.protectionScore, color: 'text-purple-500' },
                  { label: 'Network Reach', value: analyticsSummary?.totalViews ? `${(analyticsSummary.totalViews / 1000).toFixed(1)}k` : '---', color: 'text-amber-500' }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-40 mb-2", isDark ? "text-white" : "text-slate-900")}>{stat.label}</span>
                    <span className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Progress Bar - Show only in collab section */}
        {activeSection === 'collab' && profileCompleteness < 100 && (
          <div className="mb-4 p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile {profileCompleteness}% complete</span>
              <span className="text-xs text-muted-foreground">Complete to get +20% more deals</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-info to-primary transition-all duration-500"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>
        )}

        {/* Identity Section */}
        {activeSection === 'profile' && (
          <div className="space-y-6">
            {/* Elite Fundamental Dossier - Cinematic Glass */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "rounded-[32px] p-8 border backdrop-blur-2xl transition-all duration-500 overflow-hidden relative",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-50", isDark ? "text-white" : "text-slate-900")}>Fundamental Dossier</h2>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Official Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                    className={cn(
                      "w-full bg-transparent border-b-2 py-3 text-xl font-bold tracking-tight transition-all outline-none",
                      isDark 
                        ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                        : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Email Contact</label>
                    <div className="flex items-center gap-3 py-3 border-b-2 border-transparent">
                      <Mail className="w-5 h-5 opacity-20" />
                      <span className={cn("text-lg font-bold opacity-40", isDark ? "text-white" : "text-slate-900")}>{formData.email}</span>
                    </div>
                  </div>
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Mobile Uplink</label>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 opacity-20" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('+91')) {
                            value = value.length < 3 ? '+91 ' : '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                          setFormData(prev => ({ ...prev, phone: value }));
                        }}
                        disabled={!editMode}
                        placeholder="+91 98765 43210"
                        className={cn(
                          "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none",
                          isDark 
                            ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                            : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Residential Anchor</label>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-4 opacity-20" />
                    <textarea
                      value={formData.addressLine}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                      disabled={!editMode}
                      placeholder="House/Flat No., Building, Street"
                      rows={2}
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none resize-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Postal Region</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={!editMode}
                      maxLength={6}
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-xl font-black tracking-tighter transition-all outline-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    />
                  </div>
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>City/State Cluster</label>
                    <div className="py-3 text-lg font-bold opacity-40">
                      {formData.city ? `${formData.city}, ${formData.state}` : 'Waiting for Pincode...'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Social Authority - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-[32px] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-500" />
                </div>
                <h2 className={cn("text-[11px] font-black uppercase tracking-[0.2em] opacity-50", isDark ? "text-white" : "text-slate-900")}>Social Authority</h2>
              </div>

              <div className="relative group">
                <label className={cn("text-[10px] font-black uppercase tracking-[0.1em] mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-pink-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Instagram Handle</label>
                <div className="flex items-center gap-3">
                  <span className={cn("text-2xl font-black opacity-20", isDark ? "text-white" : "text-slate-900")}>@</span>
                  <input
                    type="text"
                    value={formData.instagramHandle}
                    onChange={(e) => {
                      const value = e.target.value.replace(/@/g, '').replace(/\s/g, '').toLowerCase();
                      setFormData(prev => ({ ...prev, instagramHandle: value, username: value }));
                    }}
                    disabled={!editMode}
                    placeholder="your_handle"
                    className={cn(
                      "w-full bg-transparent border-b-2 py-3 text-2xl font-black tracking-tighter transition-all outline-none",
                      isDark 
                        ? (editMode ? "border-white/10 focus:border-pink-500 text-white" : "border-transparent text-white/40") 
                        : (editMode ? "border-slate-100 focus:border-pink-500 text-slate-900" : "border-transparent text-slate-400")
                    )}
                  />
                </div>
                {formData.instagramHandle && (
                  <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <p className={cn("text-[11px] font-bold opacity-40 truncate pr-4", isDark ? "text-white" : "text-slate-900")}>
                      creatorarmour.com/{formData.instagramHandle}
                    </p>
                    <button
                      type="button"
                      onClick={() => window.open(`/${formData.instagramHandle}?preview=1`, '_blank')}
                      className="text-emerald-500 text-[11px] font-black uppercase tracking-widest hover:underline shrink-0"
                    >
                      Preview Link
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Achievement Gallery - Elite Grid */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Achievement Gallery</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {userData.achievements.map(achievement => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        "p-6 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden",
                        achievement.earned
                          ? (isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100")
                          : (isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-100")
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6",
                        achievement.earned ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-slate-200 dark:bg-white/10"
                      )}>
                        <Icon className={cn("w-6 h-6", achievement.earned ? "text-white" : "opacity-20")} />
                      </div>
                      <div className={cn("font-black text-[13px] tracking-tight mb-1", achievement.earned ? (isDark ? "text-amber-400" : "text-amber-700") : "opacity-20")}>
                        {achievement.title}
                      </div>
                      {achievement.earned ? (
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Uncovered • {achievement.date}</div>
                      ) : (
                        <div className="w-full mt-4 h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            className="h-full bg-slate-400 dark:bg-white/20"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>




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
          <div className="space-y-6">
            {/* Global Presence Module - Elite Gateway */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Global Presence</h2>
                </div>
                <div className="px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-[10px] font-black uppercase tracking-widest text-amber-500">
                  Brand Gateway Active
                </div>
              </div>

              <div className="space-y-6">
                <p className={cn("text-sm font-bold opacity-60 leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
                  Your unique creator gateway allows brands to bypass DM noise and send professional collaboration requests directly to your dossier.
                </p>

                {(() => {
                  const usernameForLink = normalizeCollabHandle(formData.instagramHandle || profile?.instagram_handle || profile?.username);
                  const hasUsername = usernameForLink.trim() !== '';
                  const collabLink = hasUsername ? buildCollabLink(usernameForLink) : '';
                  const shortLink = hasUsername ? `creatorarmour.com/${usernameForLink}` : '';

                  if (!hasUsername) {
                    return (
                      <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-black text-red-500 uppercase tracking-widest">Gateway Locked</p>
                        <p className="text-xs opacity-60 mt-1">Add your Instagram handle in the Identity section to activate.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className={cn(
                        "p-6 rounded-3xl border transition-all duration-300 group",
                        isDark ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center justify-between gap-4">
                          <code className={cn("text-lg font-black tracking-tighter truncate", isDark ? "text-emerald-400" : "text-emerald-600")}>
                            {shortLink}
                          </code>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(collabLink);
                                setCopiedLink(true);
                                toast.success('Gateway link copied to clipboard');
                                setTimeout(() => setCopiedLink(false), 2000);
                              } catch {
                                toast.error('Uplink failed');
                              }
                            }}
                            className={cn(
                              "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                              isDark ? "bg-white text-black hover:bg-emerald-400" : "bg-slate-900 text-white hover:bg-emerald-500"
                            )}
                          >
                            {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => window.open(`/${usernameForLink}`, '_blank')}
                          className={cn(
                            "py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95",
                            isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Preview Dossier
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const message = encodeURIComponent(`Let's collaborate! View my professional dossier and send a request here: ${collabLink}`);
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                          }}
                          className={cn(
                            "py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 bg-[#25D366] text-white shadow-lg shadow-emerald-500/20"
                          )}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Quick Share
                          </div>
                        </button>
                        </div>
                      </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Optimization Protocol - Nudge Module */}
            {(() => {
              const missingStats: { label: string; field: string }[] = [];
              if (!formData.avgReelViewsManual?.trim()) missingStats.push({ label: 'Reach Intelligence', field: 'avgViews' });
              if (!formData.avgRateReel?.trim()) missingStats.push({ label: 'Rate Authority', field: 'reelRate' });
              if (!formData.collabRegionLabel?.trim()) missingStats.push({ label: 'Regional Focus', field: 'region' });

              if (missingStats.length === 0) return null;

              return (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={cn(
                    "rounded-[2.5rem] p-6 border flex items-start gap-5 transition-all duration-500",
                    isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-100"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className={cn("text-sm font-black uppercase tracking-widest", isDark ? "text-amber-500" : "text-amber-600")}>Optimization Protocol</h3>
                    <p className={cn("text-xs font-bold opacity-60 mt-1", isDark ? "text-white" : "text-slate-900")}>
                      Your public dossier is missing critical authority signals. Brands prioritize creators with complete intelligence modules.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {missingStats.map(stat => (
                        <div key={stat.field} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-40">
                          {stat.label} Pending
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Deal Authority - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Deal Authority</h2>
              </div>

              <div className="space-y-8">
                {/* AI Intelligence Toggle */}
                <div className={cn(
                  "p-6 rounded-[2rem] border transition-all duration-300",
                  isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className={cn("text-[10px] font-black uppercase tracking-widest text-blue-500")}>AI Pricing Protocol</span>
                      </div>
                      <p className={cn("text-xs font-bold opacity-60 leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
                        Allow our intelligence engine to dynamically adjust your rates based on real-time engagement velocity.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(50);
                        setFormData(prev => ({ ...prev, autoPricingEnabled: !prev.autoPricingEnabled }));
                      }}
                      className={cn(
                        "flex-shrink-0 w-14 h-8 rounded-full transition-all duration-300 relative p-1",
                        formData.autoPricingEnabled ? "bg-blue-500" : (isDark ? "bg-white/10" : "bg-slate-200")
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full bg-white shadow-xl transition-transform duration-300",
                        formData.autoPricingEnabled ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <FiverrPackageEditor 
                    templates={formData.dealTemplates}
                    avg_rate_reel={Number(formData.avgRateReel) || profile.avg_rate_reel || 5000}
                    onChange={(templates) => setFormData(prev => ({ ...prev, dealTemplates: templates }))}
                    disabled={!editMode}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Content Ecosystem</label>
                    <select
                      value={formData.creatorCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, creatorCategory: e.target.value }))}
                      disabled={!editMode}
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none appearance-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    >
                      {CREATOR_CATEGORY_OPTIONS.map(option => (
                        <option key={option} value={option} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-emerald-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Base Rate Authority (INR)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black opacity-20">₹</span>
                      <input
                        type="number"
                        value={formData.avgRateReel}
                        onChange={(e) => setFormData(prev => ({ ...prev, avgRateReel: e.target.value }))}
                        disabled={!editMode}
                        className={cn(
                          "w-full bg-transparent border-b-2 py-3 text-xl font-bold tracking-tight transition-all outline-none",
                          isDark 
                            ? (editMode ? "border-white/10 focus:border-emerald-500 text-white" : "border-transparent text-white/40") 
                            : (editMode ? "border-slate-100 focus:border-emerald-500 text-slate-900" : "border-transparent text-slate-400")
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest block opacity-40", isDark ? "text-white" : "text-slate-900")}>Collaboration Preference</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COLLAB_PREFERENCE_OPTIONS.map((option) => {
                      const isSelected = formData.collaborationPreference === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={!editMode}
                          onClick={() => setFormData(prev => ({ ...prev, collaborationPreference: option }))}
                          className={cn(
                            "py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border",
                            isSelected
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : (isDark ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")
                          )}
                        >
                          {option === 'paid' ? 'Paid Only' : option === 'barter' ? 'Barter' : 'Hybrid Flow'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Brand Alignment - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Brand Alignment</h2>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest block opacity-40", isDark ? "text-white" : "text-slate-900")}>Content Niches (Select 5)</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_NICHE_OPTIONS.map((niche) => {
                      const selected = formData.contentNiches.includes(niche);
                      return (
                        <button
                          key={niche}
                          type="button"
                          disabled={!editMode}
                          onClick={() => {
                            if (selected) {
                              setFormData((prev) => ({ ...prev, contentNiches: prev.contentNiches.filter((item) => item !== niche) }));
                            } else if (formData.contentNiches.length < 5) {
                              setFormData((prev) => ({ ...prev, contentNiches: [...prev.contentNiches, niche] }));
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            selected
                              ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                              : (isDark ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")
                          )}
                        >
                          {niche}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-purple-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Reach Authority (Avg Views)</label>
                    <input
                      type="number"
                      value={formData.avgReelViewsManual}
                      onChange={(e) => setFormData(prev => ({ ...prev, avgReelViewsManual: e.target.value }))}
                      disabled={!editMode}
                      placeholder="e.g. 15000"
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-xl font-bold tracking-tight transition-all outline-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-purple-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-purple-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    />
                  </div>

                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40 group-focus-within:opacity-100 group-focus-within:text-purple-500 transition-all", isDark ? "text-white" : "text-slate-900")}>Regional Base</label>
                    <input
                      type="text"
                      value={formData.collabRegionLabel}
                      onChange={(e) => setFormData(prev => ({ ...prev, collabRegionLabel: e.target.value }))}
                      disabled={!editMode}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-xl font-bold tracking-tight transition-all outline-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-purple-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-purple-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    />
                  </div>
                </div>

                <Collapsible open={showAdvancedInsights} onOpenChange={setShowAdvancedInsights}>
                  <CollapsibleTrigger asChild>
                    <button className={cn(
                      "w-full p-4 rounded-2xl flex items-center justify-between transition-all border",
                      isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                    )}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Deep Audience Intelligence</span>
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", showAdvancedInsights && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="relative group">
                        <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Gender Split</label>
                        <input
                          type="text"
                          value={genderSplit}
                          onChange={(e) => setGenderSplit(e.target.value)}
                          disabled={!editMode}
                          placeholder="70% Women • 30% Men"
                          className={cn(
                            "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none",
                            isDark 
                              ? (editMode ? "border-white/10 focus:border-purple-500 text-white" : "border-transparent text-white/40") 
                              : (editMode ? "border-slate-100 focus:border-purple-500 text-slate-900" : "border-transparent text-slate-400")
                          )}
                        />
                      </div>
                      <div className="relative group">
                        <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Age Demographic</label>
                        <select
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value)}
                          disabled={!editMode}
                          className={cn(
                            "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none appearance-none",
                            isDark 
                              ? (editMode ? "border-white/10 focus:border-purple-500 text-white" : "border-transparent text-white/40") 
                              : (editMode ? "border-slate-100 focus:border-purple-500 text-slate-900" : "border-transparent text-slate-400")
                          )}
                        >
                          <option value="" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>Select Range</option>
                          {['18-24', '25-34', '35-44', 'Mixed'].map(range => (
                            <option key={range} value={range} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>{range}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </motion.div>

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

            {/* Operations Intelligence - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Operations Intelligence</h2>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest block opacity-40", isDark ? "text-white" : "text-slate-900")}>Professional Signals (Experience)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: '0', label: 'Genesis' },
                      { key: '3', label: '1-5 Brands' },
                      { key: '12', label: 'Verified' },
                      { key: '25', label: 'Authority' },
                    ].map((option) => {
                      const isSelected = formData.collabBrandsCountOverride === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          disabled={!editMode}
                          onClick={() => setFormData(prev => ({ ...prev, collabBrandsCountOverride: option.key }))}
                          className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            isSelected
                              ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                              : (isDark ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100")
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Active Flux (Ongoing Deals)</label>
                    <select
                      value={ongoingDealsKey}
                      onChange={(e) => {
                        const value = e.target.value;
                        const mapped = value === '0' ? '0' : value === '1-2' ? '2' : value === '3-5' ? '4' : '6';
                        setFormData(prev => ({ ...prev, activeBrandCollabsMonth: mapped }));
                      }}
                      disabled={!editMode}
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none appearance-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-blue-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-blue-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    >
                      <option value="0" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>None yet</option>
                      <option value="1-2" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>1-2 deals</option>
                      <option value="3-5" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>3-5 deals</option>
                      <option value="6+" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>6+ deals</option>
                    </select>
                  </div>

                  <div className="relative group">
                    <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Uplink Capacity (Monthly)</label>
                    <select
                      value={formData.campaignSlotPreset}
                      onChange={(e) => setFormData(prev => ({ ...prev, campaignSlotPreset: e.target.value }))}
                      disabled={!editMode}
                      className={cn(
                        "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none appearance-none",
                        isDark 
                          ? (editMode ? "border-white/10 focus:border-blue-500 text-white" : "border-transparent text-white/40") 
                          : (editMode ? "border-slate-100 focus:border-blue-500 text-slate-900" : "border-transparent text-slate-400")
                      )}
                    >
                      <option value="" className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>Select capacity</option>
                      {COLLAB_CAMPAIGN_SLOT_OPTIONS.map(option => (
                        <option key={option} value={option} className={isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="relative group">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest mb-2 block opacity-40", isDark ? "text-white" : "text-slate-900")}>Portfolio Intelligence (Media Kit URL)</label>
                  <input
                    type="url"
                    value={formData.mediaKitUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaKitUrl: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Link to your portfolio"
                    className={cn(
                      "w-full bg-transparent border-b-2 py-3 text-lg font-bold tracking-tight transition-all outline-none",
                      isDark 
                        ? (editMode ? "border-white/10 focus:border-blue-500 text-white" : "border-transparent text-white/40") 
                        : (editMode ? "border-slate-100 focus:border-blue-500 text-slate-900" : "border-transparent text-slate-400")
                    )}
                  />
                  {isMediaKitMissing && (
                    <p className="text-[10px] font-bold text-blue-500 mt-2 uppercase tracking-widest">Increases premium deal invites</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Elite Command Center - Save & Logout */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 pt-8"
            >
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className={cn(
                  "w-full py-5 rounded-[2rem] text-[15px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl",
                  isDark ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {isSaving ? 'Syncing...' : 'Commit Gateway Changes'}
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutDialog(true)}
                className={cn(
                  "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border",
                  isDark ? "bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10" : "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
                )}
              >
                Disconnect Session
              </button>
            </motion.div>
          </div>
        )}

        {/* Account Section - Security & Protocol */}
        {activeSection === 'account' && (
          <div className="space-y-6 pb-20">
            {/* Response Authority - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <BellRing className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Response Authority</h2>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Instant Deal Alerts</p>
                  </div>
                </div>
                {isPushSubscribed && (
                  <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Active</span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <p className={cn("text-sm font-medium leading-relaxed opacity-60", isDark ? "text-slate-300" : "text-slate-600")}>
                  Synchronize your device with the Creator Armour cloud to receive sub-second alerts for high-priority brand collaborations.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleEnablePushFromAccount}
                    disabled={isPushBusy || !isPushSupported || (!isIOSNeedsInstall && !hasVapidKey)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95",
                      isDark ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    {isPushBusy ? 'Syncing...' : isIOSNeedsInstall ? 'Install to Home' : isPushSubscribed ? 'Refresh Protocol' : 'Initialize Alerts'}
                  </button>

                  {isPushSubscribed && (
                    <button
                      type="button"
                      onClick={handleTestPushFromAccount}
                      disabled={isPushBusy}
                      className={cn(
                        "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border",
                        isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      {isPushBusy ? 'Testing...' : 'Send Test Burst'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Asset Tier - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Asset Tier</h2>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Account Subscription</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-500">Active</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className={cn("text-4xl font-black tracking-tighter mb-1", isDark ? "text-white" : "text-slate-900")}>{userData.subscription.plan}</div>
                    <div className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Next Billing: {userData.subscription.nextBilling}</div>
                  </div>
                  <div className={cn("text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>₹{userData.subscription.amount}<span className="text-sm opacity-40">/mo</span></div>
                </div>

                <div className="flex gap-3">
                  <button className={cn(
                    "flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border",
                    isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"
                  )}>
                    Manage Plan
                  </button>
                  <button className={cn(
                    "flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
                    isDark ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white hover:bg-slate-800"
                  )}>
                    Upgrade
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Defense Protocols - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Defense Protocols</h2>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Security & Privacy</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Lock, label: 'Change Password', sub: 'Last changed 2 months ago' },
                  { icon: Shield, label: 'Two-Factor Authentication', sub: 'Status: Enabled', highlight: true },
                  { icon: Download, label: 'Download Intelligence', sub: 'Export all account data' },
                ].map((item, idx) => (
                  <button key={idx} className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                    isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center">
                        <item.icon className={cn("w-4 h-4", item.highlight ? "text-blue-500" : "text-slate-500")} />
                      </div>
                      <div className="text-left">
                        <div className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5", isDark ? "text-white" : "text-slate-900")}>{item.label}</div>
                        <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{item.sub}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-20" />
                  </button>
                ))}

                <button className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] mt-4",
                  isDark ? "bg-red-500/5 border-red-500/10 hover:bg-red-500/10" : "bg-red-50 border-red-100 hover:bg-red-100"
                )}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-red-500">Purge Account</div>
                      <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-red-500">Permanently remove profile</div>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Support Section - Command Bridge */}
        {activeSection === 'support' && (
          <div className="space-y-6 pb-20">
            {/* Support Intelligence - Glass Card */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "rounded-[2.5rem] p-8 border backdrop-blur-2xl transition-all duration-500",
                isDark ? "bg-white/[0.02] border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"
              )}
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>Command Bridge</h2>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40", isDark ? "text-white" : "text-slate-900")}>Help & Support Intelligence</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: MessageCircle, label: 'Contact Support', sub: 'Chat with the Elite team', primary: true },
                  { icon: HelpCircle, label: 'Intelligence Center', sub: 'FAQs and Protocol Guides' },
                ].map((item, idx) => (
                  <button key={idx} className={cn(
                    "w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98]",
                    item.primary 
                      ? (isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100")
                      : (isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-slate-50 border-slate-100 hover:bg-slate-100")
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.primary ? "bg-amber-500 text-white" : "bg-slate-500/10 text-slate-500")}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className={cn("text-[10px] font-black uppercase tracking-widest mb-0.5", item.primary && "text-amber-500")}>{item.label}</div>
                        <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{item.sub}</div>
                      </div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4", item.primary ? "text-amber-500" : "opacity-20")} />
                  </button>
                ))}

                <button
                  onClick={() => {
                    if (profile?.id) {
                      localStorage.removeItem(`dashboard-tutorial-completed-${profile.id}`);
                      localStorage.removeItem(`dashboard-tutorial-dismissed-${profile.id}`);
                      toast.success('Protocol sequence reset. Re-initializing tutorial...');
                      setTimeout(() => navigate('/creator-dashboard'), 1000);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] mt-4",
                    isDark ? "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10" : "bg-blue-50 border-blue-100 hover:bg-blue-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-0.5 text-blue-500">Restart Training</div>
                      <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest text-blue-500">Guided Dashboard Protocol</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-500/20" />
                </button>
              </div>
            </motion.div>

            {/* Legal Subsection - Minimalist */}
            <div className="px-4 py-8 space-y-4">
              <div className="flex flex-wrap gap-6 justify-center">
                <button type="button" className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Terms of Service</button>
                <button type="button" className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity">Privacy Protocol</button>
              </div>
            </div>
          </div>
        )}

        {/* Final Footer Intelligence */}
        <div className="text-center pt-8 pb-4">
          <div className={cn("text-[10px] font-black tracking-[0.3em] uppercase mb-1", isDark ? "text-white/20" : "text-slate-900/20")}>Creator Armour Elite</div>
          <div className="text-[8px] font-bold opacity-20 uppercase tracking-widest">Version 2.0.4 • Alpha Flux</div>
        </div>

        {/* Final Disconnect - Cinematic */}
        <div className="px-4 pt-4 pb-12">
          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className={cn(
              "w-full py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all active:scale-95 border border-red-500/20 text-red-500 hover:bg-red-500/5",
            )}
          >
            Disconnect Session
          </button>
        </div>
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
