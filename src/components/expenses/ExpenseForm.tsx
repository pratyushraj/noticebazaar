import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CalendarDays, FileText, Building2 } from 'lucide-react';
import { CategoryDropdown } from './CategoryDropdown';
import { MethodDropdown } from './MethodDropdown';
import { ChipInput } from './ChipInput';
import { FileUploadPreview } from './FileUploadPreview';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ExpenseFormData {
  amount: string;
  category: string;
  description: string;
  expenseDate: string;
  vendorName: string;
  paymentMethod: string;
  upiId: string;
  accountLast4: string;
  cardLast4: string;
  tags: string[];
  tagsInput: string;
  receiptFile: File | null;
}

interface ExpenseFormErrors {
  amount?: string;
  category?: string;
  description?: string;
  expenseDate?: string;
  upiId?: string;
}

interface ExpenseFormProps {
  formData: ExpenseFormData;
  errors: ExpenseFormErrors;
  isSubmitting: boolean;
  onFieldChange: <K extends keyof ExpenseFormData>(field: K, value: ExpenseFormData[K]) => void;
  onFileChange: (file: File | null) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onFileChange,
}) => {
  // Format amount as Indian currency while typing
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const cleanedValue = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : numericValue;
    
    onFieldChange('amount', cleanedValue);
  };

  // Format amount display with Indian currency format
  const formatAmountDisplay = (value: string): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return numValue.toLocaleString('en-IN');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        return; // Error will be shown via toast
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return; // Error will be shown via toast
      }
      
      onFileChange(file);
    } else {
      onFileChange(null);
    }
  };

  const showUpiField = formData.paymentMethod === 'upi';
  const showAccountField = formData.paymentMethod === 'bank_transfer';
  const showCardField = formData.paymentMethod === 'card';

  return (
    <form className="space-y-6">
      {/* Amount */}
      <div>
        <Label htmlFor="amount" className="text-white/90 mb-2 block">
          Amount *
        </Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
          <div className="absolute left-9 top-1/2 -translate-y-1/2 text-white/70 text-sm z-10">
            ₹
          </div>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            value={formData.amount}
            onChange={handleAmountChange}
            disabled={isSubmitting}
            placeholder="0"
            className={cn(
              "pl-12 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
              "placeholder:text-white/40 text-white",
              "px-4 py-3",
              "focus:border-white/30 focus:ring-2 focus:ring-white/20",
              errors.amount && "border-red-400/50 focus:border-red-400"
            )}
            required
          />
        </div>
        {formData.amount && (
          <p className="text-xs text-white/60 mt-1">
            {formatAmountDisplay(formData.amount) ? `₹${formatAmountDisplay(formData.amount)}` : ''}
          </p>
        )}
        {errors.amount && (
          <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category" className="text-white/90 mb-2 block">
          Category *
        </Label>
        <CategoryDropdown
          value={formData.category}
          onValueChange={(value) => onFieldChange('category', value)}
          disabled={isSubmitting}
          error={errors.category}
        />
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="expenseDate" className="text-white/90 mb-2 block">
          Date *
        </Label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
          <Input
            id="expenseDate"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => onFieldChange('expenseDate', e.target.value)}
            disabled={isSubmitting}
            className={cn(
              "pl-9 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
              "placeholder:text-white/40 text-white",
              "px-4 py-3",
              "focus:border-white/30 focus:ring-2 focus:ring-white/20",
              errors.expenseDate && "border-red-400/50 focus:border-red-400"
            )}
            required
          />
        </div>
        {errors.expenseDate && (
          <p className="text-red-400 text-sm mt-1">{errors.expenseDate}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-white/90 mb-2 block">
          Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          disabled={isSubmitting}
          placeholder="What was this expense for?"
          rows={3}
          minLength={5}
          className={cn(
            "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
            "placeholder:text-white/40 text-white",
            "px-4 py-3",
            "focus:border-white/30 focus:ring-2 focus:ring-white/20",
            "resize-none",
            errors.description && "border-red-400/50 focus:border-red-400"
          )}
          required
        />
        {errors.description && (
          <p className="text-red-400 text-sm mt-1">{errors.description}</p>
        )}
        {formData.description && formData.description.length < 5 && (
          <p className="text-xs text-white/60 mt-1">
            Minimum 5 characters required ({formData.description.length}/5)
          </p>
        )}
      </div>

      {/* Vendor */}
      <div>
        <Label htmlFor="vendorName" className="text-white/90 mb-2 block">
          Vendor/Supplier
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
          <Input
            id="vendorName"
            value={formData.vendorName}
            onChange={(e) => onFieldChange('vendorName', e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Amazon, Office Depot"
            className={cn(
              "pl-9 bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
              "placeholder:text-white/40 text-white",
              "px-4 py-3",
              "focus:border-white/30 focus:ring-2 focus:ring-white/20"
            )}
          />
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <Label htmlFor="paymentMethod" className="text-white/90 mb-2 block">
          Payment Method
        </Label>
        <MethodDropdown
          value={formData.paymentMethod}
          onValueChange={(value) => onFieldChange('paymentMethod', value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Conditional Fields */}
      <AnimatePresence>
        {showUpiField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="upiId" className="text-white/90 mb-2 block">
              UPI ID *
            </Label>
            <Input
              id="upiId"
              value={formData.upiId}
              onChange={(e) => onFieldChange('upiId', e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., yourname@paytm"
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-white/30 focus:ring-2 focus:ring-white/20",
                errors.upiId && "border-red-400/50 focus:border-red-400"
              )}
              required={showUpiField}
            />
            {errors.upiId && (
              <p className="text-red-400 text-sm mt-1">{errors.upiId}</p>
            )}
          </motion.div>
        )}

        {showAccountField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="accountLast4" className="text-white/90 mb-2 block">
              Last 4 digits of account (Optional)
            </Label>
            <Input
              id="accountLast4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={formData.accountLast4}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                onFieldChange('accountLast4', value);
              }}
              disabled={isSubmitting}
              placeholder="1234"
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-white/30 focus:ring-2 focus:ring-white/20"
              )}
            />
          </motion.div>
        )}

        {showCardField && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="cardLast4" className="text-white/90 mb-2 block">
              Last 4 digits of card (Optional)
            </Label>
            <Input
              id="cardLast4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={formData.cardLast4}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                onFieldChange('cardLast4', value);
              }}
              disabled={isSubmitting}
              placeholder="1234"
              className={cn(
                "bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "placeholder:text-white/40 text-white",
                "px-4 py-3",
                "focus:border-white/30 focus:ring-2 focus:ring-white/20"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tags */}
      <div>
        <Label htmlFor="tags" className="text-white/90 mb-2 block">
          Tags
        </Label>
        <ChipInput
          value={formData.tagsInput || ''}
          chips={formData.tags}
          onChange={(value) => onFieldChange('tagsInput', value)}
          onChipsChange={(chips) => {
            onFieldChange('tags', chips);
            onFieldChange('tagsInput', ''); // Clear input after adding chips
          }}
          disabled={isSubmitting}
          placeholder="e.g., tax, equipment, travel"
        />
      </div>

      {/* Receipt Upload */}
      <div>
        <Label htmlFor="receiptFile" className="text-white/90 mb-2 block">
          Receipt (Optional)
        </Label>
        {formData.receiptFile ? (
          <FileUploadPreview
            file={formData.receiptFile}
            onRemove={() => onFileChange(null)}
          />
        ) : (
          <>
            <Input
              id="receiptFile"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className={cn(
                "cursor-pointer bg-white/10 border border-white/20 rounded-xl backdrop-blur-xl",
                "text-white file:mr-4 file:py-2 file:px-4",
                "file:rounded-lg file:border-0 file:text-sm file:font-semibold",
                "file:bg-white/10 file:text-white hover:file:bg-white/15",
                "px-4 py-3",
                "focus:border-white/30 focus:ring-2 focus:ring-white/20"
              )}
            />
            <p className="text-xs text-white/60 mt-1">
              Upload receipt image or PDF (max 5MB)
            </p>
          </>
        )}
      </div>
    </form>
  );
};

