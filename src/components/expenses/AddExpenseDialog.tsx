import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Upload, CalendarDays, DollarSign, Tag, CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useAddExpense } from '@/lib/hooks/useExpenses';
import { cn } from '@/lib/utils';

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  'Equipment',
  'Travel',
  'Software',
  'Marketing',
  'Office',
  'Professional Services',
  'Utilities',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Bank Transfer',
  'UPI',
  'Other'
];

export const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({ open, onClose }) => {
  const { profile, organizationId } = useSession();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [tags, setTags] = useState('');

  const addExpenseMutation = useAddExpense();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid file (JPEG, PNG, or PDF)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setReceiptFile(file);
    } else {
      setReceiptFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot save expense.');
      return;
    }

    if (!amount.trim() || !category.trim() || !expenseDate.trim()) {
      toast.error('Please fill in all required fields (Amount, Category, Date).');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      await addExpenseMutation.mutateAsync({
        creator_id: profile.id,
        organization_id: organizationId || undefined,
        amount: amountNum,
        category: category.trim(),
        description: description.trim() || undefined,
        expense_date: expenseDate.trim(),
        receipt_file: receiptFile,
        vendor_name: vendorName.trim() || undefined,
        payment_method: paymentMethod || undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined,
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      setVendorName('');
      setPaymentMethod('');
      setTags('');
      
      onClose();
    } catch (error: any) {
      toast.error('Failed to add expense', { description: error.message });
    }
  };

  const isSubmitting = addExpenseMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-2xl max-h-[90vh] overflow-y-auto",
        "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl",
        "shadow-[0_8px_40px_rgba(0,0,0,0.6)]",
        "px-6 py-6 space-y-6",
        "text-white",
        "[&>button]:hidden" // Hide default close button
      )}>
        {/* Custom close icon - top right */}
        <button
          onClick={onClose}
          className={cn(
            "absolute right-4 top-4 z-10",
            "bg-white/10 backdrop-blur-xl rounded-full p-2",
            "border border-white/10 text-white/90",
            "hover:bg-white/15 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-white/20"
          )}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-white">Add Expense</DialogTitle>
          <DialogDescription className="text-white/70">
            Track your business expenses for better financial management.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-white/90 mb-2 block">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className={cn(
                    "pl-9 bg-white/5 border border-white/10 rounded-xl",
                    "placeholder:text-white/50 text-white",
                    "px-4 py-3",
                    "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  )}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="text-white/90 mb-2 block">Category *</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting} required>
                <SelectTrigger className={cn(
                  "bg-white/5 border border-white/10 rounded-xl",
                  "text-white placeholder:text-white/50",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl text-white">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="hover:bg-white/10">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="expenseDate" className="text-white/90 mb-2 block">Date *</Label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
              <Input
                id="expenseDate"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "pl-9 bg-white/5 border border-white/10 rounded-xl",
                  "placeholder:text-white/50 text-white",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white/90 mb-2 block">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="What was this expense for?"
              rows={3}
              className={cn(
                "bg-white/5 border border-white/10 rounded-xl",
                "placeholder:text-white/50 text-white",
                "px-4 py-3",
                "focus:border-white/20 focus:ring-2 focus:ring-white/10",
                "resize-none"
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendorName" className="text-white/90 mb-2 block">Vendor/Supplier</Label>
              <Input
                id="vendorName"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., Amazon, Office Depot"
                className={cn(
                  "bg-white/5 border border-white/10 rounded-xl",
                  "placeholder:text-white/50 text-white",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod" className="text-white/90 mb-2 block">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isSubmitting}>
                <SelectTrigger className={cn(
                  "bg-white/5 border border-white/10 rounded-xl",
                  "text-white placeholder:text-white/50",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl text-white">
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method.toLowerCase().replace(' ', '_')} className="hover:bg-white/10">
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags" className="text-white/90 mb-2 block">Tags (comma-separated)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 z-10" />
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g., tax-deductible, equipment, travel"
                className={cn(
                  "pl-9 bg-white/5 border border-white/10 rounded-xl",
                  "placeholder:text-white/50 text-white",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              />
            </div>
            <p className="text-xs text-white/60 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div>
            <Label htmlFor="receiptFile" className="text-white/90 mb-2 block">Receipt (Optional)</Label>
            <div className="mt-2">
              <Input
                id="receiptFile"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className={cn(
                  "cursor-pointer bg-white/5 border border-white/10 rounded-xl",
                  "text-white file:mr-4 file:py-2 file:px-4",
                  "file:rounded-lg file:border-0 file:text-sm file:font-semibold",
                  "file:bg-white/10 file:text-white hover:file:bg-white/15",
                  "px-4 py-3",
                  "focus:border-white/20 focus:ring-2 focus:ring-white/10"
                )}
              />
              {receiptFile && (
                <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                  <Upload className="h-3 w-3" /> Selected: {receiptFile.name}
                </div>
              )}
            </div>
            <p className="text-xs text-white/60 mt-1">
              Upload receipt image or PDF (max 5MB)
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            {/* Primary action first */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full sm:w-auto",
                "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]",
                "text-white font-semibold rounded-xl py-3",
                "shadow-[0_0_20px_rgba(139,92,246,0.4)]",
                "hover:from-[#7C3AED] hover:to-[#6D28D9]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
            {/* Secondary cancel second */}
            <Button
              type="button"
              onClick={onClose}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

