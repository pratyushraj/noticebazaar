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
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DealDetailsFormData {
  brandName: string;
  campaignName: string;
  deliverables: string[];
  deadline: string;
  dealType: 'paid' | 'barter';
  // Content Approval & Revisions
  approvalProcess?: string; // "Single approval before posting" | "Approval with limited revisions"
  numberOfRevisions?: string; // "1" | "2" | "3"
  approvalTurnaroundTime?: string; // "Within 2 business days" | "Within 3 business days" | "Within 5 business days"
  // Posting Window
  postingWindow?: string; // Optional text input
  // Platform Handles
  brandHandle?: string; // Optional
  creatorHandle?: string; // Optional
  // Paid fields
  paymentAmount?: string;
  paymentTimeline?: string;
  paymentTrigger?: string; // New: required for paid
  paymentMethod?: string;
  // Barter fields
  productDescription?: string;
  barterValue?: string; // Renamed from productValue for clarity
  barterApproximateValue?: string; // New: optional approximate value for barter
  barterShippingResponsibility?: string; // Renamed from shippingResponsibility
  barterReplacementAllowed?: boolean; // New
  // Rights & safety
  usageRights: string;
  exclusivity: string;
  revisions: string;
  cancellationTerms?: string; // New: required for all
  // Jurisdiction / Governing Law
  governingLaw?: string; // Default: "India"
  // Company Contact Details
  companyLegalName?: string; // Required
  authorizedSignatoryName?: string; // Required
  companyEmail?: string; // Required
  companyAddress?: string; // Required
  companyState?: string; // Required (from GST or manual)
  companyPhone?: string; // Optional
  companyGstin?: string; // Optional
  // Auto-set (not in UI)
  jurisdiction?: string; // Auto-set to "India"
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
    deliverables: [''],
    deadline: '',
    dealType: 'paid',
    approvalProcess: 'Approval with limited revisions',
    numberOfRevisions: '2',
    approvalTurnaroundTime: 'Within 3 business days',
    postingWindow: '',
    brandHandle: '',
    creatorHandle: '',
    usageRights: '3 months',
    exclusivity: 'None',
    revisions: '2',
    governingLaw: 'India',
  });

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
      deliverables: [...prev.deliverables, '']
    }));
  };

  const handleDeliverableChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((d, i) => i === index ? value : d)
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
    if (formData.deliverables.filter(d => d.trim()).length === 0) {
      toast.error('Please add at least one deliverable');
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
          deliverables: formData.deliverables.filter(d => d.trim()),
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

          {/* Deliverables */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Deliverables *
            </label>
            <div className="space-y-2">
              {formData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={deliverable}
                    onChange={(e) => handleDeliverableChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Deliverable ${index + 1}`}
                    disabled={isFormUsed}
                  />
                  {formData.deliverables.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDeliverable(index)}
                      className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isFormUsed}
                    >
                      Remove
                    </button>
                  )}
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
                  Approval Process
                </label>
                <select
                  value={formData.approvalProcess || 'Approval with limited revisions'}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalProcess: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="Single approval before posting">Single approval before posting</option>
                  <option value="Approval with limited revisions">Approval with limited revisions</option>
                </select>
              </div>

              {formData.approvalProcess === 'Approval with limited revisions' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Revisions
                  </label>
                  <select
                    value={formData.numberOfRevisions || '2'}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfRevisions: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isFormUsed}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Approval Turnaround Time
                </label>
                <select
                  value={formData.approvalTurnaroundTime || 'Within 3 business days'}
                  onChange={(e) => setFormData(prev => ({ ...prev, approvalTurnaroundTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="Within 2 business days">Within 2 business days</option>
                  <option value="Within 3 business days">Within 3 business days</option>
                  <option value="Within 5 business days">Within 5 business days</option>
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
                <input
                  type="text"
                  value={formData.paymentTimeline || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTimeline: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 50% upfront, 50% on delivery"
                  disabled={isFormUsed}
                />
              </div>
              
              {/* Payment Trigger - Required for Paid */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Due *
                </label>
                <select
                  value={formData.paymentTrigger || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTrigger: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select payment trigger</option>
                  <option value="On content posting">On content posting</option>
                  <option value="Within X days of posting">Within X days of posting</option>
                  <option value="On content approval">On content approval</option>
                  <option value="On invoice submission">On invoice submission</option>
                </select>
                <p className="text-xs text-white/50 mt-1">
                  Clarifies when payment is expected to avoid delays or disputes.
                </p>
              </div>

              {/* Payment Method - Optional for Paid */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value || undefined }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="">Select payment method (optional)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
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
                  Usage Rights
                </label>
                <select
                  value={formData.usageRights}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageRights: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                  <option value="2 years">2 years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exclusivity Period
                </label>
                <select
                  value={formData.exclusivity}
                  onChange={(e) => setFormData(prev => ({ ...prev, exclusivity: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="None">None</option>
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="90 days">90 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Revisions
                </label>
                <select
                  value={formData.revisions}
                  onChange={(e) => setFormData(prev => ({ ...prev, revisions: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUsed}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>

              {/* Cancellation/Termination - Required for All */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  If the campaign is cancelled *
                </label>
                <select
                  value={formData.cancellationTerms || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cancellationTerms: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isFormUsed}
                >
                  <option value="">Select cancellation terms</option>
                  <option value="Full payment to creator">Full payment to creator</option>
                  <option value="Partial payment for work completed">Partial payment for work completed</option>
                  <option value="No payment if work not started">No payment if work not started</option>
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
                  State
                </label>
                <input
                  type="text"
                  value={formData.companyState || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyState: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="State"
                  disabled={isFormUsed}
                />
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
                <input
                  type="text"
                  value={formData.companyState || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyState: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="State"
                  required
                  disabled={isFormUsed}
                />
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

