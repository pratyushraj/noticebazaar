import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useAddBrandDeal } from '@/lib/hooks/useBrandDeals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Calendar, DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spacing, typography, iconSizes, buttons, glass, shadows, radius, animations, gradients } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { FileUploadPreview } from '@/components/expenses/FileUploadPreview';
import { generateInvoiceNumber } from '@/lib/services/invoiceService';

const DEAL_CATEGORIES = [
  'Influencer Content',
  'UGC / Reels',
  'YouTube Video',
  'Brand Partnership',
  'Barter Deal',
  'Affiliate Deal',
  'Other'
] as const;

const PAYMENT_TERMS = [
  '30 Days Post Delivery',
  '50% Advance + 50% Post Delivery',
  'Weekly Milestones',
  'Monthly Retainer',
  'Immediate Payment',
  'Custom'
] as const;

interface FormData {
  dealTitle: string;
  dealValue: string;
  category: string;
  brandName: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  customPaymentTerms: string;
  notes: string;
  contractFile: File | null;
}

interface FormErrors {
  dealTitle?: string;
  dealValue?: string;
  category?: string;
  brandName?: string;
  deliverables?: string;
  startDate?: string;
  endDate?: string;
  paymentTerms?: string;
  customPaymentTerms?: string;
}

const CreateDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, organizationId } = useSession();
  const addDealMutation = useAddBrandDeal();

  const [formData, setFormData] = useState<FormData>({
    dealTitle: '',
    dealValue: '',
    category: '',
    brandName: '',
    deliverables: '',
    startDate: '',
    endDate: '',
    paymentTerms: '',
    customPaymentTerms: '',
    notes: '',
    contractFile: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate due date based on payment terms
  const calculatedDueDate = useMemo(() => {
    if (!formData.endDate || !formData.paymentTerms) return null;

    const endDate = new Date(formData.endDate);
    let dueDate = new Date(endDate);

    switch (formData.paymentTerms) {
      case '30 Days Post Delivery':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case '50% Advance + 50% Post Delivery':
        // Advance is immediate, second payment is 30 days after delivery
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Weekly Milestones':
        // User sets manually, so return null
        return null;
      case 'Monthly Retainer':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'Immediate Payment':
        dueDate = new Date(); // Today
        break;
      case 'Custom':
        // User sets manually
        return null;
      default:
        return null;
    }

    return dueDate.toISOString().split('T')[0];
  }, [formData.endDate, formData.paymentTerms]);

  // Calculate risk level
  const riskLevel = useMemo(() => {
    if (!formData.paymentTerms || !calculatedDueDate) return null;

    const dueDate = new Date(calculatedDueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Check for advance payment
    const hasAdvance = formData.paymentTerms.includes('Advance') || formData.paymentTerms === 'Immediate Payment';

    // High Risk: payment more than 30 days, no advance, deliverables seem unfair
    if (daysUntilDue > 30 && !hasAdvance) {
      return 'high';
    }

    // Medium Risk: payment 15-30 days, fair deliverables
    if (daysUntilDue >= 15 && daysUntilDue <= 30) {
      return 'medium';
    }

    // Low Risk: immediate payment or advance
    if (hasAdvance || daysUntilDue < 15) {
      return 'low';
    }

    return 'medium'; // Default
  }, [formData.paymentTerms, calculatedDueDate]);

  // Format amount as Indian currency
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    const cleanedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
    setFormData(prev => ({ ...prev, dealValue: cleanedValue }));
    
    // Clear error when user types
    if (errors.dealValue) {
      setErrors(prev => ({ ...prev, dealValue: undefined }));
    }
  };

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN');
  };

  const handleFieldChange = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid file (PDF, JPEG, or PNG)');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, contractFile: file }));
    } else {
      setFormData(prev => ({ ...prev, contractFile: null }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.dealTitle.trim() || formData.dealTitle.trim().length < 3) {
      newErrors.dealTitle = 'Deal title must be at least 3 characters';
    }

    if (!formData.dealValue.trim()) {
      newErrors.dealValue = 'Deal value is required';
    } else {
      const amountNum = parseFloat(formData.dealValue);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.dealValue = 'Please enter a valid amount';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.brandName.trim()) {
      newErrors.brandName = 'Brand name is required';
    }

    if (!formData.deliverables.trim()) {
      newErrors.deliverables = 'Deliverables are required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.paymentTerms) {
      newErrors.paymentTerms = 'Payment terms are required';
    }

    if (formData.paymentTerms === 'Custom' && !formData.customPaymentTerms.trim()) {
      newErrors.customPaymentTerms = 'Please specify custom payment terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot create deal.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const amountNum = parseFloat(formData.dealValue);
      
      // Generate invoice number (format: INV-YYYY-XXXXXX)
      const year = new Date().getFullYear();
      const random6 = Math.floor(100000 + Math.random() * 900000); // 6-digit random
      const invoiceNumber = `INV-${year}-${random6}`;

      // Calculate due date
      let dueDate = calculatedDueDate || formData.endDate;
      let paymentExpectedDate = dueDate;

      // If custom payment terms, use end date + 30 days as default
      if (formData.paymentTerms === 'Custom' || formData.paymentTerms === 'Weekly Milestones') {
        const endDate = new Date(formData.endDate);
        endDate.setDate(endDate.getDate() + 30);
        dueDate = endDate.toISOString().split('T')[0];
        paymentExpectedDate = dueDate;
      }

      // Create deal
      const result = await addDealMutation.mutateAsync({
        creator_id: profile.id,
        organization_id: organizationId || null,
        brand_name: formData.brandName.trim(),
        deal_amount: amountNum,
        deliverables: formData.deliverables.trim(),
        contract_file: formData.contractFile,
        due_date: dueDate,
        payment_expected_date: paymentExpectedDate,
        contact_person: null,
        platform: formData.category,
        status: 'Negotiation' as const, // Start as Negotiation
        invoice_file: null,
        utr_number: null,
        brand_email: null,
        payment_received_date: null,
      });

      // Generate success message
      toast.success('Deal created successfully!', {
        description: `${formData.brandName} deal has been added`,
      });

      // Redirect to deal detail page
      // Note: We need to get the deal ID from the mutation result
      // For now, we'll redirect to deals list and the new deal should appear
      setTimeout(() => {
        navigate('/creator-contracts');
      }, 500);
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showCustomPaymentTerms = formData.paymentTerms === 'Custom';
  const showManualDueDate = formData.paymentTerms === 'Custom' || formData.paymentTerms === 'Weekly Milestones';
  const [manualDueDate, setManualDueDate] = useState('');

  return (
    <div className={cn(
      "nb-screen-height",
      "bg-gradient-to-b from-[#2A004B] to-[#11001F]",
      spacing.page,
      "pb-24 safe-area-fix"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "max-w-3xl mx-auto",
          "bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl",
          "p-6 shadow-2xl",
          spacing.card
        )}
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(typography.h1, "mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent")}>
            Create New Deal
          </h1>
          <p className={cn(typography.body, "text-white/70")}>
            Add deal details manually for tracking & payments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deal Title */}
          <div>
            <Label htmlFor="dealTitle" className="text-white/90 mb-2 block">
              Deal Title *
            </Label>
            <Input
              id="dealTitle"
              value={formData.dealTitle}
              onChange={(e) => handleFieldChange('dealTitle', e.target.value)}
              disabled={isSubmitting}
              placeholder="Influencer Campaign with ABC Brand"
              minLength={3}
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                "transition-all duration-200",
                errors.dealTitle && "border-red-400/50 focus:border-red-400"
              )}
              required
            />
            {errors.dealTitle && (
              <p className="text-red-400 text-sm mt-1">{errors.dealTitle}</p>
            )}
          </div>

          {/* Deal Value & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dealValue" className="text-white/90 mb-2 block">
                Deal Value *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
                <div className="absolute left-9 top-1/2 -translate-y-1/2 text-white/70 text-sm z-10">
                  ₹
                </div>
                <Input
                  id="dealValue"
                  type="text"
                  inputMode="numeric"
                  value={formData.dealValue}
                  onChange={handleAmountChange}
                  disabled={isSubmitting}
                  placeholder="0"
                  className={cn(
                    "pl-12 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                    "placeholder:text-white/40 text-white",
                    "px-4 py-3",
                    "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                    "transition-all duration-200",
                    errors.dealValue && "border-red-400/50 focus:border-red-400"
                  )}
                  required
                />
              </div>
              {formData.dealValue && (
                <p className="text-xs text-white/60 mt-1">
                  {formatAmountDisplay(formData.dealValue) ? `₹${formatAmountDisplay(formData.dealValue)}` : ''}
                </p>
              )}
              {errors.dealValue && (
                <p className="text-red-400 text-sm mt-1">{errors.dealValue}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category" className="text-white/90 mb-2 block">
                Deal Category *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleFieldChange('category', value)}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger 
                  className={cn(
                    "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                    "text-white placeholder:text-white/40",
                    "px-4 py-3",
                    "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                    errors.category && "border-red-400/50 focus:border-red-400"
                  )}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white">
                  {DEAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="hover:bg-white/10">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-400 text-sm mt-1">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <Label htmlFor="brandName" className="text-white/90 mb-2 block">
              Brand Name *
            </Label>
            <Input
              id="brandName"
              value={formData.brandName}
              onChange={(e) => handleFieldChange('brandName', e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., ABC Brand"
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                "transition-all duration-200",
                errors.brandName && "border-red-400/50 focus:border-red-400"
              )}
              required
            />
            {errors.brandName && (
              <p className="text-red-400 text-sm mt-1">{errors.brandName}</p>
            )}
          </div>

          {/* Deliverables */}
          <div>
            <Label htmlFor="deliverables" className="text-white/90 mb-2 block">
              Deliverables *
            </Label>
            <Textarea
              id="deliverables"
              value={formData.deliverables}
              onChange={(e) => handleFieldChange('deliverables', e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., 1 YouTube Video&#10;2 Reels + 3 Stories&#10;1 Post + 1 Reel"
              rows={4}
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                "resize-none transition-all duration-200",
                errors.deliverables && "border-red-400/50 focus:border-red-400"
              )}
              required
            />
            {errors.deliverables && (
              <p className="text-red-400 text-sm mt-1">{errors.deliverables}</p>
            )}
          </div>

          {/* Campaign Duration */}
          <div>
            <Label className="text-white/90 mb-2 block">
              Campaign Duration *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "pl-9 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                      "text-white",
                      "px-4 py-3",
                      "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                      "transition-all duration-200",
                      errors.startDate && "border-red-400/50 focus:border-red-400"
                    )}
                    required
                  />
                </div>
                <p className="text-xs text-white/60 mt-1">Start Date</p>
                {errors.startDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    disabled={isSubmitting}
                    min={formData.startDate || undefined}
                    className={cn(
                      "pl-9 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                      "text-white",
                      "px-4 py-3",
                      "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                      "transition-all duration-200",
                      errors.endDate && "border-red-400/50 focus:border-red-400"
                    )}
                    required
                  />
                </div>
                <p className="text-xs text-white/60 mt-1">End Date</p>
                {errors.endDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms" className="text-white/90 mb-2 block">
              Payment Terms *
            </Label>
            <Select 
              value={formData.paymentTerms} 
              onValueChange={(value) => handleFieldChange('paymentTerms', value)}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger 
                className={cn(
                  "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                  "text-white placeholder:text-white/40",
                  "px-4 py-3",
                  "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                  errors.paymentTerms && "border-red-400/50 focus:border-red-400"
                )}
              >
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white">
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term} value={term} className="hover:bg-white/10">
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentTerms && (
              <p className="text-red-400 text-sm mt-1">{errors.paymentTerms}</p>
            )}

            {/* Custom Payment Terms Input */}
            <AnimatePresence>
              {showCustomPaymentTerms && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4"
                >
                  <Label htmlFor="customPaymentTerms" className="text-white/90 mb-2 block">
                    Custom Payment Terms *
                  </Label>
                  <Textarea
                    id="customPaymentTerms"
                    value={formData.customPaymentTerms}
                    onChange={(e) => handleFieldChange('customPaymentTerms', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Describe your custom payment terms..."
                    rows={2}
                    className={cn(
                      "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                      "placeholder:text-white/40 text-white",
                      "px-4 py-3",
                      "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                      "resize-none transition-all duration-200",
                      errors.customPaymentTerms && "border-red-400/50 focus:border-red-400"
                    )}
                    required={showCustomPaymentTerms}
                  />
                  {errors.customPaymentTerms && (
                    <p className="text-red-400 text-sm mt-1">{errors.customPaymentTerms}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Due Date (Auto-calculated or Manual) */}
          <div>
            <Label htmlFor="dueDate" className="text-white/90 mb-2 block">
              Due Date {showManualDueDate ? '*' : '(Auto-calculated)'}
            </Label>
            {showManualDueDate ? (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
                <Input
                  type="date"
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  disabled={isSubmitting}
                  min={formData.endDate || undefined}
                  className={cn(
                    "pl-9 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                    "text-white",
                    "px-4 py-3",
                    "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                    "transition-all duration-200"
                  )}
                  required={showManualDueDate}
                />
              </div>
            ) : (
              <Input
                type="text"
                value={calculatedDueDate ? new Date(calculatedDueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Calculate after selecting payment terms'}
                disabled
                className={cn(
                  "bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl",
                  "text-white/70",
                  "px-4 py-3",
                  "cursor-not-allowed"
                )}
              />
            )}
          </div>

          {/* Risk Level Badge */}
          {riskLevel && (
            <div>
              <Label className="text-white/90 mb-2 block">
                Risk Level (Auto-calculated)
              </Label>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                "backdrop-blur-xl border",
                riskLevel === 'low' && "bg-green-500/20 border-green-400/30 text-green-400",
                riskLevel === 'medium' && "bg-yellow-500/20 border-yellow-400/30 text-yellow-400",
                riskLevel === 'high' && "bg-red-500/20 border-red-400/30 text-red-400"
              )}>
                {riskLevel === 'low' && <CheckCircle className="w-4 h-4" />}
                {riskLevel === 'medium' && <Clock className="w-4 h-4" />}
                {riskLevel === 'high' && <AlertCircle className="w-4 h-4" />}
                <span className="font-semibold capitalize">
                  {riskLevel === 'low' ? 'Low Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-white/90 mb-2 block">
              Notes / Comments (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              disabled={isSubmitting}
              placeholder="Anything the brand told you…"
              rows={3}
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20",
                "resize-none transition-all duration-200"
              )}
            />
          </div>

          {/* Upload Contract */}
          <div>
            <Label htmlFor="contractFile" className="text-white/90 mb-2 block">
              Upload Contract (Optional)
            </Label>
            {formData.contractFile ? (
              <FileUploadPreview
                file={formData.contractFile}
                onRemove={() => setFormData(prev => ({ ...prev, contractFile: null }))}
              />
            ) : (
              <>
                <Input
                  id="contractFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className={cn(
                    "cursor-pointer bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                    "text-white file:mr-4 file:py-2 file:px-4",
                    "file:rounded-lg file:border-0 file:text-sm file:font-semibold",
                    "file:bg-white/10 file:text-white hover:file:bg-white/15",
                    "px-4 py-3",
                    "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20"
                  )}
                />
                <p className="text-xs text-white/60 mt-1">
                  PDF, JPG, or PNG (max 10MB)
                </p>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-white/10">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={animations.microTap}
              className={cn(
                "w-full bg-purple-500 text-white rounded-2xl py-4 text-lg font-semibold",
                "shadow-xl shadow-purple-900/30",
                "hover:bg-purple-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Deal...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Deal</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateDealPage;

