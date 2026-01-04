"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Loader2,
  FileText,
  Calendar,
  IndianRupee,
  Package,
  Shield,
  Clock,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Structured deliverable interface
interface Deliverable {
  platform: string;
  contentType: string;
  quantity: number;
  duration?: number; // in seconds, optional
}

interface DealDetailsFormData {
  brandName: string;
  campaignName: string;
  deliverables: Deliverable[]; // Changed from string[] to structured
  deadline: string;
  dealType: 'paid' | 'barter';
  // Content Approval & Revisions
  approvalProcess?: 'no_approval' | 'one_time' | 'limited_revisions' | 'unlimited_revisions';
  numberOfRevisions?: number; // Changed from string to number (1-5)
  approvalTurnaroundTime?: '24_hours' | '48_hours' | '3_business_days' | '5_business_days';
  // Posting Window
  postingWindow?: string; // Optional text input (descriptive, not legally binding)
  // Platform Handles
  brandHandle?: string; // Optional (validated with regex)
  creatorHandle?: string; // Optional (validated with regex)
  // Paid fields
  paymentAmount?: string;
  paymentTimeline?: 'on_delivery' | '7_days' | '15_days' | '30_days';
  paymentTrigger?: 'on_submission' | 'on_approval' | 'on_publishing' | 'on_completion';
  paymentMethod?: string[]; // Changed to array for multi-select
  // Barter fields
  productDescription?: string;
  barterValue?: string;
  barterApproximateValue?: string;
  barterShippingResponsibility?: string;
  barterReplacementAllowed?: boolean;
  // Rights & safety
  usageRightsDuration?: '1_month' | '3_months' | '6_months' | '12_months' | 'perpetual';
  paidAdsAllowed?: boolean; // New: explicit toggle
  whitelistingAllowed?: boolean; // New: explicit toggle
  exclusivityPeriod?: 'none' | '7_days' | '15_days' | '30_days' | 'custom';
  revisions?: string; // Keep for backward compatibility
  cancellationTerms?: 'full_payment_after_approval' | 'pro_rata_completed_work' | 'no_payment_before_start';
  // Jurisdiction / Governing Law
  governingLaw?: string; // Default: "India"
  companyState?: string; // Changed to dropdown (Indian states)
  // Company Contact Details
  companyLegalName?: string; // Required
  authorizedSignatoryName?: string; // Required
  companyEmail?: string; // Required
  companyAddress?: string; // Required (multiline text)
  companyPhone?: string; // Optional
  companyGstin?: string; // Optional
  // Auto-set (not in UI)
  jurisdiction?: string; // Auto-derived from state
}

const BrandDealDetailsPage = () => {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creatorName, setCreatorName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFormUsed, setIsFormUsed] = useState(false);
  const [isGstLookupLoading, setIsGstLookupLoading] = useState(false);
  const [gstLookupError, setGstLookupError] = useState<string | null>(null);
  const [gstLookupSuccess, setGstLookupSuccess] = useState(false);
  const [gstStatus, setGstStatus] = useState<'Active' | 'Cancelled' | 'Suspended' | null>(null);
  const [companyTradeName, setCompanyTradeName] = useState<string>('');
  
  const [formData, setFormData] = useState<DealDetailsFormData>({
    brandName: '',
    campaignName: '',
    deliverables: [{ platform: 'Instagram', contentType: 'Reel', quantity: 1, duration: 15 }],
    deadline: '',
    dealType: 'paid',
    approvalProcess: 'limited_revisions',
    numberOfRevisions: 2,
    approvalTurnaroundTime: '3_business_days',
    postingWindow: '',
    brandHandle: '',
    creatorHandle: '',
    paymentTimeline: '7_days',
    usageRightsDuration: '3_months',
    paidAdsAllowed: false,
    whitelistingAllowed: false,
    exclusivityPeriod: 'none',
    revisions: '2',
    governingLaw: 'India',
    paymentMethod: [],
  });

  // Indian states list for dropdown
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // Update Open Graph meta tags for social sharing
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://creatorarmour.com';
    
    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update page title
    document.title = 'CreatorArmour — Protect Your Brand Deals';

    // Update Open Graph tags
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:title', 'CreatorArmour — Protect Your Brand Deals');
    updateMetaTag('og:description', 'Generate contracts, track payments & stay protected — built for creators.');
    updateMetaTag('og:image', 'https://creatorarmour.com/og-preview.png');
    updateMetaTag('og:url', currentUrl);

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'CreatorArmour — Protect Your Brand Deals');
    updateMetaTag('twitter:description', 'Generate contracts, track payments & stay protected — built for creators.');
    updateMetaTag('twitter:image', 'https://creatorarmour.com/og-preview.png');

    // Cleanup function to restore default meta tags when component unmounts
    return () => {
      // Optionally restore default meta tags here if needed
    };
  }, [token]);

  // Fetch token info on mount
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!token) {
        setError('Invalid link');
        setIsLoading(false);
        return;
      }

      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL ||
          (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
            ? 'https://api.creatorarmour.com'
            : typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'http://localhost:3001'
            : 'https://noticebazaar-api.onrender.com');

        const response = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'This link is no longer valid. Please contact the creator.');
          setIsLoading(false);
          return;
        }

        setCreatorName(data.creatorName || 'the creator');
        // If form is already used, show read-only view
        if (data.isUsed) {
          setIsFormUsed(true);
          setError('This form has already been submitted and cannot be edited. Please contact the creator for any changes.');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      } catch (err: any) {
        console.error('[BrandDealDetailsPage] Error:', err);
        setError('An error occurred. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [token]);

  const handleAddDeliverable = () => {
    setFormData(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, { platform: 'Instagram', contentType: 'Reel', quantity: 1, duration: 15 }]
    }));
  };

  const handleDeliverableChange = (index: number, field: keyof Deliverable, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  const handleRemoveDeliverable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handleGstLookup = async () => {
    if (!formData.companyGstin?.trim()) {
      setGstLookupError('Please enter a GSTIN');
      return;
    }

    const gstin = formData.companyGstin.trim().toUpperCase();
    if (gstin.length !== 15) {
      setGstLookupError('GSTIN must be 15 characters');
      return;
    }

    setIsGstLookupLoading(true);
    setGstLookupError(null);
    setGstLookupSuccess(false);

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : 'http://localhost:3001');

      const response = await fetch(`${apiBaseUrl}/api/gst/lookup?gstin=${encodeURIComponent(gstin)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 404) {
          throw new Error(data.error || 'GSTIN not found. Please verify the GSTIN and try again, or enter details manually.');
        }
        if (response.status === 502) {
          throw new Error(data.error || 'GST lookup service temporarily unavailable. Please enter details manually.');
        }
        throw new Error(data.error || 'Failed to lookup GST data. Please enter details manually.');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to lookup GST data');
      }

      // Auto-fill form fields with fetched data
      setFormData(prev => ({
        ...prev,
        companyLegalName: data.data.legalName || prev.companyLegalName,
        companyAddress: data.data.address || prev.companyAddress,
        companyState: data.data.state || prev.companyState,
        companyGstin: gstin, // Ensure uppercase
      }));

      // Store GST status and trade name for display
      setGstStatus(data.data.gstStatus || null);
      setCompanyTradeName(data.data.tradeName || '');

      setGstLookupSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setGstLookupSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('[BrandDealDetailsPage] GST lookup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to lookup GST data. Please enter details manually.';
      setGstLookupError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGstLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.brandName.trim()) {
      toast.error('Please enter your brand name');
      return;
    }
    if (!formData.campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    if (formData.deliverables.length === 0 || formData.deliverables.some(d => !d.platform || !d.contentType || !d.quantity)) {
      toast.error('Please add at least one complete deliverable');
      return;
    }
    if (!formData.deadline) {
      toast.error('Please select a deadline');
      return;
    }
    if (formData.dealType === 'paid') {
      if (!formData.paymentAmount) {
        toast.error('Please enter payment amount');
        return;
      }
      if (!formData.paymentTrigger) {
        toast.error('Please select when payment is due');
        return;
      }
    }
    if (formData.dealType === 'barter') {
      if (!formData.productDescription) {
        toast.error('Please describe the product');
        return;
      }
      if (!formData.barterValue) {
        toast.error('Please enter product/service value');
        return;
      }
      if (!formData.barterShippingResponsibility) {
        toast.error('Please select shipping responsibility');
        return;
      }
      if (formData.barterReplacementAllowed === undefined) {
        toast.error('Please select replacement policy');
        return;
      }
    }
    if (!formData.cancellationTerms) {
      toast.error('Please select cancellation terms');
      return;
    }
    
    // Company Contact Details validation
    if (!formData.companyLegalName?.trim()) {
      toast.error('Please enter company legal name');
      return;
    }
    if (!formData.authorizedSignatoryName?.trim()) {
      toast.error('Please enter authorized signatory name');
      return;
    }
    // Email validation (optional but must be valid if provided)
    if (formData.companyEmail?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.companyEmail.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
    }
    if (!formData.companyAddress?.trim()) {
      toast.error('Please enter company address');
      return;
    }
    if (!formData.companyState?.trim()) {
      toast.error('Please enter company state');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
          ? 'https://api.creatorarmour.com'
          : 'http://localhost:3001');

      const response = await fetch(`${apiBaseUrl}/api/deal-details-tokens/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          deliverables: formData.deliverables.map(d => 
            `${d.quantity} ${d.platform} ${d.contentType}${d.duration ? ` (${d.duration}s)` : ''}`
          ),
          // Auto-set jurisdiction
          jurisdiction: 'India',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit details');
      }

      setIsSubmitted(true);
      toast.success('Details received!');
    } catch (err: any) {
      console.error('[BrandDealDetailsPage] Submit error:', err);
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Link Invalid</h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">✅ Details Received</h2>
          <p className="text-white/80 text-lg mb-2">
            Thank you for providing the collaboration details!
          </p>
          <p className="text-white/60 text-sm">
            {creatorName} will review and share the final agreement shortly.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Help finalize your collaboration with {creatorName}
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            This takes ~2 minutes. No legal knowledge needed.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {isFormUsed && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 mb-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ This form has already been submitted. All fields are locked. Please contact the creator for any changes.
              </p>
            </div>
          )}
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Your brand name"
              required
              disabled={isFormUsed}
            />
          </div>

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.campaignName}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignName: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., Summer Product Launch"
              required
              disabled={isFormUsed}
            />
          </div>

          {/* Deliverables - Structured */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Deliverables *
            </label>
            <div className="space-y-4">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">Deliverable {index + 1}</span>
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      disabled={isFormUsed}
                    >
                      Remove
                    </button>
                  )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Platform *</label>
                      <select
                        value={deliverable.platform}
                        onChange={(e) => handleDeliverableChange(index, 'platform', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                        disabled={isFormUsed}
                        required
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="X">X (Twitter)</option>
                        <option value="Blog">Blog</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Content Type *</label>
                      <select
                        value={deliverable.contentType}
                        onChange={(e) => handleDeliverableChange(index, 'contentType', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                        disabled={isFormUsed}
                        required
                      >
                        <option value="Reel">Reel</option>
                        <option value="Story">Story</option>
                        <option value="Post">Post</option>
                        <option value="Video">Video</option>
                        <option value="Shorts">Shorts</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={deliverable.quantity}
                        onChange={(e) => handleDeliverableChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                        disabled={isFormUsed}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/60 mb-1">Min Duration (sec)</label>
                      <input
                        type="number"
                        min="0"
                        value={deliverable.duration || ''}
                        onChange={(e) => handleDeliverableChange(index, 'duration', parseInt(e.target.value) || undefined)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50"
                        placeholder="15"
                        disabled={isFormUsed}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="text-sm text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isFormUsed}
              >
                + Add another deliverable
              </button>
            </div>
          </div>

          {/* Content Approval & Revisions */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-300" />
              Content Approval & Revisions
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Approval Type
                </label>
                <select
                  value={formData.approvalProcess || 'limited_revisions'}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalProcess: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="no_approval">No approval required</option>
                  <option value="one_time">One-time approval</option>
                  <option value="limited_revisions">Limited revisions</option>
                  <option value="unlimited_revisions">Unlimited revisions</option>
                </select>
              </div>

              {formData.approvalProcess === 'limited_revisions' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Revisions (1-5)
                  </label>
                  <select
                    value={formData.numberOfRevisions || 2}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfRevisions: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isFormUsed}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Approval Turnaround Time
                </label>
                <select
                  value={formData.approvalTurnaroundTime || '3_business_days'}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalTurnaroundTime: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="24_hours">24 hours</option>
                  <option value="48_hours">48 hours</option>
                  <option value="3_business_days">3 business days</option>
                  <option value="5_business_days">5 business days</option>
                </select>
              </div>

              <p className="text-xs text-white/50 mt-1">
                Defines how many changes are allowed and how quickly approvals are expected.
              </p>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline / Deadline *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isFormUsed}
            />
          </div>

          {/* Posting Window */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Posting Window
            </label>
            <input
              type="text"
              value={formData.postingWindow || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, postingWindow: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., Within 7 days of approval or Between 10–15 June 2025"
              disabled={isFormUsed}
            />
            <p className="text-xs text-white/50 mt-1">
              Clarifies when the content is expected to go live after approval.
            </p>
          </div>

          {/* Deal Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Deal Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, dealType: 'paid' }))}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 transition-all",
                  formData.dealType === 'paid'
                    ? "bg-purple-500/30 border-purple-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={isFormUsed}
              >
                <IndianRupee className="w-5 h-5 mx-auto mb-1" />
                Paid
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, dealType: 'barter' }))}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 transition-all",
                  formData.dealType === 'barter'
                    ? "bg-purple-500/30 border-purple-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={isFormUsed}
              >
                <Package className="w-5 h-5 mx-auto mb-1" />
                Barter
              </button>
            </div>
          </div>

          {/* Platform Details */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-white/70">Platform Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Brand Handle
                </label>
                <input
                  type="text"
                  value={formData.brandHandle || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandHandle: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="@brandname"
                  disabled={isFormUsed}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Creator Handle
                </label>
                <input
                  type="text"
                  value={formData.creatorHandle || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, creatorHandle: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="@creatorhandle"
                  disabled={isFormUsed}
                />
              </div>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.dealType === 'paid' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.paymentAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 50000"
                  required
                  disabled={isFormUsed}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Timeline
                </label>
                <select
                  value={formData.paymentTimeline || '7_days'}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTimeline: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="on_delivery">On delivery</option>
                  <option value="7_days">Within 7 days of delivery</option>
                  <option value="15_days">Within 15 days of delivery</option>
                  <option value="30_days">Within 30 days of delivery</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Clarifies when payment is expected to avoid delays or disputes.
                </p>
              </div>
              
              {/* Payment Trigger - Required for Paid */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Due *
                </label>
                <select
                  value={formData.paymentTrigger || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTrigger: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select payment trigger</option>
                  <option value="on_submission">On content submission</option>
                  <option value="on_approval">On content approval</option>
                  <option value="on_publishing">On publishing</option>
                  <option value="on_completion">On campaign completion</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Clarifies when payment is expected to avoid delays or disputes.
                </p>
              </div>

              {/* Payment Method - Multi-select for Paid */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Method (optional)
                </label>
                <div className="space-y-2">
                  {['Bank Transfer', 'UPI', 'Cheque', 'Escrow'].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.paymentMethod?.includes(method) || false}
                        onChange={(e) => {
                          const current = formData.paymentMethod || [];
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, paymentMethod: [...current, method] }));
                          } else {
                            setFormData(prev => ({ ...prev, paymentMethod: current.filter(m => m !== method) }));
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400/50 disabled:opacity-50"
                  disabled={isFormUsed}
                      />
                      <span className="text-sm text-white/80">{method}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Used only for clarity and invoicing.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Description *
                </label>
                <textarea
                  value={formData.productDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Describe the product or service being exchanged"
                  required
                  disabled={isFormUsed}
                />
                <p className="text-xs text-white/50 mt-1">
                  This will be converted into a legally usable barter agreement.
                </p>
              </div>
              {/* Product/Service Value - Required for Barter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product / Service Value (₹) *
                </label>
                <input
                  type="number"
                  value={formData.barterValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barterValue: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 10000"
                  required
                  disabled={isFormUsed}
                />
              </div>

              {/* Approximate Product Value - Optional for Barter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Approximate Product Value (₹)
                </label>
                <input
                  type="number"
                  value={formData.barterApproximateValue || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barterApproximateValue: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 10000"
                  disabled={isFormUsed}
                />
                <p className="text-xs text-white/50 mt-1">
                  Used for record-keeping and dispute resolution only.
                </p>
              </div>

              {/* Shipping Responsibility - Required for Barter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipping Responsibility *
                </label>
                <select
                  value={formData.barterShippingResponsibility || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, barterShippingResponsibility: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select shipping responsibility</option>
                  <option value="Brand bears shipping">Brand bears shipping</option>
                  <option value="Creator bears shipping">Creator bears shipping</option>
                </select>
              </div>

              {/* Replacement if Defective - Required for Barter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Replacement if product is defective? *
                </label>
                <select
                  value={formData.barterReplacementAllowed === undefined ? '' : formData.barterReplacementAllowed ? 'yes' : 'no'}
                  onChange={(e) => setFormData(prev => ({ ...prev, barterReplacementAllowed: e.target.value === 'yes' }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </>
          )}

          {/* Rights & Safety */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-300" />
              Rights & Usage
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Rights Duration
                </label>
                <select
                  value={formData.usageRightsDuration || '3_months'}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageRightsDuration: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="1_month">1 month</option>
                  <option value="3_months">3 months</option>
                  <option value="6_months">6 months</option>
                  <option value="12_months">12 months</option>
                  <option value="perpetual">Perpetual</option>
                </select>
              </div>

              {/* Paid Ads Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Paid Ads Allowed?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paidAds"
                      checked={formData.paidAdsAllowed === true}
                      onChange={() => setFormData(prev => ({ ...prev, paidAdsAllowed: true }))}
                      className="w-4 h-4 border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400/50 disabled:opacity-50"
                  disabled={isFormUsed}
                    />
                    <span className="text-sm text-white/80">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paidAds"
                      checked={formData.paidAdsAllowed === false}
                      onChange={() => setFormData(prev => ({ ...prev, paidAdsAllowed: false }))}
                      className="w-4 h-4 border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400/50 disabled:opacity-50"
                      disabled={isFormUsed}
                    />
                    <span className="text-sm text-white/80">No</span>
                  </label>
                </div>
              </div>

              {/* Whitelisting Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  Whitelisting Allowed?
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-white/60 hover:text-white/80 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-purple-900/95 border-white/20 text-white max-w-xs">
                        <p className="text-sm">
                          Whitelisting allows the brand to run your content as paid ads from your profile or identity. Enable only if you want brands to promote your content, and always define duration & platforms.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="whitelisting"
                      checked={formData.whitelistingAllowed === true}
                      onChange={() => setFormData(prev => ({ ...prev, whitelistingAllowed: true }))}
                      className="w-4 h-4 border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400/50 disabled:opacity-50"
                      disabled={isFormUsed}
                    />
                    <span className="text-sm text-white/80">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="whitelisting"
                      checked={formData.whitelistingAllowed === false}
                      onChange={() => setFormData(prev => ({ ...prev, whitelistingAllowed: false }))}
                      className="w-4 h-4 border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400/50 disabled:opacity-50"
                      disabled={isFormUsed}
                    />
                    <span className="text-sm text-white/80">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  Exclusivity Period
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-white/60 hover:text-white/80 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-purple-900/95 border-white/20 text-white max-w-xs">
                        <p className="text-sm">
                          Exclusivity means you agree not to work with competing brands in the same category for a defined period. Set this only if the brand is compensating fairly for restricting your future collaborations.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </label>
                <select
                  value={formData.exclusivityPeriod || 'none'}
                  onChange={(e) => setFormData(prev => ({ ...prev, exclusivityPeriod: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="none">None</option>
                  <option value="7_days">7 days</option>
                  <option value="15_days">15 days</option>
                  <option value="30_days">30 days</option>
                  <option value="custom">Custom (lawyer review)</option>
                </select>
              </div>

              {/* Cancellation/Termination - Required for All */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  If the campaign is cancelled *
                </label>
                <select
                  value={formData.cancellationTerms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cancellationTerms: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select cancellation terms</option>
                  <option value="full_payment_after_approval">Full payment if cancelled after approval</option>
                  <option value="pro_rata_completed_work">Pro-rata payment for completed work</option>
                  <option value="no_payment_before_start">No payment if cancelled before work starts</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Sets clear expectations if the campaign is stopped early.
                </p>
              </div>
            </div>
          </div>

          {/* Jurisdiction / Governing Law */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-300" />
              Jurisdiction / Governing Law
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Governing Law
                </label>
                <select
                  value={formData.governingLaw || 'India'}
                  onChange={(e) => setFormData(prev => ({ ...prev, governingLaw: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="India">India</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  State *
                </label>
                <select
                  value={formData.companyState || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyState: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select state</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-white/50 mt-1">
                Used only for legal notices and dispute jurisdiction.
              </p>
            </div>
          </div>

          {/* Company Details */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-300" />
              Company Details
            </h3>
            
            <div className="space-y-4">
              {/* GSTIN with Fetch Button */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  GSTIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.companyGstin || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, companyGstin: e.target.value }));
                      setGstLookupError(null);
                      setGstLookupSuccess(false);
                      setGstStatus(null);
                      setCompanyTradeName('');
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    placeholder="Enter 15-digit GSTIN"
                    maxLength={15}
                    disabled={isFormUsed || isGstLookupLoading}
                  />
                  <button
                    type="button"
                    onClick={handleGstLookup}
                    disabled={isFormUsed || isGstLookupLoading || !formData.companyGstin?.trim() || formData.companyGstin.trim().length !== 15}
                    className={cn(
                      "px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                      "bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/30",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center gap-2"
                    )}
                  >
                    {isGstLookupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'Fetch from GST'
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  We auto-fill company details from public GST records. Please verify before submitting.
                </p>
                {gstLookupError && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {gstLookupError}
                  </p>
                )}
                {gstLookupSuccess && (
                  <p className="text-xs text-green-300 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Company details fetched. Please verify and edit if needed.
                  </p>
                )}
                {gstStatus && (
                  <div className="mt-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      gstStatus === 'Active' 
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    )}>
                      {gstStatus === 'Active' ? '🟢' : '🔴'}
                      GST Status: {gstStatus}
                    </span>
                    {gstStatus !== 'Active' && (
                      <p className="text-xs text-amber-300/80 mt-1.5">
                        ⚠️ This GSTIN is {gstStatus.toLowerCase()}. Please verify the company status before proceeding.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Company Legal Name - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Legal Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyLegalName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyLegalName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Registered company name"
                  required
                  disabled={isFormUsed}
                />
                <p className="text-xs text-white/50 mt-1">
                  This will appear on the contract and invoice.
                </p>
              </div>

              {/* Trade Name (GST) - Optional, Read-only when available */}
              {companyTradeName && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Trade Name (GST)
                  </label>
                  <input
                    type="text"
                    value={companyTradeName}
                    readOnly
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 placeholder-white/40 focus:outline-none cursor-not-allowed"
                    placeholder="Trade name from GST records"
                    disabled
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Trade name from GST records (read-only).
                  </p>
                </div>
              )}

              {/* Registered Address - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Registered Address *
                </label>
                <textarea
                  value={formData.companyAddress || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Registered office or official business address"
                  required
                  disabled={isFormUsed}
                  rows={3}
                />
                <p className="text-xs text-white/50 mt-1">
                  Required for legal notices and jurisdiction.
                </p>
              </div>

              {/* State - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  State *
                </label>
                <select
                  value={formData.companyState || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyState: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select state</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Authorized Signatory Name - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Authorized Signatory Name *
                </label>
                <input
                  type="text"
                  value={formData.authorizedSignatoryName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorizedSignatoryName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Name of person signing on behalf of the company"
                  required
                  disabled={isFormUsed}
                />
                <p className="text-xs text-white/50 mt-1">
                  Person authorized to approve and sign this agreement.
                </p>
              </div>

              {/* Official Company Email - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={formData.companyEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="official@company.com"
                  disabled={isFormUsed}
                />
                <p className="text-xs text-white/50 mt-1">
                  Used for contract sharing, notices, and payment communication.
                </p>
              </div>

              {/* Phone Number - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.companyPhone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="+91 XXXXX XXXXX"
                  disabled={isFormUsed}
                />
              </div>
            </div>

            {/* Legal Note */}
            <p className="text-xs text-white/40 mt-4 italic">
              CreatorArmour does not verify GST filings. Information is provided for convenience only.
            </p>
            
            {/* Disclosure */}
            <p className="text-xs text-white/50 mt-4 border-t border-white/10 pt-4">
              Company details are sourced from public GST records. CreatorArmour does not verify ownership or signing authority. Please verify before submitting.
            </p>
          </div>

          {/* Legal Disclaimer */}
          <p className="text-xs text-white/50 text-center">
            This information will be used to prepare a draft collaboration agreement. Final terms apply only once both parties sign.
          </p>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || isFormUsed}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full py-4 rounded-xl font-semibold text-lg transition-all",
              "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : isFormUsed ? (
              'Already Submitted'
            ) : (
              'Submit Details'
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
};

export default BrandDealDetailsPage;

