"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Upload, X, CheckCircle2, Scale, FileText, HelpCircle } from 'lucide-react';
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

interface ConsumerComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | null;
  categoryName?: string;
  onSubmit: () => void;
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

const ConsumerComplaintModal: React.FC<ConsumerComplaintModalProps> = ({
  open,
  onOpenChange,
  category,
  categoryName,
  onSubmit,
}) => {
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
      
      // Reset form after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setCurrentStep('form');
        setFormData({
          companyName: '',
          issueType: '',
          description: '',
          amount: '',
        });
        setUploadedFile(null);
        setPreFilingActions({
          wants_lawyer_review: false,
          wants_notice_draft: false,
        });
        setComplaintId(null);
        onOpenChange(false);
        onSubmit();
        
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

  const handleClose = () => {
    if (!isSubmitting && !isSuccess && currentStep !== 'success') {
      setFormData({
        companyName: '',
        issueType: '',
        description: '',
        amount: '',
      });
      setUploadedFile(null);
      setPreFilingActions({
        wants_lawyer_review: false,
        wants_notice_draft: false,
      });
      setCurrentStep('form');
      setComplaintId(null);
      onOpenChange(false);
    }
  };

  const togglePreFilingAction = (action: 'wants_lawyer_review' | 'wants_notice_draft') => {
    setPreFilingActions(prev => ({
      ...prev,
      [action]: !prev[action],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 text-white">
        {currentStep === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Complaint Received!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Your complaint has been received. Our team will take it forward.
            </DialogDescription>
          </div>
        ) : currentStep === 'pre_filing' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Before you proceed
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Optional services to strengthen your complaint (Free during pilot)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
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

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('form')}
                disabled={isSubmitting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4 mb-2">
                <DialogTitle className="text-2xl font-bold flex-1">
                  Raise Consumer Complaint
                </DialogTitle>
                <a
                  href="/#/consumer-complaints/how-it-works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white hover:underline cursor-pointer flex-shrink-0 mt-1"
                  aria-label="Learn how consumer complaints work on CreatorArmour"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">How this works</span>
                  <span className="sm:hidden">Help</span>
                </a>
              </div>
              <DialogDescription className="text-gray-300">
                {categoryName && (
                  <span className="text-emerald-400">Category: {categoryName}</span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white">
                  Company / Service Name *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g. Ola, Urban Company, Pronto, Porter"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Issue Type */}
              <div className="space-y-2">
                <Label htmlFor="issueType" className="text-white">
                  Issue Type *
                </Label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => handleInputChange('issueType', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {issueTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Short Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Amount (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount Involved (Optional)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="₹0"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              {/* File Upload (Optional) */}
              <div className="space-y-2">
                <Label className="text-white">Upload Proof (Optional)</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-2 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <span className="flex-1 text-sm text-white truncate">
                      {uploadedFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 p-0 hover:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors bg-gray-800/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
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
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConsumerComplaintModal;









