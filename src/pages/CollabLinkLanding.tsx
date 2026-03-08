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
  { label: 'Reel', value: 'Instagram Reel', icon: <Clapperboard className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Post', value: 'Post', icon: <ImageIcon className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Story', value: 'Story', icon: <FileText className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'YouTube', value: 'YouTube Video', icon: <Youtube className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Custom', value: 'Custom', icon: <Target className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
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
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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
        setErrors(prev => ({
          ...prev,
          campaignDescription: !campaignDescription.trim()
            ? 'Campaign Goal is required'
            : campaignDescription.trim().length < 20
              ? 'Please provide more details'
              : ''
        }));
        toast.error('Please complete Step 1 (Campaign Goal) first');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 2) {
      if (!isStep2Ready) {
        toast.error('Please select deliverables and set a budget');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep === 3) {
      if (!isStep3Ready) {
        toast.error('Please complete required Brand & Contact details');
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
  const typePageTitle = 'md:text-[28px] md:leading-[36px] md:font-semibold';
  const typeSectionTitle = 'md:text-[20px] md:leading-[28px] md:font-semibold';
  const typeCardTitle = 'md:text-[16px] md:leading-[24px] md:font-semibold';
  const typeBodyPrimary = 'md:text-[15px] md:leading-[22px] md:font-normal';
  // const typeBodySecondary = "text-[15px] sm:text-[16px] leading-[1.6] text-slate-500 font-medium tracking-snug";
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
  const ctaStepStatus = !hasStartedOffer ? 'create' : (currentStep === 3 ? 'send' : 'next');
  const ctaLabel = ctaStepStatus === 'create' ? 'Create Proposal' : ctaStepStatus === 'next' ? (currentStep === 2 ? 'Continue to Legal Terms' : `Next: Step ${currentStep + 1}`) : 'Send Collaboration Offer';
  const ctaHelper = ctaStepStatus === 'create'
    ? 'Takes 20 seconds'
    : ctaStepStatus === 'next'
      ? (currentStep === 2 ? 'Legally binding contract auto-generated' : 'Step-based progressive flow')
      : 'Review & sign contract';
  const ctaIcon = ctaStepStatus === 'send'
    ? <Send className="h-4 w-4 text-slate-400" />
    : <Rocket className="h-4 w-4 text-slate-400" />;
  const isFinalSubmissionStep = ctaStepStatus === 'send';
  const showSubmittingTrust = submitting && isFinalSubmissionStep;
  const submittingChecklist = [
    'Validating terms...',
    'Generating secure contract...',
    'Securing payload for transmission...',
  ];
  const revealDelayStyle = (delayMs: number) => ({
    transitionDelay: showDetailedForm ? `${delayMs}ms` : '0ms',
  });

  const isStep1Ready = Boolean(campaignCategory && campaignDescription.trim().length >= 20);
  const isStep2Ready = Boolean(collabType && deliverables.length > 0 && isBudgetProvided);
  const isStep3Ready = Boolean(brandName.trim() && isValidBrandEmail && brandAddress.trim().length >= 15);

  const completionChecks = useMemo(() => ([
    { label: 'Campaign Goal', complete: isStep1Ready },
    { label: 'Deliverables & Budget', complete: isStep2Ready },
    { label: 'Brand Details', complete: isStep3Ready },
  ]), [
    isStep1Ready,
    isStep2Ready,
    isStep3Ready,
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
      avgRateReel: (creator as any).avg_rate_reel || creator.suggested_reel_rate, // Fix: property name was avg_reel_rate
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
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
            <p className="text-slate-400 mb-6">{error}</p>
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
  const audienceRelevanceNote = creator.collab_audience_relevance_note?.trim() || 'Strong relevance for North India audience';
  const creatorBio = isScrapedInstagramBio(creator.bio) ? null : creator.bio;
  const audienceFitLine = creator.collab_audience_fit_note?.trim() || 'Works best for targeted audience campaigns.';
  const sameDayResponseLine = avgResponseHours && avgResponseHours <= 20
    ? `~${Math.round(avgResponseHours)} hr${Math.round(avgResponseHours) > 1 ? 's' : ''}`
    : '~24 hrs';
  const showEngagementConfidence = engagementRange !== 'Growing Audience';
  const engagementConfidenceNote = 'Above-average engagement for creator size';
  const recentActivityNoteRaw = creator.collab_recent_activity_note?.trim() || 'Posting consistently';
  const recentActivityNote = withNeutralPrefix(recentActivityNoteRaw, 'Currently ');
  const campaignSlotNoteRaw = creator.campaign_slot_note?.trim() || 'Selective partnerships';
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
    avgRateReel: (creator as any).avg_rate_reel || (creator as any).avg_reel_rate,
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

      <div className="min-h-screen bg-[#0B0F14] selection:bg-blue-500/30">
        <div className="container mx-auto px-4 pt-4 pb-0 md:py-6 md:pb-28 max-w-lg md:max-w-[960px] relative">
          {/* Header - Deal Desk Intake Portal */}
          <div className="mb-6 pt-2 md:mb-10 md:pt-4 relative">
            {/* Ambient glow behind hero */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-5 md:mb-7 relative">
              {/* Avatar with ring */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/15 shadow-xl">
                  {creator.profile_photo ? (
                    <img src={creator.profile_photo} alt={`${creator.name} profile`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-700 text-white font-black text-xl">
                      {creator.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0B0F14]" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-[17px] font-black text-white leading-tight">{creator.name}</h2>
                  <div className="flex items-center gap-1 bg-blue-500/15 border border-blue-400/20 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                {primaryFollowers ? (
                  <span className="text-[13px] text-white/50 font-semibold mt-0.5">{formatFollowers(primaryFollowers)} followers · Open to collabs</span>
                ) : (
                  <span className="text-[13px] text-white/50 font-semibold mt-0.5">Verified Creator Profile</span>
                )}
              </div>
            </div>

            <div className="max-w-xl relative">
              <h1 className={`text-[30px] md:text-4xl font-black tracking-tight text-white mb-2.5 leading-tight ${typePageTitle}`}>
                Send Offer to {creator.name.split(' ')[0]}
              </h1>
              <p className="text-[15px] text-white/55 leading-relaxed max-w-md">
                Create a legally binding term sheet to partner with {creator.name.split(' ')[0]}.
              </p>
            </div>
          </div>

          {/* Creator Performance Snapshot */}
          <div className={`hidden md:block mb-12 backdrop-blur-md rounded-xl p-6 ${elevationLevel2}`}>
            <h3 className={`text-base font-semibold text-white ${typeSectionTitle}`}>Audience Fit Snapshot</h3>
            <p className={`${typeHelper} text-slate-100/70 mt-1 mb-4`}>
              Helps brands align campaigns with audience size & content style.
            </p>
            <div className="space-y-8">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">Performance Truth</p>
                <div className="space-y-5">
                  {primaryFollowers > 0 && (
                    <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                      <p className="text-xs text-white/60">Reach</p>
                      <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><TrendingUp className="h-4 w-4 text-sky-400" />Followers: {formatFollowers(primaryFollowers)}</p>
                    </div>
                  )}

                  {(avgReelViews > 0 || avgLikes > 0) && (
                    <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                      <p className="text-xs text-white/60">Content Impact</p>
                      {avgReelViews > 0 && (
                        <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>
                          Avg Reel Views: {Number(avgReelViews).toLocaleString('en-IN')}
                          {' (Based on recent posts)'}
                        </p>
                      )}
                      {avgLikes > 0 && (
                        <p className={`text-sm text-white ${typeBodyPrimary}`}>
                          Avg Likes: {Number(avgLikes).toLocaleString('en-IN')}
                          {' (Based on recent posts)'}
                        </p>
                      )}
                    </div>
                  )}

                  {pastBrandCount > 0 && (
                    <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                      <p className="text-xs text-white/60">Brand Experience</p>
                      <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>Past Collaborations: {pastBrandCount}</p>
                    </div>
                  )}

                  {avgResponseHours > 0 && (
                    <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                      <p className="text-xs text-white/60">Response Time</p>
                      <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><Clock className="h-4 w-4 text-sky-400" />~{Math.round(avgResponseHours)} hr{Math.round(avgResponseHours) > 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                <p className="text-xs text-white/60">Engagement Quality</p>
                <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}><TrendingUp className="h-4 w-4 text-sky-400" />{engagementRange}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 mb-2">Platform Experience</p>
              <div className="space-y-5">
                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Past Collaborations</p>
                  <p className={`text-sm text-white mt-1 ${typeBodyPrimary}`}>
                    {pastBrandCount ? `${pastBrandCount} deals completed` : 'Establishing Brand Track Record'}
                  </p>
                </div>

                <div className={`rounded-lg p-3 ${elevationLevel1}`}>
                  <p className="text-xs text-white/60">Response Time</p>
                  <p className={`text-sm text-white mt-1 inline-flex items-center gap-2 ${typeBodyPrimary}`}>
                    <Clock className="h-4 w-4 text-sky-400" />
                    Avg Creator Response: {avgResponseHours ? `~${Math.round(avgResponseHours)} hrs` : '~24 hours'}
                  </p>
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
                  <ul className="text-sm text-slate-100/90 space-y-0.5">
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
                    <p className="text-sm text-slate-100/90">{audienceCities[0]}</p>
                  ) : (
                    <ul className="text-sm text-slate-100/90 space-y-0.5">
                      {audienceCities.map((city, idx) => (
                        <li key={`${city}-${idx}`}>• {city}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-slate-100/70 mt-1">{audienceRelevanceNote}</p>
                </div>
              )}

              {creator.audience_age_range && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Age</p>
                  <p className="text-sm text-slate-100/90">{creator.audience_age_range}</p>
                </div>
              )}

              {creator.posting_frequency && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/60 mb-1">Posting Frequency</p>
                  <p className="text-sm text-slate-100/90">{creator.posting_frequency}</p>
                </div>
              )}

              {audienceLanguage && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 md:col-span-2">
                  <p className="text-xs text-white/60 mb-1">Language</p>
                  <p className="text-sm text-slate-100/90">{audienceLanguage}</p>
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
                  className="inline-flex items-center rounded-full border border-white/30 bg-white/[0.04] px-3.5 py-2 text-sm text-slate-100"
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
              <p className="text-slate-100/85 leading-relaxed mb-4">
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
                      <div key={idx} className="flex items-center gap-3 text-slate-100/85">
                        {getPlatformIcon(platform.name)}
                        <div className="flex-1">
                          <p className="font-medium text-white">{platform.name}</p>
                          {isInstagram && platform.handle ? (
                            <a
                              href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-slate-200 hover:text-white transition-colors flex items-center gap-1"
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
              <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                {creator.open_to_collabs !== false && (
                  <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Actively open to collaborations
                  </p>
                )}
                {creator.content_niches && creator.content_niches.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Content niches</p>
                    <div className="flex flex-wrap gap-2">
                      {creator.content_niches.map((niche, i) => (
                        <Badge key={i} variant="secondary" className="bg-white/10 text-slate-400 border-white/20">
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
                      className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-1"
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

        {/* Trust & Safety Block - premium redesign */}
        <div className="mt-5 mb-4 md:mt-12 md:mb-10">
          <div className="grid grid-cols-3 gap-2 px-0">
            {[
              { label: 'Contract auto-generated', icon: <FileCheck className="h-5 w-5 text-emerald-400" />, desc: 'Legal & binding' },
              { label: 'Payment secured', icon: <ShieldCheck className="h-5 w-5 text-blue-400" />, desc: 'Dispute protected' },
              { label: 'Deliverables verified', icon: <BadgeCheck className="h-5 w-5 text-violet-400" />, desc: 'Creator accountable' },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-2 py-4">
                <div className={`shrink-0 rounded-xl p-2.5 ${idx === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  idx === 1 ? 'bg-blue-500/10 border border-blue-500/20' :
                    'bg-violet-500/10 border border-violet-500/20'
                  }`}>{item.icon}</div>
                <div>
                  <p className="text-[11px] font-black text-white/80 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 font-semibold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile-first collapsed audience snapshot - premium */}
        <div className="md:hidden mt-4 mb-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <h3 className="text-[15px] font-black text-white">Audience Fit Snapshot</h3>
            </div>
            {audienceRegionLabel && (
              <span className="flex items-center gap-1 text-[10px] font-black text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 rounded-full px-2 py-1 uppercase tracking-wide">
                <MapPin className="w-3 h-3" />{audienceRegionLabel}
              </span>
            )}
          </div>

          {/* Stats grid – 4 metrics */}
          <div className="grid grid-cols-2 gap-px bg-white/5">
            <div className="bg-[#0B0F14] px-4 py-3">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-sky-400" /> Engagement</p>
              <p className="text-[14px] font-black text-white leading-tight">{mobileEngagementLabel}</p>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">Consistent viewer engagement</p>
            </div>
            <div className="bg-[#0B0F14] px-4 py-3">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Response Time</p>
              <p className="text-[14px] font-black text-white leading-tight">{sameDayResponseLine}</p>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">Avg message reply</p>
            </div>
            {pastBrandCount > 0 ? (
              <div className="bg-[#0B0F14] px-4 py-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Past Brand Deals</p>
                <p className="text-[14px] font-black text-white leading-tight">{pastBrandCount} completed</p>
                <p className="text-[10px] text-emerald-400/60 font-semibold mt-0.5">Verified history</p>
              </div>
            ) : (
              <div className="bg-[#0B0F14] px-4 py-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Followers</p>
                <p className="text-[14px] font-black text-white leading-tight">{formatFollowers(primaryFollowers)}</p>
              </div>
            )}
            <div className="bg-[#0B0F14] px-4 py-3">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1">Creator Reliability</p>
              <p className="text-[14px] font-black text-emerald-400 leading-tight">98%</p>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">Deal completion rate</p>
            </div>
          </div>

          {/* Estimated Reach card */}
          {(avgReelViews || primaryFollowers > 0) && (
            <div className="px-4 py-3 border-t border-white/5 bg-sky-500/[0.04]">
              <p className="text-[10px] text-sky-300/60 font-black uppercase tracking-wider mb-2">Estimated Campaign Reach</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Reel</p>
                  <p className="text-[13px] font-black text-white">
                    {avgReelViews
                      ? `${Math.round(Number(avgReelViews) * 0.6 / 1000)}K – ${Math.round(Number(avgReelViews) * 1.4 / 1000)}K views`
                      : `${Math.round(primaryFollowers * 0.15 / 1000)}K – ${Math.round(primaryFollowers * 0.35 / 1000)}K views`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Story</p>
                  <p className="text-[13px] font-black text-white">
                    {`${Math.round(primaryFollowers * 0.04 / 1000)}K – ${Math.round(primaryFollowers * 0.09 / 1000)}K views`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowMobileAudienceDetails((prev) => !prev)}
            className="w-full px-4 py-3 text-[12px] font-black text-white/60 flex items-center justify-center gap-2 hover:bg-white/5 transition-all border-t border-white/10"
          >
            {showMobileAudienceDetails ? 'Hide Audience Details ↑' : 'View Audience Details ↓'}
          </button>

          {showMobileAudienceDetails && (
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/10">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1.5">Content Impact</p>
                <p className="text-[13px] text-white font-semibold">Avg Reel Views: {avgReelViews ? Number(avgReelViews).toLocaleString('en-IN') : '—'}</p>
                <p className="text-[13px] text-white font-semibold">Avg Likes: {avgLikes ? Number(avgLikes).toLocaleString('en-IN') : '—'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1.5">Creator Context</p>
                <p className="text-[13px] text-white/80 font-semibold">• {audienceFitLine}</p>
                <p className="text-[13px] text-white/80 font-semibold">• {recentActivityNote}</p>
                <p className="text-[13px] text-white/80 font-semibold">• {campaignSlotNoteText}</p>
              </div>
              {(genderRows || audienceCities.length > 0 || creator.audience_age_range || audienceLanguage) && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-wider mb-1.5">Audience Profile</p>
                  {genderRows && <p className="text-[13px] text-white/80 font-semibold">Gender: {genderRows.join(' / ')}</p>}
                  {audienceCities.length > 0 && <p className="text-[13px] text-white/80 font-semibold">Top Cities: {audienceCities.slice(0, 3).join(', ')}</p>}
                  {creator.audience_age_range && <p className="text-[13px] text-white/80 font-semibold">Age: {creator.audience_age_range}</p>}
                  {audienceLanguage && <p className="text-[13px] text-white/80 font-semibold">Language: {audienceLanguage}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Deal Builder label */}
        <div className="md:hidden mt-5 mb-2 flex items-center gap-3">
          <div className="h-[1px] flex-1 bg-white/10" />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Propose Collaboration</span>
          <div className="h-[1px] flex-1 bg-white/10" />
        </div>

        {/* Social proof banner */}
        <div className="md:hidden mb-3 mx-0">
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 px-4 py-3">
            <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.12em]">✓ Used by 50+ brands to close deals safely</p>
            <p className="text-[11px] text-white/50 font-semibold">Takes less than 20 seconds</p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-semibold">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Protected by contract & payment tracking</span>
            </div>
          </div>
        </div>

        <div id="core-offer-form" className={`mt-2 md:mt-16 rounded-[28px] p-5 md:p-8 mb-6 md:mb-16 text-white border border-white/15 bg-gradient-to-b from-white/[0.10] to-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/40 relative transition-all duration-200 ease-out`}>
          {/* Subtle gradient top accent */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-[28px]" />

          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className={`text-[20px] font-black tracking-tight text-white leading-tight ${typeSectionTitle}`}>
                {currentStep === 1 ? 'Campaign Details' : currentStep === 2 ? 'Deliverables & Budget' : 'Brand & Contact Info'}
              </h2>
              <p className="text-[11px] text-white/40 font-semibold mt-0.5 uppercase tracking-wider">
                {currentStep === 1 ? 'Tell us about your campaign' : currentStep === 2 ? 'What content & how much?' : 'Your brand contact & billing'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${step === currentStep ? 'w-8 bg-blue-500' : step < currentStep ? 'w-3 bg-emerald-500' : 'w-1.5 bg-white/20'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider">
                {['Creator', 'Deliverables', 'Legal'].map((label, i) => (
                  <span key={label} className={i + 1 === currentStep ? 'text-blue-400' : i + 1 < currentStep ? 'text-emerald-400' : 'text-white/20'}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Campaign Category - Added for Step 1 refinement */}
              <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-white/20">
                <label className={`block text-slate-100/90 mb-3 ${typeLabel} inline-flex items-center gap-2`}><Target className="h-4 w-4 text-slate-400" />Project Category</label>
                <div className="flex flex-wrap gap-2">
                  {['General', 'Lifestyle', 'Fashion', 'Tech', 'Food', 'Beauty', 'Gaming'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCampaignCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${campaignCategory === cat ? 'bg-white text-black border-white' : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.10]'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div id="campaign-goal-field" className="space-y-3">
                <label className={`flex items-center gap-2 text-[10px] font-bold text-slate-200/65 uppercase tracking-wider ${typeLabel}`}>
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  What is your campaign goal? <span className="text-red-400 ml-0.5">*</span>
                </label>
                <Textarea
                  value={campaignDescription}
                  onChange={(e) => {
                    setCampaignDescription(e.target.value);
                    if (errors.campaignDescription) setErrors({ ...errors, campaignDescription: '' });
                  }}
                  placeholder={`e.g. Promote our new organic skincare launch to Gen-Z in North India. Looking for authentic product review and 1 reel.`}
                  className={`bg-white/[0.06] border-white/15 rounded-2xl min-h-[140px] text-white placeholder:text-slate-200/45 focus:ring-purple-500/30 text-sm leading-relaxed ${errors.campaignDescription ? 'border-red-400/50' : ''}`}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-100/50">Minimum 20 characters for a quality proposal</p>
                  {campaignDescription.length > 0 && campaignDescription.length < 20 && (
                    <p className="text-[10px] text-amber-400 font-bold">{20 - campaignDescription.length} more chars</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={`space-y-6 md:space-y-8 ${currentStep === 1 ? 'hidden' : ''}`}>
            {/* Deal Type */}
            <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-white/20">
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-2 text-sm text-slate-100/90 ${typeLabel}`}><Target className="h-4 w-4 text-slate-400" />Deal Type</span>
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
                    <SelectItem value="hybrid"><span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-slate-400" />Cash + Product</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {collabType === 'barter' && (
                <p className="text-xs text-slate-100/75 mt-2">
                  Creator may request partial cash + product
                </p>
              )}
            </div>

            {/* Budget – Hero Card */}
            <div
              aria-hidden={collabType !== 'paid'}
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collabType === 'paid' ? 'opacity-100 max-h-[360px] translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/5 to-amber-500/[0.02] p-5">
                {/* Label row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-300/80 uppercase tracking-widest"><IndianRupee className="h-3.5 w-3.5" />Proposed Budget</span>
                  {((creator as any).avg_rate_reel || (creator as any).avg_reel_rate) && (
                    <span className="text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                      Typical: ₹{((creator as any).avg_rate_reel || (creator as any).avg_reel_rate).toLocaleString()} – ₹{(((creator as any).avg_rate_reel || (creator as any).avg_reel_rate) * 1.6).toLocaleString()}
                    </span>
                  )}
                </div>
                {/* Big amount input */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[22px] font-black text-amber-300/70">₹</span>
                  <input
                    type="number"
                    value={exactBudget}
                    onChange={(e) => setExactBudget(e.target.value)}
                    placeholder="3,000"
                    className="bg-transparent border-0 focus:ring-0 text-white font-black p-0 text-[32px] tracking-tight placeholder:text-white/20 w-full"
                    style={{ lineHeight: 1 }}
                  />
                </div>
                {/* Escrow note */}
                <div className="flex items-center gap-1.5 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-3 py-2">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-emerald-100/80 font-semibold">
                    Funds secured in escrow until deliverables are approved
                  </p>
                </div>
              </div>
            </div>

            <div
              aria-hidden={collabType !== 'barter'}
              className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${collabType === 'barter' ? 'opacity-100 max-h-60 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none'}`}
            >
              <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/15 transition-all focus-within:ring-2 focus-within:ring-white/20">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-100/90"><Package className="h-4 w-4 text-amber-400" />Estimated Product / Service Value</span>
                  <div className="relative flex items-center">
                    <span className="text-slate-200/70 font-bold mr-1">₹</span>
                    <input
                      type="number"
                      value={barterValue}
                      onChange={(e) => setBarterValue(e.target.value)}
                      placeholder="3000"
                      className="bg-transparent border-0 text-right w-24 focus:ring-0 text-white font-bold p-0 text-base placeholder:text-slate-200/55"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-100/65 mt-2">Helps creator evaluate collaboration value.</p>
                <p className="text-xs text-slate-100/60 mt-1">Used only for collaboration fairness.</p>
              </div>
            </div>

          </div>

          {/* Deliverables – Premium Selectable Cards */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 text-[11px] font-black text-slate-100/60 uppercase tracking-widest"><Clapperboard className="h-3.5 w-3.5 text-slate-400" />Content Requested</span>
              {deliverables.length > 0 && <span className="text-[10px] font-black text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-2 py-0.5">{deliverables.length} selected</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERABLE_OPTIONS.filter((item) => item.value !== 'Custom').map((item) => {
                const active = deliverables.includes(item.value);
                const qty = deliverableQuantities[item.value] || 1;
                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border-2 transition-all cursor-pointer ${active
                        ? 'border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 shadow-[0_0_20px_rgba(192,86,234,0.10)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]'
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleDeliverableToggle(item.value)}
                      className="w-full p-3 text-left flex items-center gap-3"
                    >
                      <span className="text-2xl leading-none">{item.icon}</span>
                      <div className="flex-1">
                        <p className={`text-[14px] font-black leading-tight ${active ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                        {active && <p className="text-[10px] text-fuchsia-300/70 font-bold mt-0.5">✓ Selected</p>}
                      </div>
                    </button>
                    {active && (
                      <div className="flex items-center justify-between border-t border-white/10 px-3 pb-2.5 pt-2">
                        <span className="text-[10px] font-semibold text-white/50">Qty</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDeliverableQuantity(item.value, qty - 1)}
                            className="w-6 h-6 rounded-lg bg-white/10 text-white font-black text-sm flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all"
                          >−</button>
                          <span className="text-[15px] font-black text-white w-5 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateDeliverableQuantity(item.value, qty + 1)}
                            className="w-6 h-6 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 font-black text-sm flex items-center justify-center hover:bg-fuchsia-500/30 active:scale-90 transition-all"
                          >+</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline & Validity */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
            {/* Campaign Go-Live Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="inline-flex items-center gap-2 text-[11px] font-black text-slate-100/60 uppercase tracking-widest"><Calendar className="h-3.5 w-3.5 text-sky-400" />Campaign Go-Live Date</span>
              </div>
              <div className="flex items-center justify-between bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5">
                <span className="text-[13px] text-white/50 font-semibold flex items-center gap-2">📅 Select date</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-transparent border-0 text-right focus:ring-0 text-white font-bold p-0 text-sm w-auto"
                />
              </div>
              <p className="text-[10px] text-amber-300/70 font-semibold mt-1.5 flex items-center gap-1">⚡ Creator usually needs 3–5 days production time</p>
            </div>

            {/* Offer Validity – Preset Chips */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-[11px] font-black text-slate-100/60 uppercase tracking-widest mb-2.5 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-orange-300" />Offer expires in</p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: '3 days', days: 3 },
                  { label: '7 days', days: 7 },
                  { label: '14 days', days: 14 },
                  { label: '30 days', days: 30 },
                ].map(({ label, days }) => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + days);
                  const targetStr = targetDate.toISOString().split('T')[0];
                  const isActive = offerExpiry === targetStr;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setOfferExpiry(targetStr)}
                      className={`px-4 py-1.5 rounded-full text-[12px] font-black border transition-all active:scale-95 ${isActive
                          ? 'bg-orange-400/20 border-orange-400/40 text-orange-300'
                          : 'bg-white/[0.05] border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {offerExpiry && (
                <p className="text-[10px] text-white/30 font-semibold mt-2">Expires: {new Date(offerExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              )}
            </div>
          </div>

          {/* --- STEP 3: Brand Details --- */}
          <div className={`space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 ${currentStep === 3 ? '' : 'hidden'}`}>
            <div className="bg-white/[0.06] rounded-[24px] p-5 border border-white/15">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-amber-400" />
                Brand & Contact
              </h3>
              <p className="text-xs text-slate-100/60 mb-6">Required for the collaboration contract</p>

              <form id="collab-request-form" ref={formRef} onSubmit={handleSubmit} className="space-y-5">

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
                    placeholder="Official Company / Brand Name"
                    className={`${inputClass} border-white/20 bg-black/20 focus:bg-black/40 ${errors.brandName ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandName && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandName}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-white mb-2 ${typeLabel}`}>
                    <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-300" />Work Email <span className="text-red-400">*</span></span>
                  </label>
                  <Input
                    type="email"
                    value={brandEmail}
                    onChange={(e) => {
                      setBrandEmail(e.target.value);
                      if (errors.brandEmail) setErrors({ ...errors, brandEmail: '' });
                    }}
                    required
                    placeholder="you@company.com"
                    className={`${inputClass} border-white/20 bg-black/20 focus:bg-black/40 ${errors.brandEmail ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandEmail && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandEmail}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-white mb-2 ${typeLabel}`}>
                    <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-300" />Company Address <span className="text-red-400">*</span></span>
                  </label>
                  <Textarea
                    value={brandAddress}
                    onChange={(e) => {
                      setBrandAddress(e.target.value);
                      if (errors.brandAddress) setErrors({ ...errors, brandAddress: '' });
                    }}
                    required
                    placeholder="Full registered address for invoicing..."
                    rows={2}
                    className={`${inputClass} min-h-[70px] border-white/20 bg-black/20 focus:bg-black/40 ${errors.brandAddress ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandAddress && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandAddress}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowOptionalBrandDetails(prev => !prev)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-100/80 hover:text-white transition-colors"
                  >
                    <span className={showOptionalBrandDetails ? 'rotate-180 transition-transform' : 'transition-transform'}><ChevronDown className="h-4 w-4" /></span>
                    Optional Brand Details
                  </button>

                  {showOptionalBrandDetails && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-xs text-slate-100/70 mb-1.5 ${typeLabel}`}>
                            Website
                          </label>
                          <Input
                            type="text"
                            value={brandWebsite}
                            onChange={(e) => setBrandWebsite(e.target.value)}
                            placeholder="example.com"
                            className={`${inputClass} h-9 border-white/10`}
                          />
                        </div>
                        <div>
                          <label className={`block text-xs text-slate-100/70 mb-1.5 ${typeLabel}`}>
                            Instagram
                          </label>
                          <Input
                            type="text"
                            value={brandInstagram}
                            onChange={(e) => setBrandInstagram(e.target.value)}
                            placeholder="@brand"
                            className={`${inputClass} h-9 border-white/10`}
                          />
                        </div>
                      </div>
                      {collabType !== 'paid' && (
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                          <h4 className="text-xs font-bold text-white mb-2">Product Image</h4>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleBarterImageChange}
                            disabled={barterImageUploading}
                            className="block w-full text-xs text-white/80 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-500/30 file:text-slate-200 file:text-xs file:font-medium"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Secure Trust Indicators inline in Step 3 */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">Secured by Creator Armour</span>
              </div>
              <p className="text-xs text-emerald-100/70 pl-6">Your details are only shared once the creator accepts the collaboration proposal.</p>
            </div>
          </div>

          {/* Global Footer Elements */}
          <div className="mt-8 flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-100/60 mb-3">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span>End-to-End Encrypted Data</span>
            </div>

            <button
              type="button"
              onClick={() => setShowSaveDraftModal(true)}
              className="text-xs text-slate-100/80 hover:text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-2 transition-colors bg-white/[0.03] hover:bg-white/[0.08]"
            >
              Save and continue later
            </button>
          </div>

          {/* Demo Fill Button - Only in development or with ?demo=true */}
          {import.meta.env.DEV && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={fillDemoData}
                className="text-xs text-slate-200/50 hover:text-slate-100 underline underline-offset-4"
              >
                Fill demo data
              </button>
            </div>
          )}

          <div className="md:hidden h-20" />

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
                      <Lock className="h-5 w-5 text-slate-100" />
                      Processing Offer...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">{ctaIcon}{ctaLabel}</span>
                  )}
                </Button>
              </div>
              <p className="text-center text-[11px] text-slate-100/70 mt-2">
                {showSubmittingTrust ? 'Your offer is being processed securely' : ctaHelper}
              </p>
              {showSubmittingTrust && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  {submittingChecklist.map((step, idx) => {
                    const complete = idx <= submitChecklistStep;
                    return (
                      <div key={step} className={`flex items-center gap-2 text-xs transition-all duration-200 ${complete ? 'text-emerald-200 opacity-100 translate-y-0' : 'text-slate-100/50 opacity-70 translate-y-0.5'}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 ${complete ? 'text-emerald-400' : 'text-slate-200/50'}`} />
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
                <div className="absolute inset-0 bg-blue-600/30 blur-[40px] rounded-full animate-pulse -z-10" />
                {showSubmittingTrust && (
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-[24px] border border-violet-300/30 animate-ping" />
                )}
                {ctaStepStatus === 'create' && (
                  <p className="text-center text-xs text-slate-100/85 mb-2 inline-flex w-full items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-sky-400" />
                    Most brands receive a response the same day
                  </p>
                )}
                <Button
                  onClick={handleStickySubmit}
                  disabled={submitting}
                  className={`w-full h-16 rounded-[24px] bg-gradient-to-r from-[#8E2DE2] to-[#4A00E0] text-white text-[16px] font-semibold shadow-xl border-t border-white/20 transition-all active:scale-95 ${elevationLevel3}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-3">
                      <Lock className="h-6 w-6 text-slate-100" />
                      Processing Offer...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      {ctaIcon}
                      {ctaLabel}
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-100/75 mt-2">
                  {showSubmittingTrust ? 'Your offer is being processed securely' : ctaHelper}
                </p>
                {showSubmittingTrust && (
                  <div className="mx-auto mt-3 max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="grid grid-cols-1 gap-2">
                      {submittingChecklist.map((step, idx) => {
                        const complete = idx <= submitChecklistStep;
                        return (
                          <div key={step} className={`flex items-center gap-2 text-sm transition-all duration-200 ${complete ? 'text-emerald-200 opacity-100 translate-y-0' : 'text-slate-100/50 opacity-70 translate-y-0.5'}`}>
                            <CheckCircle2 className={`h-4 w-4 ${complete ? 'text-emerald-400' : 'text-slate-200/50'}`} />
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
        </div>
      </div>
    </>
  );
};

export default CollabLinkLanding;
