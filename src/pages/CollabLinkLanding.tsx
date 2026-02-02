import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Instagram, Youtube, Twitter, Facebook, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/utils/analytics';
import { SEOHead } from '@/components/seo/SEOHead';
import { ArticleSchema } from '@/components/seo/SchemaMarkup';

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
  category: string | null;
  platforms: Array<{ name: string; handle: string; followers?: number }>;
  bio: string | null;
  open_to_collabs?: boolean;
  content_niches?: string[];
  media_kit_url?: string | null;
}

type CollabType = 'paid' | 'barter' | 'both';

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
  const [collabType, setCollabType] = useState<'paid' | 'barter' | 'both'>('paid');
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
  const [barterProductImageUrl, setBarterProductImageUrl] = useState<string | null>(null);
  const [barterImageUploading, setBarterImageUploading] = useState(false);
  const [campaignDescription, setCampaignDescription] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [usageRights, setUsageRights] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

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
    barterProductImageUrl,
    campaignDescription,
    deliverables,
    usageRights,
    deadline,
  });

  const applyDraftFormData = (data: Record<string, unknown>) => {
    if (typeof data.collabType === 'string' && ['paid', 'barter', 'both'].includes(data.collabType)) {
      setCollabType(data.collabType as 'paid' | 'barter' | 'both');
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
    if (typeof data.barterProductImageUrl === 'string') setBarterProductImageUrl(data.barterProductImageUrl || null);
    if (typeof data.campaignDescription === 'string') setCampaignDescription(data.campaignDescription);
    if (Array.isArray(data.deliverables)) setDeliverables(data.deliverables.filter((d): d is string => typeof d === 'string'));
    if (typeof data.usageRights === 'boolean') setUsageRights(data.usageRights);
    if (typeof data.deadline === 'string') setDeadline(data.deadline);
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
    setBudgetRange('10000-25000');
    setExactBudget('15000');
    setCampaignDescription('We are launching a new sustainable fashion line and would love to collaborate with you on creating authentic content that showcases our eco-friendly products. Our campaign focuses on promoting conscious consumerism and we believe your content style aligns perfectly with our brand values.');
    setDeliverables(['Instagram Reel', 'Post', 'Story']);
    setUsageRights(true);
    // Set deadline to 2 weeks from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    setDeadline(futureDate.toISOString().split('T')[0]);
    setErrors({});
    toast.success('Demo data filled! You can now test the form submission.');
  };

  // Auto-fill demo data if ?demo=true in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      fillDemoData();
    }
  }, []);

  // Helper to get API base URL (same logic as other pages)
  const getApiBaseUrl = (): string => {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
    const origin = window.location.origin;
    if (origin.includes('creatorarmour.com')) return 'https://api.creatorarmour.com';
    if (origin.includes('noticebazaar.com')) return 'https://api.noticebazaar.com';
    return 'http://localhost:3001';
  };

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
          const errorMessage = errorData.error || 'Failed to load creator profile';
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
  }, [username]);

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

    if (collabType === 'both') {
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
          barter_value: barterValue ? parseFloat(barterValue) : undefined,
          barter_product_image_url: barterProductImageUrl || undefined,
          campaign_description: campaignDescription,
          deliverables,
          usage_rights: usageRights,
          deadline: deadline || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        trackEvent('collab_link_form_submitted', { username: username || '', collab_type: collabType });
        navigate(`/collab/${username}/success`, { state: { creatorName: creator?.name || 'the creator' } });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8">
            <h1 className="text-2xl font-bold mb-4">Creator Not Found</h1>
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
  const metaTitle = `Collaborate with ${creatorName} | Official Brand Collaboration Link`;
  const platformNames = creator.platforms.map(p => p.name).join(', ');
  const followerCount = creator.platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
  const followerText = followerCount > 0 
    ? `with ${followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} followers` 
    : '';
  const metaDescription = `Collaborate with ${creatorName}${creator.category ? `, ${creator.category} creator` : ''} ${followerText ? followerText : ''} on ${platformNames || 'social media'}. Submit your request here — contracts and payments are protected by CreatorArmour. ${creator.bio ? creator.bio.substring(0, 60) : ''}`.substring(0, 160);
  
  // Use clean URL for SEO (no hash)
  const canonicalUrl = `https://creatorarmour.com/collab/${creator.username}`;
  const pageImage = creator.platforms.length > 0 
    ? `https://creatorarmour.com/og-creator-${creator.username}.png`
    : 'https://creatorarmour.com/og-preview.png';

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={[
          `collaborate with ${creatorName}`,
          `${creatorName} influencer`,
          creator.category || 'influencer',
          'brand collaboration',
          'influencer marketing',
          'creator collaboration',
          'India',
        ]}
        image={pageImage}
        type="article"
        canonicalUrl={canonicalUrl}
      />

      {/* Creator Profile Schema */}
      <ArticleSchema
        title={metaTitle}
        description={metaDescription}
        image={pageImage}
        datePublished={new Date().toISOString()}
        author={{
          name: creatorName,
          type: 'Person',
        }}
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

    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header - Creator Profile Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                {/* Creator Identity Block - Instagram First */}
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-white mb-3">{creator.name}</h1>
                  {creator.platforms.some(p => p.name.toLowerCase() === 'instagram' && p.handle) ? (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                        <Instagram className="h-5 w-5 text-white" />
                        <span className="font-medium text-white">
                          @{creator.platforms.find(p => p.name.toLowerCase() === 'instagram')?.handle.replace('@', '')}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      </div>
                      <a
                        href={`https://instagram.com/${creator.platforms.find(p => p.name.toLowerCase() === 'instagram')?.handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-300/70 mb-3">
                      <Instagram className="h-4 w-4" />
                      <span className="text-sm">Instagram not verified yet</span>
                    </div>
                  )}
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified by Creator Armour
                  </Badge>
                </div>
                {creator.category && (
                  <Badge variant="outline" className="text-purple-200 border-purple-400/50 mb-3">
                    {creator.category}
                  </Badge>
                )}
                {creator.platforms.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {creator.platforms.map((platform, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-purple-200">
                        {getPlatformIcon(platform.name)}
                        <span>{platform.name}</span>
                        {platform.followers && (
                          <span className="text-purple-300">
                            {platform.followers >= 1000
                              ? `${(platform.followers / 1000).toFixed(1)}K`
                              : platform.followers}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {creator.bio && (
                  <p className="text-purple-200 mt-3">{creator.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works — for brands (SEO + trust) */}
        <div className="mb-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-6" role="region" aria-label="How it works">
          <h2 className="text-xl font-semibold text-white mb-4">How it works</h2>
          <ol className="space-y-3 text-purple-200">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-white text-sm font-semibold">1</span>
              <span><strong className="text-white">Fill the form below</strong> with your campaign details, budget, and deliverables.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-white text-sm font-semibold">2</span>
              <span><strong className="text-white">The creator reviews</strong> your request and can accept, counter, or decline — all in one place.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-white text-sm font-semibold">3</span>
              <span><strong className="text-white">Contract & payment</strong> are handled securely by Creator Armour. No DMs, no confusion.</span>
            </li>
          </ol>
        </div>

        {/* SEO-Friendly Content Section - Indexable */}
        <div className="mb-8 space-y-4">
          {/* Creator Bio & Platforms - Indexable Content */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            {creator.bio && (
              <p className="text-purple-200 leading-relaxed mb-4">
                {creator.bio}
              </p>
            )}
            
            {creator.platforms.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white mb-3">
                  Active on {creator.platforms.length > 1 ? 'Platforms' : 'Platform'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creator.platforms.map((platform, idx) => {
                    const isInstagram = platform.name.toLowerCase() === 'instagram';
                    return (
                      <div key={idx} className="flex items-center gap-3 text-purple-200">
                        {getPlatformIcon(platform.name)}
                        <div className="flex-1">
                          <p className="font-medium text-white">{platform.name}</p>
                          {isInstagram && platform.handle ? (
                            <a
                              href={`https://instagram.com/${platform.handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-300 hover:text-white transition-colors flex items-center gap-1"
                            >
                              @{platform.handle.replace('@', '')}
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <p className="text-sm text-purple-300">
                              {platform.handle}
                            </p>
                          )}
                          {platform.followers && (
                            <p className="text-xs text-purple-400 mt-1">
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
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                {creator.open_to_collabs !== false && (
                  <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Open to collabs
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
                  </div>
                )}
              </div>
            )}

            {/* Collaboration Info */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h2 className="text-xl font-semibold text-white mb-3">
                How to Collaborate
              </h2>
              <p className="text-purple-200 leading-relaxed mb-4">
                Submit your collaboration request below. This helps {creator.name} respond faster and ensures all deals are handled securely through CreatorArmour's contract and payment protection system.
              </p>
              <ul className="space-y-2 text-purple-200">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Secure contract generation and management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Payment tracking and protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Professional collaboration workflow</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Intro Text */}
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Submit Your Collaboration Request
          </h2>
          <p className="text-lg text-purple-200">
            Fill out the form below with your campaign details. All information is secure and will only be shared with {creator.name}.
          </p>
        </div>

        {/* Trust line + reduce drop-off: Save and continue later */}
        <div className="text-center mb-4 space-y-2">
          <p className="text-sm text-purple-200">
            Contracts are legally valid. Used by creators across India.
          </p>
          <p className="text-xs text-purple-300/70">
            Requests sent via DMs are not protected.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowSaveDraftModal(true)}
              className="text-sm text-purple-200 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-4 py-2 transition-colors"
            >
              Save and continue later
            </button>
            <span className="text-xs text-purple-400/80">We’ll email you a link (valid 7 days)</span>
          </div>
        </div>

        {/* Demo Fill Button - Only in development or with ?demo=true */}
        {(import.meta.env.DEV || new URLSearchParams(window.location.search).get('demo') === 'true') && (
          <div className="mb-4 flex justify-center">
            <Button
              type="button"
              onClick={fillDemoData}
              variant="outline"
              className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20 hover:text-white"
            >
              🧪 Fill Demo Data
            </Button>
          </div>
        )}

        {/* Form */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Collaboration Type */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Collaboration Type <span className="text-red-400">*</span>
                </label>
                <Select value={collabType} onValueChange={(value: CollabType) => {
                  setCollabType(value);
                  // Reset form fields when type changes
                  if (value === 'paid') {
                    setBarterValue('');
                  } else if (value === 'barter') {
                    setBudgetRange('');
                    setExactBudget('');
                  }
                }}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid Collaboration</SelectItem>
                    <SelectItem value="barter">Barter Collaboration</SelectItem>
                    <SelectItem value="both">Open to Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget / Offer Section - Smart Visibility */}
              {collabType === 'paid' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Budget Range
                    </label>
                    <Select value={budgetRange} onValueChange={setBudgetRange}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5000">Under ₹5,000</SelectItem>
                        <SelectItem value="5000-10000">₹5,000 – ₹10,000</SelectItem>
                        <SelectItem value="10000-25000">₹10,000 – ₹25,000</SelectItem>
                        <SelectItem value="25000+">₹25,000+</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-purple-300/70 mt-1.5">
                      If your budget is flexible, select a range — the creator may counter with a proposal.
                    </p>
                    {budgetRange && !exactBudget && (
                      <p className="text-xs text-purple-300/80 mt-1.5 flex items-center gap-1">
                        <span className="text-purple-400">ℹ️</span>
                        <span>Creator may counter-offer</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Exact Amount (Optional)
                    </label>
                    <Input
                      type="number"
                      value={exactBudget}
                      onChange={(e) => setExactBudget(e.target.value)}
                      placeholder="₹0"
                      min="0"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
              )}

              {collabType === 'barter' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Estimated Product Value (Optional)
                    </label>
                    <Input
                      type="number"
                      value={barterValue}
                      onChange={(e) => setBarterValue(e.target.value)}
                      placeholder="₹0"
                      min="0"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Product Image (optional)
                    </label>
                    <p className="text-xs text-purple-200/80 mb-2">
                      Upload a clear image of the product or service you&apos;re offering
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
                  </div>
                </div>
              )}

              {(collabType === 'both') && (
                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm text-purple-200 mb-4">
                      Please specify both paid budget and barter details:
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Budget Range (Paid)
                        </label>
                        <Select value={budgetRange} onValueChange={setBudgetRange}>
                          <SelectTrigger className="bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under-5000">Under ₹5,000</SelectItem>
                            <SelectItem value="5000-10000">₹5,000 – ₹10,000</SelectItem>
                            <SelectItem value="10000-25000">₹10,000 – ₹25,000</SelectItem>
                            <SelectItem value="25000+">₹25,000+</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-300/70 mt-1.5">
                          If your budget is flexible, select a range — the creator may counter with a proposal.
                        </p>
                        {budgetRange && !exactBudget && (
                          <p className="text-xs text-purple-300/80 mt-1.5 flex items-center gap-1">
                            <span className="text-purple-400">ℹ️</span>
                            <span>Creator may counter-offer</span>
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Exact Amount (Optional)
                        </label>
                        <Input
                          type="number"
                          value={exactBudget}
                          onChange={(e) => setExactBudget(e.target.value)}
                          placeholder="₹0"
                          min="0"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Estimated Product Value (Optional)
                        </label>
                        <Input
                          type="number"
                          value={barterValue}
                          onChange={(e) => setBarterValue(e.target.value)}
                          placeholder="₹0"
                          min="0"
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Product Image (optional)
                        </label>
                        <p className="text-xs text-purple-200/80 mb-2">
                          Upload a clear image of the product or service you&apos;re offering
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
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Campaign Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Brand Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    value={brandName}
                    onChange={(e) => {
                      setBrandName(e.target.value);
                      if (errors.brandName) setErrors({ ...errors, brandName: '' });
                    }}
                    required
                    className={`bg-white/5 border-white/20 text-white ${errors.brandName ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandName && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Website
                    </label>
                    <Input
                      type="text"
                      value={brandWebsite}
                      onChange={(e) => {
                        setBrandWebsite(e.target.value);
                        if (errors.brandWebsite) setErrors({ ...errors, brandWebsite: '' });
                      }}
                      placeholder="example.com or www.example.com"
                      className={`bg-white/5 border-white/20 text-white ${errors.brandWebsite ? 'border-red-400/50' : ''}`}
                    />
                    {errors.brandWebsite && (
                      <p className="text-xs text-red-400 mt-1">{errors.brandWebsite}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Instagram Handle
                    </label>
                    <Input
                      type="text"
                      value={brandInstagram}
                      onChange={(e) => setBrandInstagram(e.target.value)}
                      placeholder="@brandname"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Campaign Description <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={campaignDescription}
                    onChange={(e) => {
                      setCampaignDescription(e.target.value);
                      if (errors.campaignDescription) setErrors({ ...errors, campaignDescription: '' });
                    }}
                    required
                    placeholder="Tell us about your campaign..."
                    className={`bg-white/5 border-white/20 text-white min-h-[120px] ${errors.campaignDescription ? 'border-red-400/50' : ''}`}
                  />
                  {errors.campaignDescription && (
                    <p className="text-xs text-red-400 mt-1">{errors.campaignDescription}</p>
                  )}
                  {campaignDescription && !errors.campaignDescription && (
                    <p className="text-xs text-purple-300 mt-1">
                      {campaignDescription.length} characters
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Deliverables Requested <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs text-purple-300/70 mb-3">Multiple selections allowed</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                      { label: 'Instagram Reel', icon: '🎥' },
                      { label: 'Post', icon: '🖼️' },
                      { label: 'Story', icon: '📖' },
                      { label: 'YouTube Video', icon: '🎬' },
                      { label: 'Custom', icon: '➕' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <Checkbox
                          id={item.label}
                          checked={deliverables.includes(item.label)}
                          onCheckedChange={() => handleDeliverableToggle(item.label)}
                          className="border-white/30 data-[state=checked]:bg-purple-600"
                        />
                        <label
                          htmlFor={item.label}
                          className="text-sm text-purple-200 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </label>
                      </div>
                    ))}
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
                  <label htmlFor="usage-rights" className="text-sm text-purple-200 cursor-pointer">
                    Usage rights needed?
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Timeline / Deadline
                  </label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                  <p className="text-xs text-purple-300/70 mt-1.5">
                    Suggested: at least 5–7 working days after approval
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Contact Information</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Brand Email <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="email"
                    value={brandEmail}
                    onChange={(e) => {
                      setBrandEmail(e.target.value);
                      if (errors.brandEmail) setErrors({ ...errors, brandEmail: '' });
                    }}
                    required
                    className={`bg-white/5 border-white/20 text-white ${errors.brandEmail ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandEmail && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    GSTIN (Optional)
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
                      className={`flex-1 bg-white/5 border-white/20 text-white font-mono ${errors.brandGstin ? 'border-red-400/50' : ''}`}
                      disabled={isGstLookupLoading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGstLookup}
                      disabled={isGstLookupLoading || !brandGstin.trim() || brandGstin.trim().length !== 15}
                      className="shrink-0 bg-white/5 border-white/20 text-white hover:bg-white/10 font-mono"
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
                  <p className="text-xs text-purple-300/70 mt-1.5">
                    Optional. Use &quot;Fetch from GST&quot; to auto-fill company name and address.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Company / Brand Address <span className="text-red-400">*</span>
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
                    className={`bg-white/5 border-white/20 text-white min-h-[80px] ${errors.brandAddress ? 'border-red-400/50' : ''}`}
                  />
                  {errors.brandAddress && (
                    <p className="text-xs text-red-400 mt-1">{errors.brandAddress}</p>
                  )}
                  <p className="text-xs text-purple-300/70 mt-1.5">
                    Used for the collaboration agreement when the creator accepts
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Phone (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={brandPhone}
                    onChange={(e) => setBrandPhone(e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-purple-200">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span>Secured by Creator Armour</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-purple-200">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span>Details visible only to creator</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-2">
              <Button
                type="submit"
                disabled={submitting || Object.keys(errors).length > 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30 h-14 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={submitting ? 'Submitting collaboration request' : 'Submit secure collaboration request'}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden />
                    Submitting...
                  </>
                ) : (
                    'Submit Secure Collaboration Request'
                )}
              </Button>
                <p className="text-xs text-purple-300/70 text-center">
                  No DMs. Clear terms. Faster response.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Trust Note */}
        <div className="text-center mt-6 text-purple-200 text-sm">
          <p className="flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>All collaborations are logged and protected by Creator Armour.</span>
          </p>
        </div>

        {/* Additional SEO Content - Brand-Focused */}
        <div className="mt-12 max-w-3xl mx-auto bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">
            Professional Collaboration Workflow
          </h2>
          <div className="space-y-4 text-purple-200 leading-relaxed">
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
              <a href="mailto:support@creatorarmour.com" className="text-purple-300 hover:text-white underline">
                Help / Contact us
              </a>
              <span className="text-purple-400/80 ml-1">— we’re here before any issue becomes a dispute.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Save and continue later modal */}
      <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
        <DialogContent className="bg-purple-900/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Save and continue later</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-purple-200">
            Enter your email. We&apos;ll send you a link to continue this request (valid for 7 days).
          </p>
          <Input
            type="email"
            placeholder="you@company.com"
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
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
    </div>
    </>
  );
};

export default CollabLinkLanding;

