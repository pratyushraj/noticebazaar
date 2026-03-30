"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, User, Building2, Scale, CheckCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSendLegalCheckEmail } from '@/lib/hooks/useSendLegalCheckEmail';
import { useLeadSubmission, useFetchLeadSubmission } from '@/lib/hooks/useLeadSubmission';
import { setCookie, getCookie } from '@/lib/utils/cookies';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/analytics';

// --- Constants ---
const BUSINESS_TYPES = [
  'Influencer / Content Creator', 'UGC Creator', 'Creator-led Brand', 
  'Talent Manager / Agency', 'Freelancer / Service Provider', 
  'YouTube Creator', 'Instagram Creator', 
  'Podcast / Education Creator', 'Streamer / Gaming Creator', 'Other',
];
const BUSINESS_STAGES = ['Just starting out', 'Taking my first paid deals', 'Already doing repeat brand deals', 'Established creator business'];
const ENTITY_TYPES = ['Individual creator', 'Proprietorship', 'Partnership / Agency', 'Private Limited / LLP', 'Not registered yet', 'Not sure'];
const YES_NO_NOTSURE = ['Yes', 'No', 'Not sure'];
const YES_NO = ['Yes', 'No'];
const YES_NO_NA = ['Yes', 'No', 'Not applicable'];
const CONTACT_METHODS = ['Email', 'WhatsApp', 'Both'];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyType: string;
  businessStage: string;
  entityType: string;
  hasGst: string;
  hasClientVendorAgreements: string;
  hasEmployeeAgreements: string;
  hasFiledAnnualReturns: string;
  ongoingDisputes: string;
  debtRecoveryChallenge: string;
  preferredContactMethod: string;
  wantsConsultation: string;
}

const LegalCheckForm = () => {
  const navigate = useNavigate();
  const sendEmailMutation = useSendLegalCheckEmail();
  const saveLeadMutation = useLeadSubmission();
  
  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: '', email: '', phone: '', companyName: '', companyType: '',
    businessStage: '', entityType: '', hasGst: '', hasClientVendorAgreements: '',
    hasEmployeeAgreements: '', hasFiledAnnualReturns: '', ongoingDisputes: '',
    debtRecoveryChallenge: '', preferredContactMethod: '', wantsConsultation: '',
  });

  // --- Lead ID and Data Loading ---
  useEffect(() => {
    let currentLeadId = getCookie('lead_id');
    if (!currentLeadId) {
      // Generate a new unique ID (simple timestamp + random number)
      currentLeadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setCookie('lead_id', currentLeadId, 30); // Store for 30 days
    }
    setLeadId(currentLeadId);
  }, []);

  // Fetch existing lead data if leadId is set
  const { mutate: fetchLeadData } = useFetchLeadSubmission(leadId);

  useEffect(() => {
    if (leadId) {
      fetchLeadData(undefined, {
        onSuccess: (data) => {
          if (data) {
            // Map fetched data back to form state
            setFormData({
              fullName: data.full_name || '',
              email: data.email || '',
              phone: data.phone || '',
              companyName: data.company_name || '',
              companyType: data.company_type || '',
              businessStage: data.business_stage || '',
              entityType: data.entity_type || '',
              hasGst: data.has_gst || '',
              hasClientVendorAgreements: data.has_client_vendor_agreements || '',
              hasEmployeeAgreements: data.has_employee_agreements || '',
              hasFiledAnnualReturns: data.has_filed_annual_returns || '',
              ongoingDisputes: data.ongoing_disputes || '',
              debtRecoveryChallenge: data.debt_recovery_challenge || '',
              preferredContactMethod: data.preferred_contact_method || '',
              wantsConsultation: data.wants_consultation || '',
            });
            // Optionally set step based on progress, but we'll keep it at step 1 for simplicity
          }
        },
        onError: (error) => {
          console.error('Failed to load previous lead data:', error);
        }
      });
    }
  }, [leadId, fetchLeadData]);

  // --- Save Progress Function ---
  const saveProgress = useCallback((currentFormData: FormData, status: 'in_progress' | 'completed') => {
    if (!leadId) return;

    const dataToSave = {
      status: status,
      full_name: currentFormData.fullName || null,
      email: currentFormData.email || null,
      phone: currentFormData.phone || null,
      company_name: currentFormData.companyName || null,
      company_type: currentFormData.companyType || null,
      business_stage: currentFormData.businessStage || null,
      entity_type: currentFormData.entityType || null,
      has_gst: currentFormData.hasGst || null,
      has_client_vendor_agreements: currentFormData.hasClientVendorAgreements || null,
      has_employee_agreements: currentFormData.hasEmployeeAgreements || null,
      has_filed_annual_returns: currentFormData.hasFiledAnnualReturns || null,
      ongoing_disputes: currentFormData.ongoingDisputes || null,
      debt_recovery_challenge: currentFormData.debtRecoveryChallenge || null,
      preferred_contact_method: currentFormData.preferredContactMethod || null,
      wants_consultation: currentFormData.wantsConsultation || null,
    };

    saveLeadMutation.mutate({ lead_id: leadId, data: dataToSave });
  }, [leadId, saveLeadMutation]);

  const isLoading = sendEmailMutation.isPending || saveLeadMutation.isPending;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Save progress on blur for text inputs
    saveProgress(formData, 'in_progress');
  };

  const handleSelectChange = (id: keyof FormData, value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [id]: value };
      // Save progress immediately on select change
      saveProgress(newFormData, 'in_progress');
      return newFormData;
    });
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName.trim() || !formData.email.trim()) {
        toast.error('Please fill in your full name and email.');
        return false;
      }
      if (!formData.email.includes('@')) {
        toast.error('Please enter a valid email address.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.phone.trim() || !formData.companyType || !formData.businessStage || !formData.entityType) {
        toast.error('Please fill in all required fields in Section 2.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.hasGst || !formData.hasClientVendorAgreements || !formData.hasEmployeeAgreements || !formData.hasFiledAnnualReturns || !formData.debtRecoveryChallenge) {
        toast.error('Please answer all required questions in Section 3.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.preferredContactMethod || !formData.wantsConsultation) {
        toast.error('Please answer all required questions in the Final Step.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      if (step === 1) {
        void trackEvent('legal_check_started', { source: 'legal_check_form_step_1' });
        // Meta Pixel Event 2: Contact (Micro-conversion for starting the form)
        if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Contact');
        }
      }
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    try {
      // 1. Mark lead as completed in the database
      await saveProgress(formData, 'completed');
      void trackEvent('legal_check_submitted', {
        creator_type: formData.companyType,
        creator_stage: formData.businessStage,
        has_payment_issue: formData.debtRecoveryChallenge,
      });

      // 2. Send the email (which triggers the external notification)
      await sendEmailMutation.mutateAsync(formData);
      
      // 3. Redirect to the thank you page
      navigate('/thank-you', { replace: true });
    } catch (error: any) {
      console.error('Submission failed:', error);
      toast.error('Submission failed. Please try again or contact support.');
    }
  };

  // Helper component for Select inputs
  const FormSelect = ({ id, label, options, value, placeholder, required = true, helperText }: { id: keyof FormData, label: string, options: string[], value: string, placeholder: string, required?: boolean, helperText?: string }) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label} {required && '*'}</Label>
      <Select onValueChange={(val) => handleSelectChange(id, val)} value={value} disabled={isLoading}>
        <SelectTrigger id={id} className="bg-input text-foreground border-border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground border-border">
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && <p className="text-xs text-muted-foreground italic mt-1">{helperText}</p>}
    </div>
  );

  const totalSteps = 4;
  const progress = Math.min(Math.floor(((step - 1) / totalSteps) * 100) + (step === totalSteps ? 100 : 0), 100);

  const StepIndicator = ({ stepNum, title, Icon, isCurrent }: { stepNum: number, title: string, Icon: React.ElementType, isCurrent: boolean }) => (
    <div className={cn("flex items-center space-x-2", stepNum < step ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-muted-foreground')}>
      {stepNum < step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      <span className="text-sm font-medium hidden sm:inline">{title}</span>
    </div>
  );

  const getEncouragementMessage = () => {
    if (step === 1) return "Great! Just 3 more sections...";
    if (step === 2) return "Halfway there! Almost done with your business profile.";
    if (step === 3) return "Almost there! Your report will be ready in 48 hours.";
    return "Final step! Just need your contact preferences.";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-card rounded-xl shadow-lg border border-border">
      <h3 className="text-2xl font-bold text-foreground">1. Tell Us About Your Creator Workflow</h3>
      <p className="text-muted-foreground">Answer a few quick questions so Creator Armour can flag your likely contract, payment, and proof risks. You will get a personalized summary with the next action to take first.</p>

      {/* Progress Bar and Step Indicators */}
      <div className="space-y-3">
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <p className="text-primary font-medium">Step {step} of {totalSteps}: {['Basic Details', 'Creator Profile', 'Deal Risk', 'Final Step'][step - 1]}</p>
          <p className="text-muted-foreground italic">{getEncouragementMessage()}</p>
        </div>
        <div className="flex justify-between pt-2 border-t border-border/50">
          <StepIndicator stepNum={1} title="Basic Details" Icon={User} isCurrent={step === 1} />
          <StepIndicator stepNum={2} title="Creator Profile" Icon={Building2} isCurrent={step === 2} />
          <StepIndicator stepNum={3} title="Deal Risk" Icon={Scale} isCurrent={step === 3} />
          <StepIndicator stepNum={4} title="Final Step" Icon={CheckCircle} isCurrent={step === 4} />
        </div>
      </div>

      {/* STEP 1: Basic Details (Reduced Friction) */}
      {step === 1 && (
        <div className="space-y-4 transition-opacity duration-300">
          <h4 className="text-xl font-semibold text-primary border-b border-border/50 pb-2 flex items-center"><User className="h-5 w-5 mr-2" /> 1. Your Contact Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" value={formData.fullName} onChange={handleChange} onBlur={handleBlur} disabled={isLoading} className="bg-input text-foreground border-border" />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} disabled={isLoading} className="bg-input text-foreground border-border" />
            </div>
          </div>
          <Button type="button" onClick={handleNextStep} className="w-full cta-primary py-3 rounded-lg font-bold text-lg" disabled={isLoading}>
            Continue to Step 2 → <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* STEP 2: Creator Profile */}
      {step === 2 && (
        <div className="space-y-4 transition-opacity duration-300">
          <h4 className="text-xl font-semibold text-primary border-b border-border/50 pb-2 flex items-center"><Building2 className="h-5 w-5 mr-2" /> 2. Creator Profile</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Creator / Brand Name</Label>
              <Input id="companyName" value={formData.companyName} onChange={handleChange} onBlur={handleBlur} disabled={isLoading} className="bg-input text-foreground border-border" />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (for report delivery) *</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} onBlur={handleBlur} disabled={isLoading} className="bg-input text-foreground border-border" />
            </div>
          </div>
          <FormSelect
            id="companyType"
            label="Select your creator type *"
            options={BUSINESS_TYPES}
            value={formData.companyType}
            placeholder="Select creator type"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              id="businessStage"
              label="Creator Stage *"
              options={BUSINESS_STAGES}
              value={formData.businessStage}
              placeholder="Select stage"
            />
            <FormSelect
              id="entityType"
              label="Operating Structure *"
              options={ENTITY_TYPES}
              value={formData.entityType}
              placeholder="Select structure"
            />
          </div>
          <div className="flex justify-between gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isLoading} className="text-foreground border-border hover:bg-accent">
              ← Back
            </Button>
            <Button type="button" onClick={handleNextStep} className="cta-primary py-3 font-bold text-lg" disabled={isLoading}>
              Continue to Step 3 → <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Deal Risk */}
      {step === 3 && (
        <div className="space-y-4 transition-opacity duration-300">
          <h4 className="text-xl font-semibold text-primary border-b border-border/50 pb-2 flex items-center"><Scale className="h-5 w-5 mr-2" /> 3. Deal Risk</h4>
          <FormSelect
            id="hasGst"
            label="Do you usually invoice brands formally? *"
            options={YES_NO_NOTSURE}
            value={formData.hasGst}
            placeholder="Select option"
            helperText="This helps us assess how prepared your payment workflow is."
          />
          <FormSelect
            id="hasClientVendorAgreements"
            label="Do you usually work with written agreements or clear scopes? *"
            options={YES_NO}
            value={formData.hasClientVendorAgreements}
            placeholder="Select option"
            helperText="If not, the report will prioritize contract structure before escalation."
          />
          <FormSelect
            id="hasEmployeeAgreements"
            label="Do you keep approvals, chats, and deliverables in one place? *"
            options={YES_NO_NA}
            value={formData.hasEmployeeAgreements}
            placeholder="Select option"
            helperText="Weak proof trails make payment recovery much harder."
          />
          <FormSelect
            id="hasFiledAnnualReturns"
            label="Have you already had a brand delay payment, change scope, or go silent? *"
            options={YES_NO_NOTSURE}
            value={formData.hasFiledAnnualReturns}
            placeholder="Select option"
            helperText="We use this to separate prevention issues from active dispute issues."
          />
          <FormSelect
            id="debtRecoveryChallenge"
            label="Are unpaid or underpaid deals an active challenge for you? *"
            options={YES_NO}
            value={formData.debtRecoveryChallenge}
            placeholder="Select option"
          />
          <div>
            <Label htmlFor="ongoingDisputes">What is the main issue worrying you right now? (Optional)</Label>
            <Textarea
              id="ongoingDisputes"
              value={formData.ongoingDisputes}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              placeholder="Example: a brand approved work on WhatsApp but is now delaying payment, or the contract terms feel vague."
              className="bg-input text-foreground border-border min-h-[80px]"
            />
          </div>
          <div className="flex justify-between gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isLoading} className="text-foreground border-border hover:bg-accent">
              ← Back
            </Button>
            <Button type="button" onClick={handleNextStep} className="cta-primary py-3 font-bold text-lg" disabled={isLoading}>
              Continue to Step 4 → <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Final Step & Submission */}
      {step === 4 && (
        <div className="space-y-4 transition-opacity duration-300">
          <h4 className="text-xl font-semibold text-primary border-b border-border/50 pb-2 flex items-center"><CheckCircle className="h-5 w-5 mr-2" /> 4. Final Step</h4>
          <FormSelect
            id="preferredContactMethod"
            label="Preferred way to receive your risk summary *"
            options={CONTACT_METHODS}
            value={formData.preferredContactMethod}
            placeholder="Select contact method"
          />
          <FormSelect
            id="wantsConsultation"
            label="Would you like an optional 15-min call to review the result? *"
            options={YES_NO}
            value={formData.wantsConsultation}
            placeholder="Select option"
          />
          
          <div className="flex justify-between gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(3)} disabled={isLoading} className="text-foreground border-border hover:bg-accent">
              ← Back
            </Button>
            <Button type="submit" className="cta-primary py-3 rounded-lg font-bold text-lg flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Get My Risk Summary <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Tiny FAQ / Reassurance (Point 8) */}
          <div className="mt-4 p-3 bg-secondary rounded-lg text-sm space-y-1">
            <p className="text-foreground flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> ⏱️ Takes about 2 minutes</p>
            <p className="text-foreground flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 🔒 100% Confidential & Secure</p>
            <p className="text-foreground flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 💰 Completely FREE (₹0)</p>
          </div>
        </div>
      )}
    </form>
  );
};

export default LegalCheckForm;
