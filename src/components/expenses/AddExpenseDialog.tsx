import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useAddExpense } from '@/lib/hooks/useExpenses';
import { ExpenseModalWrapper } from './ExpenseModalWrapper';
import { ExpenseForm } from './ExpenseForm';
import { AnimatedSubmitButton } from './AnimatedSubmitButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const initialFormData: ExpenseFormData = {
  amount: '',
  category: '',
  description: '',
  expenseDate: new Date().toISOString().split('T')[0],
  vendorName: '',
  paymentMethod: '',
  upiId: '',
  accountLast4: '',
  cardLast4: '',
  tags: [],
  tagsInput: '',
  receiptFile: null,
};

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ 
  open, 
  onClose,
  onSuccess 
}) => {
  const { profile, organizationId } = useSession();
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const addExpenseMutation = useAddExpense();

  const validateForm = (): boolean => {
    const newErrors: ExpenseFormErrors = {};

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    }

    // Category validation
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    // Date validation
    if (!formData.expenseDate.trim()) {
      newErrors.expenseDate = 'Date is required';
    }

    // UPI ID validation (if UPI is selected)
    if (formData.paymentMethod === 'upi' && !formData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required when UPI is selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = useCallback(<K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof ExpenseFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ExpenseFormErrors];
        return newErrors;
      });
    }
  }, [errors]);

  const handleFileChange = useCallback((file: File | null) => {
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid file (JPEG, PNG, or PDF)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
    }
    setFormData(prev => ({ ...prev, receiptFile: file }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot save expense.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const amountNum = parseFloat(formData.amount);
    
    // Build payment method details
    let paymentMethodDetails: string | undefined = formData.paymentMethod;
    if (formData.paymentMethod === 'upi' && formData.upiId) {
      paymentMethodDetails = `UPI: ${formData.upiId}`;
    } else if (formData.paymentMethod === 'bank_transfer' && formData.accountLast4) {
      paymentMethodDetails = `Bank Transfer: ****${formData.accountLast4}`;
    } else if (formData.paymentMethod === 'card' && formData.cardLast4) {
      paymentMethodDetails = `Card: ****${formData.cardLast4}`;
    }

    try {
      await addExpenseMutation.mutateAsync({
        creator_id: profile.id,
        organization_id: organizationId || undefined,
        amount: amountNum,
        category: formData.category.trim(),
        description: formData.description.trim(),
        expense_date: formData.expenseDate.trim(),
        receipt_file: formData.receiptFile,
        vendor_name: formData.vendorName.trim() || undefined,
        payment_method: paymentMethodDetails || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      });

      // Reset form
      setFormData(initialFormData);
      setErrors({});
      
      // Close modal with fade-out animation
      setTimeout(() => {
        onClose();
      }, 300);

      // Show success snackbar with "View in list" button
      toast.success('Expense added successfully!', {
        description: `₹${amountNum.toLocaleString('en-IN')} expense added`,
        action: {
          label: 'View in list',
          onClick: () => {
            // Scroll to expenses section or trigger onSuccess callback
            if (onSuccess) {
              onSuccess();
            }
          },
        },
        duration: 5000,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error('Failed to add expense', { 
        description: error.message || 'Please try again.' 
      });
    }
  };

  const handleClose = useCallback(() => {
    // Reset form when closing
    setFormData(initialFormData);
    setErrors({});
    onClose();
  }, [onClose]);

  const isSubmitting = addExpenseMutation.isPending;

  return (
    <ExpenseModalWrapper
      open={open}
      onClose={handleClose}
      title="Add Expense"
      description="Track your business expenses for better financial management."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <ExpenseForm
          formData={formData}
          errors={errors}
          isSubmitting={isSubmitting}
          onFieldChange={handleFieldChange}
          onFileChange={handleFileChange}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
          <AnimatedSubmitButton isLoading={isSubmitting}>
            Add Expense
          </AnimatedSubmitButton>
          
          <Button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={cn(
              "w-full sm:w-auto",
              "text-white/70 hover:text-white/90",
              "py-3 bg-transparent border-0",
              "hover:bg-white/5 rounded-xl",
              "transition-colors duration-200"
            )}
          >
            Cancel
          </Button>
        </div>
      </form>
    </ExpenseModalWrapper>
  );
};
