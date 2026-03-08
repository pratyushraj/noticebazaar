import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Instagram, Youtube, Twitter, Facebook, CheckCircle2, Loader2, ChevronLeft, ChevronRight, ShieldCheck, Target, Mail, MapPin, Phone, Globe, AtSign, FileText, ImageIcon, Wallet, RefreshCcw, Calendar, TrendingUp, Lock, Clapperboard, FileCheck, BadgeCheck, Clock, Package, Plus, Minus, Settings, Check, CircleDollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
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
  const [errors, setErrors] = useState<FormErrors>({});
  const readinessBadgeRef = useRef<HTMLDivElement | null>(null);

  // Progressive Flow State
  const [currentStep, setCurrentStep] = useState(1);
  const [deliverableQuantities, setDeliverableQuantities] = useState<Record<string, number>>({});
  const [showOptionalBrandDetails, setShowOptionalBrandDetails] = useState(false);
  const [legalPreset, setLegalPreset] = useState<'standard' | 'custom'>('standard');

  // Handle deliverable quantity
  const handleDeliverableQuantityChange = (deliverable: string, delta: number) => {
    setDeliverableQuantities(prev => ({
      ...prev,
      [deliverable]: Math.max(1, (prev[deliverable] || 1) + delta)
    }));
  };

  const nextStep = () => {
    // Basic validation before moving next
    if (currentStep === 1) {
      if (!campaignDescription.trim() || campaignDescription.trim().length < 10) {
        setErrors(prev => ({ ...prev, campaignDescription: 'Please provide more campaign details' }));
        toast.error('Please describe your campaign goal');
        return;
      }
      setErrors(prev => ({ ...prev, campaignDescription: '' }));
    }
    if (currentStep === 2) {
      if (deliverables.length === 0) {
        toast.error('Please select at least one deliverable');
        return;
      }
      if (collabType !== 'barter' && !exactBudget && !budgetRange) {
        toast.error('Please specify a budget');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
    // Scroll to form top with offset for header
    const formElement = document.getElementById('core-offer-form');
    if (formElement) {
      const offset = 100;
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    const formElement = document.getElementById('core-offer-form');
    if (formElement) {
      const offset = 100;
      const elementPosition = formElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

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
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
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
          deliverables,
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

  // Data derivations
  const creatorName = creator.name || 'Creator';
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  const primaryFollowers = creator.followers ?? followerCount;
  const avgReelViews = creator.avg_reel_views ?? creator.performance_proof?.median_reel_views ?? null;
  const avgLikes = creator.avg_likes ?? creator.performance_proof?.avg_likes ?? null;
  const trustStats = creator.trust_stats;

  const engagementRange = getEngagementRange(primaryFollowers, avgReelViews);
  const audienceRegionLabel = creator.collab_region_label?.trim() || getAudienceRegionLabel(formatAudienceCities(creator.top_cities));
  const completionPercent = Math.round((completionChecks.filter(c => c.complete).length / completionChecks.length) * 100);
  const creatorBio = isScrapedInstagramBio(creator.bio) ? null : creator.bio;

  // SEO & Meta data
  const normalizedHandle = (creator.username || username || '').replace(/^@/, '').trim();
  const creatorHandle = normalizedHandle ? `@${normalizedHandle}` : '';
  const metaTitle = `${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''} Collab Link | CreatorArmour`;
  const followerText = followerCount > 0
    ? `${followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} followers`
    : '';
  const metaDescription = `Book ${creatorName}${creatorHandle ? ` (${creatorHandle})` : ''}${creator.category ? `, ${creator.category} creator` : ''}${followerText ? ` • ${followerText}` : ''}. Share paid, barter, or hybrid briefs with contract-first protection via CreatorArmour.`.substring(0, 158);

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
    'paid barter hybrid collaboration'
  ].filter(Boolean)));

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
          { name: 'Home', url: '/' },
          { name: creator.name, url: `/${creator.username}` },
        ]}
      />
      <PersonSchema
        schema={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": creator.name,
          "alternateName": creator.username,
          "description": creatorBio || creator.bio,
          "image": creator.profile_photo,
          "url": window.location.href,
          "jobTitle": creator.profile_label || "Creator"
        }}
      />

      <div className="min-h-screen bg-[#0E061E] text-white selection:bg-blue-500/30">
        {/* Ambient background glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 pt-6 pb-24 md:pt-12 md:pb-32 max-w-4xl relative">
          {/* Header Section */}
          <div className="mb-8 md:mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Official Collaboration Link
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight text-white">
              Create Collaboration with <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{creator.name}</span>
            </h1>
            <p className="text-white/50 text-sm md:text-lg max-w-xl mx-auto font-medium">
              A professional, secure, and legally-binding workflow for brands to partner with India's top creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form (Step-based) */}
            <div className="md:col-span-8">
              <div id="core-offer-form" className="rounded-[32px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl shadow-2xl overflow-hidden">
                {/* Step Indicator */}
                <div className="px-6 pt-8 md:px-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-500",
                            currentStep === step ? "w-10 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : (currentStep > step ? "w-6 bg-emerald-500" : "w-6 bg-white/10")
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Step {currentStep} of 3</span>
                  </div>

                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 pb-10"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white">Campaign Details</h2>
                          <p className="text-white/40 text-sm">Define what you're building together.</p>
                        </div>

                        {/* Deal Type Selection */}
                        <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Choose Deal Type</label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { id: 'paid', label: 'Paid Deal', sub: 'Cash compensation', icon: Wallet, color: 'text-blue-400' },
                              { id: 'barter', label: 'Barter', sub: 'Product exchange', icon: Package, color: 'text-amber-400' },
                              { id: 'hybrid', label: 'Hybrid', sub: 'Cash + Product', icon: RefreshCcw, color: 'text-fuchsia-400' }
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setCollabType(item.id as CollabType)}
                                className={cn(
                                  "p-4 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                  collabType === item.id ? "bg-white/10 border-white/20 ring-1 ring-white/10" : "bg-white/5 border-white/5 hover:bg-white/[0.07]"
                                )}
                              >
                                {collabType === item.id && <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-white" /></div>}
                                <item.icon className={cn("w-5 h-5 mb-3", item.color)} />
                                <p className="text-sm font-black leading-tight mb-1 text-white">{item.label}</p>
                                <p className="text-[10px] text-white/40 font-medium">{item.sub}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Campaign Goal */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Campaign Goal & Message</label>
                            <span className={cn("text-[10px] font-bold", campaignDescription.length < 20 ? "text-amber-400" : "text-emerald-400")}>
                              {campaignDescription.length}/20+ characters
                            </span>
                          </div>
                          <Textarea
                            placeholder="Briefly describe your campaign goal, who the brand is, and why you want to work with this creator..."
                            value={campaignDescription}
                            onChange={(e) => setCampaignDescription(e.target.value)}
                            className="bg-white/5 border-white/10 rounded-2xl min-h-[160px] p-5 text-[15px] leading-relaxed focus:ring-2 focus:ring-blue-500/30 focus:bg-white/[0.08] text-white"
                          />
                        </div>

                        {/* Category & Timeline (Dates) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Category</label>
                            <Select value={campaignCategory} onValueChange={setCampaignCategory}>
                              <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-white">
                                <SelectValue placeholder="Select Industry" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-white/15 text-white">
                                {['Lifestyle', 'Tech', 'Fashion', 'Beauty', 'Food', 'Travel', 'Fitness', 'Finance', 'Education', 'Gaming', 'Entertainment'].map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Deliverable Deadline</label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 pb-10"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white">Deliverables & Budget</h2>
                          <p className="text-white/40 text-sm">Define what is expected and the commercial offer.</p>
                        </div>

                        {/* Deliverables Selection */}
                        <div className="space-y-4">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Select Deliverables (Tap to Select + Adjust Quantity)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DELIVERABLE_OPTIONS.map((item) => {
                              const active = deliverables.includes(item.value);
                              const qty = deliverableQuantities[item.value] || 1;
                              return (
                                <div
                                  key={item.value}
                                  className={cn(
                                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                                    active ? "bg-blue-500/10 border-blue-500/40" : "bg-white/5 border-white/5"
                                  )}
                                >
                                  <button
                                    onClick={() => handleDeliverableToggle(item.value)}
                                    className="flex items-center gap-3 flex-1 text-left"
                                  >
                                    <div className={cn("p-2 rounded-xl", active ? "bg-blue-500 text-white" : "bg-white/5 text-white/40")}>
                                      {item.icon}
                                    </div>
                                    <span className={cn("text-sm font-black", active ? "text-white" : "text-white/40")}>{item.label}</span>
                                  </button>

                                  {active && (
                                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                                      <button onClick={() => handleDeliverableQuantityChange(item.value, -1)} className="p-1 text-white hover:text-blue-400"><Minus className="w-3.5 h-3.5" /></button>
                                      <span className="text-xs font-black min-w-[20px] text-center text-white">{qty}</span>
                                      <button onClick={() => handleDeliverableQuantityChange(item.value, 1)} className="p-1 text-white hover:text-blue-400"><Plus className="w-3.5 h-3.5" /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Budget Section */}
                        <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 space-y-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CircleDollarSign className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Commercial Offer</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(collabType === 'paid' || collabType === 'hybrid') && (
                              <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Cash Component (INR)</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/40">₹</span>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 15000"
                                    value={exactBudget}
                                    onChange={(e) => setExactBudget(e.target.value)}
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl pl-8 pr-5 text-[16px] font-black text-white"
                                  />
                                </div>
                              </div>
                            )}

                            {(collabType === 'barter' || collabType === 'hybrid') && (
                              <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Product/Service Value (INR)</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/40">₹</span>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    value={barterValue}
                                    onChange={(e) => setBarterValue(e.target.value)}
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl pl-8 pr-5 text-[16px] font-black text-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Barter Product Image Upload */}
                          {(isHybridCollab(collabType) || collabType === 'barter') && (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                              <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Product Image (Recommended)</label>
                              <div className="flex items-center gap-4">
                                {!barterProductImageUrl ? (
                                  <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-all">
                                    <input type="file" accept="image/*" onChange={handleBarterImageChange} className="hidden" disabled={barterImageUploading} />
                                    {barterImageUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <ImageIcon className="w-6 h-6 text-white/30 mb-2" />}
                                    <p className="text-xs font-bold text-white/50">Upload Product Pic</p>
                                  </label>
                                ) : (
                                  <div className="flex-1 flex items-center gap-4 p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5">
                                    <img src={barterProductImageUrl} className="w-16 h-16 rounded-lg object-cover" alt="Product" />
                                    <div className="flex-1">
                                      <p className="text-xs font-black text-white">Product Displayed</p>
                                      <button onClick={() => setBarterProductImageUrl(null)} className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1 hover:text-red-300">Remove</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                            <p className="text-[11px] font-medium text-blue-200/70 leading-relaxed">
                              Payments are strictly held in Creator Armour Escrow until content is verified. Safe for both parties.
                            </p>
                          </div>
                        </div>

                        {/* Proposal Expiry */}
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Proposal Validity (When this offer expires)</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                              type="date"
                              value={offerExpiry}
                              onChange={(e) => setOfferExpiry(e.target.value)}
                              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 text-white"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8 pb-10"
                      >
                        <div className="space-y-2">
                          <h2 className="text-2xl font-black text-white">Brand + Contract Info</h2>
                          <p className="text-white/40 text-sm">Final details to generate the legal agreement.</p>
                        </div>

                        {/* Brand Logo Upload */}
                        <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                          <div className="relative">
                            {!brandLogoUrl ? (
                              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.08] transition-all">
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={brandLogoUploading} />
                                {brandLogoUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <ImageIcon className="w-6 h-6 text-white/20" />}
                              </label>
                            ) : (
                              <div className="relative">
                                <img src={brandLogoUrl} className="w-20 h-20 rounded-2xl object-contain bg-white p-2" alt="Logo" />
                                <button onClick={() => setBrandLogoUrl(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><Minus className="w-3 h-3" /></button>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="text-sm font-black text-white">Brand Identity</h3>
                            <p className="text-xs text-white/40 leading-relaxed">Upload your logo to appear on the contract and the deal console.</p>
                          </div>
                        </div>

                        {/* Basic Brand Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Brand / Agency Name</label>
                            <Input placeholder="e.g. Acme Marketing" value={brandName} onChange={e => setBrandName(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-white" />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Authorized Work Email</label>
                            <Input placeholder="e.g. deals@acme.com" value={brandEmail} onChange={e => setBrandEmail(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-white" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Registered Business Address</label>
                          <textarea
                            placeholder="Required for legal contract generation..."
                            value={brandAddress}
                            onChange={(e) => setBrandAddress(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500/30 text-white"
                          />
                        </div>

                        <div className="space-y-4">
                          <button
                            onClick={() => setShowOptionalBrandDetails(!showOptionalBrandDetails)}
                            className="flex items-center gap-2 text-xs font-black text-blue-400 py-2 hover:text-blue-300 transition-colors"
                          >
                            {showOptionalBrandDetails ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showOptionalBrandDetails ? 'HIDE' : 'ADD'} OPTIONAL DETAILS (GST, IG, WEBSITE)
                          </button>

                          <AnimatePresence>
                            {showOptionalBrandDetails && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-4"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input placeholder="GST Number (Optional)" value={brandGstin} onChange={e => setBrandGstin(e.target.value.toUpperCase())} className="h-12 bg-white/5 text-white" />
                                  <Input placeholder="Website (e.g. acme.com)" value={brandWebsite} onChange={e => setBrandWebsite(e.target.value)} className="h-12 bg-white/5 text-white" />
                                  <Input placeholder="Instagram @handle" value={brandInstagram} onChange={e => setBrandInstagram(e.target.value)} className="h-12 bg-white/5 text-white" />
                                  <Input placeholder="Contact Phone" value={brandPhone} onChange={e => setBrandPhone(e.target.value)} className="h-12 bg-white/5 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Usage Rights */}
                        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                          <Checkbox
                            id="usage-rights"
                            checked={usageRights}
                            onCheckedChange={(checked) => setUsageRights(checked === true)}
                            className="w-5 h-5 rounded-md border-white/20 data-[state=checked]:bg-blue-600"
                          />
                          <div className="space-y-0.5">
                            <label htmlFor="usage-rights" className="text-sm font-black cursor-pointer leading-none text-white">Usage Rights Needed?</label>
                            <p className="text-[10px] text-white/30">Check this if you plan to use this content in paid ads.</p>
                          </div>
                        </div>

                        {/* Contract Terms */}
                        <div className="space-y-6 pt-6 border-t border-white/5">
                          <div className="space-y-4">
                            <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Deal Terms & Legal</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => { setLegalPreset('standard'); setShowCommercialTerms(false); }}
                                className={cn(
                                  "p-4 rounded-2xl border text-left transition-all",
                                  legalPreset === 'standard' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-white/5 border-white/5"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-3">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-xs font-black mb-1 text-white">Standard</p>
                                <p className="text-[10px] text-white/40">Creator Armour Template</p>
                              </button>
                              <button
                                onClick={() => { setLegalPreset('custom'); setShowCommercialTerms(true); }}
                                className={cn(
                                  "p-4 rounded-2xl border text-left transition-all",
                                  legalPreset === 'custom' ? "bg-blue-500/10 border-blue-500/40" : "bg-white/5 border-white/5"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-3">
                                  <Settings className="w-4 h-4 text-blue-500" />
                                </div>
                                <p className="text-xs font-black mb-1 text-white">Custom</p>
                                <p className="text-[10px] text-white/40">Define specific clauses</p>
                              </button>
                            </div>
                          </div>

                          {showCommercialTerms && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4"
                            >
                              <Input placeholder="Usage Duration (e.g. 90 days)" value={usageDuration} onChange={e => setUsageDuration(e.target.value)} className="h-12 bg-white/5 text-white" />
                              <Input placeholder="Approval SLA (e.g. 48 hours)" value={approvalSlaHours} onChange={e => setApprovalSlaHours(e.target.value)} className="h-12 bg-white/5 text-white" />
                              <Input placeholder="Payment Terms (e.g. 15 days)" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="h-12 bg-white/5 col-span-2 text-white" />
                            </motion.div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase text-white/40">Authorized Signer Name</label>
                              <Input placeholder="Full legal name" value={authorizedSignerName} onChange={e => setAuthorizedSignerName(e.target.value)} className="h-12 bg-white/5 text-white" />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase text-white/40">Signer Designation</label>
                              <Input placeholder="e.g. Marketing Lead" value={authorizedSignerRole} onChange={e => setAuthorizedSignerRole(e.target.value)} className="h-12 bg-white/5 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Review Summary / Checklist */}
                        <div className="mt-8 p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/10">
                          <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/60">Deal Completeness Check</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                            {[
                              { label: 'Campaign Goal Defined', complete: campaignDescription.length >= 20 },
                              { label: 'Commercial Terms Set', complete: Boolean(exactBudget || barterValue || budgetRange) },
                              { label: 'Deliverables Selected', complete: deliverables.length > 0 },
                              { label: 'Authorized Signer Added', complete: !!authorizedSignerName },
                              { label: 'Legal Address Provided', complete: brandAddress.length > 15 },
                              { label: 'Payment Escrow Enabled', complete: true }
                            ].map((check, idx) => (
                              <div key={idx} className="flex items-center gap-2.5">
                                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center transition-colors", check.complete ? "bg-emerald-500" : "bg-white/10")}>
                                  {check.complete && <Check className="w-2.5 h-2.5 text-black" />}
                                </div>
                                <span className={cn("text-[11px] font-bold", check.complete ? "text-white/80" : "text-white/30")}>{check.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Navigation */}
                <div className="p-6 md:p-10 bg-white/5 border-t border-white/10 flex items-center gap-4">
                  {currentStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="h-14 w-16 rounded-2xl bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}

                  {currentStep < 3 ? (
                    <Button
                      onClick={nextStep}
                      className="h-14 flex-1 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[16px] shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                      Continue to {currentStep === 1 ? 'Deliverables' : 'Final Step'} <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-[16px] shadow-[0_8px_30px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Sending Offer...
                        </span>
                      ) : 'Send Collaboration Offer'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Draft Helper */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowSaveDraftModal(true)}
                  className="text-xs font-bold text-white/40 hover:text-white/80 transition-colors uppercase tracking-widest"
                >
                  Save draft and continue later
                </button>
              </div>
            </div>

            {/* Right Column: Context/Snapshots */}
            <div className="md:col-span-4 space-y-6">
              {/* Creator Card */}
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20">
                    <img src={creator.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.name}`} className="w-full h-full object-cover" alt={creator.name} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{creator.name}</h3>
                    <p className="text-sm font-medium text-white/40">@{creator.username}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Followers</span>
                    <span className="text-sm font-black text-blue-400">{(creator.followers || 0).toLocaleString()}</span>
                  </div>
                  {creator.trust_stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Completed Deals</span>
                        <span className="text-sm font-black text-emerald-400">{creator.trust_stats.completed_deals}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Avg Response</span>
                        <span className="text-sm font-black text-blue-400">{creator.trust_stats.avg_response_hours}h</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trust Section */}
              <div className="p-6 rounded-3xl border border-blue-500/10 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Enterprise Safe</h3>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                  We generate legally-binding agreements, handle payments via secure escrow, and provide automated GST invoicing for agencies.
                </p>
              </div>

              {/* Process Details */}
              <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Standard Workflow</h3>
                <div className="space-y-4 pt-2">
                  {[
                    { title: '1. Offer Sent', sub: 'Creator notified via app & SMS' },
                    { title: '2. Review & Accept', sub: 'Terms discussed via deal console' },
                    { title: '3. Legal Signing', sub: 'OTP-based digital signature' },
                    { title: '4. Content Post', sub: 'Verification & Escrow release' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black shrink-0 mt-1 text-white">{i + 1}</div>
                      <div>
                        <p className="text-xs font-black mb-0.5 text-white">{step.title}</p>
                        <p className="text-[10px] text-white/30 font-medium">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Draft Modal */}
      <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[32px]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-black">Save Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="text-sm text-white/50 leading-relaxed">
              Enter your work email. We'll send you a magic link to return and complete this request anytime in the next 7 days.
            </p>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Work Email</label>
              <Input
                type="email"
                placeholder="marketing@acme.com"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-white"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              onClick={handleSaveDraftSubmit}
              disabled={saveDraftSubmitting}
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-[16px]"
            >
              {saveDraftSubmitting ? (
                <span className="flex items-center gap-2 text-black"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
              ) : 'Send Magic Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CollabLinkLanding;
