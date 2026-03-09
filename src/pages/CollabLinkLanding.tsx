import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Edit, Plus, Instagram, Youtube, Twitter, Facebook, CheckCircle2, Loader2, ExternalLink, ChevronDown, ChevronUp, ShieldCheck, Rocket, Target, IndianRupee, Package, Mail, Building2, MapPin, Phone, Globe, AtSign, FileText, ImageIcon, Wallet, RefreshCcw, Calendar, TrendingUp, Lock, Clapperboard, Send, FileCheck, BadgeCheck, Clock, PenLine, Zap, Languages, ArrowRight, Users, ChevronRight, Activity, Heart, AlertCircle, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { trackEvent } from '@/lib/utils/analytics';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { getCollabReadiness } from '@/lib/collab/readiness';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';

// Person Schema Component (for structured data)
const PersonSchema = ({ schema }: { schema: any }) => {
  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="person-collab"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'person-collab');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.querySelector('script[data-schema="person-collab"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
};

interface Creator {
  id: string;
  name: string;
  username: string;
  is_registered?: boolean;
  profile_type?: 'verified' | 'public';
  profile_label?: string;
  submission_flow?: 'direct_request' | 'lead_capture';
  category: string | null;
  profile_photo?: string | null;
  followers?: number | null;
  last_instagram_sync?: string | null;
  platforms: Array<{ name: string; handle: string; followers?: number }>;
  bio: string | null;
  open_to_collabs?: boolean;
  content_niches?: string[];
  media_kit_url?: string | null;
  past_brands?: string[];
  recent_campaign_types?: string[];
  avg_reel_views?: number | null;
  avg_likes?: number | null;
  past_brand_count?: number | null;
  audience_gender_split?: string | null;
  top_cities?: string[];
  audience_age_range?: string | null;
  primary_audience_language?: string | null;
  posting_frequency?: string | null;
  active_brand_collabs_month?: number | null;
  campaign_slot_note?: string | null;
  collab_brands_count_override?: number | null;
  collab_response_hours_override?: number | null;
  collab_cancellations_percent_override?: number | null;
  collab_region_label?: string | null;
  collab_audience_fit_note?: string | null;
  collab_recent_activity_note?: string | null;
  collab_audience_relevance_note?: string | null;
  collab_delivery_reliability_note?: string | null;
  collab_engagement_confidence_note?: string | null;
  collab_response_behavior_note?: string | null;
  collab_cta_trust_note?: string | null;
  collab_cta_dm_note?: string | null;
  collab_cta_platform_note?: string | null;
  performance_proof?: {
    median_reel_views?: number | null;
    avg_likes?: number | null;
    captured_at?: string | null;
  } | null;
  suggested_reel_rate?: number | null;
  suggested_paid_range_min?: number | null;
  suggested_paid_range_max?: number | null;
  suggested_barter_value_min?: number | null;
  suggested_barter_value_max?: number | null;
  trust_stats?: {
    brands_count: number;
    completed_deals: number;
    total_deals: number;
    completion_rate: number | null;
    avg_response_hours: number | null;
  };
  // NEW: Qualification & Deal Rules
  min_deal_value?: number | null;
  min_lead_time_days?: number | null;
  typical_story_rate?: number | null;
  typical_post_rate?: number | null;
  premium_production_multiplier?: number | null;
  brand_type_preferences?: string[] | null;
  campaign_type_support?: string[] | null;
  revision_policy?: string | null;
  allow_negotiation?: boolean | null;
  allow_counter_offer?: boolean | null;
  // Deal preference: 'paid_only' | 'barter_only' | 'open_to_both'
  collab_deal_preference?: 'paid_only' | 'barter_only' | 'open_to_both' | null;
  deal_templates?: DealTemplate[] | null;
}

interface DealTemplate {
  id: string;
  label: string;
  icon: string;
  budget: number; // For paid: ₹ amount, for barter: ₹ product value
  type: 'paid' | 'barter';
  category: string;
  description: string;
  deliverables: string[];
  quantities: Record<string, number>;
  deadlineDays: number;
  notes?: string;
}

type CollabType = 'paid' | 'barter' | 'hybrid' | 'both' | 'affiliate';

const isHybridCollab = (value: CollabType) => value === 'hybrid' || value === 'both';

interface FormErrors {
  brandName?: string;
  brandEmail?: string;
  brandAddress?: string;
  brandGstin?: string;
  brandWebsite?: string;
  campaignDescription?: string;
  deliverables?: string;
  budget?: string;
}

// Reserved usernames that should not be used for collab links
const RESERVED_USERNAMES = [
  'admin', 'api', 'blog', 'login', 'signup', 'reset-password', 'about', 'careers',
  'pricing-comparison', 'privacy-policy', 'terms-of-service', 'refund-policy',
  'delete-data', 'sitemap', 'free-legal-check', 'thank-you', 'free-influencer-contract',
  'collaboration-agreement-generator', 'plan', 'creators', 'creator', 'collab',
  'dashboard-white-preview', 'dashboard-preview', 'p', 'old-home', 'home',
  'consumer-complaints', 'creator-dashboard', 'creator-profile', 'creator-analytics',
  'creator-contracts', 'creator-payments', 'creator-tax', 'creator-onboarding',
  'brand-directory', 'brand-opportunities', 'partner-program', 'ai-pitch-generator',
  'documents-vault', 'insights', 'messages', 'notifications', 'client-dashboard',
  'client-profile', 'client-subscription', 'client-cases', 'client-documents',
  'client-consultations', 'admin-dashboard', 'admin-documents', 'admin-cases',
  'admin-clients', 'admin-consultations', 'admin-subscriptions', 'admin-activity-log',
  'admin-profile', 'admin-influencers', 'admin-discovery', 'ca-dashboard'
];

const DELIVERABLE_OPTIONS = [
  { label: 'Reel', value: 'Instagram Reel', icon: <span className="mr-1.5">🎬</span> },
  { label: 'Story', value: 'Story', icon: <span className="mr-1.5">📱</span> },
  { label: 'Post', value: 'Post', icon: <span className="mr-1.5">📷</span> },
  { label: 'Unboxing', value: 'Unboxing Video', icon: <span className="mr-1.5">📦</span> },
  { label: 'Review', value: 'Review Post', icon: <span className="mr-1.5">⭐</span> },
  { label: 'Giveaway', value: 'Giveaway', icon: <span className="mr-1.5">🎁</span> },
  { label: 'YouTube', value: 'YouTube Video', icon: <span className="mr-1.5">▶</span> },
  { label: 'Custom', value: 'Custom', icon: <Target className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
];

const PRODUCT_CATEGORY_OPTIONS = [
  { value: 'fashion', label: '👗 Fashion & Clothing' },
  { value: 'beauty', label: '💄 Beauty & Skincare' },
  { value: 'food', label: '🍕 Food & Beverage' },
  { value: 'tech', label: '📱 Tech & Gadgets' },
  { value: 'app', label: '💻 App / Software' },
  { value: 'fitness', label: '💪 Fitness & Health' },
  { value: 'home', label: '🏠 Home & Living' },
  { value: 'travel', label: '✈️ Travel & Hospitality' },
  { value: 'finance', label: '💰 Finance & BFSI' },
  { value: 'gaming', label: '🎮 Gaming' },
  { value: 'kids', label: '🧸 Kids & Parenting' },
  { value: 'other', label: '📦 Other' },
];

// const CAMPAIGN_CATEGORY_OPTIONS = [
//   'Fashion',
//   'Beauty',
//   'Tech',
//   'Food',
//   'Travel',
//   'Fitness',
//   'Finance',
//   'Lifestyle',
//   'Education',
//   'Entertainment',
//   'Gaming',
//   'Parenting',
//   'General',
// ];

const getEngagementRange = (followers?: number | null, avgReelViews?: number | null) => {
  if (!followers || followers <= 0 || !avgReelViews || avgReelViews < 0) {
    return 'Growing Audience';
  }
  const engagementRate = avgReelViews / followers;
  if (engagementRate < 0.1) return 'Growing Audience';
  if (engagementRate <= 0.25) return 'Engaged Audience';
  return 'High Viewer Interaction';
};

const formatAudienceGender = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const womenMatch = normalized.match(/(\d+)\s*%?\s*women?/i);
  const menMatch = normalized.match(/(\d+)\s*%?\s*men?/i);
  const women = womenMatch ? Number(womenMatch[1]) : null;
  const men = menMatch ? Number(menMatch[1]) : null;

  if (women !== null && men !== null) {
    return [`${women}% Women`, `${men}% Men`];
  }
  if (women !== null) {
    const inferredMen = Math.max(0, 100 - women);
    return [`${women}% Women`, `${inferredMen}% Men`];
  }
  if (men !== null) {
    const inferredWomen = Math.max(0, 100 - men);
    return [`${inferredWomen}% Women`, `${men}% Men`];
  }
  return [normalized];
};

const toTitleCase = (value: string) => {
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatAudienceLanguage = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized
    .split(/[,/]+/)
    .map((part) => toTitleCase(part.trim()))
    .filter(Boolean)
    .join(' / ');
};

const formatAudienceCities = (cities?: string[] | null) => {
  if (!Array.isArray(cities)) return [];
  return cities
    .map((city) => toTitleCase((city || '').trim()))
    .filter(Boolean);
};

const buildLocalPreviewCreator = (handle: string): Creator => ({
  id: 'local-preview-creator',
  name: 'Pratyush',
  username: handle,
  is_registered: true,
  profile_type: 'verified',
  profile_label: 'Verified Creator Profile',
  submission_flow: 'direct_request',
  category: 'Lifestyle',
  profile_photo: null,
  followers: 10200,
  platforms: [{ name: 'Instagram', handle, followers: 10200 }],
  bio: 'Creator profile preview mode (local only)',
  open_to_collabs: true,
  content_niches: ['Food', 'Lifestyle', 'Gaming'],
  media_kit_url: 'https://example.com/media-kit',
  past_brands: ['Sample Brand'],
  recent_campaign_types: ['Product Launch'],
  avg_reel_views: 12200,
  avg_likes: 800,
  past_brand_count: 11,
  audience_gender_split: '70 women',
  top_cities: ['noida', 'delhi', 'ghaziabad'],
  audience_age_range: '18-24',
  primary_audience_language: 'hindi',
  posting_frequency: '3-4 times/week',
  active_brand_collabs_month: 2,
  campaign_slot_note: 'Limited slots this month',
  collab_brands_count_override: 11,
  collab_response_hours_override: 3,
  collab_cancellations_percent_override: 0,
  collab_region_label: 'NCR (Delhi Region)',
  collab_audience_fit_note: 'Works best for targeted audience campaigns.',
  collab_recent_activity_note: 'Posting consistently',
  collab_audience_relevance_note: 'Strong relevance for North India audience',
  collab_delivery_reliability_note: 'Proven delivery across past campaigns',
  collab_engagement_confidence_note: 'Above-average engagement for creator size',
  collab_response_behavior_note: 'Most brands receive response same day',
  collab_cta_trust_note: 'Creator notified instantly — no DM required.',
  collab_cta_dm_note: 'No DMs required — creator replies here.',
  collab_cta_platform_note: 'Direct collaboration — no agency middle layer',
  trust_stats: {
    brands_count: 11,
    completed_deals: 11,
    total_deals: 11,
    completion_rate: 100,
    avg_response_hours: 3,
  },
});

const getAudienceRegionLabel = (cities: string[]) => {
  if (!cities.length) return null;
  const normalized = cities.map((city) => city.toLowerCase());
  const hasNcr = normalized.some((city) =>
    ['delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad'].some((key) => city.includes(key))
  );
  const hasTier1 = normalized.some((city) =>
    ['mumbai', 'bengaluru', 'bangalore', 'chennai', 'hyderabad', 'pune', 'kolkata', 'ahmedabad'].some((key) => city.includes(key))
  );

  if (hasNcr && hasTier1) return 'NCR (Delhi Region) / Tier 1';
  if (hasNcr) return 'NCR (Delhi Region)';
  if (hasTier1) return 'Tier 1';
  return null;
};

const isScrapedInstagramBio = (bio?: string | null) => {
  if (!bio) return false;
  const normalized = bio.toLowerCase();
  return (
    (normalized.includes('followers') &&
      normalized.includes('following') &&
      normalized.includes('posts')) ||
    normalized.includes('see instagram photos and videos')
  );
};

const withNeutralPrefix = (text: string, prefix: string) => {
  const normalized = text.trim();
  if (!normalized) return normalized;
  if (/^(currently|works with|typically|open to|reviewing|prefer)/i.test(normalized)) {
    return normalized;
  }
  return `${prefix}${normalized}`;
};

const CollabLinkLanding = () => {
  const { user } = useSession();
  const updateProfileMutation = useUpdateProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const [editMode, setEditMode] = useState(() => searchParams.get('edit') === 'true');

  useEffect(() => {
    if (editMode && searchParams.get('edit') !== 'true') {
      setSearchParams(prev => { prev.set('edit', 'true'); return prev; }, { replace: true });
    } else if (!editMode && searchParams.get('edit') === 'true') {
      setSearchParams(prev => { prev.delete('edit'); return prev; }, { replace: true });
    }
  }, [editMode, setSearchParams, searchParams]);

  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitChecklistStep, setSubmitChecklistStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // ── Force light mode while this page is mounted ──────────────────────────
  // The creator dashboard may set `dark` on <html> via class-based dark mode.
  // CollabLinkLanding is a light-only page. Remove dark class on mount and
  // restore it (if the system prefers dark) when navigating away.
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.remove('dark');
    return () => {
      // Restore dark if it was set before entering this page
      if (hadDark) html.classList.add('dark');
    };
  }, []);

  // Check if username is reserved (redirect to 404 if so)
  useEffect(() => {
    if (username && RESERVED_USERNAMES.includes(username.toLowerCase())) {
      navigate('/404', { replace: true });
    }
  }, [username, navigate]);

  // Form state
  const [collabType, setCollabType] = useState<CollabType>('paid');
  const [brandName, setBrandName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandAddress, setBrandAddress] = useState('');
  const [brandGstin, setBrandGstin] = useState('');
  const [isGstLookupLoading, setIsGstLookupLoading] = useState(false);
  const [gstLookupError, setGstLookupError] = useState<string | null>(null);
  const [brandPhone, setBrandPhone] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [brandInstagram, setBrandInstagram] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [exactBudget, setExactBudget] = useState('');
  const [barterValue, setBarterValue] = useState('');
  const [barterProductName, setBarterProductName] = useState('');
  const [barterProductCategory, setBarterProductCategory] = useState('');
  const [hybridCashBudget, setHybridCashBudget] = useState('');
  const [hybridProductValue, setHybridProductValue] = useState('');
  const [campaignCategory, setCampaignCategory] = useState('General');
  const [barterProductImageUrl, setBarterProductImageUrl] = useState<string | null>(null);
  const [barterImageUploading, setBarterImageUploading] = useState(false);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandLogoUploading, setBrandLogoUploading] = useState(false);
  const [campaignDescription, setCampaignDescription] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deliverableQuantities, setDeliverableQuantities] = useState<Record<string, number>>({});
  const [usageRights, setUsageRights] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [offerExpiry, setOfferExpiry] = useState('');
  const [authorizedSignerName, setAuthorizedSignerName] = useState('');
  const [authorizedSignerRole, setAuthorizedSignerRole] = useState('');
  const [usageDuration, setUsageDuration] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [approvalSlaHours, setApprovalSlaHours] = useState('');
  const [shippingTimelineDays, setShippingTimelineDays] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [showCommercialTerms, setShowCommercialTerms] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [showOptionalBrandDetails, setShowOptionalBrandDetails] = useState(false);
  const [hasStartedOffer, setHasStartedOffer] = useState(false);
  const [showMobileAudienceDetails, setShowMobileAudienceDetails] = useState(false);
  // const [showAdvancedMobileOptions, setShowAdvancedMobileOptions] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const readinessBadgeRef = useRef<HTMLDivElement | null>(null);
  const [readinessBadgeSparkle, setReadinessBadgeSparkle] = useState(false);

  // Save and continue later
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [saveDraftSubmitting, setSaveDraftSubmitting] = useState(false);
  const [newNicheInput, setNewNicheInput] = useState('');
  const [showCustomFlow, setShowCustomFlow] = useState(false);

  // Deal Templates State (Moved up to fix Hook Order violations)
  const [localDealTemplates, setLocalDealTemplates] = useState<DealTemplate[]>([]);
  const [isEditingTemplates, setIsEditingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DealTemplate | null>(null);

  useEffect(() => {
    if (creator) {
      if (creator.deal_templates && creator.deal_templates.length > 0) {
        setLocalDealTemplates(creator.deal_templates.slice(0, 3));
      } else {
        // Generate Default Templates based on reel rate
        const suggestedRate = creator.suggested_reel_rate || (creator as any).avg_rate_reel || 5000;
        const reelRate = suggestedRate;

        const defaultTemplates: DealTemplate[] = [
          {
            id: 'reel_deal',
            label: 'Reel Deal',
            icon: '🎬',
            budget: Math.max(reelRate - 1, 999),
            type: 'paid',
            category: creator.category || 'Lifestyle',
            description: '1 High-quality Instagram Reel with professional hooks and brand tagging.',
            deliverables: ['Reel'],
            quantities: { 'Reel': 1 },
            deadlineDays: creator.min_lead_time_days || 7,
            notes: 'Includes 1 revision. Collaborative post included.'
          },
          {
            id: 'engagement_package',
            label: 'Engagement Package',
            icon: '🔥',
            budget: Math.max(Math.round(reelRate * 1.5) - 1, 1499),
            type: 'paid',
            category: creator.category || 'Lifestyle',
            description: '1 Reel + 2 Engagement Stories to maximize reach and drive action.',
            deliverables: ['Reel', 'Story'],
            quantities: { 'Reel': 1, 'Story': 2 },
            deadlineDays: creator.min_lead_time_days || 10,
            notes: 'Stories include direct link + Polls for engagement.'
          },
          {
            id: 'product_review',
            label: 'Product Review',
            icon: '📦',
            budget: Math.max(1999, Math.round(reelRate * 0.5) - 1),
            type: 'barter',
            category: creator.category || 'Lifestyle',
            description: 'In-depth product unboxing and review with 1 story mention.',
            deliverables: ['Unboxing Video', 'Story'],
            quantities: { 'Unboxing Video': 1, 'Story': 1 },
            deadlineDays: creator.min_lead_time_days || 14,
            notes: 'Product must be shipped before shoot. Honest review only.'
          }
        ];
        setLocalDealTemplates(defaultTemplates);
      }
    }
  }, [creator]);


  const isOwner = useMemo(() => {
    return Boolean(user?.id && creator?.id && user.id === creator.id);
  }, [user?.id, creator?.id]);

  const isDeadlineProvided = Boolean(deadline);
  const isBudgetProvided = collabType === 'affiliate' ? true : collabType === 'paid' ? Number(exactBudget) > 0 : collabType === 'barter' ? Number(barterValue) > 0 : collabType === 'hybrid' ? (Number(exactBudget) > 0 && Number(barterValue) > 0) : true;

  const isStep1Ready = Boolean(collabType);
  const isStep2Ready = deliverables.length > 0;
  const isStep3Ready = isBudgetProvided;
  const isStep4Ready = Boolean(campaignCategory && campaignDescription.trim().length >= 20 && isDeadlineProvided);
  const isValidBrandEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail);
  const isStep5Ready = Boolean(brandName.trim() && isValidBrandEmail && brandAddress.trim().length >= 15);

  const completionChecks = useMemo(() => ([
    { label: 'Deal Type', complete: isStep1Ready },
    { label: 'Content', complete: isStep2Ready },
    { label: 'Budget', complete: isStep3Ready },
    { label: 'Campaign Goal', complete: isStep4Ready },
    { label: 'Brand Details', complete: isStep5Ready },
  ]), [
    isStep1Ready,
    isStep2Ready,
    isStep3Ready,
    isStep4Ready,
    isStep5Ready,
  ]);

  const [showSubmittingTrust, setShowSubmittingTrust] = useState(false);
  const submittingChecklist = [
    'Verifying brand identity...',
    'Reviewing deliverables set...',
    'Generating secure contract...',
    'Securing payload for transmission...',
  ];

  const typeSectionTitle = 'bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent';
  const typeLabel = 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent';
  const ctaStepStatus = !hasStartedOffer ? 'create' : currentStep < 5 ? 'next' : 'send';
  const ctaLabel = ctaStepStatus === 'create' ? 'Send Collaboration Proposal' : ctaStepStatus === 'next' ? (currentStep === 2 ? 'Continue to Legal Terms' : `Next: Step ${currentStep + 1}`) : 'Send Collaboration Proposal';
  const ctaIcon = ctaStepStatus === 'send'
    ? <Send className="h-4 w-4" />
    : <Rocket className="h-4 w-4" />;
  const ctaHelper = ctaStepStatus === 'send'
    ? 'Legally binding contract will be generated'
    : '50+ brands have collaborated through Creator Armour';
  const inputClass = 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-400 transition-all rounded-xl';

  const isCampaignDescriptionValid = campaignDescription.trim().length >= 20;
  const isContactReady = isStep5Ready;
  const isCoreReady = isStep1Ready && isStep2Ready && isStep3Ready && isStep4Ready;

  const typePageTitle = 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent';

  useEffect(() => {
    if (!showSubmittingTrust) {
      setSubmitChecklistStep(0);
      return;
    }
    setSubmitChecklistStep(0);
    const interval = window.setInterval(() => {
      setSubmitChecklistStep((prev) => (prev < submittingChecklist.length - 1 ? prev + 1 : prev));
    }, 220);
    return () => window.clearInterval(interval);
  }, [showSubmittingTrust]);

  // Readiness badge animation (must run before any conditional returns to preserve hook order)
  useEffect(() => {
    if (!creator || !readinessBadgeRef.current || typeof window === 'undefined') return;

    const badgeEl = readinessBadgeRef.current;
    const keyId = creator.username || creator.id;
    if (!keyId) return;

    const previewAvgReelViews = creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null;
    const previewAvgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null;
    const previewAudienceCities = (creator.top_cities || []);
    const previewAudienceRegionLabel = creator.collab_region_label?.trim() || getAudienceRegionLabel(formatAudienceCities(previewAudienceCities));
    const previewTrustStats = creator.trust_stats;

    const readiness = getCollabReadiness({
      instagramHandle: creator.platforms.find((p) => p.name.toLowerCase() === 'instagram')?.handle || creator.username,
      instagramLinked: Boolean(creator.last_instagram_sync),
      category: creator.category,
      niches: creator.content_niches,
      topCities: creator.top_cities,
      audienceGenderSplit: creator.audience_gender_split,
      primaryAudienceLanguage: creator.primary_audience_language,
      postingFrequency: creator.posting_frequency,
      avgReelViews: previewAvgReelViews,
      avgLikes: previewAvgLikes,
      openToCollabs: creator.open_to_collabs,
      avgRateReel: (creator as any).avg_rate_reel || (creator as any).avg_reel_rate,
      suggestedReelRate: creator.suggested_reel_rate,
      suggestedBarterValueMin: creator.suggested_barter_value_min,
      suggestedBarterValueMax: creator.suggested_barter_value_max,
      regionLabel: creator.collab_region_label || previewAudienceRegionLabel,
      mediaKitUrl: creator.media_kit_url,
      firstDealCount: creator.past_brand_count || creator.collab_brands_count_override || previewTrustStats?.completed_deals || 0,
    });

    const currentRank = readiness.rank;
    const lastRankKey = `ca:readiness:last:${keyId}`;
    const seenStateKey = `ca:readiness:seen:${keyId}:${readiness.stageKey}`;
    const storedRank = Number(window.localStorage.getItem(lastRankKey) || '0');
    const seenCurrentState = window.localStorage.getItem(seenStateKey) === '1';
    const shouldAnimate = currentRank > storedRank || !seenCurrentState;

    if (!shouldAnimate) return;

    if (storedRank >= 3 && currentRank === 4) {
      setReadinessBadgeSparkle(true);
      window.setTimeout(() => setReadinessBadgeSparkle(false), 800);
      badgeEl.animate(
        [
          { opacity: 0.4, transform: 'translateY(8px) scale(0.97)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          { opacity: 1, transform: 'translateY(0) scale(1.02)', boxShadow: '0 0 30px rgba(139,92,246,0.35)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    } else if (storedRank >= 2 && currentRank === 3) {
      badgeEl.animate(
        [
          { opacity: 0.5, transform: 'translateY(6px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(-1px) scale(1.03)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    } else {
      badgeEl.animate(
        [
          { opacity: 0.3, transform: 'scale(0.97)' },
          { opacity: 1, transform: 'scale(1.03)' },
          { opacity: 1, transform: 'scale(1)' },
        ],
        { duration: 360, easing: 'ease-out' }
      );
    }

    window.localStorage.setItem(lastRankKey, String(Math.max(storedRank, currentRank)));
    window.localStorage.setItem(seenStateKey, '1');
  }, [creator]);

  const handleInlineProfileUpdate = async (field: string, value: any) => {
    if (!creator?.id) return;

    // Update local state for immediate feedback
    setCreator(prev => prev ? { ...prev, [field]: value } : null);

    try {
      let updatePayload: any = { id: creator.id };

      if (field === 'name') {
        const nameStr = String(value || '').trim();
        const spaceIndex = nameStr.indexOf(' ');
        if (spaceIndex === -1) {
          updatePayload.first_name = nameStr;
          updatePayload.last_name = '';
        } else {
          updatePayload.first_name = nameStr.substring(0, spaceIndex);
          updatePayload.last_name = nameStr.substring(spaceIndex + 1);
        }
      } else {
        updatePayload[field] = value;
      }

      await updateProfileMutation.mutateAsync(updatePayload);
      toast.success('Field updated successfully');
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      toast.error(`Failed to update ${field}`);
    }
  };

  // Build form payload for save-draft / resume
  const getDraftFormData = () => ({
    collabType,
    brandName,
    brandEmail,
    brandAddress,
    brandGstin,
    brandPhone,
    brandWebsite,
    brandInstagram,
    budgetRange,
    exactBudget,
    barterValue,
    barterProductName,
    barterProductCategory,
    hybridCashBudget,
    hybridProductValue,
    campaignCategory,
    barterProductImageUrl,
    campaignDescription,
    deliverables,
    usageRights,
    deadline,
    offerExpiry,
    authorizedSignerName,
    authorizedSignerRole,
    usageDuration,
    paymentTerms,
    approvalSlaHours,
    shippingTimelineDays,
    cancellationPolicy,
  });

  const applyDraftFormData = (data: Record<string, unknown>) => {
    if (typeof data.collabType === 'string' && ['paid', 'barter', 'hybrid', 'both'].includes(data.collabType)) {
      setCollabType(data.collabType as CollabType);
    }
    if (typeof data.brandName === 'string') setBrandName(data.brandName);
    if (typeof data.brandEmail === 'string') setBrandEmail(data.brandEmail);
    if (typeof data.brandAddress === 'string') setBrandAddress(data.brandAddress);
    if (typeof data.brandGstin === 'string') setBrandGstin(data.brandGstin);
    if (typeof data.brandPhone === 'string') setBrandPhone(data.brandPhone);
    if (typeof data.brandWebsite === 'string') setBrandWebsite(data.brandWebsite);
    if (typeof data.brandInstagram === 'string') setBrandInstagram(data.brandInstagram);
    if (typeof data.budgetRange === 'string') setBudgetRange(data.budgetRange);
    if (typeof data.exactBudget === 'string') setExactBudget(data.exactBudget);
    if (typeof data.barterValue === 'string') setBarterValue(data.barterValue);
    if (typeof data.barterProductName === 'string') setBarterProductName(data.barterProductName);
    if (typeof data.barterProductCategory === 'string') setBarterProductCategory(data.barterProductCategory);
    if (typeof data.hybridCashBudget === 'string') setHybridCashBudget(data.hybridCashBudget);
    if (typeof data.hybridProductValue === 'string') setHybridProductValue(data.hybridProductValue);
    if (typeof data.campaignCategory === 'string') setCampaignCategory(data.campaignCategory);
    if (typeof data.barterProductImageUrl === 'string') setBarterProductImageUrl(data.barterProductImageUrl || null);
    if (typeof data.campaignDescription === 'string') setCampaignDescription(data.campaignDescription);
    if (Array.isArray(data.deliverables)) setDeliverables(data.deliverables.filter((d): d is string => typeof d === 'string'));
    if (typeof data.usageRights === 'boolean') setUsageRights(data.usageRights);
    if (typeof data.deadline === 'string') setDeadline(data.deadline);
    if (typeof data.offerExpiry === 'string') setOfferExpiry(data.offerExpiry);
    if (typeof data.authorizedSignerName === 'string') setAuthorizedSignerName(data.authorizedSignerName);
    if (typeof data.authorizedSignerRole === 'string') setAuthorizedSignerRole(data.authorizedSignerRole);
    if (typeof data.usageDuration === 'string') setUsageDuration(data.usageDuration);
    if (typeof data.paymentTerms === 'string') setPaymentTerms(data.paymentTerms);
    if (typeof data.approvalSlaHours === 'string') setApprovalSlaHours(data.approvalSlaHours);
    if (typeof data.shippingTimelineDays === 'string') setShippingTimelineDays(data.shippingTimelineDays);
    if (typeof data.cancellationPolicy === 'string') setCancellationPolicy(data.cancellationPolicy);
  };

  // Demo data prefill function
  const fillDemoData = () => {
    setBrandName('Demo Brand Co.');
    setBrandEmail('demo@brandco.com');
    setBrandAddress('123 Business Park, Andheri East, Mumbai, Maharashtra 400069');
    setBrandGstin('27AABCU9603R1ZX');
    setBrandPhone('+91 98765 43210');
    setBrandWebsite('https://www.demobrandco.com');
    setBrandInstagram('@demobrandco');
    setCollabType('paid');
    setCampaignCategory('Lifestyle');
    setBudgetRange('10000-25000');
    setExactBudget('15000');
    setCampaignDescription('We are launching a new sustainable fashion line and would love to collaborate with you on creating authentic content that showcases our eco-friendly products. Our campaign focuses on promoting conscious consumerism and we believe your content style aligns perfectly with our brand values.');
    setDeliverables(['Instagram Reel', 'Post', 'Story']);
    setUsageRights(true);
    setAuthorizedSignerName('Aman Gupta');
    setAuthorizedSignerRole('Marketing Manager');
    setUsageDuration('90 days');
    setPaymentTerms('50% advance, 50% within 7 days of posting');
    setApprovalSlaHours('48');
    setShippingTimelineDays('3');
    setCancellationPolicy('If canceled after signing, approved production costs are payable.');
    // Set deadline to 2 weeks from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setDeadline(futureDate.toISOString().split('T')[0]);
    setErrors({});
    toast.success('Demo data filled! You can now test the form submission.');
  };

  const applyStandardTerms = () => {
    setApprovalSlaHours((prev) => prev || '48');
    setShippingTimelineDays((prev) => prev || '5');
    setUsageDuration((prev) => prev || '90 days');
    setPaymentTerms((prev) => prev || '50% advance, balance within 7 days of posting');
    setCancellationPolicy((prev) => prev || 'If canceled after signing, approved production costs are payable.');
    toast.success('Standard commercial terms applied');
  };

  // Auto-fill demo data for preview/design mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const normalizedUsername = (username || '').toLowerCase().trim();
    const isPreviewRoute = normalizedUsername === 'preview' || urlParams.get('preview') === '1';
    if (urlParams.get('demo') === 'true' || isPreviewRoute) {
      fillDemoData();
    }
  }, [username]);

  // No longer need local getApiBaseUrl helper as it's imported from @/lib/utils/api


  // Fetch company name and address from GST by GSTIN
  const handleGstLookup = async () => {
    const gstin = brandGstin.trim().toUpperCase();
    if (!gstin || gstin.length !== 15) {
      setGstLookupError('Please enter a valid 15-digit GSTIN first');
      return;
    }
    if (!/^[0-9A-Z]{15}$/.test(gstin)) {
      setGstLookupError('GSTIN must be 15 characters (letters and numbers only)');
      return;
    }
    setIsGstLookupLoading(true);
    setGstLookupError(null);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/gst/lookup?gstin=${encodeURIComponent(gstin)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      let data: { success?: boolean; data?: { legalName?: string; address?: string; state?: string }; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Server returned non-JSON (e.g. 502/503 HTML from proxy)
        if (response.status === 502 || response.status === 503) {
          setGstLookupError('GST lookup is temporarily unavailable. Please enter company name and address manually.');
          toast.error('GST lookup is temporarily unavailable. Please enter details manually.');
        } else {
          setGstLookupError('Failed to lookup GST data. Please try again or enter details manually.');
          toast.error('Failed to lookup GST data. Please enter details manually.');
        }
        return;
      }
      if (!response.ok) {
        const msg = data.error || (response.status === 502 || response.status === 503
          ? 'GST lookup is temporarily unavailable. Please enter company name and address manually.'
          : 'GST lookup failed. Enter details manually.');
        setGstLookupError(msg);
        toast.error(msg);
        return;
      }
      if (!data.success || !data.data) {
        setGstLookupError(data.error || 'GST lookup failed. Enter details manually.');
        toast.error(data.error || 'GST lookup failed. Enter details manually.');
        return;
      }
      const { legalName, address, state } = data.data;
      if (legalName?.trim()) setBrandName(legalName.trim());
      if (address?.trim()) {
        const fullAddress = state?.trim() ? `${address.trim()}, ${state.trim()}` : address.trim();
        setBrandAddress(fullAddress);
      }
      setBrandGstin(gstin);
      setErrors((prev) => ({ ...prev, brandName: '', brandAddress: '', brandGstin: '' }));
      toast.success('Company name and address filled from GST');
    } catch (err: any) {
      const msg = err?.message || 'Failed to lookup GST data. Please try again or enter details manually.';
      setGstLookupError(msg);
      toast.error(msg);
    } finally {
      setIsGstLookupLoading(false);
    }
  };

  // Upload barter product image and store public URL
  const handleBarterImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !username) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    setBarterImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/collab/${encodeURIComponent(username)}/upload-barter-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.url) {
        setBarterProductImageUrl(data.url);
        toast.success('Product image uploaded.');
      } else {
        toast.error(data.error || 'Failed to upload image.');
      }
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setBarterImageUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !username) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, SVG, or GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB.');
      return;
    }
    setBrandLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/collab/${encodeURIComponent(username)}/upload-brand-logo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.url) {
        setBrandLogoUrl(data.url);
        toast.success('Brand logo uploaded.');
      } else {
        toast.error(data.error || 'Failed to upload logo.');
      }
    } catch {
      toast.error('Failed to upload logo.');
    } finally {
      setBrandLogoUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Fetch creator profile (with timeout so page doesn't stay stuck on spinner)
  const CREATOR_FETCH_TIMEOUT_MS = 55000;

  useEffect(() => {
    if (!username) return;

    const normalizedUsername = decodeURIComponent(username).trim().toLowerCase();
    const previewMode = searchParams.get('preview') === '1' || normalizedUsername === 'preview';
    if (previewMode) {
      setCreator(buildLocalPreviewCreator(normalizedUsername || 'preview'));
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CREATOR_FETCH_TIMEOUT_MS);

    // Track if it's taking unusually long (typical for Render cold starts)
    const warmingTimer = setTimeout(() => {
      setIsWarmingUp(true);
    }, 10000);

    const fetchCreator = async () => {
      const normalizedUsername = decodeURIComponent(username).trim();
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/api/collab/${encodeURIComponent(normalizedUsername)}`;

      console.log('[CollabLinkLanding] Fetching creator:', {
        originalUsername: username,
        normalizedUsername,
        apiUrl,
        currentUrl: window.location.href,
        hash: window.location.hash,
      });

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[CollabLinkLanding] API error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            username: normalizedUsername,
            apiUrl,
          });

          if (response.status === 404) {
            // Don't redirect immediately - show error state instead
            setLoading(false);
            setError(`Creator "${normalizedUsername}" not found. Please check the username and try again.`);
            toast.error(`Creator "${normalizedUsername}" not found. Please check the username and try again.`);
            return;
          }

          // For other errors, show error but don't redirect
          let errorMessage = errorData.error || 'Failed to load creator profile';
          if (response.status === 503 || errorData?.code === 'UPSTREAM_CONNECTIVITY_ISSUE') {
            errorMessage = 'Profile service is temporarily unreachable. Please retry in a minute, or switch DNS/VPN.';
          }
          console.error('[CollabLinkLanding] Error:', errorMessage);
          setLoading(false);
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        const data = await response.json();

        if (data.success && data.creator) {
          console.log('[CollabLinkLanding] Creator loaded successfully:', data.creator);
          setCreator(data.creator);
          trackEvent('collab_link_viewed', { username: normalizedUsername });
          // Track page view event (anonymous, no auth required)
          try {
            // Extract UTM parameters from URL
            const urlParams = new URLSearchParams(window.location.search);
            const utmSource = urlParams.get('utm_source');
            const utmMedium = urlParams.get('utm_medium');
            const utmCampaign = urlParams.get('utm_campaign');

            const apiBaseUrl = getApiBaseUrl();
            const trackResponse = await fetch(`${apiBaseUrl}/api/collab-analytics/track`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                creator_username: normalizedUsername,
                event_type: 'view',
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null,
              }),
            });

            if (!trackResponse.ok) {
              const trackErrorData = await trackResponse.json().catch(() => ({ error: 'Unknown error' }));
              console.error('[CollabLinkLanding] View tracking failed:', trackResponse.status, trackErrorData);
            } else {
              const trackData = await trackResponse.json().catch(() => null);
              if (import.meta.env.DEV) {
                console.log('[CollabLinkLanding] View tracked successfully:', trackData);
              }
            }
          } catch (trackError) {
            // Log error but don't break the user experience
            console.error('[CollabLinkLanding] Failed to track view:', trackError);
          }
        } else {
          console.error('[CollabLinkLanding] Invalid response:', data);
          setLoading(false);
          const errorMsg = data.error || 'Creator not found';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          setError('Request timed out. Make sure the server is running at ' + apiBaseUrl + ' and try again.');
          toast.error('Request timed out. Check that the API server is running.');
        } else {
          console.error('[CollabLinkLanding] Fetch error:', {
            error,
            message: error?.message,
            username: normalizedUsername,
            apiUrl,
          });
          let errorMsg = 'Failed to load creator profile. Please try again later.';
          if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
            errorMsg = 'Unable to connect. Is the server running at ' + apiBaseUrl + '?';
          }
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } finally {
        clearTimeout(timeoutId);
        clearTimeout(warmingTimer);
        setLoading(false);
      }
    };

    fetchCreator();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
      clearTimeout(warmingTimer);
    };
  }, [username, searchParams]);

  // Resume draft from ?resume= token (after creator is loaded)
  useEffect(() => {
    const resumeToken = searchParams.get('resume');
    const normalizedUsername = username?.toLowerCase().trim();
    if (!resumeToken || !normalizedUsername || !creator) return;

    const loadDraft = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(
          `${apiBaseUrl}/api/collab/${encodeURIComponent(normalizedUsername)}/resume?token=${encodeURIComponent(resumeToken)}`
        );
        const data = await res.json();
        if (data.success && data.formData && typeof data.formData === 'object') {
          applyDraftFormData(data.formData);
          toast.success('Form restored. You can continue where you left off.');
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('resume');
            return next;
          }, { replace: true });
        } else if (res.status === 410) {
          toast.error('This link has expired.');
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('resume');
            return next;
          }, { replace: true });
        } else if (!res.ok) {
          toast.error(data.error || 'Could not load saved draft.');
        }
      } catch {
        toast.error('Could not load saved draft.');
      }
    };
    loadDraft();
  }, [creator, username, searchParams, setSearchParams]);

  const handleSaveDraftSubmit = async () => {
    const emailStr = draftEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!username?.trim()) return;
    setSaveDraftSubmitting(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/collab/${encodeURIComponent(username.toLowerCase().trim())}/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStr, formData: getDraftFormData() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Check your email for a link to continue your request.');
        setShowSaveDraftModal(false);
        setDraftEmail('');
      } else {
        toast.error(data.error || 'Failed to save draft.');
      }
    } catch {
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setSaveDraftSubmitting(false);
    }
  };

  const handleDeliverableToggle = (deliverable: string) => {
    setDeliverables(prev => {
      const isSelected = prev.includes(deliverable);
      if (isSelected) {
        const next = prev.filter(d => d !== deliverable);
        const nextQuantities = { ...deliverableQuantities };
        delete nextQuantities[deliverable];
        setDeliverableQuantities(nextQuantities);
        return next;
      } else {
        setDeliverableQuantities(prev => ({ ...prev, [deliverable]: 1 }));
        return [...prev, deliverable];
      }
    });
  };

  const updateDeliverableQuantity = (deliverable: string, quantity: number) => {
    setDeliverableQuantities(prev => ({
      ...prev,
      [deliverable]: Math.max(1, quantity)
    }));
  };

  const handleCreateOfferClick = () => {
    setHasStartedOffer(true);
    setShowDetailedForm(true);
    window.setTimeout(() => {
      document.getElementById('detailed-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleStickySubmit = () => {
    if (!hasStartedOffer) {
      handleCreateOfferClick();
      return;
    }

    if (currentStep === 1) {
      if (!isStep1Ready) {
        toast.error('Please select a deal type');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      if (!isStep2Ready) {
        toast.error('Please select at least one deliverable');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      if (!isStep3Ready) {
        toast.error('Please set a budget or product value');
        return;
      }
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 4) {
      if (!isStep4Ready) {
        toast.error('Please complete the campaign goal and deadline');
        return;
      }
      setCurrentStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 5) {
      if (!isStep5Ready) {
        toast.error('Please provide brand and contact details');
        return;
      }
      formRef.current?.requestSubmit();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    if (!brandEmail.trim()) {
      newErrors.brandEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail)) {
      newErrors.brandEmail = 'Please enter a valid email address';
    }

    if (!brandAddress.trim()) {
      newErrors.brandAddress = 'Company / brand address is required for contract';
    } else if (brandAddress.trim().length < 15) {
      newErrors.brandAddress = 'Please enter full registered address (at least 15 characters)';
    }

    if (brandGstin.trim()) {
      const gstin = brandGstin.trim().toUpperCase();
      if (!/^[0-9A-Z]{15}$/.test(gstin)) {
        newErrors.brandGstin = 'GSTIN must be 15 characters (letters and numbers only)';
      }
    }

    if (!campaignDescription.trim()) {
      newErrors.campaignDescription = 'Campaign description is required';
    } else if (campaignDescription.trim().length < 20) {
      newErrors.campaignDescription = 'Please provide more details (at least 20 characters)';
    }

    if (deliverables.length === 0) {
      newErrors.deliverables = 'Please select at least one deliverable';
    }

    if (collabType === 'paid' && !budgetRange && !exactBudget) {
      newErrors.budget = 'Please specify a budget range or exact amount';
    }

    if (isHybridCollab(collabType)) {
      if (!budgetRange && !exactBudget) {
        newErrors.budget = 'Please specify paid budget details';
      }
    }

    // Validate website URL - accept with/without https:// and with/without www.
    if (brandWebsite && brandWebsite.trim()) {
      const website = brandWebsite.trim();
      // Accept: example.com, www.example.com, http://example.com, https://example.com, etc.
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+(\/.*)?$/;
      if (!urlPattern.test(website)) {
        newErrors.brandWebsite = 'Please enter a valid website URL (e.g., example.com or www.example.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Normalize website URL - add https:// if missing
  const normalizeWebsiteUrl = (url: string): string => {
    if (!url || !url.trim()) return url;
    const trimmed = url.trim();
    // If it already has http:// or https://, return as is
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    // Otherwise, add https://
    return `https://${trimmed}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/collab/${username}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_name: brandName,
          brand_email: brandEmail,
          brand_address: brandAddress.trim(),
          brand_gstin: brandGstin.trim() ? brandGstin.trim().toUpperCase() : undefined,
          brand_phone: brandPhone || undefined,
          brand_website: brandWebsite ? normalizeWebsiteUrl(brandWebsite) : undefined,
          brand_instagram: brandInstagram || undefined,
          brand_logo_url: brandLogoUrl || undefined,
          collab_type: collabType,
          budget_range: budgetRange || undefined,
          exact_budget: exactBudget ? parseFloat(exactBudget) : undefined,
          campaign_category: campaignCategory || undefined,
          barter_value: barterValue ? parseFloat(barterValue) : undefined,
          barter_product_name: barterProductName || undefined,
          barter_product_category: barterProductCategory || undefined,
          barter_product_image_url: barterProductImageUrl || undefined,
          campaign_description: campaignDescription,
          deliverables: deliverables.map(d => `${d}${deliverableQuantities[d] > 1 ? ` (x${deliverableQuantities[d]})` : ''}`),
          usage_rights: usageRights,
          deadline: deadline || undefined,
          offer_expires_at: offerExpiry || undefined,
          authorized_signer_name: authorizedSignerName || undefined,
          authorized_signer_role: authorizedSignerRole || undefined,
          usage_duration: usageDuration || undefined,
          payment_terms: paymentTerms || undefined,
          approval_sla_hours: approvalSlaHours ? Number(approvalSlaHours) : undefined,
          shipping_timeline_days: shippingTimelineDays ? Number(shippingTimelineDays) : undefined,
          cancellation_policy: cancellationPolicy || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        trackEvent('collab_link_form_submitted', { username: username || '', collab_type: collabType });
        // Redirect to the unified Brand Deal Console
        const consoleToken = data.request.id;
        navigate(`/deal/${consoleToken}`, {
          state: {
            creatorName: creator?.name || 'the creator',
            submissionType: data.submission_type || (data.lead ? 'lead' : 'request'),
            confirmationMessage: data.message,
            profileLabel: creator?.profile_label || undefined,
            isNewSubmission: true
          },
        });
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error: any) {
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'youtube':
        return <Youtube className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const elevationLevel1 = 'bg-white/[0.05] border border-white/10 shadow-none';
  const elevationLevel2 = 'bg-white/[0.08] border border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
  const elevationLevel3 = 'bg-white/[0.12] border border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.08)]';



  // Readiness badge animation (must run before any conditional returns to preserve hook order)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-6" />
        {isWarmingUp && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-xs">
            <h3 className="text-white font-bold text-lg mb-2">Waking up server...</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our secure server is spinning up to verify this creator's profile. This usually takes 30-40 seconds on the first load.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    const isNotFoundError = /not found/i.test(error);
    const errorTitle = isNotFoundError ? 'Creator Not Found' : 'Unable to Load Profile';
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-4">{errorTitle}</h1>
            <p className="text-slate-400 mb-6 leading-relaxed">
              {error.toLowerCase().includes('timeout')
                ? "The profile server is taking unusually long to wake up. This is common on the first load—clicking 'Try Again' usually works immediately."
                : error}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Go to Homepage
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  window.location.reload();
                }}
                className="bg-white text-black hover:bg-slate-200"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return null;
  }

  // Generate SEO meta tags
  const creatorName = creator.name || 'Creator';
  const normalizedHandle = (creator.username || username || '').replace(/^@/, '').trim();
  const creatorHandle = normalizedHandle ? `@${normalizedHandle}` : '';
  const metaTitle = `${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''} Collab Link | CreatorArmour`;
  // const platformNames = platforms.map(p => p.name).join(', ');
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  const trustStats = creator.trust_stats;
  const pastBrands = Array.isArray(creator.past_brands)
    ? creator.past_brands.map((b) => (typeof b === 'string' ? b.trim() : '')).filter(Boolean)
    : [];
  const trustedBrands = trustStats?.brands_count ?? 0;
  const avgResponseHours = trustStats?.avg_response_hours ?? null;
  const completionRate = trustStats?.completion_rate ?? null;
  const recentCampaignTypes = Array.isArray(creator.recent_campaign_types)
    ? creator.recent_campaign_types.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
    : [];
  // const completedDeals = creator.past_brand_count || 0;(trustedBrands > 0 ? trustedBrands : pastBrands.length);
  const pastBrandCount = creator.past_brand_count ?? (trustedBrands > 0 ? trustedBrands : pastBrands.length);
  const followerText = followerCount > 0
    ? `${followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} followers`
    : '';
  const metaDescription = `Book ${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''}${creator.category ? `, ${creator.category} creator` : ''}${followerText ? ` • ${followerText}` : ''}. Share paid, barter, or hybrid briefs with contract-first protection via CreatorArmour.`.substring(0, 158);

  // Use clean URL for SEO (no hash)
  const canonicalUrl = `https://creatorarmour.com/collab/${encodeURIComponent(normalizedHandle || creator.username)}`;
  const pageImage = creator.profile_photo && /^https?:\/\//i.test(creator.profile_photo)
    ? creator.profile_photo
    : 'https://creatorarmour.com/og-preview.png';
  const imageAlt = `Collaborate with ${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''}`;
  const seoKeywords = Array.from(new Set([
    `collaborate with ${creatorName}`,
    creatorHandle,
    `${creatorName} brand collaboration`,
    creator.category ? `${creator.category} creator` : 'content creator',
    `${creatorName} collab link`,
    'influencer marketing India',
    'creator collaboration',
    'paid barter hybrid collaboration',
    ...pastBrands.slice(0, 4),
  ].filter(Boolean)));

  const completedCount = completionChecks.filter((item) => item.complete).length;
  // const completionPercent = Math.round((completionChecks.filter(c => c.complete).length / completionChecks.length) * 100);
  const missingRequired = completionChecks.filter((item) => !item.complete).map((item) => item.label);
  const formSteps = [
    { label: 'Campaign', complete: isCoreReady },
    { label: 'Terms', complete: !showCommercialTerms || Boolean(paymentTerms || approvalSlaHours || shippingTimelineDays || usageDuration) },
    { label: 'Contact', complete: isContactReady },
    { label: 'Review', complete: isCoreReady && isContactReady },
  ];
  const displayBudget = exactBudget
    ? `₹${Number(exactBudget || 0).toLocaleString('en-IN')}`
    : budgetRange
      ? budgetRange.replace('-', ' – ').replace('under', 'Under ₹').replace('+', '+')
      : collabType === 'barter'
        ? (barterValue ? `Barter • ₹${Number(barterValue).toLocaleString('en-IN')} value` : 'Barter')
        : isHybridCollab(collabType)
          ? `Hybrid${barterValue ? ` • ₹${Number(barterValue).toLocaleString('en-IN')} barter value` : ''}${exactBudget ? ` • ₹${Number(exactBudget).toLocaleString('en-IN')} paid` : ''}`
          : 'Not set';
  const displayDeadline = deadline
    ? new Date(deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not set';
  const formatFollowers = (n?: number | null) => {
    if (n === null || n === undefined || Number.isNaN(n) || n === 0) return 'Verified Account';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };
  const primaryFollowers = creator.followers ?? followerCount;
  const avgReelViews = creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null;
  const avgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null;

  const isViewsVerified = Boolean(creator.performance_proof?.median_reel_views &&
    (Number(avgReelViews) === Number(creator.performance_proof.median_reel_views)));
  const isLikesVerified = Boolean(creator.performance_proof?.avg_likes &&
    (Number(avgLikes) === Number(creator.performance_proof.avg_likes)));

  // Qualification Warnings
  const minDeadlineDate = new Date();
  if (creator.min_lead_time_days) minDeadlineDate.setDate(minDeadlineDate.getDate() + creator.min_lead_time_days);
  const isDeadlineTooSoon = Boolean(creator.min_lead_time_days && deadline && new Date(deadline) < minDeadlineDate);

  const engagementRange = getEngagementRange(primaryFollowers, avgReelViews);
  const genderRows = formatAudienceGender(creator.audience_gender_split);
  const audienceCities = formatAudienceCities(creator.top_cities);
  const audienceLanguage = formatAudienceLanguage(creator.primary_audience_language);
  const audienceRegionLabel = creator.collab_region_label?.trim() || getAudienceRegionLabel(audienceCities);
  const audienceRelevanceNote = creator.collab_audience_relevance_note?.trim() || 'Strong relevance for North India audience';
  const creatorBio = isScrapedInstagramBio(creator.bio) ? null : creator.bio;
  const audienceFitLine = creator.collab_audience_fit_note?.trim() || 'Works best for targeted audience campaigns.';
  const sameDayResponseLine = avgResponseHours && avgResponseHours <= 20
    ? `~${Math.round(avgResponseHours)} hr${Math.round(avgResponseHours) > 1 ? 's' : ''}`
    : '~24 hrs';
  const showEngagementConfidence = engagementRange !== 'Growing Audience';
  const engagementConfidenceNote = 'Above-average engagement for creator size';
  const recentActivityNoteRaw = creator.past_brand_count === 0
    ? 'New Creator on Creator Armour'
    : (creator.collab_recent_activity_note?.trim() || 'Posting consistently');
  const recentActivityNote = withNeutralPrefix(recentActivityNoteRaw, 'Currently ');
  const campaignSlotNoteRaw = creator.past_brand_count === 0
    ? 'Actively accepting collaborations'
    : (creator.campaign_slot_note?.trim() || 'Selective partnerships');
  const campaignSlotNoteText = withNeutralPrefix(campaignSlotNoteRaw, 'Works with ');
  const deliveryReliabilityNote = creator.collab_delivery_reliability_note?.trim() || 'Reliable delivery across past collaborations.'; // const responseCtaLine = collabResponseBehaviorPreset
  //   ? `Usually responds ${collabResponseBehaviorPreset.toLowerCase()}`
  //   : `Ready to review offers`;
  const responseBehaviorNoteRaw = creator.collab_response_behavior_note?.trim() || 'Most brands receive response within same day';
  const responseBehaviorNote = withNeutralPrefix(responseBehaviorNoteRaw, 'Typically ');
  const ctaTrustNote = creator.collab_cta_trust_note?.trim() || 'Creator notified instantly — no DM required.';
  // const ctaTrustNote = creator.collab_cta_trust_note;
  const ctaDmNote = creator.collab_cta_dm_note?.trim() || 'No DMs required — creator replies here.';
  const ctaPlatformNote = creator.collab_cta_platform_note?.trim() || 'Direct collaboration — no agency middle layer';
  const mobileEngagementLabel = engagementRange === 'Growing Audience' ? 'Consistent viewer engagement' : engagementRange;

  const collabReadiness = getCollabReadiness({
    instagramHandle: creator.platforms.find((p) => p.name.toLowerCase() === 'instagram')?.handle || creator.username,
    instagramLinked: Boolean(creator.last_instagram_sync),
    category: creator.category,
    niches: creator.content_niches,
    topCities: creator.top_cities,
    audienceGenderSplit: creator.audience_gender_split,
    primaryAudienceLanguage: creator.primary_audience_language,
    postingFrequency: creator.posting_frequency,
    avgReelViews,
    avgLikes,
    openToCollabs: creator.open_to_collabs,
    avgRateReel: (creator as any).avg_rate_reel || (creator as any).avg_reel_rate,
    suggestedReelRate: creator.suggested_reel_rate,
    suggestedBarterValueMin: creator.suggested_barter_value_min,
    suggestedBarterValueMax: creator.suggested_barter_value_max,
    regionLabel: creator.collab_region_label || audienceRegionLabel,
    mediaKitUrl: creator.media_kit_url,
    firstDealCount: creator.past_brand_count || creator.collab_brands_count_override || trustStats?.completed_deals || 0,
  });

  const isBudgetTooLow = Boolean(
    creator.min_deal_value &&
    ((collabType === 'paid' && Number(exactBudget) > 0 && Number(exactBudget) < creator.min_deal_value) ||
      (collabType === 'barter' && Number(barterValue) > 0 && Number(barterValue) < creator.min_deal_value))
  );

  const handleTemplateSelect = (template: DealTemplate) => {
    setCollabType(template.type || 'paid');
    if (template.type === 'paid') {
      setExactBudget(template.budget.toString());
    } else {
      setBarterValue(template.budget.toString());
    }

    if (template.category) setCampaignCategory(template.category);
    setCampaignDescription(template.description);
    setDeliverables(template.deliverables);
    setDeliverableQuantities(template.quantities);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (template.deadlineDays || 7));
    setDeadline(targetDate.toISOString().split('T')[0]);

    setShowCustomFlow(true); // Reveal the form
    setCurrentStep(5); // Jump to Step 5 (Brand & Contact)
    toast.success(`${template.label} Applied!`);
    triggerHaptic(HapticPatterns.success);
  };


  const handleUpdateTemplate = (updated: DealTemplate) => {
    const updatedList = localDealTemplates.map(t => t.id === updated.id ? updated : t);
    setLocalDealTemplates(updatedList);
    setEditingTemplate(null);
    toast.success("Template updated locally! (Persist via profile update)");
    triggerHaptic(HapticPatterns.success);
  };

  const dealTemplates = localDealTemplates;

  return (
    <>
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={seoKeywords}
        image={pageImage}
        imageAlt={imageAlt}
        type="website"
        canonicalUrl={canonicalUrl}
      />

      <BreadcrumbSchema
        items={[
          { name: 'CreatorArmour', url: 'https://creatorarmour.com' },
          { name: 'Collab', url: 'https://creatorarmour.com/collab' },
          { name: creatorHandle || creatorName, url: canonicalUrl },
        ]}
      />

      <PersonSchema schema={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: creatorName,
        description: metaDescription,
        url: canonicalUrl,
        image: pageImage,
        jobTitle: creator.category ? `${creator.category} Creator` : 'Content Creator',
        knowsAbout: creator.category || 'Content Creation',
        sameAs: creator.platforms.map(p => {
          switch (p.name.toLowerCase()) {
            case 'instagram':
              return `https://instagram.com/${p.handle.replace('@', '')}`;
            case 'youtube':
              return `https://youtube.com/${p.handle}`;
            case 'twitter':
              return `https://twitter.com/${p.handle.replace('@', '')}`;
            case 'facebook':
              return p.handle;
            default:
              return null;
          }
        }).filter(Boolean),
      }} />

      <div className="light min-h-screen bg-slate-50 selection:bg-teal-500/30 text-slate-900">
        {isOwner && (
          <div className="bg-[#004D40] text-emerald-50 px-4 py-2 flex items-center justify-between sticky top-0 z-[100] shadow-lg border-b border-emerald-400/20 backdrop-blur-md bg-opacity-90">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-400/20 p-1.5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-0.5">Owner View</p>
                <p className="text-[10px] text-emerald-300/80 font-medium">You are viewing your own collab link as brands see it.</p>
              </div>
              <div className="sm:hidden">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Your Collab Link</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setEditMode(!editMode)}
                size="sm"
                className={`${editMode ? 'bg-white text-emerald-900 hover:bg-slate-100' : 'bg-emerald-500 text-white hover:bg-emerald-400'} border-none transition-all text-[11px] font-bold h-7 px-4 rounded-full shadow-sm`}
              >
                {editMode ? 'Finish Editing' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 pt-4 pb-36 lg:pb-10 lg:pt-10 max-w-lg lg:max-w-[1100px] xl:max-w-[1240px] relative">
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12 w-full">

            {/* LEFT COLUMN - Creator Context */}
            <div className="w-full lg:w-[42%] shrink-0 lg:sticky lg:top-24 space-y-6 lg:space-y-8 z-10">

              {/* Header - Hero */}
              <div className="mb-6 pt-2 lg:mb-0 lg:pt-0 relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-3.5 mb-5 md:mb-7 relative">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
                      {creator.profile_photo ? (
                        <img src={creator.profile_photo} alt={`${creator.name} profile`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black text-xl">
                          {creator.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-50" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      {editMode ? (
                        <Input
                          className="h-7 text-[17px] font-black text-slate-900 w-auto min-w-[120px] px-2 bg-white/50 border-slate-300 border-dashed focus:border-teal-500 transition-all"
                          defaultValue={creator.name}
                          onBlur={(e) => handleInlineProfileUpdate('name', e.target.value)}
                          placeholder="Your Name"
                        />
                      ) : (
                        <h2 className="text-[17px] font-black text-slate-900 leading-tight">{creator.name}</h2>
                      )}
                      <div className="flex items-center gap-1 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3 text-teal-600" />
                        <span className="text-[10px] font-black text-teal-700 uppercase tracking-wider">Verified</span>
                      </div>
                    </div>
                    {editMode ? (
                      <div className="mt-1 flex gap-2 items-center">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Category:</span>
                        <Input
                          className="h-6 text-[12px] font-bold text-teal-600 px-2 bg-white/50 border-slate-300 border-dashed w-32"
                          defaultValue={creator.category || ''}
                          onBlur={(e) => handleInlineProfileUpdate('creator_category', e.target.value)}
                          placeholder="e.g. Lifestyle"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <a href={`https://instagram.com/${creator.username}`} target="_blank" rel="noreferrer" className="text-[13px] text-teal-600 font-bold hover:underline">@{creator.username}</a>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-[13px] text-slate-500 font-semibold">{formatFollowers(primaryFollowers)} Instagram {creator.category || ''}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {(creator as any).avg_rate_reel && (
                            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              <Wallet className="h-3 w-3 text-slate-500" />
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Typical Rate: ₹{Math.round((creator as any).avg_rate_reel / 1000)}K+</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Replies in {sameDayResponseLine.replace('~', '')}</span>
                          </div>
                          {creator.collab_deal_preference && (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                              <span className="text-[10px] font-black text-amber-700 uppercase tracking-tight">
                                Prefers: {creator.collab_deal_preference === 'paid_only' ? 'Paid Only' : creator.collab_deal_preference === 'barter_only' ? 'Barter Only' : 'Open to Both'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-w-xl relative">
                  <h1 className={`text-[30px] md:text-4xl font-black tracking-tight text-slate-900 mb-2.5 leading-tight ${typePageTitle}`}>
                    Book a Collaboration with {creator.name.split(' ')[0]}
                  </h1>
                  <p className="text-[15px] text-slate-500 leading-relaxed max-w-md">
                    Create a legally binding term sheet to partner with {creator.name.split(' ')[0]}.
                  </p>
                </div>
              </div>

              {/* 1. Trust Indicators */}
              <div className="mb-6 md:mb-10 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <div className="grid grid-cols-3 gap-2 px-0">
                  {[
                    { label: 'Contract auto-generated', icon: <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />, desc: 'Legal & binding' },
                    { label: 'Payment secured', icon: <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-teal-600" />, desc: 'Dispute protected' },
                    { label: 'Deliverables verified', icon: <BadgeCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />, desc: 'Creator accountable' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center gap-1.5 md:gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm px-1.5 py-3 md:px-2 md:py-4">
                      <div className={`shrink-0 rounded-xl p-2 md:p-2.5 ${idx === 0 ? 'bg-emerald-50 border border-emerald-100' :
                        idx === 1 ? 'bg-teal-50 border border-teal-100' :
                          'bg-blue-50 border border-blue-100'
                        }`}>{item.icon}</div>
                      <div>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-700 leading-tight">{item.label}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 font-semibold">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Audience Snapshot Toggle */}
              <div className="mb-6 md:mb-10 relative z-10">
                <button
                  onClick={() => setShowMobileAudienceDetails(!showMobileAudienceDetails)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-teal-300 transition-all group ${showMobileAudienceDetails ? 'border-teal-200' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[14px] md:text-[15px] font-black text-slate-900">Audience Snapshot</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Followers, Reach & Reliability</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showMobileAudienceDetails ? 'rotate-180' : ''}`} />
                </button>

                {showMobileAudienceDetails && (
                  <div className="mt-3 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-white px-4 py-3.5">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-teal-600" /> Engagement</p>
                        <p className="text-[14px] font-black text-slate-900 leading-tight">{mobileEngagementLabel}</p>
                      </div>
                      <div className="bg-white px-4 py-3.5">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Response Time</p>
                        <p className="text-[14px] font-black text-slate-900 leading-tight">{sameDayResponseLine}</p>
                      </div>
                      <div className="bg-white px-4 py-3.5">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Brand Deals</p>
                        <p className="text-[14px] font-black text-slate-900 leading-tight">{pastBrandCount} deals</p>
                      </div>
                      <div className="bg-white px-4 py-3.5">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Reliability</p>
                        <p className="text-[14px] font-black text-emerald-600 leading-tight">98%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Audience Profile</h4>
                        <div className="space-y-2">
                          {genderRows && <div className="text-[13px] text-slate-700 flex justify-between"><span>Gender Blend</span> <span className="font-bold">{genderRows.join(' / ')}</span></div>}
                          {audienceCities.length > 0 && <div className="text-[13px] text-slate-700 flex justify-between"><span>Top Cities</span> <span className="font-bold text-right ml-4">{audienceCities.slice(0, 3).join(', ')}</span></div>}
                          {creator.audience_age_range && <div className="text-[13px] text-slate-700 flex justify-between"><span>Core Age Range</span> <span className="font-bold">{creator.audience_age_range}</span></div>}
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Creator Context</h4>
                        <ul className="text-[12px] text-slate-600 space-y-2 leading-tight">
                          <li className="flex gap-2"><span>•</span> {audienceFitLine}</li>
                          <li className="flex gap-2"><span>•</span> {recentActivityNote}</li>
                          <li className="flex gap-2"><span>•</span> {campaignSlotNoteText}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Strip */}
              <div className="md:hidden mt-6 mb-4 mx-0 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                <div className="flex flex-col justify-center gap-2.5 rounded-2xl bg-[#004D40] text-emerald-50 px-5 py-4 shadow-md overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                  <div className="flex flex-col gap-2 z-10 w-full relative">
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="flex items-center justify-center min-w-[16px]"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                      <span className="text-[12px] font-bold tracking-wide">50+ Brands Trust Creator Armour</span>
                    </div>
                    <div className="flex items-center gap-2.5 w-full border-t border-white/10 pt-2">
                      <div className="flex items-center justify-center min-w-[16px]"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                      <span className="text-[12px] font-bold tracking-wide">Legally Binding Contracts</span>
                    </div>
                    <div className="flex items-center gap-2.5 w-full border-t border-white/10 pt-2">
                      <div className="flex items-center justify-center min-w-[16px]"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                      <span className="text-[12px] font-bold tracking-wide">Secure Payment Protection</span>
                    </div>
                    <div className="flex items-center gap-2.5 w-full border-t border-white/10 pt-2">
                      <div className="flex items-center justify-center min-w-[16px]"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                      <span className="text-[12px] font-bold tracking-wide">Verified Deliverables</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Creator Snapshot Accordion (Premium Indian Context) */}
              <Accordion type="single" collapsible className="w-full mb-6 relative z-20" defaultValue="item-1">
                <AccordionItem value="item-1" className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden border-b-0">
                  <AccordionTrigger className="flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[15px] font-black text-slate-900">Creator Snapshot</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reach, Trust & Practical Logistics</p>
                      </div>
                    </div>
                    {audienceRegionLabel && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2.5 py-1 uppercase tracking-wide mr-2">
                        <MapPin className="w-3 h-3" />{audienceRegionLabel}
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-px bg-slate-100">
                      {/* Avg Reel Views */}
                      <div className="bg-white px-4 py-3 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Reel Views</p>
                          {isViewsVerified && <span title="Verified source"><BadgeCheck className="w-3 h-3 text-emerald-500" /></span>}
                        </div>
                        {editMode ? (
                          <Input
                            type="number"
                            className="h-7 text-[16px] font-black text-slate-900 px-1 bg-slate-50 border-slate-200 border-dashed"
                            defaultValue={creator.avg_reel_views || ''}
                            onBlur={(e) => handleInlineProfileUpdate('avg_reel_views', Number(e.target.value))}
                            placeholder="e.g. 10000"
                          />
                        ) : avgReelViews ? (
                          <>
                            <p className="text-[18px] font-black text-slate-900 leading-tight">
                              {Number(avgReelViews) >= 1000 ? `${Math.round(Number(avgReelViews) / 1000)}K` : avgReelViews}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">{isViewsVerified ? '✓ Instagram API' : 'Creator Provided'}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-black text-slate-300 leading-tight">—</p>
                            <p className="text-[9px] text-slate-300 mt-0.5 font-bold uppercase tracking-tight">Not provided yet</p>
                          </>
                        )}
                      </div>

                      {/* Response Time */}
                      <div className="bg-white px-4 py-3 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Response Time</p>
                          {(avgResponseHours && avgResponseHours > 0) && <span title="Based on past requests"><BadgeCheck className="w-3 h-3 text-emerald-500" /></span>}
                        </div>
                        {(avgResponseHours && avgResponseHours > 0) ? (
                          <>
                            <p className="text-[18px] font-black text-slate-900 leading-tight">{`${Math.round(avgResponseHours)}h`}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">✓ Based on past requests</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-black text-slate-300 leading-tight">—</p>
                            <p className="text-[9px] text-slate-300 mt-0.5 font-bold uppercase tracking-tight">No history yet</p>
                          </>
                        )}
                      </div>

                      <div className="bg-white px-4 py-3 text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Brands Worked</p>
                        {editMode ? (
                          <Input
                            type="number"
                            className="h-7 text-[16px] font-black text-slate-900 px-1 bg-slate-50 border-slate-200 border-dashed"
                            defaultValue={creator.past_brand_count || ''}
                            onBlur={(e) => handleInlineProfileUpdate('past_brand_count', Number(e.target.value))}
                            placeholder="0"
                          />
                        ) : (creator.trust_stats?.brands_count != null && creator.trust_stats.brands_count > 0) ? (
                          <>
                            <p className="text-[18px] font-black text-emerald-600 leading-tight">{creator.trust_stats.brands_count}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">✓ Verified Partnerships</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-black text-slate-300 leading-tight">New</p>
                            <p className="text-[9px] text-slate-300 mt-0.5 font-bold uppercase tracking-tight">Building portfolio</p>
                          </>
                        )}
                      </div>

                      {/* Completion Rate */}
                      <div className="bg-white px-4 py-3 text-left">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Completion Rate</p>
                        {(creator.trust_stats?.completion_rate != null && creator.trust_stats.completion_rate > 0) ? (
                          <>
                            <p className="text-[18px] font-black text-slate-900 leading-tight">{`${Math.round(creator.trust_stats.completion_rate)}%`}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">✓ Deal Fulfillment</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[18px] font-black text-slate-300 leading-tight">—</p>
                            <p className="text-[9px] text-slate-300 mt-0.5 font-bold uppercase tracking-tight">No deals completed yet</p>
                          </>
                        )}
                      </div>
                    </div>


                    <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-teal-500 pl-2 flex items-center justify-between">
                              Typical Reel Rate
                              {editMode && <span className="text-[8px] font-bold text-slate-300 italic normal-case tracking-normal">Set your base rate</span>}
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {editMode && (
                                <div className="mb-2 bg-teal-50/50 p-3 rounded-xl border border-teal-100/50">
                                  <p className="text-[10px] font-bold text-teal-700 uppercase mb-2">Base Reel Rate (₹)</p>
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      className="h-9 bg-white border-teal-200 text-teal-900 font-bold"
                                      defaultValue={creator.suggested_reel_rate || ''}
                                      placeholder="e.g. 5000"
                                      onBlur={(e) => handleInlineProfileUpdate('suggested_reel_rate', Number(e.target.value))}
                                    />
                                    <div className="flex-1 bg-white border border-teal-100 rounded-md px-2 flex flex-col justify-center">
                                      <p className="text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">Preview</p>
                                      <p className="text-xs font-black text-teal-800 leading-none">₹{Math.round(Number(creator.suggested_reel_rate || 0) / 1000)}K</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {(() => {
                                const reelRate = creator.suggested_reel_rate;
                                const paidMin = creator.suggested_paid_range_min;
                                const paidMax = creator.suggested_paid_range_max;
                                const hasRate = reelRate && reelRate > 0;
                                const rateLabel = hasRate
                                  ? (paidMin && paidMax
                                    ? `₹${Math.round(paidMin / 1000)}K – ₹${Math.round(paidMax / 1000)}K`
                                    : `₹${Math.round(reelRate / 1000)}K`)
                                  : null;
                                return [
                                  { label: 'Instagram Reel', rate: rateLabel },
                                ].map(p => (
                                  <div key={p.label}>
                                    <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-xl flex items-center justify-between shadow-sm">
                                      <span className="text-[13px] font-bold text-slate-700">{p.label}</span>
                                      {p.rate
                                        ? <span className="text-[15px] font-black text-teal-800">{p.rate}</span>
                                        : <span className="text-[13px] font-semibold text-slate-300">Not set</span>
                                      }
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1.5 ml-1 italic leading-tight">
                                      Stories & static posts are usually included in collaboration packages.
                                    </p>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-l-2 border-slate-300 pl-2">Logistics</h4>
                            <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm border-l-2 border-l-emerald-400">
                              <span className="text-slate-500 font-medium flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-emerald-600" />Availability</span>
                              <span className="font-bold text-emerald-700">Open for collaborations this month</span>
                            </div>
                            <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-slate-500 font-medium flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />Base City</span>
                              <span className="font-bold text-slate-800">{audienceRegionLabel || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-slate-500 font-medium flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-blue-500" />Reply Time</span>
                              <span className="font-bold text-slate-800">
                                {(avgResponseHours && avgResponseHours > 0)
                                  ? `~${Math.round(avgResponseHours)} hr${Math.round(avgResponseHours) > 1 ? 's' : ''}`
                                  : '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-slate-500 font-medium flex items-center gap-2"><Wallet className="h-3.5 w-3.5" />Payment Methods</span>
                              <span className="font-bold text-slate-800">UPI, Bank Transfer</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-blue-500 pl-2">Expected SLA & Rights</h4>
                            <div className="space-y-2">
                              {creator.collab_delivery_reliability_note ? (
                                <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-slate-500 font-medium flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Delivery</span>
                                  <span className="font-bold text-slate-800 text-right max-w-[55%] text-[12px]">{creator.collab_delivery_reliability_note}</span>
                                </div>
                              ) : null}
                              {creator.collab_cta_trust_note ? (
                                <div className="flex items-center justify-between text-[13px] bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                  <span className="text-slate-500 font-medium flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5" />Rights</span>
                                  <span className="font-bold text-slate-800 text-right max-w-[55%] text-[12px]">{creator.collab_cta_trust_note}</span>
                                </div>
                              ) : null}
                              {!creator.collab_delivery_reliability_note && !creator.collab_cta_trust_note && (
                                <p className="text-[12px] text-slate-300 italic">Not specified yet</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-2">Audience Context</h4>
                            <div className="space-y-2.5">
                              {/* Core Geo — only show if top cities exist */}
                              {audienceCities.length > 0 && (
                                <div className="flex items-center justify-between text-[13px]">
                                  <span className="text-slate-500 font-medium flex items-center gap-2"><Globe className="h-3.5 w-3.5" />Core Geo</span>
                                  <span className="font-bold text-slate-800">{audienceCities.slice(0, 2).join(', ')}</span>
                                </div>
                              )}
                              {/* Audience Age */}
                              <div className="flex items-center justify-between text-[13px]">
                                <span className="text-slate-500 font-medium flex items-center gap-2"><Users className="h-3.5 w-3.5" />Audience Age</span>
                                {creator.audience_age_range
                                  ? <span className="font-bold text-slate-800 whitespace-pre-line text-right">{creator.audience_age_range}</span>
                                  : <span className="font-semibold text-slate-300">—</span>
                                }
                              </div>
                              {/* Languages */}
                              {audienceLanguage && (
                                <div className="mt-2 space-y-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"><Languages className="h-3 w-3 inline mr-1" />Languages</span>
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {audienceLanguage.split(',').map(lang => (
                                      <span key={lang.trim()} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">{lang.trim()}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Best Fit / Supports — only show if real data is available */}
                            {((creator.content_niches?.length ?? 0) > 0 || recentCampaignTypes.length > 0) && (
                              <div className="pt-4">
                                <div className="bg-white/50 border border-slate-200 rounded-xl p-3">
                                  {(creator.content_niches?.length ?? 0) > 0 && (
                                    <>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-500" /> Best fit for</p>
                                      <div className="flex flex-wrap gap-1.5 mb-3">
                                        {(creator.content_niches ?? []).map(cat => (
                                          <span key={cat} className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">{cat}</span>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                  {recentCampaignTypes.length > 0 && (
                                    <>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Supports</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {recentCampaignTypes.map(cat => (
                                          <span key={cat} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">{cat}</span>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(avgReelViews || primaryFollowers > 0) && (
                      <div className="p-5 border-t border-slate-100 bg-teal-50/20">
                        <p className="text-[10px] text-teal-700 font-black uppercase tracking-widest mb-4 flex items-center justify-between">
                          <span>Market Impact (Est. per campaign)</span>
                          <span className="text-teal-600 bg-white border border-teal-200 px-2 py-0.5 rounded-md font-bold text-[9px]">Live Data Verified</span>
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Typical Reel Engagement</p>
                            <p className="text-[20px] font-black text-slate-900 leading-tight">
                              {avgReelViews
                                ? `${Math.round(Number(avgReelViews) * 0.8 / 1000)}K – ${Math.round(Number(avgReelViews) * 1.6 / 1000)}K`
                                : `${Math.round(primaryFollowers * 0.1 / 1000)}K – ${Math.round(primaryFollowers * 0.3 / 1000)}K`
                              }
                              <span className="text-[12px] text-slate-400 font-bold ml-1.5">Views</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Est. Story Reach</p>
                            <p className="text-[20px] font-black text-slate-900 leading-tight">
                              {`${Math.round(primaryFollowers * 0.04 / 1000)}K – ${Math.round(primaryFollowers * 0.09 / 1000)}K`}
                              <span className="text-[12px] text-slate-400 font-bold ml-1.5">Reach</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div> {/* END LEFT COLUMN */}

              {/* 1.5. Deal Templates (Moved higher for conversion speed) */}
              {!showCustomFlow && (
                <div className="mb-6 md:mb-10 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 px-1">Fastest way to collaborate</span>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-[15px] font-black text-slate-800 tracking-tight">Pick a package below</span>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditingTemplates(!isEditingTemplates)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200 transition-all text-slate-600 active:scale-95"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Manage</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dealTemplates.map((template, idx) => {
                      const deliverablesList = template.deliverables.map(d => {
                        const qty = template.quantities[d] || 1;
                        if (d === 'Unboxing Video') return `${qty} Unboxing`;
                        return `${qty} ${d.replace('Instagram ', '')}`;
                      }).join(' + ');

                      return (
                        <div key={template.id} className="relative group/card h-full">
                          {idx === 1 && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                              <div className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300 shadow-sm uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-2 w-2" />
                                Most Booked
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className={`w-full text-left p-4 rounded-3xl border transition-all group active:scale-95 h-full flex flex-col relative overflow-hidden ${idx === 1 ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 shadow-lg shadow-amber-900/5' : 'border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50 shadow-sm'}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-xl">
                                {template.icon}
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[14px] font-black text-slate-900 mb-0.5">{template.label}</p>
                              <div className="mb-3">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Includes</p>
                              <div className="space-y-1">
                                {template.deliverables.map((d, di) => {
                                  const qty = template.quantities[d] || 1;
                                  const label = d === 'Unboxing Video' ? 'Unboxing' : d.replace('Instagram ', '');
                                  return (
                                    <div key={di} className="flex items-center gap-1.5">
                                      <div className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                                      <span className="text-[11px] font-bold text-slate-600">{qty} {label}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            </div>
                            <div className="mt-auto pt-3 border-t border-slate-100/60 flex items-center justify-between gap-2">
                              <p className="text-[16px] font-black text-teal-600 leading-tight">
                                {template.type === 'barter' ? 'Barter' : `₹${template.budget.toLocaleString()}`}
                              </p>
                              <div className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider group-hover:bg-teal-600 group-active:scale-95 transition-all">
                                Select →
                              </div>
                            </div>
                          </button>

                          {isOwner && isEditingTemplates && (
                            <div className="absolute top-2 right-2 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTemplate(template);
                                }}
                                className="p-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:border-teal-500 hover:text-teal-600 transition-all active:scale-90"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mb-3">Or create custom</p>
                    <Button
                      onClick={() => {
                        setShowCustomFlow(true);
                        setCurrentStep(1);
                        triggerHaptic(HapticPatterns.success);
                      }}
                      variant="outline"
                      className="w-full h-12 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-[11px] uppercase tracking-widest transition-all group active:scale-[0.98]"
                    >
                      Propose Custom Deal
                      <ArrowRight className="ml-2 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Desktop-only Bio & Platforms */}
              <div className="hidden lg:block space-y-8">
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
                  {editMode ? (
                    <div className="mb-6 relative">
                      <div className="absolute -top-6 left-0 flex items-center gap-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Creator Bio</p>
                      </div>
                      <Textarea
                        className="bg-slate-50 border-slate-300 border-dashed text-slate-700 leading-relaxed font-medium min-h-[100px] focus:border-teal-500 transition-all"
                        defaultValue={creator.bio || ''}
                        onBlur={(e) => handleInlineProfileUpdate('bio', e.target.value)}
                        placeholder="Brief introduction for brands..."
                      />
                      <p className="text-[9px] text-slate-400 mt-1">Updates immediately when you click outside</p>
                    </div>
                  ) : creatorBio && (
                    <p className="text-slate-700 leading-relaxed mb-6 font-medium">
                      {creatorBio}
                    </p>
                  )}

                  {creator.platforms.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-xl font-semibold text-slate-900 mb-3">
                        Active on {creator.platforms.length > 1 ? 'Platforms' : 'Platform'}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {creator.platforms.map((platform, idx) => {
                          const isInstagram = platform.name.toLowerCase() === 'instagram';
                          return (
                            <div key={idx} className="flex items-center gap-3 text-slate-100/85">
                              {getPlatformIcon(platform.name)}
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{platform.name}</p>
                                {isInstagram && platform.handle ? (
                                  <a
                                    href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                                  >
                                    @{platform.handle.replace('@', '')}
                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                  </a>
                                ) : (
                                  <p className="text-sm text-slate-200/90">
                                    {platform.handle}
                                  </p>
                                )}
                                {platform.followers && (
                                  <p className="text-xs text-slate-200/65 mt-1">
                                    {platform.followers >= 1000
                                      ? `${(platform.followers / 1000).toFixed(1)}K followers`
                                      : `${platform.followers} followers`}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Open to collabs + niches + media kit (creator readiness for brands) */}
                  {(creator.open_to_collabs !== false || (creator.content_niches && creator.content_niches.length > 0) || creator.media_kit_url) && (
                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
                      {creator.open_to_collabs !== false && (
                        <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          Actively open to collaborations
                        </p>
                      )}
                      {editMode ? (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                            Content Niches
                            <span className="text-[8px] font-bold text-slate-300 italic normal-case tracking-normal">Add relevant tags for your profile</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {creator.content_niches?.map((niche, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="bg-teal-50 text-teal-700 border-teal-100 pl-3 pr-1 py-1 flex items-center gap-1 group"
                              >
                                {niche}
                                <button
                                  onClick={() => {
                                    const updated = creator.content_niches?.filter(n => n !== niche);
                                    handleInlineProfileUpdate('content_niches', updated);
                                  }}
                                  className="hover:bg-teal-200/50 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="New niche..."
                              value={newNicheInput}
                              onChange={(e) => setNewNicheInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = newNicheInput.trim();
                                  if (val) {
                                    const updated = [...(creator.content_niches || []), val];
                                    handleInlineProfileUpdate('content_niches', updated);
                                    setNewNicheInput('');
                                  }
                                }
                              }}
                              className="h-8 text-xs border-dashed bg-slate-50"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-dashed border-teal-200 text-teal-600 hover:bg-teal-50"
                              onClick={() => {
                                const val = newNicheInput.trim();
                                if (val) {
                                  const updated = [...(creator.content_niches || []), val];
                                  handleInlineProfileUpdate('content_niches', updated);
                                  setNewNicheInput('');
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ) : creator.content_niches && creator.content_niches.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Content niches</p>
                          <div className="flex flex-wrap gap-2">
                            {creator.content_niches.map((niche, i) => (
                              <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                {niche}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {editMode ? (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Media Kit Link (URL)</p>
                          <Input
                            className="h-8 text-xs bg-slate-50 border-dashed"
                            defaultValue={creator.media_kit_url || ''}
                            onBlur={(e) => handleInlineProfileUpdate('media_kit_url', e.target.value)}
                            placeholder="e.g. https://canva.com/your-media-kit"
                          />
                        </div>
                      ) : creator.media_kit_url && (
                        <div>
                          <a
                            href={creator.media_kit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4 shrink-0" />
                            Media kit
                          </a>
                          <p className="text-xs text-slate-100/70 mt-1">Ready for brand collaborations</p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>


            {/* RIGHT COLUMN - Offer Form */}
            <div className="w-full lg:w-[58%] lg:pb-32">
              {/* 4. The main offer formation form (Unified for desktop/mobile) */}
              <div id="core-offer-form" className={`mt-2 lg:mt-0 w-full rounded-[28px] p-5 md:p-8 lg:p-10 mb-6 text-slate-900 border border-slate-200 bg-white shadow-2xl shadow-teal-900/5 relative transition-all duration-200 ease-out`}>

                {/* Fallback space when flow is hidden */}
                {!showCustomFlow && (
                  <div className="py-20 text-center animate-in fade-in duration-1000">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                      <Zap className="h-10 w-10 fill-current" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-bounce text-teal-400 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                      </div>
                      <p className="text-slate-500 font-black uppercase tracking-[2px] text-[11px]">Pick a package above</p>
                      <p className="text-slate-400 text-[12px] font-medium">Tap a package to start your proposal</p>
                    </div>
                  </div>
                )}

                {/* Step indicator (Now shows 5 steps) */}
                {showCustomFlow && (
                  <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                      <h2 className={`text-[17px] font-black tracking-tight text-slate-900 leading-tight ${typeSectionTitle}`}>
                        {currentStep === 1 ? 'Step 1: Deal Type' :
                          currentStep === 2 ? 'Step 2: Content' :
                            currentStep === 3 ? 'Step 3: Budget' :
                              currentStep === 4 ? 'Step 4: Campaign Goal' :
                                'Step 5: Contact Info'}
                      </h2>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-all duration-300 ${step === currentStep ? 'w-8 bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.1)]' : step < currentStep ? 'w-3 bg-emerald-500/40' : 'w-1.5 bg-slate-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {showCustomFlow && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
                    {/* Step 1: Collaboration Type */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <label className={`block text-[15px] font-black text-slate-800 mb-6 ${typeLabel}`}>What type of collaboration?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'paid', label: 'Paid', icon: <Wallet className="h-5 w-5" />, sub: 'Fixed cash budget' },
                            { id: 'barter', label: 'Barter', icon: <Package className="h-5 w-5" />, sub: 'Product exchange' },
                            { id: 'hybrid', label: 'Hybrid', icon: <Zap className="h-5 w-5" />, sub: 'Cash + Product' },
                            { id: 'affiliate', label: 'Affiliate', icon: <TrendingUp className="h-5 w-5" />, sub: 'Sales commission' },
                          ].map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setCollabType(type.id as CollabType)}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${collabType === type.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${collabType === type.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                  {type.icon}
                                </div>
                                <div className="text-left">
                                  <p className="text-[13px] font-black uppercase tracking-tight">{type.label}</p>
                                  <p className={`text-[10px] font-medium ${collabType === type.id ? 'text-white/60' : 'text-slate-400'}`}>{type.sub}</p>
                                </div>
                              </div>
                              {collabType === type.id && <CheckCircle2 className="h-5 w-5 text-white" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Content (Deliverables) */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner">
                          <label className={`block text-[15px] font-black text-slate-800 mb-4 ${typeLabel} flex items-center gap-2`}>
                            <Clapperboard className="h-5 w-5 text-slate-900" />
                            What content would you like?
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {DELIVERABLE_OPTIONS.map((option) => {
                              const isSelected = deliverables.includes(option.value);
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleDeliverableToggle(option.value)}
                                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[13px] font-black transition-all border-2 ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-slate-200 shadow-sm'}`}
                                >
                                  {option.icon}
                                  {option.label}
                                  {isSelected && <CheckCircle2 className="h-3 w-3 text-white ml-1" />}
                                </button>
                              );
                            })}
                          </div>

                          {deliverables.length > 0 && (
                            <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Adjust Quantities</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {deliverables.map((d) => (
                                  <div key={d} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-slate-300 transition-all">
                                    <span className="text-[12px] font-black text-slate-700">{d}</span>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => updateDeliverableQuantity(d, (deliverableQuantities[d] || 1) - 1)}
                                        className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-90 transition-all font-bold"
                                      >
                                        −
                                      </button>
                                      <span className="w-6 text-center text-[13px] font-black text-slate-900">{deliverableQuantities[d] || 1}</span>
                                      <button
                                        onClick={() => updateDeliverableQuantity(d, (deliverableQuantities[d] || 1) + 1)}
                                        className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-90 transition-all font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Budget/Product Value */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner">
                          <label className={`block text-[15px] font-black text-slate-800 mb-6 ${typeLabel} flex items-center gap-2`}>
                            <IndianRupee className="h-5 w-5 text-slate-900" />
                            {collabType === 'paid' ? 'Campaign Budget' : collabType === 'barter' ? 'Product Value' : 'Commitment Details'}
                          </label>

                          {collabType === 'paid' && (
                            <div className="space-y-4">
                              <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[15px] group-focus-within:text-slate-900 transition-colors">₹</div>
                                <Input
                                  type="number"
                                  value={exactBudget}
                                  onChange={(e) => setExactBudget(e.target.value)}
                                  placeholder="Enter exact budget in INR"
                                  className="h-14 pl-10 pr-6 rounded-2xl border-white bg-white font-black text-[15px] shadow-sm focus:border-slate-300 transition-all"
                                />
                              </div>
                              <p className="px-1 text-[11px] text-slate-400 font-medium">Standard rate for this creator is ~₹{(creator.suggested_reel_rate || (creator as any).avg_rate_reel || 5000).toLocaleString()}.</p>
                            </div>
                          )}

                          {(collabType === 'barter' || collabType === 'hybrid') && (
                            <div className="space-y-5">
                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-2 block">Product Name / Offer</label>
                                <Input
                                  value={barterProductName}
                                  onChange={(e) => setBarterProductName(e.target.value)}
                                  placeholder="e.g. Wireless Noise Canceling Headphones"
                                  className="h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] shadow-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-2 block">Market Value (₹)</label>
                                  <Input
                                    type="number"
                                    value={barterValue}
                                    onChange={(e) => setBarterValue(e.target.value)}
                                    placeholder="Value in INR"
                                    className="h-12 px-4 rounded-xl border-white bg-white font-black text-[14px] shadow-sm"
                                  />
                                </div>
                                {collabType === 'hybrid' && (
                                  <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 mb-2 block">Plus Cash (₹)</label>
                                    <Input
                                      type="number"
                                      value={exactBudget}
                                      onChange={(e) => setExactBudget(e.target.value)}
                                      placeholder="Extra Cash"
                                      className="h-12 px-4 rounded-xl border-white bg-white font-black text-[14px] shadow-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {collabType === 'affiliate' && (
                            <div className="p-10 text-center space-y-3">
                              <TrendingUp className="h-10 w-10 text-slate-300 mx-auto" />
                              <p className="text-[13px] font-black text-slate-500">Commission terms will be negotiated after brief review.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Step 4: Campaign Goal & Timeline */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner space-y-6">
                          <div>
                            <label className={`block text-[15px] font-black text-slate-800 mb-3 ${typeLabel} flex items-center gap-2`}><Target className="h-5 w-5 text-slate-900" />Project Category</label>
                            <div className="flex flex-wrap gap-2">
                              {PRODUCT_CATEGORY_OPTIONS.slice(0, 10).map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setCampaignCategory(option.label)}
                                  className={`px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all border-2 ${campaignCategory === option.label ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-white text-slate-500 hover:border-slate-200 shadow-sm'}`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className={`block text-[15px] font-black text-slate-800 mb-2 ${typeLabel} flex items-center gap-2`}><FileText className="h-5 w-5 text-slate-900" />Campaign Goal</label>
                            <Textarea
                              value={campaignDescription}
                              onChange={(e) => setCampaignDescription(e.target.value)}
                              placeholder="Be specific! Example: Review our summer skin serum focusing on lightweight texture. Mention our launch date June 15th."
                              className="bg-white border-white rounded-2xl min-h-[120px] text-slate-900 placeholder:text-slate-400 focus:ring-slate-900/10 focus:border-slate-300 text-sm leading-relaxed shadow-sm p-4 font-medium"
                            />
                            <p className="text-[10px] text-slate-400 mt-2 px-1">Min. 20 characters • {campaignDescription.length} chars</p>
                          </div>

                          <div>
                            <label className={`block text-[15px] font-black text-slate-800 mb-3 ${typeLabel} flex items-center gap-2`}><Calendar className="h-5 w-5 text-slate-900" />Target Completion Date</label>
                            <Input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={deadline}
                              onChange={(e) => setDeadline(e.target.value)}
                              className="h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Contact Details */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        {/* Summary of Offer */}
                        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl relative overflow-hidden group mb-6">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all" />
                          <p className="text-[10px] font-black uppercase tracking-[2px] text-white/40 mb-4">Brief Summary</p>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] uppercase text-white/30 font-bold mb-0.5">Type</p>
                              <p className="text-[14px] font-black capitalize">{collabType}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-white/30 font-bold mb-0.5">Value</p>
                              <p className="text-[14px] font-black">{displayBudget}</p>
                            </div>
                            <div className="col-span-2 border-t border-white/5 pt-4">
                              <p className="text-[10px] uppercase text-white/30 font-bold mb-2">Scope</p>
                              <div className="flex flex-wrap gap-1.5">
                                {deliverables.length > 0 ? (
                                  deliverables.map(d => (
                                    <span key={d} className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-black text-white/90 border border-white/5">{deliverableQuantities[d] || 1}x {d}</span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-white/40 italic">No deliverables selected</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-200 shadow-inner space-y-6">
                          <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            <p className="text-[11px] font-black text-emerald-700 uppercase tracking-tight">Contract Protection Active</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Brand/Agency Name</label>
                              <Input
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                placeholder="e.g. Acme Marketing Unit"
                                className="h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] shadow-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Contact Email</label>
                              <Input
                                type="email"
                                value={brandEmail}
                                onChange={(e) => setBrandEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] shadow-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Authorized Person Name</label>
                            <Input
                              value={authorizedSignerName}
                              onChange={(e) => setAuthorizedSignerName(e.target.value)}
                              placeholder="Full name for contract signing"
                              className="h-12 px-4 rounded-xl border-white bg-white font-bold text-[14px] shadow-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Registered Address</label>
                            <Textarea
                              value={brandAddress}
                              onChange={(e) => setBrandAddress(e.target.value)}
                              placeholder="Enter full office address for the legal agreement..."
                              className="bg-white border-white rounded-xl min-h-[80px] shadow-sm p-4 font-medium text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step Navigation Bar */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => {
                          if (currentStep === 1) {
                            setShowCustomFlow(false);
                          } else {
                            setCurrentStep(currentStep - 1);
                          }
                          triggerHaptic(HapticPatterns.soft);
                        }}
                        variant="outline"
                        className="h-14 rounded-full border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:border-slate-800 hover:text-slate-900 transition-all active:scale-95"
                      >
                        {currentStep === 1 ? 'Go Back' : 'Previous Step'}
                      </Button>

                      {currentStep < 5 ? (
                        <Button
                          onClick={() => {
                            let canProceed = false;
                            if (currentStep === 1 && isStep1Ready) canProceed = true;
                            if (currentStep === 2 && isStep2Ready) canProceed = true;
                            if (currentStep === 3 && isStep3Ready) canProceed = true;
                            if (currentStep === 4 && isStep4Ready) canProceed = true;

                            if (canProceed) {
                              setCurrentStep(currentStep + 1);
                              triggerHaptic(HapticPatterns.success);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                              toast.error(`Please complete Step ${currentStep} first`);
                            }
                          }}
                          className="h-14 rounded-full bg-slate-900 border-2 border-slate-900 text-white hover:bg-black font-black text-xs uppercase tracking-widest transition-all shadow-xl flex-1 active:scale-98"
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSubmit}
                          disabled={submitting || !isStep5Ready}
                          className="h-14 rounded-full bg-slate-900 border-2 border-slate-900 text-white hover:bg-black font-black text-xs uppercase tracking-widest transition-all shadow-xl flex-1 active:scale-95 group relative overflow-hidden"
                        >
                          <span className="flex items-center justify-center gap-2">
                            {submitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Send Collaboration Offer
                              </>
                            )}
                          </span>
                        </Button>
                      )}
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-8">
                      <button
                        type="button"
                        onClick={() => setShowSaveDraftModal(true)}
                        className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors flex items-center gap-2"
                      >
                        <Lock className="h-3 w-3" />
                        Save draft & Resume later
                      </button>

                      {currentStep < 5 && (
                        <Button
                          onClick={handleStickySubmit}
                          className="hidden lg:flex w-auto h-12 px-8 rounded-2xl bg-slate-100 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                        >
                          Next Step: Step {currentStep + 1}
                        </Button>
                      )}
                    </div>

                    {/* Demo Fill Button */}
                    {/* Demo Fill Button */}
                    {import.meta.env.DEV && (
                      <div className="mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={fillDemoData}
                          className="text-[10px] text-slate-200 hover:text-slate-300 font-bold uppercase tracking-widest"
                        >
                          Fill demo data
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div> {/* END core-offer-form */}
            </div> {/* END RIGHT COLUMN */}
          </div> {/* END flex-row container */}

          <div className="lg:hidden h-20" />

          <div className="px-4">
            {/* Save and continue later modal */}
            <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
              <DialogContent className="bg-slate-900/95 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Save and continue later</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-100/85">
                  Enter your email. We&apos;ll send you a link to continue this request (valid for 7 days).
                </p>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  className={inputClass}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSaveDraftModal(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveDraftSubmit}
                    disabled={saveDraftSubmitting}
                    className="bg-white text-black hover:bg-slate-200 text-white"
                  >
                    {saveDraftSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      'Send link'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Sticky Bottom CTA (mobile compact) */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-slate-100">
            <div className="relative">
              {/* Mini Summary Strip */}
              <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900 rounded-xl shadow-lg animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Offer Summary</p>
                  <p className="text-[11px] font-black text-white">
                    {collabType === 'paid' ? `₹${Number(exactBudget).toLocaleString()}` : collabType === 'barter' ? 'Product Exchange' : 'Hybrid'}
                    <span className="mx-1.5 text-slate-600">·</span>
                    {deliverables.length === 0 ? <span className={"font-[600] text-slate-400"}>Add deliverables</span> : `${deliverables.length} ${deliverables[0]?.replace('Instagram ', '') || 'Asset'}${deliverables.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${isCoreReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">{isCoreReady ? 'Ready' : 'Incomplete'}</span>
                </div>
              </div>

              {isCoreReady && !hasStartedOffer && (
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl border border-teal-300/30 animate-ping" />
              )}
              <Button
                onClick={!showCustomFlow ? () => { const el = document.querySelector('.deal-templates-section'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } : handleStickySubmit}
                disabled={submitting}
                className={[
                  'w-full h-12 rounded-2xl font-bold text-base active:scale-[0.99] transition-all duration-200',
                  !showCustomFlow
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-pointer'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20 border-t border-white/20'
                ].join(' ')}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-5 w-5 text-white" />
                    Processing...
                  </span>
                ) : !showCustomFlow ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    Select a package to continue
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">{ctaIcon}{ctaLabel}</span>
                )}
              </Button>
            </div>
            <p className="text-center text-[10.5px] font-semibold text-slate-500 mt-2">
              {showSubmittingTrust ? 'Your offer is being processed securely' : '50+ brands have collaborated through Creator Armour'}
            </p>
            {showSubmittingTrust && (
              <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                {submittingChecklist.map((step, idx) => {
                  const complete = idx <= submitChecklistStep;
                  return (
                    <div key={step} className={`flex items-center gap-2 text-xs transition-all duration-200 ${complete ? 'text-emerald-700 opacity-100 translate-y-0' : 'text-slate-400 opacity-70 translate-y-0.5'}`}>
                      <CheckCircle2 className={`h-3.5 w-3.5 ${complete ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Deal Template Modal */}
      {
        editingTemplate && (
          <EditDealTemplateModal
            template={editingTemplate!}
            onSave={handleUpdateTemplate}
            onClose={() => setEditingTemplate(null)}
          />
        )
      }
    </>
  );
};

// Component helper for editing templates
const EditDealTemplateModal = ({
  template,
  onSave,
  onClose,
}: {
  template: DealTemplate;
  onSave: (updated: DealTemplate) => void;
  onClose: () => void;
}) => {
  const [edited, setEdited] = useState<DealTemplate>({ ...template });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-6 bg-white border-none shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <DialogHeader className="pt-2">
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-2xl">{edited.icon}</span>
            Edit Deal Template
          </DialogTitle>
          <p className="text-xs text-slate-500 font-medium tracking-tight">Set your collaboration package to guide brands.</p>
        </DialogHeader>
        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Template Label</label>
            <Input
              value={edited.label}
              onChange={(e) => setEdited({ ...edited, label: e.target.value })}
              className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all"
              placeholder="e.g. Pro Reel Package"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Deal Type</label>
              <Select
                value={edited.type}
                onValueChange={(v: any) => setEdited({ ...edited, type: v })}
              >
                <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="paid" className="rounded-xl font-bold">💰 Paid Collab</SelectItem>
                  <SelectItem value="barter" className="rounded-xl font-bold">📦 Barter Deal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">
                {edited.type === 'paid' ? 'Budget (₹)' : 'Value (₹)'}
              </label>
              <Input
                type="number"
                value={edited.budget}
                onChange={(e) => setEdited({ ...edited, budget: Number(e.target.value) })}
                className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-black text-teal-600 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Package Description</label>
            <Textarea
              value={edited.description}
              onChange={(e) => setEdited({ ...edited, description: e.target.value })}
              placeholder="e.g. 1 Reel with 2 Revisions & Brand Tag"
              className="rounded-2xl border-slate-200 bg-slate-50 min-h-[100px] font-medium focus:bg-white transition-all py-3 px-4"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest pl-1">Creator Notes (Optional)</label>
            <Input
              value={edited.notes || ''}
              onChange={(e) => setEdited({ ...edited, notes: e.target.value })}
              placeholder="e.g. Include shipping costs"
              className="rounded-2xl border-slate-200 bg-slate-50 h-12 font-bold focus:bg-white transition-all"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-full font-black text-slate-400 text-xs uppercase tracking-widest h-11 hover:bg-slate-50">Cancel</Button>
          <Button
            onClick={() => onSave(edited)}
            className="flex-1 rounded-full bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest h-11 shadow-xl active:scale-[0.98] transition-all"
          >
            Update Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CollabLinkLanding;
