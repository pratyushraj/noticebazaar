import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Instagram, Youtube, Twitter, Facebook, CheckCircle2, Loader2, ExternalLink, ChevronDown, ChevronUp, ShieldCheck, Rocket, Target, IndianRupee, Package, Mail, Building2, MapPin, Phone, Globe, AtSign, FileText, ImageIcon, Wallet, RefreshCcw, Calendar, TrendingUp, Lock, Clapperboard, Send, FileCheck, BadgeCheck, Clock, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/utils/analytics';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/SchemaMarkup';
import { getApiBaseUrl } from '@/lib/utils/api';
import { getCollabReadiness } from '@/lib/collab/readiness';

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
}

type CollabType = 'paid' | 'barter' | 'hybrid' | 'both';

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
  { label: 'Reel', value: 'Instagram Reel', icon: <Clapperboard className="h-3.5 w-3.5 text-violet-300 inline-block" /> },
  { label: 'Post', value: 'Post', icon: <ImageIcon className="h-3.5 w-3.5 text-violet-300 inline-block" /> },
  { label: 'Story', value: 'Story', icon: <FileText className="h-3.5 w-3.5 text-violet-300 inline-block" /> },
  { label: 'YouTube', value: 'YouTube Video', icon: <Youtube className="h-3.5 w-3.5 text-violet-300 inline-block" /> },
  { label: 'Custom', value: 'Custom', icon: <Target className="h-3.5 w-3.5 text-violet-300 inline-block" /> },
];

const CAMPAIGN_CATEGORY_OPTIONS = [
  'Fashion',
  'Beauty',
  'Tech',
  'Food',
  'Travel',
  'Fitness',
  'Finance',
  'Lifestyle',
  'Education',
  'Entertainment',
  'Gaming',
  'Parenting',
  'General',
];

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
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitChecklistStep, setSubmitChecklistStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
  const [campaignCategory, setCampaignCategory] = useState('General');
  const [barterProductImageUrl, setBarterProductImageUrl] = useState<string | null>(null);
  const [barterImageUploading, setBarterImageUploading] = useState(false);
  const [campaignDescription, setCampaignDescription] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [usageRights, setUsageRights] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [authorizedSignerName, setAuthorizedSignerName] = useState('');
  const [authorizedSignerRole, setAuthorizedSignerRole] = useState('');
  const [usageDuration, setUsageDuration] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [approvalSlaHours, setApprovalSlaHours] = useState('');
  const [shippingTimelineDays, setShippingTimelineDays] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [showCommercialTerms, setShowCommercialTerms] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [hasStartedOffer, setHasStartedOffer] = useState(false);
  const [showMobileAudienceDetails, setShowMobileAudienceDetails] = useState(false);
  const [showAdvancedMobileOptions, setShowAdvancedMobileOptions] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const readinessBadgeRef = useRef<HTMLDivElement | null>(null);
  const [readinessBadgeSparkle, setReadinessBadgeSparkle] = useState(false);

  // Save and continue later
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [saveDraftSubmitting, setSaveDraftSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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
    campaignCategory,
    barterProductImageUrl,
    campaignDescription,
    deliverables,
    usageRights,
    deadline,
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
    if (typeof data.campaignCategory === 'string') setCampaignCategory(data.campaignCategory);
    if (typeof data.barterProductImageUrl === 'string') setBarterProductImageUrl(data.barterProductImageUrl || null);
    if (typeof data.campaignDescription === 'string') setCampaignDescription(data.campaignDescription);
    if (Array.isArray(data.deliverables)) setDeliverables(data.deliverables.filter((d): d is string => typeof d === 'string'));
    if (typeof data.usageRights === 'boolean') setUsageRights(data.usageRights);
    if (typeof data.deadline === 'string') setDeadline(data.deadline);
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
      e.target.value = '';
    }
  };

  // Fetch creator profile (with timeout so page doesn't stay stuck on spinner)
  const CREATOR_FETCH_TIMEOUT_MS = 12000;

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
        setLoading(false);
      }
    };

    fetchCreator();
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
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
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
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

    if (!showDetailedForm) {
      setShowDetailedForm(true);
      toast.info('Add final details before sending.');
      window.setTimeout(() => {
        document.getElementById('detailed-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    formRef.current?.requestSubmit();
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
          collab_type: collabType,
          budget_range: budgetRange || undefined,
          exact_budget: exactBudget ? parseFloat(exactBudget) : undefined,
          campaign_category: campaignCategory || undefined,
          barter_value: barterValue ? parseFloat(barterValue) : undefined,
          barter_product_image_url: barterProductImageUrl || undefined,
          campaign_description: campaignDescription,
          deliverables,
          usage_rights: usageRights,
          deadline: deadline || undefined,
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
        navigate(`/collab/${username}/success`, {
          state: {
            creatorName: creator?.name || 'the creator',
            submissionType: data.submission_type || (data.lead ? 'lead' : 'request'),
            confirmationMessage: data.message,
            profileLabel: creator?.profile_label || undefined,
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
  const typePageTitle = 'md:text-[28px] md:leading-[36px] md:font-semibold';
  const typeSectionTitle = 'md:text-[20px] md:leading-[28px] md:font-semibold';
  const typeCardTitle = 'md:text-[16px] md:leading-[24px] md:font-semibold';
  const typeBodyPrimary = 'md:text-[15px] md:leading-[22px] md:font-normal';
  const typeBodySecondary = 'md:text-[14px] md:leading-[20px] md:font-normal';
  const typeHelper = 'text-[13px] leading-[18px] font-normal';
  const typeLabel = 'text-[13px] leading-[18px] font-medium';
  const typeTrust = 'flex items-center gap-2 text-[14px] leading-[20px] font-medium text-white/60';
  const surfaceClass = `${elevationLevel2} backdrop-blur-2xl rounded-3xl`;
  const inputClass = 'bg-white/[0.05] border-white/10 text-white placeholder:text-white/40 focus:bg-white/[0.08] focus:border-white/20 transition-all rounded-xl';
  const helperTextClass = `${typeHelper} text-white/50`;
  const isValidBrandEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail.trim());
  const isCampaignDescriptionValid = campaignDescription.trim().length >= 20;
  const isBudgetProvided = collabType === 'barter' || Boolean(budgetRange || exactBudget);
  const isCoreReady = Boolean(
    collabType &&
    brandName.trim() &&
    deliverables.length > 0 &&
    isCampaignDescriptionValid &&
    isBudgetProvided
  );
  const isContactReady = Boolean(isValidBrandEmail && brandAddress.trim().length >= 15);
  const ctaStep = !hasStartedOffer ? 'create' : (showDetailedForm ? 'send' : 'review');
  const ctaLabel = ctaStep === 'create' ? 'Create Offer' : ctaStep === 'review' ? 'Review Offer' : 'Send Offer';
  const ctaHelper = ctaStep === 'create'
    ? 'Takes 20 seconds'
    : ctaStep === 'review'
      ? 'Add final details before sending'
      : 'Contract & payment protected';
  const ctaIcon = ctaStep === 'send'
    ? <Send className="h-4 w-4 text-violet-300" />
    : <Rocket className="h-4 w-4 text-violet-300" />;
  const isFinalSubmissionStep = ctaStep === 'send';
  const showSubmittingTrust = submitting && isFinalSubmissionStep;
  const submittingChecklist = [
    'Creating secure request',
    'Preparing contract-ready terms',
    'Notifying creator',
  ];
  const revealDelayStyle = (delayMs: number) => ({
    transitionDelay: showDetailedForm ? `${delayMs}ms` : '0ms',
  });

  const completionChecks = useMemo(() => ([
    { label: 'Collaboration type', complete: Boolean(collabType) },
    { label: 'Budget or offer', complete: isBudgetProvided },
    { label: 'Brand name', complete: Boolean(brandName.trim()) },
    { label: 'Campaign description', complete: isCampaignDescriptionValid },
    { label: 'At least 1 deliverable', complete: deliverables.length > 0 },
    { label: 'Brand email', complete: isValidBrandEmail },
    { label: 'Brand address', complete: brandAddress.trim().length >= 15 },
  ]), [
    collabType,
    isBudgetProvided,
    brandName,
    isCampaignDescriptionValid,
    deliverables.length,
    isValidBrandEmail,
    brandAddress,
  ]);

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
    const previewAudienceCities = formatAudienceCities(creator.top_cities);
    const previewAudienceRegionLabel = creator.collab_region_label?.trim() || getAudienceRegionLabel(previewAudienceCities);
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
      avgRateReel: creator.avg_rate_reel,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    const isNotFoundError = /not found/i.test(error);
    const errorTitle = isNotFoundError ? 'Creator Not Found' : 'Unable to Load Profile';
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-4">{errorTitle}</h1>
            <p className="text-purple-200 mb-6">{error}</p>
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
                className="bg-purple-600 hover:bg-purple-700"
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
  const platformNames = creator.platforms.map(p => p.name).join(', ');
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  const trustStats = creator.trust_stats;
  const pastBrands = Array.isArray(creator.past_brands)
    ? creator.past_brands.map((b) => (typeof b === 'string' ? b.trim() : '')).filter(Boolean)
    : [];
  const recentCampaignTypes = Array.isArray(creator.recent_campaign_types)
    ? creator.recent_campaign_types.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean)
    : [];
  const trustedBrands = trustStats?.brands_count ?? 0;
  const avgResponseHours = trustStats?.avg_response_hours ?? null;
  const completionRate = trustStats?.completion_rate ?? null;
  const completedDeals = trustStats?.completed_deals ?? 0;
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
  const completionPercent = Math.round((completedCount / completionChecks.length) * 100);
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
    if (n === null || n === undefined || Number.isNaN(n)) return '';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };
  const primaryFollowers = creator.followers ?? followerCount;
  const avgReelViews = creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null;
  const avgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null;
  const engagementRange = getEngagementRange(primaryFollowers, avgReelViews);
  const genderRows = formatAudienceGender(creator.audience_gender_split);
  const audienceCities = formatAudienceCities(creator.top_cities);
  const audienceLanguage = formatAudienceLanguage(creator.primary_audience_language);
  const audienceRegionLabel = creator.collab_region_label?.trim() || getAudienceRegionLabel(audienceCities);
  const creatorBio = isScrapedInstagramBio(creator.bio) ? null : creator.bio;
  const profileLabel = creator.profile_label || (creator.is_registered ? 'Verified Creator Profile' : 'Public Creator Profile');
  const audienceFitLine = creator.collab_audience_fit_note?.trim() || 'Works best for targeted audience campaigns.';
  const responseCtaLine = avgResponseHours && avgResponseHours > 0
    ? `~${Math.round(avgResponseHours)} hr${Math.round(avgResponseHours) > 1 ? 's' : ''}`
    : '~24 hrs';
  const showEngagementConfidence = engagementRange !== 'Growing Audience';
  const engagementConfidenceNote = 'Above-average engagement for creator size';
  const recentActivityNoteRaw = creator.collab_recent_activity_note?.trim() || 'Posting consistently';
  const recentActivityNote = withNeutralPrefix(recentActivityNoteRaw, 'Currently ');
  const audienceRelevanceNote = creator.collab_audience_relevance_note?.trim() || 'Strong relevance for North India audience';
  const activeBrandCollabsMonth = Number(creator.active_brand_collabs_month);
  const currentMonthCollabCount = Number.isFinite(activeBrandCollabsMonth) && activeBrandCollabsMonth > 0
    ? activeBrandCollabsMonth
    : null;
  const campaignSlotNoteRaw = creator.campaign_slot_note?.trim() || 'Selective partnerships';
  const campaignSlotNoteText = withNeutralPrefix(campaignSlotNoteRaw, 'Works with ');
  const deliveryReliabilityNote = creator.collab_delivery_reliability_note?.trim() || 'Reliable delivery across past collaborations.';
  const responseBehaviorNoteRaw = creator.collab_response_behavior_note?.trim() || 'Most brands receive response within same day';
  const responseBehaviorNote = withNeutralPrefix(responseBehaviorNoteRaw, 'Typically ');
  const sameDayResponseLine = responseBehaviorNoteRaw
    .replace(/typically\s*/i, '')
    .replace(/within\s+same day/i, 'same day')
    .trim() || 'Most brands receive response same day';
  const ctaTrustNote = creator.collab_cta_trust_note?.trim() || 'Creator notified instantly — no DM required.';
  const ctaDmNote = creator.collab_cta_dm_note?.trim() || 'No DMs required — creator replies here.';
  const ctaPlatformNote = creator.collab_cta_platform_note?.trim() || 'Direct collaboration — no agency middle layer';
  const mobileEngagementLabel = engagementRange === 'Growing Audience' ? 'Consistent viewer engagement' : engagementRange;
  const hasEngagementAndRegion = Boolean((avgReelViews || avgLikes) && audienceRegionLabel);
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
    avgRateReel: creator.avg_rate_reel,
    suggestedReelRate: creator.suggested_reel_rate,
    suggestedBarterValueMin: creator.suggested_barter_value_min,
    suggestedBarterValueMax: creator.suggested_barter_value_max,
    regionLabel: creator.collab_region_label || audienceRegionLabel,
    mediaKitUrl: creator.media_kit_url,
    firstDealCount: creator.past_brand_count || creator.collab_brands_count_override || trustStats?.completed_deals || 0,
  });
  const profileReadinessState = collabReadiness.label;
  const profileReadinessTone = collabReadiness.toneClass;

  return (
    <>
      {/* SEO Meta Tags */}
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

      {/* Person Schema for SEO */}
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

      <div className="min-h-screen bg-[#0E061E] text-white selection:bg-purple-500/30">
        <div className="container mx-auto px-4 pt-4 pb-0 md:py-6 md:pb-28 max-w-lg md:max-w-[960px] relative">
          {/* Header - Creator Profile Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] p-6 mb-2 md:mb-4 shadow-2xl">
            {/* Ambient glows */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-fuchsia-500/30 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/30 blur-[100px] rounded-full" />

            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-white/25 bg-white/10 shrink-0">
                    {creator.profile_photo ? (
                      <img src={creator.profile_photo} alt={`${creator.name} profile`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {creator.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className={`text-4xl font-bold text-white tracking-tight leading-none mb-1 ${typePageTitle}`}>{creator.name.split(' ')[0]}</h1>
                    {creator.platforms.find(p => p.name.toLowerCase() === 'instagram' && p.handle) && (
                      <span className="text-sm font-medium text-white/70">
                        @{creator.platforms.find(p => p.name.toLowerCase() === 'instagram')?.handle.replace('@', '')}
                      </span>
                    )}
                    <div className="text-xs text-white/70 mt-1">
                      {primaryFollowers
                        ? `${formatFollowers(primaryFollowers)} Followers`
                        : 'Instagram Profile Linked'}
                    </div>
                    <div
                      ref={readinessBadgeRef}
                      className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium relative overflow-hidden ${profileReadinessTone}`}
                    >
                      {profileReadinessState}
                      {readinessBadgeSparkle && (
                        <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-violet-200/70 animate-ping" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white/90 w-fit">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Safe Zone • Creator Armour
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-white/85 w-fit">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />
                  {profileLabel}
                </div>
              </div>
            </div>

            {creatorBio && (
              <p className="text-xs text-white/60 mt-3 line-clamp-2 max-w-md leading-relaxed">
                {creatorBio}
              </p>
            )}
          </div>
        </div>

        {/* Mobile stats chips */}
        <div className="md:hidden flex gap-2 overflow-x-auto no-scrollbar py-2 mb-2 px-1">
          <div className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white">
            {pastBrandCount > 0 ? `${pastBrandCount}+` : (trustedBrands > 0 ? `${trustedBrands}+` : (pastBrands.length > 0 ? `${pastBrands.length}+` : '14+'))} Past Collaborations
          </div>
          <div className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white">
            {(trustStats?.total_deals || 0) < 5 ? 'No cancellations' : `${(completionRate && completionRate > 0 ? `${100 - completionRate}%` : 'No')} cancellations`}
          </div>
        </div>

        {/* Desktop stats row (unchanged) */}
        <div className="hidden md:flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-2 mb-12 px-1">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-lg font-bold text-white">{pastBrandCount > 0 ? `${pastBrandCount}+` : (trustedBrands > 0 ? `${trustedBrands}+` : (pastBrands.length > 0 ? `${pastBrands.length}+` : '14+'))}</span>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-tighter">Brand Collaborations</span>
          </div>
          <div className="w-[1px] h-8 bg-white/30" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-lg font-bold text-white">{avgResponseHours || 1} hr</span>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-tighter">Response Time</span>
          </div>
          <div className="w-[1px] h-8 bg-white/30" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-lg font-bold text-white">{(trustStats?.total_deals || 0) < 5 ? '—' : (completionRate && completionRate > 0 ? `${100 - completionRate}%` : '0%')}</span>
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-tighter">{(trustStats?.total_deals || 0) < 5 ? 'No cancels yet' : 'Cancellations'}</span>
          </div>
        </div>
        <p className="text-center text-xs text-white/55 mb-2 md:mb-12">
          {(pastBrandCount ?? 0)}+ Past Collaborations
        </p>
        {currentMonthCollabCount !== null && (
          <p className="text-center text-xs text-violet-100/70 mt-[-10px] mb-2">
            {currentMonthCollabCount} Active Campaign{currentMonthCollabCount > 1 ? 's' : ''} This Month
          </p>
        )}

        {/* Creator Performance Snapshot */}
        <div className={`hidden md:block mb-12 backdrop-blur-md rounded-xl p-6 ${elevationLevel2}`}>
          <h3 className={`text-base font-semibold text-white ${typeSectionTitle}`}>Audience Fit Snapshot</h3>
          <p className={`${typeHelper} text-violet-100/70 mt-1 mb-4`}>
            Helps brands align campaigns with audience size & content style.
          </p>
          <div className="space-y-8">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">Performance Truth</p>
              <div className="space-y-5">
                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Reach</p>
                  <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><TrendingUp className="h-4 w-4 text-sky-400" />Followers: {primaryFollowers ? `${formatFollowers(primaryFollowers)}` : '—'}</p>
                </div>

                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Content Impact</p>
                  <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>
                    Avg Reel Views: {avgReelViews ? `${Number(avgReelViews).toLocaleString('en-IN')}` : '—'}
                    {avgReelViews ? ' (Based on recent posts)' : ''}
                  </p>
                  <p className={`text-sm text-white ${typeBodyPrimary}`}>
                    Avg Likes: {avgLikes ? `${Number(avgLikes).toLocaleString('en-IN')}` : '—'}
                    {avgLikes ? ' (Based on recent posts)' : ''}
                  </p>
                </div>

                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Brand Experience</p>
                  <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>Past Collaborations: {pastBrandCount ?? 0}</p>
                </div>

                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Response Time</p>
                  <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><Clock className="h-4 w-4 text-sky-400" />{avgResponseHours || 1} hr</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">System Trust Layer</p>
              <div className="space-y-5">
                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Engagement Quality</p>
                  <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><TrendingUp className="h-4 w-4 text-sky-400" />{engagementRange}</p>
                  {showEngagementConfidence && (
                    <p className={`${typeHelper} text-emerald-200/85 mt-1 inline-flex items-center gap-2`}><TrendingUp className="h-4 w-4 text-sky-400" />{engagementConfidenceNote}</p>
                  )}
                </div>

                {audienceRegionLabel && (
                  <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                    <p className="text-xs text-white/60">Audience Region</p>
                    <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><MapPin className="h-4 w-4 text-sky-400" />Primary Audience: {audienceRegionLabel}</p>
                  </div>
                )}

                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Reliability Indicators</p>
                  <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>{deliveryReliabilityNote}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">Creator Context Layer</p>
              <div className={`rounded-lg p-3 space-y-3 ${elevationLevel1}`}>
                <div>
                  <p className="text-xs text-white/60">Audience Fit</p>
                  <p className={`text-sm text-white mt-0.5 ${typeBodyPrimary}`}>{audienceFitLine}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Recent Activity</p>
                  <p className={`text-sm text-white mt-0.5 ${typeBodyPrimary}`}>{recentActivityNote}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Campaign Slots</p>
                  <p className={`text-sm text-white mt-0.5 ${typeBodyPrimary}`}>{campaignSlotNoteText}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">CTA Behavior</p>
                  <p className={`text-sm text-white mt-0.5 ${typeBodyPrimary}`}>{responseBehaviorNote}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(creator.audience_gender_split || audienceCities.length > 0 || creator.audience_age_range || audienceLanguage || creator.posting_frequency) && (
          <div className="hidden md:block mb-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <h4 className="text-base font-semibold text-white mb-2">Audience Profile</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {genderRows && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Gender</p>
                  <ul className="text-sm text-violet-100/90 space-y-0.5">
                    {genderRows.map((row, idx) => (
                      <li key={`${row}-${idx}`}>• {row}</li>
                    ))}
                  </ul>
                </div>
              )}

              {audienceCities.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Top Cities</p>
                  {audienceCities.length === 1 ? (
                    <p className="text-sm text-violet-100/90">{audienceCities[0]}</p>
                  ) : (
                    <ul className="text-sm text-violet-100/90 space-y-0.5">
                      {audienceCities.map((city, idx) => (
                        <li key={`${city}-${idx}`}>• {city}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-violet-100/70 mt-1">{audienceRelevanceNote}</p>
                </div>
              )}

              {creator.audience_age_range && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Age</p>
                  <p className="text-sm text-violet-100/90">{creator.audience_age_range}</p>
                </div>
              )}

              {creator.posting_frequency && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Posting Frequency</p>
                  <p className="text-sm text-violet-100/90">{creator.posting_frequency}</p>
                </div>
              )}

              {audienceLanguage && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
                  <p className="text-xs text-white/60 mb-1">Language</p>
                  <p className="text-sm text-violet-100/90">{audienceLanguage}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {recentCampaignTypes.length > 0 && (
          <div className="hidden md:block mb-12 rounded-xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-6" role="region" aria-label="Recent campaign types">
            <h3 className="text-lg font-semibold text-white mb-3">Recent Campaign Types</h3>
            <div className="flex flex-wrap gap-3">
              {recentCampaignTypes.map((campaignType, idx) => (
                <span
                  key={`${campaignType}-${idx}`}
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/[0.04] px-3.5 py-2 text-sm text-violet-100"
                >
                  {campaignType}
                </span>
              ))}
            </div>
          </div>
        )}


        {/* SEO-Friendly Content Section - Indexable */}
        <div className="hidden md:block mb-12 space-y-8">
          {/* Creator Bio & Platforms - Indexable Content */}
          <div className="bg-white/[0.07] backdrop-blur-xl rounded-xl p-6 border border-white/15">
            {creatorBio && (
              <p className="text-violet-100/85 leading-relaxed mb-4">
                {creatorBio}
              </p>
            )}

            {creator.platforms.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white mb-3">
                  Active on {creator.platforms.length > 1 ? 'Platforms' : 'Platform'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  {creator.platforms.map((platform, idx) => {
                    const isInstagram = platform.name.toLowerCase() === 'instagram';
                    return (
                      <div key={idx} className="flex items-center gap-3 text-violet-100/85">
                        {getPlatformIcon(platform.name)}
                        <div className="flex-1">
                          <p className="font-medium text-white">{platform.name}</p>
                          {isInstagram && platform.handle ? (
                            <a
                              href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-violet-200 hover:text-white transition-colors flex items-center gap-1"
                            >
                              @{platform.handle.replace('@', '')}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <p className="text-sm text-violet-200/90">
                              {platform.handle}
                            </p>
                          )}
                          {platform.followers && (
                            <p className="text-xs text-violet-200/65 mt-1">
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
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                {creator.open_to_collabs !== false && (
                  <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Actively open to collaborations
                  </p>
                )}
                {creator.content_niches && creator.content_niches.length > 0 && (
                  <div>
                    <p className="text-xs text-purple-400 mb-1">Content niches</p>
                    <div className="flex flex-wrap gap-2">
                      {creator.content_niches.map((niche, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/10 text-purple-200 border-white/20">
                          {niche}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {creator.media_kit_url && (
                  <div>
                    <a
                      href={creator.media_kit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-200 hover:text-white inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      Media kit
                    </a>
                    <p className="text-xs text-violet-100/70 mt-1">Ready for brand collaborations</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Trust & Safety Block */}
        <div className="mt-6 mb-2 md:mt-12 md:mb-12 space-y-4">
          <div className="grid grid-cols-1 gap-3 px-2 md:px-0">
            {[
              { label: 'Contract auto-generated', icon: <FileCheck className="h-4 w-4 text-emerald-400" /> },
              { label: 'Payment secured', icon: <ShieldCheck className="h-4 w-4 text-emerald-400" /> },
              { label: 'Deliverables verified', icon: <BadgeCheck className="h-4 w-4 text-emerald-400" /> }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-medium text-white/70">
                <div className="shrink-0 bg-emerald-500/10 p-1 rounded-full">{item.icon}</div>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile-first collapsed audience snapshot */}
        <div className="md:hidden mt-6 mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
          <h3 className="text-base font-semibold text-white">Audience Fit Snapshot</h3>
          <div className="mt-3 space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs text-white/60 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-sky-400" />Engagement Quality</p>
              <p className="text-sm text-white mt-1">{mobileEngagementLabel}</p>
            </div>
            {audienceRegionLabel && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                  <MapPin className="h-4 w-4 text-sky-400" />
                  {audienceRegionLabel} Audience
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileAudienceDetails((prev) => !prev)}
            className="mt-3 w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-violet-100"
          >
            {showMobileAudienceDetails ? 'Hide Audience Details' : 'View Audience Details'}
          </button>

          {showMobileAudienceDetails && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-white/60">Followers</p>
                <p className="text-sm text-white mt-1">{primaryFollowers ? `${formatFollowers(primaryFollowers)}` : '—'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-white/60">Content Impact</p>
                <p className="text-sm text-white mt-1">Avg Reel Views: {avgReelViews ? `${Number(avgReelViews).toLocaleString('en-IN')}` : '—'}</p>
                <p className="text-sm text-white">Avg Likes: {avgLikes ? `${Number(avgLikes).toLocaleString('en-IN')}` : '—'}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs text-white/60">Brand Experience</p>
                <p className="text-sm text-white mt-1">Past Collaborations: {pastBrandCount ?? 0}</p>
                <p className="text-sm text-white mt-1">Response Time: {avgResponseHours || 1} hr</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-1">
                <p className="text-xs text-white/60">Creator Context</p>
                <p className="text-sm text-white">• {audienceFitLine}</p>
                <p className="text-sm text-white">• {recentActivityNote}</p>
                <p className="text-sm text-white">• {campaignSlotNoteText}</p>
                <p className="text-sm text-white inline-flex items-center gap-2"><Clock className="h-4 w-4 text-sky-400" />{sameDayResponseLine}</p>
              </div>
              {(genderRows || audienceCities.length > 0 || creator.audience_age_range || creator.posting_frequency || audienceLanguage) && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-1">
                  <p className="text-xs text-white/60">Audience Profile</p>
                  {genderRows && <p className="text-sm text-white">Gender: {genderRows.join(' / ')}</p>}
                  {audienceCities.length > 0 && <p className="text-sm text-white">Top Cities: {audienceCities.slice(0, 3).join(', ')}</p>}
                  {creator.audience_age_range && <p className="text-sm text-white">Age: {creator.audience_age_range}</p>}
                  {creator.posting_frequency && <p className="text-sm text-white">Posting: {creator.posting_frequency}</p>}
                  {audienceLanguage && <p className="text-sm text-white">Language: {audienceLanguage}</p>}
                </div>
              )}
              {hasEngagementAndRegion && (
                <p className="text-xs text-violet-100/75 px-1">
                  Brands in similar categories have collaborated successfully.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Quick Deal Builder */}
        <div className="md:hidden mt-6 mb-1 flex items-center gap-3 px-2">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Propose Collaboration</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        <p className="md:hidden text-center text-[10px] font-bold text-emerald-400 uppercase tracking-[0.1em] mb-1">
          Used by 50+ brands to close deals safely
        </p>
        <p className="md:hidden text-center text-xs text-violet-100/65 mb-1">
          Takes less than 20 seconds
        </p>
        <div className="md:hidden flex items-center justify-center gap-1.5 mb-3 text-[10px] text-violet-100/70">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Protected by contract & payment tracking</span>
        </div>

        <div id="core-offer-form" className={`mt-2 md:mt-16 rounded-[28px] p-5 md:p-6 mb-6 md:mb-16 text-white border border-white/15 bg-gradient-to-b from-white/[0.10] to-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/30 relative transition-all duration-200 ease-out ${showDetailedForm ? 'opacity-[0.85] scale-[0.995]' : 'opacity-100 scale-100'}`}>
          <h2 className={`text-xl font-bold mb-5 tracking-tight ${typeSectionTitle}`}>
            <span className="md:hidden">Propose Collaboration</span>
            <span className="hidden md:inline">Propose Collaboration</span>
          </h2>

          <div className="space-y-6 md:space-y-8">
            {/* Deal Type */}
            <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-purple-500/30">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 text-sm text-violet-100/90 ${typeLabel}`}><Target className="h-4 w-4 text-violet-400" />Deal Type</span>
                <Select
                  value={collabType}
                  onValueChange={(value: CollabType) => {
                    setCollabType(value);
                    if (value === 'paid') {
                      setBarterValue('');
                    } else if (value === 'barter') {
                      setBudgetRange('');
                      setExactBudget('');
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[190px] bg-transparent border-0 p-0 text-right text-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid"><span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4 text-amber-400" />Paid Deal</span></SelectItem>
                    <SelectItem value="barter"><span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-amber-400" />Product Exchange</span></SelectItem>
                    <SelectItem value="hybrid"><span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-violet-400" />Cash + Product</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {collabType === 'barter' && (
                <p className="text-xs text-violet-100/75 mt-2">
                  Creator may request partial cash + product
                </p>
              )}
            </div>

            {/* Budget */}
            <div
              aria-hidden={collabType !== 'paid'}
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collabType === 'paid' ? 'opacity-100 max-h-44 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><IndianRupee className="h-4 w-4 text-amber-400" />Proposed Budget</span>
                  <div className="relative flex items-center">
                    <span className="text-violet-200/70 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={exactBudget}
                      onChange={(e) => setExactBudget(e.target.value)}
                      placeholder="3000"
                      className="bg-transparent border-0 text-right w-24 focus:ring-0 text-white font-bold p-0 text-base placeholder:text-violet-200/55"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              aria-hidden={collabType !== 'barter'}
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collabType === 'barter' ? 'opacity-100 max-h-60 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><Package className="h-4 w-4 text-amber-400" />Estimated Product / Service Value</span>
                  <div className="relative flex items-center">
                    <span className="text-violet-200/70 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={barterValue}
                      onChange={(e) => setBarterValue(e.target.value)}
                      placeholder="3000"
                      className="bg-transparent border-0 text-right w-24 focus:ring-0 text-white font-bold p-0 text-base placeholder:text-violet-200/55"
                    />
                  </div>
                </div>
                <p className="text-xs text-violet-100/65 mt-2">Helps creator evaluate collaboration value.</p>
                <p className="text-xs text-violet-100/60 mt-1">Used only for collaboration fairness.</p>
              </div>
            </div>

            <div
              aria-hidden={!isHybridCollab(collabType)}
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isHybridCollab(collabType) ? 'opacity-100 max-h-80 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 space-y-3 transition-all focus-within:ring-2 focus-within:ring-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><IndianRupee className="h-4 w-4 text-amber-400" />Proposed Budget</span>
                  <div className="relative flex items-center">
                    <span className="text-violet-200/70 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={exactBudget}
                      onChange={(e) => setExactBudget(e.target.value)}
                      placeholder="3000"
                      className="bg-transparent border-0 text-right w-24 focus:ring-0 text-white font-bold p-0 text-base placeholder:text-violet-200/55"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><Package className="h-4 w-4 text-amber-400" />Estimated Product / Service Value</span>
                  <div className="relative flex items-center">
                    <span className="text-violet-200/70 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={barterValue}
                      onChange={(e) => setBarterValue(e.target.value)}
                      placeholder="3000"
                      className="bg-transparent border-0 text-right w-24 focus:ring-0 text-white font-bold p-0 text-base placeholder:text-violet-200/55"
                    />
                  </div>
                </div>
                <p className="text-xs text-violet-100/65">Helps creator evaluate collaboration value.</p>
                <p className="text-xs text-violet-100/60">Used only for collaboration fairness.</p>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><Clapperboard className="h-4 w-4 text-violet-400" />Content Requested</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 py-0.5">
                {DELIVERABLE_OPTIONS.filter((item) => item.value !== 'Custom').map((item) => {
                  const active = deliverables.includes(item.value);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleDeliverableToggle(item.value)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${active ? 'bg-gradient-to-r from-fuchsia-500/80 to-violet-500/80 text-white border-fuchsia-300/70 shadow-lg shadow-fuchsia-900/50 ring-2 ring-fuchsia-400/40' : 'bg-white/[0.06] text-violet-100/80 border-white/25 hover:bg-white/[0.12]'}`}
                    >
                      <span className="mr-1">{item.icon}</span>{item.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-violet-100/65 mt-2">Custom deliverables can be discussed</p>
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-100/90"><Calendar className="h-4 w-4 text-slate-300" />Timeline</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-transparent border-0 text-right focus:ring-0 text-white font-bold p-0 text-sm"
                />
              </div>
            </div>

            {/* Message -> Campaign Goal */}
            <div>
              <label className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold text-violet-200/65 uppercase tracking-wider">
                <Target className="h-3.5 w-3.5 text-violet-400" />
                Campaign Goal <span className="text-red-400 ml-0.5">*</span>
              </label>
              <Textarea
                value={campaignDescription}
                onChange={(e) => {
                  setCampaignDescription(e.target.value);
                  if (errors.campaignDescription) setErrors({ ...errors, campaignDescription: '' });
                }}
                placeholder={`Briefly outline the campaign goal... (min 20 characters)`}
                className={`bg-white/[0.06] border-white/15 rounded-2xl min-h-[100px] text-white placeholder:text-violet-200/45 focus:ring-purple-500/30 text-sm leading-relaxed ${errors.campaignDescription ? 'border-red-400/50' : ''}`}
              />
              {errors.campaignDescription && (
                <p className="text-xs text-red-400 mt-1">{errors.campaignDescription}</p>
              )}
              {!errors.campaignDescription && campaignDescription.length > 0 && campaignDescription.length < 20 && (
                <p className="text-xs text-amber-400 mt-1">{20 - campaignDescription.length} more characters needed</p>
              )}
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowSaveDraftModal(true)}
              className="text-sm text-violet-100 hover:text-white border border-white/30 hover:border-white/50 rounded-xl px-4 py-2 transition-colors bg-white/[0.05] hover:bg-white/[0.10]"
            >
              Save and continue later
            </button>
            <span className="text-xs text-violet-100/60">We’ll email you a link (valid 7 days)</span>
          </div>

          {/* Demo Fill Button - Only in development or with ?demo=true */}
          {import.meta.env.DEV && (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={fillDemoData}
                className="text-xs text-violet-200/70 hover:text-violet-100 underline underline-offset-4"
              >
                Fill demo data
              </button>
            </div>
          )}

          {/* Expandable Detailed Form */}
          <div
            id="detailed-form"
            className={`overflow-hidden transition-all duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'max-h-[4600px] opacity-100 translate-y-0 mt-8 md:mt-16 pt-4 md:pt-8 border-t border-white/10' : 'max-h-0 opacity-0 translate-y-4 pointer-events-none'}`}
          >
            <div className="mb-3">
              <div
                style={revealDelayStyle(40)}
                className={`mb-3 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
              >
                Creator Armour handles contracts automatically — so both sides stay protected.
              </div>
              <div className="mb-3 flex items-center gap-3">
                <div style={revealDelayStyle(120)} className={`h-px flex-1 bg-white/20 origin-left transition-transform duration-300 ease-out ${showDetailedForm ? 'scale-x-100' : 'scale-x-0'}`} />
                <span style={revealDelayStyle(0)} className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-100/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}><ShieldCheck className="h-4 w-4 text-emerald-400" /><Lock className="h-4 w-4 text-emerald-400" />Secure Details (after creator accepts)</span>
                <div style={revealDelayStyle(120)} className={`h-px flex-1 bg-white/20 origin-left transition-transform duration-300 ease-out ${showDetailedForm ? 'scale-x-100' : 'scale-x-0'}`} />
              </div>
              <button
                type="button"
                onClick={() => setShowDetailedForm((prev) => !prev)}
                style={revealDelayStyle(120)}
                className={`w-full rounded-lg border border-white/25 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
              >
                {showDetailedForm ? 'Hide secure details' : 'Add Secure Details'}
              </button>
            </div>
          </div>
          <Card className={`${surfaceClass} max-w-[840px] mx-auto ${showDetailedForm ? '' : 'hidden'}`}>
            <CardContent className="p-6 md:p-6">
              <form id="collab-request-form" ref={formRef} onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {collabType !== 'paid' && (
                  <div
                    style={revealDelayStyle(120)}
                    className={`space-y-4 md:space-y-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 md:p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                  >
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      Product / Service Image
                    </h3>
                    <p className="text-xs text-violet-100/75">
                      Upload an image representing what you&apos;re offering.
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleBarterImageChange}
                      disabled={barterImageUploading}
                      className="block w-full text-sm text-white/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500/30 file:text-purple-100 file:text-sm file:font-medium"
                    />
                    {barterProductImageUrl && (
                      <div className="mt-2 flex items-start gap-3 rounded-lg border border-purple-500/20 bg-white/5 p-2">
                        <img
                          src={barterProductImageUrl}
                          alt="Product"
                          className="h-20 w-20 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-green-400/90">Image uploaded</p>
                          <button
                            type="button"
                            onClick={() => setBarterProductImageUrl(null)}
                            className="mt-1 text-xs text-purple-300 hover:text-white underline"
                          >
                            Remove image
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-violet-100/70">
                      Product collaborations are treated as commercial partnerships.
                    </p>
                  </div>
                )}

                {/* Campaign Details */}
                <div
                  style={revealDelayStyle(80)}
                  className={`space-y-4 md:space-y-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 md:p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                >
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-violet-400" />
                    Content Requested
                  </h3>
                  <p className="md:hidden text-xs text-violet-200/70">
                    Core campaign details were captured above. Add brand and legal details here.
                  </p>

                  <div>
                    <label className={`block text-white mb-2 ${typeLabel}`}>
                      <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-300" />Brand Name <span className="text-red-400">*</span></span>
                    </label>
                    <Input
                      type="text"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        if (errors.brandName) setErrors({ ...errors, brandName: '' });
                      }}
                      required
                      className={`${inputClass} ${errors.brandName ? 'border-red-400/50' : ''}`}
                    />
                    {errors.brandName && (
                      <p className="text-xs text-red-400 mt-1">{errors.brandName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className={`block text-white mb-2 ${typeLabel}`}>
                        <span className="inline-flex items-center gap-2"><Globe className="h-4 w-4 text-slate-300" />Website</span>
                      </label>
                      <Input
                        type="text"
                        value={brandWebsite}
                        onChange={(e) => {
                          setBrandWebsite(e.target.value);
                          if (errors.brandWebsite) setErrors({ ...errors, brandWebsite: '' });
                        }}
                        placeholder="example.com or www.example.com"
                        className={`${inputClass} ${errors.brandWebsite ? 'border-red-400/50' : ''}`}
                      />
                      {errors.brandWebsite && (
                        <p className="text-xs text-red-400 mt-1">{errors.brandWebsite}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-white mb-2 ${typeLabel}`}>
                        <span className="inline-flex items-center gap-2"><AtSign className="h-4 w-4 text-slate-300" />Instagram Handle</span>
                      </label>
                      <Input
                        type="text"
                        value={brandInstagram}
                        onChange={(e) => setBrandInstagram(e.target.value)}
                        placeholder="@brandname"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <label className={`block text-white mb-2 ${typeLabel}`}>
                      <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-slate-300" />Campaign Description <span className="text-red-400">*</span></span>
                    </label>
                    <Textarea
                      value={campaignDescription}
                      onChange={(e) => {
                        setCampaignDescription(e.target.value);
                        if (errors.campaignDescription) setErrors({ ...errors, campaignDescription: '' });
                      }}
                      required
                      placeholder="Tell us about your campaign..."
                      className={`${inputClass} min-h-[120px] ${errors.campaignDescription ? 'border-red-400/50' : ''}`}
                    />
                    {errors.campaignDescription && (
                      <p className="text-xs text-red-400 mt-1">{errors.campaignDescription}</p>
                    )}
                    {campaignDescription && !errors.campaignDescription && (
                      <p className="text-xs text-violet-100/65 mt-1">
                        {campaignDescription.length} characters
                      </p>
                    )}
                  </div>

                  <div className="hidden md:block">
                    <label className={`block text-white mb-2 ${typeLabel}`}>
                      <span className="inline-flex items-center gap-2"><Clapperboard className="h-4 w-4 text-violet-400" />Deliverables Requested <span className="text-red-400">*</span></span>
                    </label>
                    <p className={`${helperTextClass} mb-3`}>Multiple selections allowed</p>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      {DELIVERABLE_OPTIONS.map((item) => {
                        const active = deliverables.includes(item.value);
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => handleDeliverableToggle(item.value)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${active
                              ? 'border-fuchsia-300/70 bg-fuchsia-500/25 text-white ring-2 ring-fuchsia-400/40 shadow-lg shadow-fuchsia-500/20'
                              : 'border-white/25 bg-white/[0.04] text-violet-100/85 hover:bg-white/[0.08]'
                              }`}
                          >
                            <span className="mr-1">{item.icon}</span>{item.label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.deliverables && (
                      <p className="text-xs text-red-400 mt-1">{errors.deliverables}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="usage-rights"
                      checked={usageRights}
                      onCheckedChange={(checked) => setUsageRights(checked === true)}
                      className="border-white/30 data-[state=checked]:bg-purple-600"
                    />
                    <label htmlFor="usage-rights" className="text-sm text-violet-100/85 cursor-pointer">
                      Usage rights needed?
                    </label>
                  </div>

                  <div className="hidden md:block rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-300" />
                      Timeline
                    </h4>
                    <label className={`block text-white mb-2 ${typeLabel}`}>
                      <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-300" />Timeline / Deadline</span>
                    </label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={inputClass}
                    />
                    <p className={`${helperTextClass} mt-1.5`}>
                      Suggested: at least 5–7 working days after approval
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/15">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setShowCommercialTerms((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-violet-100"
                      >
                        <FileText className="h-4 w-4 text-slate-300" />
                        Commercial Terms (Optional)
                        {showCommercialTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {showCommercialTerms && (
                        <button
                          type="button"
                          onClick={applyStandardTerms}
                          className="text-xs text-violet-100 hover:text-white border border-white/25 rounded-md px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1]"
                        >
                          Use standard terms
                        </button>
                      )}
                    </div>
                    {showCommercialTerms && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><PenLine className="h-4 w-4 text-slate-300" />Authorized Signer Name</label>
                            <Input
                              type="text"
                              value={authorizedSignerName}
                              onChange={(e) => setAuthorizedSignerName(e.target.value)}
                              placeholder="Full legal name"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><PenLine className="h-4 w-4 text-slate-300" />Signer Designation</label>
                            <Input
                              type="text"
                              value={authorizedSignerRole}
                              onChange={(e) => setAuthorizedSignerRole(e.target.value)}
                              placeholder="e.g. Marketing Manager"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-slate-300" />Usage Rights Duration</label>
                            <Input
                              type="text"
                              value={usageDuration}
                              onChange={(e) => setUsageDuration(e.target.value)}
                              placeholder="e.g. 90 days"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><Clock className="h-4 w-4 text-slate-300" />Approval SLA (hours)</label>
                            <Input
                              type="number"
                              min="1"
                              value={approvalSlaHours}
                              onChange={(e) => setApprovalSlaHours(e.target.value)}
                              placeholder="e.g. 48"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-300" />Shipping Timeline (days)</label>
                            <Input
                              type="number"
                              min="1"
                              value={shippingTimelineDays}
                              onChange={(e) => setShippingTimelineDays(e.target.value)}
                              placeholder="e.g. 3"
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-slate-300" />Payment Terms</label>
                          <Textarea
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                            placeholder="e.g. 50% advance, balance within 7 days of posting"
                            className={`${inputClass} min-h-[84px]`}
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-white mb-2 inline-flex items-center gap-2"><FileText className="h-4 w-4 text-slate-300" />Cancellation / Reschedule Policy</label>
                          <Textarea
                            value={cancellationPolicy}
                            onChange={(e) => setCancellationPolicy(e.target.value)}
                            placeholder="e.g. If canceled after signing, approved production costs are payable."
                            className={`${inputClass} min-h-[84px]`}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div
                  style={revealDelayStyle(100)}
                  className={`space-y-4 md:space-y-5 rounded-xl border border-white/15 bg-white/[0.04] p-4 md:p-6 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                >
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-fuchsia-300" />
                    Secure Deal Details
                  </h3>
                  <p className="text-xs text-violet-100/70 mt-[-6px]">
                    Used to auto-generate contract once creator accepts.
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-300" />Brand Email <span className="text-red-400">*</span></span>
                    </label>
                    <Input
                      type="email"
                      value={brandEmail}
                      onChange={(e) => {
                        setBrandEmail(e.target.value);
                        if (errors.brandEmail) setErrors({ ...errors, brandEmail: '' });
                      }}
                      required
                      className={`${inputClass} ${errors.brandEmail ? 'border-red-400/50' : ''}`}
                    />
                    {errors.brandEmail && (
                      <p className="text-xs text-red-400 mt-1">{errors.brandEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-amber-400" />GSTIN (Optional)</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        value={brandGstin}
                        onChange={(e) => {
                          setBrandGstin(e.target.value.toUpperCase().slice(0, 15));
                          if (errors.brandGstin) setErrors({ ...errors, brandGstin: '' });
                          setGstLookupError(null);
                        }}
                        placeholder="15-digit GSTIN for invoicing"
                        maxLength={15}
                        className={`flex-1 ${inputClass} font-mono ${errors.brandGstin ? 'border-red-400/50' : ''}`}
                        disabled={isGstLookupLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGstLookup}
                        disabled={isGstLookupLoading || !brandGstin.trim() || brandGstin.trim().length !== 15}
                        className="shrink-0 bg-white/[0.07] border-white/25 text-violet-100 hover:bg-white/[0.12] font-mono"
                        aria-label="Fetch company name and address from GST"
                      >
                        {isGstLookupLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />
                            Fetching...
                          </>
                        ) : (
                          'Fetch from GST'
                        )}
                      </Button>
                    </div>
                    {(errors.brandGstin || gstLookupError) && (
                      <p className="text-xs text-red-400 mt-1">{errors.brandGstin || gstLookupError}</p>
                    )}
                    <p className={`${helperTextClass} mt-1.5`}>
                      Optional. Use &quot;Fetch from GST&quot; to auto-fill company name and address.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-300" />Company / Brand Address <span className="text-red-400">*</span></span>
                    </label>
                    <Textarea
                      value={brandAddress}
                      onChange={(e) => {
                        setBrandAddress(e.target.value);
                        if (errors.brandAddress) setErrors({ ...errors, brandAddress: '' });
                      }}
                      required
                      placeholder="Full registered address (required for contract)"
                      rows={3}
                      className={`${inputClass} min-h-[80px] ${errors.brandAddress ? 'border-red-400/50' : ''}`}
                    />
                    {errors.brandAddress && (
                      <p className="text-xs text-red-400 mt-1">{errors.brandAddress}</p>
                    )}
                    <p className={`${helperTextClass} mt-1.5`}>
                      Used for the collaboration agreement when the creator accepts
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-slate-300" />Phone (Optional)</span>
                    </label>
                    <Input
                      type="tel"
                      value={brandPhone}
                      onChange={(e) => setBrandPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Trust Indicators */}
                <div
                  style={revealDelayStyle(120)}
                  className={`rounded-xl border border-white/20 bg-white/[0.05] p-6 space-y-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                >
                  <h3 className={`text-base font-semibold text-white ${typeCardTitle}`}>Review before submit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="text-violet-100/80">Brand: <span className="text-white">{brandName.trim() || 'Not set'}</span></div>
                    <div className="text-violet-100/80">Type: <span className="text-white">{collabType === 'paid' ? 'Paid Deal' : collabType === 'barter' ? 'Product Exchange' : 'Cash + Product'}</span></div>
                    <div className="text-violet-100/80">Budget/Offer: <span className="text-white">{displayBudget}</span></div>
                    <div className="text-violet-100/80">Deadline: <span className="text-white">{displayDeadline}</span></div>
                    <div className="text-violet-100/80">Deliverables: <span className="text-white">{deliverables.length > 0 ? deliverables.join(', ') : 'Not set'}</span></div>
                    <div className="text-violet-100/80">Payment terms: <span className="text-white">{paymentTerms.trim() || 'Default after negotiation'}</span></div>
                  </div>
                  {missingRequired.length > 0 && (
                    <p className="text-xs text-amber-200/90">Before submit, complete: {missingRequired.join(', ')}</p>
                  )}
                </div>

                <div
                  style={revealDelayStyle(120)}
                  className={`bg-violet-500/10 border border-violet-300/25 rounded-lg p-6 space-y-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDetailedForm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                >
                  <div className={typeTrust}>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Secured by Creator Armour</span>
                  </div>
                  <div className={typeTrust}>
                    <BadgeCheck className="h-4 w-4 text-emerald-400" />
                    <span>Details visible only to creator</span>
                  </div>
                </div>

                <button type="submit" className="hidden" aria-hidden="true" />
              </form>
            </CardContent>
          </Card>


          {/* Additional SEO Content - Brand-Focused */}
          <details className="hidden md:block mt-10 max-w-3xl mx-auto bg-white/[0.07] backdrop-blur-xl rounded-xl p-6 border border-white/15">
            <summary className="cursor-pointer list-none text-xl font-bold text-white flex items-center justify-between">
              <span>Professional Collaboration Workflow</span>
              <ChevronDown className="h-4 w-4 text-violet-200" />
            </summary>
            <div className="space-y-4 text-violet-100/85 leading-relaxed mt-4">
              <p>
                When you submit a collaboration request through this page, you're choosing a professional workflow designed for brands and agencies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Clear Contracts
                  </h3>
                  <p className="text-sm">
                    Every collaboration gets a legally binding contract automatically generated with your terms, deliverables, and payment details.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Faster Approvals
                  </h3>
                  <p className="text-sm">
                    Structured requests mean quicker responses. Creators can accept, counter, or decline with clear terms from day one.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Payment Safety
                  </h3>
                  <p className="text-sm">
                    All payments are tracked and protected. No chasing invoices or payment delays—everything is logged and monitored.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Professional Workflow
                  </h3>
                  <p className="text-sm">
                    Skip the back-and-forth DMs. Submit once, get a response, and move forward with confidence.
                  </p>
                </div>
              </div>
              <p className="text-sm mt-4 pt-4 border-t border-white/10">
                This collaboration page is optimized for brands and agencies looking to partner with {creator.name} for influencer marketing campaigns. All requests are processed securely through Creator Armour's platform.
              </p>
              <p className="text-sm mt-3">
                <a href="mailto:support@creatorarmour.com" className="text-violet-200 hover:text-white underline">
                  Help / Contact us
                </a>
                <span className="text-purple-400/80 ml-1">— we’re here before any issue becomes a dispute.</span>
              </p>
            </div>
          </details>
          <div className="md:hidden h-20" />
        </div>

        {/* Save and continue later modal */}
        <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
          <DialogContent className="bg-purple-900/95 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Save and continue later</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-violet-100/85">
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
                className="bg-purple-600 hover:bg-purple-700 text-white"
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
        {/* Sticky Bottom CTA (mobile compact) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-gradient-to-t from-[#0E061E] via-[#0E061E]/95 to-transparent backdrop-blur-md">
          <div className="relative">
            {showSubmittingTrust && (
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl border border-violet-300/30 animate-ping" />
            )}
            <Button
              onClick={handleStickySubmit}
              disabled={submitting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] text-white font-bold text-base shadow-[0_12px_35px_rgba(74,0,224,0.4)] border-t border-white/20 active:scale-[0.99]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5 text-violet-100" />
                  Securing Offer...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">{ctaIcon}{ctaLabel}</span>
              )}
            </Button>
          </div>
          <p className="text-center text-[11px] text-violet-100/70 mt-2">
            {showSubmittingTrust ? 'Your offer is being processed securely' : ctaHelper}
          </p>
          {showSubmittingTrust && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              {submittingChecklist.map((step, idx) => {
                const complete = idx <= submitChecklistStep;
                return (
                  <div key={step} className={`flex items-center gap-2 text-xs transition-all duration-200 ${complete ? 'text-emerald-200 opacity-100 translate-y-0' : 'text-violet-100/50 opacity-70 translate-y-0.5'}`}>
                    <CheckCircle2 className={`h-3.5 w-3.5 ${complete ? 'text-emerald-400' : 'text-violet-200/50'}`} />
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Bottom CTA (desktop full) */}
        <div className="hidden md:block fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-[#0E061E] via-[#0E061E]/95 to-transparent backdrop-blur-md">
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-purple-600/30 blur-[40px] rounded-full animate-pulse -z-10" />
            {showSubmittingTrust && (
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-[24px] border border-violet-300/30 animate-ping" />
            )}
            {ctaStep === 'create' && (
              <p className="text-center text-xs text-violet-100/85 mb-2 inline-flex w-full items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                Most brands receive a response the same day
              </p>
            )}
            <Button
              onClick={handleStickySubmit}
              disabled={submitting}
              className={`w-full h-16 rounded-[24px] bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] text-white text-[16px] font-semibold shadow-[0_15px_45px_rgba(74,0,224,0.45)] hover:shadow-[0_20px_60px_rgba(74,0,224,0.6)] border-t border-white/20 transition-all active:scale-95 ${elevationLevel3}`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <Lock className="h-6 w-6 text-violet-100" />
                  Securing Offer...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  {ctaIcon}
                  {ctaLabel}
                </span>
              )}
            </Button>
            <p className="text-center text-xs text-violet-100/75 mt-2">
              {showSubmittingTrust ? 'Your offer is being processed securely' : ctaHelper}
            </p>
            {showSubmittingTrust && (
              <div className="mx-auto mt-3 max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="grid grid-cols-1 gap-2">
                  {submittingChecklist.map((step, idx) => {
                    const complete = idx <= submitChecklistStep;
                    return (
                      <div key={step} className={`flex items-center gap-2 text-sm transition-all duration-200 ${complete ? 'text-emerald-200 opacity-100 translate-y-0' : 'text-violet-100/50 opacity-70 translate-y-0.5'}`}>
                        <CheckCircle2 className={`h-4 w-4 ${complete ? 'text-emerald-400' : 'text-violet-200/50'}`} />
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default CollabLinkLanding;
