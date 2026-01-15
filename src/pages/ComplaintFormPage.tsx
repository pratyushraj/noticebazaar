"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X, CheckCircle2, Scale, FileText, HelpCircle, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

// Helper to get API base URL
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  
  const origin = window.location.origin;
  if (origin.includes('noticebazaar.com')) {
    return 'https://api.noticebazaar.com';
  }
  
  return 'http://localhost:3001';
}

const issueTypes = [
  'Refund not processed',
  'Wrong product/service delivered',
  'Poor customer service',
  'Billing error',
  'Delivery delay',
  'Product quality issue',
  'Other',
];

type Step = 'form' | 'pre_filing' | 'success';

const ComplaintFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || null;
  const categoryName = searchParams.get('categoryName') || '';
  
  const { profile, user } = useSession();
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    companyName: '',
    issueType: '',
    description: '',
    amount: '',
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  
  // Pre-filing actions state
  const [preFilingActions, setPreFilingActions] = useState({
    wants_lawyer_review: false,
    wants_notice_draft: false,
  });

  // Redirect if no category
  useEffect(() => {
    if (!category) {
      navigate('/lifestyle/consumer-complaints');
    }
  }, [category, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Please enter company/platform name');
      return;
    }
    if (!formData.issueType) {
      toast.error('Please select an issue type');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    if (!profile?.id || !user?.id) {
      toast.error('Please log in to submit a complaint');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload file if exists
      let proofFileUrl: string | null = null;
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('complaint-proofs')
          .upload(fileName, uploadedFile);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast.error('Failed to upload proof file');
        } else {
          const { data: urlData } = supabase.storage
            .from('complaint-proofs')
            .getPublicUrl(fileName);
          proofFileUrl = urlData.publicUrl;
        }
      }

      // Create complaint draft (without pre-filing actions yet)
      const { data: complaintData, error: complaintError } = await supabase
        .from('consumer_complaints')
        .insert({
          creator_id: profile.id,
          category: category || 'others',
          category_name: categoryName || '',
          company_name: formData.companyName,
          issue_type: formData.issueType,
          description: formData.description,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          proof_file_url: proofFileUrl,
          status: 'draft_created',
        } as any)
        .select()
        .single();

      if (complaintError) {
        console.error('Complaint creation error:', complaintError);
        toast.error('Failed to create complaint. Please try again.');
        setIsSubmitting(false);
        return;
      }

      if (!complaintData || !('id' in complaintData)) {
        console.error('Invalid complaint data returned');
        toast.error('Failed to create complaint. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setComplaintId(complaintData.id as string);
      setIsSubmitting(false);
      setCurrentStep('pre_filing');
      toast.success('Complaint draft created!');
    } catch (error: any) {
      console.error('Error creating complaint:', error);
      toast.error('Failed to create complaint. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!complaintId || !profile?.id || !user?.id) {
      toast.error('Missing complaint data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine status based on selections
      let newStatus = 'ready_to_file';
      if (preFilingActions.wants_lawyer_review && preFilingActions.wants_notice_draft) {
        // If both selected, prioritize lawyer review first
        newStatus = 'lawyer_review_requested';
      } else if (preFilingActions.wants_lawyer_review) {
        newStatus = 'lawyer_review_requested';
      } else if (preFilingActions.wants_notice_draft) {
        newStatus = 'notice_generated';
      }

      // Call backend to update complaint and trigger notifications
      const apiBaseUrl = getApiBaseUrl();
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${apiBaseUrl}/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          wants_lawyer_review: preFilingActions.wants_lawyer_review,
          wants_notice_draft: preFilingActions.wants_notice_draft,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update complaint' }));
        throw new Error(errorData.error || 'Failed to update complaint');
      }

      setIsSubmitting(false);
      setCurrentStep('success');
      
      // Redirect after showing success
      setTimeout(() => {
        navigate('/dashboard/consumer-complaints');
        
        if (newStatus === 'lawyer_review_requested') {
          toast.success('Complaint submitted for lawyer review. You\'ll be notified when the review is complete.');
        } else if (newStatus === 'notice_generated') {
          toast.success('Legal notice will be generated. You\'ll be notified when it\'s ready.');
        } else {
          toast.success('Complaint is ready to file. You can proceed with filing.');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      toast.error(error.message || 'Failed to save selections. Please try again.');
      setIsSubmitting(false);
    }
  };

  const togglePreFilingAction = (action: 'wants_lawyer_review' | 'wants_notice_draft') => {
    setPreFilingActions(prev => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  // Check if form step 1 is valid (Company & Issue)
  const isStep1Valid = formData.companyName.trim() && formData.issueType;
  
  // Check if form step 2 is valid (Details)
  const isStep2Valid = formData.description.trim();
  
  // Current form step (1-3)
  const formStep = uploadedFile ? 3 : formData.description.trim() ? 2 : 1;

  if (currentStep === 'success') {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Complaint Received!
          </h1>
          <p className="text-white/70 text-lg">
            Your complaint has been received. Our team will take it forward.
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === 'pre_filing') {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep('form')}
              className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">
              Before you proceed
            </h1>
            <p className="text-white/70">
              Optional services to strengthen your complaint (Free during pilot)
            </p>
          </div>

          <div className="space-y-4">
            {/* Lawyer Review Toggle Card */}
            <button
              type="button"
              onClick={() => togglePreFilingAction('wants_lawyer_review')}
              className={cn(
                "w-full p-5 rounded-xl border-2 transition-all text-left",
                "bg-gradient-to-br from-purple-900/50 to-indigo-900/50",
                preFilingActions.wants_lawyer_review
                  ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-purple-500/30 hover:border-purple-400/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                  preFilingActions.wants_lawyer_review
                    ? "bg-purple-500/20"
                    : "bg-purple-500/10"
                )}>
                  <Scale className="w-6 h-6 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">
                      Lawyer Review (Free • Pilot)
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Pilot
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    A legal advisor will review your complaint and suggest improvements before you file.
                  </p>
                  <p className="text-xs text-white/50">
                    Best-effort review during beta. No legal representation.
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                  preFilingActions.wants_lawyer_review
                    ? "bg-purple-500 border-purple-400"
                    : "border-purple-400/50"
                )}>
                  {preFilingActions.wants_lawyer_review && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </button>

            {/* Legal Notice Drafting Toggle Card */}
            <button
              type="button"
              onClick={() => togglePreFilingAction('wants_notice_draft')}
              className={cn(
                "w-full p-5 rounded-xl border-2 transition-all text-left",
                "bg-gradient-to-br from-purple-900/50 to-indigo-900/50",
                preFilingActions.wants_notice_draft
                  ? "border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                  : "border-purple-500/30 hover:border-purple-400/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                  preFilingActions.wants_notice_draft
                    ? "bg-purple-500/20"
                    : "bg-purple-500/10"
                )}>
                  <FileText className="w-6 h-6 text-purple-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">
                      Generate Legal Notice (Free • Pilot)
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Pilot
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    We'll draft a formal legal notice you can send to the company.
                  </p>
                  <p className="text-xs text-white/50">
                    Draft only. Sending and enforcement remain with you.
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                  preFilingActions.wants_notice_draft
                    ? "bg-purple-500 border-purple-400"
                    : "border-purple-400/50"
                )}>
                  {preFilingActions.wants_notice_draft && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
            </button>

            {/* Disclaimer */}
            <div className="pt-2 border-t border-purple-500/20">
              <p className="text-xs text-white/50 text-center">
                These services are complimentary during a limited pilot. CreatorArmour does not act as legal counsel unless explicitly agreed.
              </p>
            </div>

            {/* Helper text if neither selected */}
            {!preFilingActions.wants_lawyer_review && !preFilingActions.wants_notice_draft && (
              <p className="text-sm text-white/60 text-center pt-2">
                You can file the complaint yourself without review.
              </p>
            )}
          </div>

          {/* Sticky Bottom CTA */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-900 via-purple-800 to-transparent border-t border-purple-500/20">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={handleContinue}
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-semibold"
              >
                {isSubmitting ? 'Processing...' : 'Continue →'}
              </Button>
              <p className="text-xs text-white/50 text-center mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Your information is private and secure
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/lifestyle/consumer-complaints')}
            className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Raise Consumer Complaint
              </h1>
              {categoryName && (
                <p className="text-emerald-400 text-sm">
                  Category: {categoryName}
                </p>
              )}
            </div>
            <a
              href="/#/consumer-complaints/how-it-works"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white hover:underline cursor-pointer flex-shrink-0 mt-1"
              aria-label="Learn how consumer complaints work on CreatorArmour"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </a>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${(formStep / 3) * 100}%` }}
              />
            </div>
            <span className="text-sm text-white/60 font-medium">
              Step {formStep} of 3
            </span>
          </div>
          <div className="flex gap-2 text-xs text-white/50">
            <span className={cn(formStep >= 1 && "text-white/70")}>Company & Issue</span>
            <span>•</span>
            <span className={cn(formStep >= 2 && "text-white/70")}>Details</span>
            <span>•</span>
            <span className={cn(formStep >= 3 && "text-white/70")}>Proof</span>
          </div>
        </div>

        {/* Form Steps */}
        <div className="space-y-6">
          {/* Step 1: Company & Issue */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white font-medium">
                Company / Service Name *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="e.g. Ola, Urban Company, Pronto, Porter"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueType" className="text-white font-medium">
                Issue Type *
              </Label>
              <Select
                value={formData.issueType}
                onValueChange={(value) => handleInputChange('issueType', value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12 text-base">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {issueTypes.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 2: Details */}
          {isStep1Valid && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-medium">
                  Short Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Explain what went wrong and what resolution you expect"
                  rows={5}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none text-base min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white font-medium">
                  Amount Involved (Optional)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="₹0"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-base"
                />
                <p className="text-xs text-white/50">
                  Helps us prioritize your complaint (optional)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Proof (Optional) */}
          {isStep2Valid && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              <Label className="text-white font-medium">
                Upload screenshots or documents (optional)
              </Label>
              {uploadedFile ? (
                <div className="flex items-center gap-3 p-4 bg-white/10 border border-white/20 rounded-xl">
                  <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-white truncate">
                    {uploadedFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0 hover:bg-white/10 text-white/70"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-400/50 transition-colors bg-white/5">
                  <div className="flex flex-col items-center justify-center pt-6 pb-4">
                    <Upload className="w-10 h-10 mb-3 text-white/60" />
                    <p className="text-base text-white font-medium mb-1">
                      Tap to upload proof
                    </p>
                    <p className="text-xs text-white/50">
                      PNG, JPG, PDF up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-900 via-purple-800 to-transparent border-t border-purple-500/20">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isStep1Valid || !isStep2Valid}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : formStep === 3 ? 'Submit Complaint Securely' : 'Continue →'}
            </Button>
            <p className="text-xs text-white/50 text-center mt-2 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Your information is private and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintFormPage;

