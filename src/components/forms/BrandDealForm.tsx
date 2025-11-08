import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, CalendarDays, DollarSign, User, Globe, Mail, ReceiptText } from 'lucide-react'; // Added Mail and ReceiptText icons
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import { useAddBrandDeal, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { BrandDeal } from '@/types';

interface BrandDealFormProps {
  initialData?: BrandDeal | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const PLATFORM_OPTIONS = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'LinkedIn', 'Twitter', 'Other'];
const DEAL_STATUS_OPTIONS = ['Drafting', 'Approved', 'Payment Pending', 'Completed', 'Cancelled'];

const BrandDealForm = ({ initialData, onSaveSuccess, onClose }: BrandDealFormProps) => {
  const { profile } = useSession();
  const [brandName, setBrandName] = useState(initialData?.brand_name || '');
  const [dealAmount, setDealAmount] = useState(initialData?.deal_amount?.toString() || '');
  const [deliverables, setDeliverables] = useState(initialData?.deliverables || '');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [existingContractFileUrl, setExistingContractFileUrl] = useState(initialData?.contract_file_url || null);
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [paymentExpectedDate, setPaymentExpectedDate] = useState(initialData?.payment_expected_date || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contact_person || '');
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [status, setStatus] = useState<BrandDeal['status']>(initialData?.status || 'Drafting');
  const [brandEmail, setBrandEmail] = useState(initialData?.brand_email || ''); // New state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null); // New state
  const [existingInvoiceFileUrl, setExistingInvoiceFileUrl] = useState(initialData?.invoice_file_url || null); // New state
  const [utrNumber, setUtrNumber] = useState(initialData?.utr_number || ''); // New state
  const [paymentReceivedDate, setPaymentReceivedDate] = useState(initialData?.payment_received_date || ''); // New state

  const addBrandDealMutation = useAddBrandDeal();
  const updateBrandDealMutation = useUpdateBrandDeal();

  useEffect(() => {
    if (initialData) {
      setBrandName(initialData.brand_name);
      setDealAmount(initialData.deal_amount?.toString() || '');
      setDeliverables(initialData.deliverables || '');
      setExistingContractFileUrl(initialData.contract_file_url || null);
      // Ensure date strings are correctly formatted for input type="date"
      setDueDate(initialData.due_date.split('T')[0]);
      setPaymentExpectedDate(initialData.payment_expected_date.split('T')[0]);
      setContactPerson(initialData.contact_person || '');
      setPlatform(initialData.platform || '');
      setStatus(initialData.status);
      setBrandEmail(initialData.brand_email || ''); // Set new state
      setExistingInvoiceFileUrl(initialData.invoice_file_url || null); // Set new state
      setUtrNumber(initialData.utr_number || ''); // Set new state
      setPaymentReceivedDate(initialData.payment_received_date ? initialData.payment_received_date.split('T')[0] : ''); // Set new state
    } else {
      // Reset form for new entry
      setBrandName('');
      setDealAmount('');
      setDeliverables('');
      setContractFile(null);
      setExistingContractFileUrl(null);
      setDueDate('');
      setPaymentExpectedDate('');
      setContactPerson('');
      setPlatform('');
      setStatus('Drafting');
      setBrandEmail(''); // Reset new state
      setInvoiceFile(null); // Reset new state
      setExistingInvoiceFileUrl(null); // Reset new state
      setUtrNumber(''); // Reset new state
      setPaymentReceivedDate(''); // Reset new state
    }
  }, [initialData]);

  const handleContractFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setContractFile(event.target.files[0]);
    } else {
      setContractFile(null);
    }
  };

  const handleInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setInvoiceFile(event.target.files[0]);
    } else {
      setInvoiceFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Creator profile not found. Cannot save brand deal.');
      return;
    }

    // Explicitly check for required fields, including dates
    if (!brandName.trim() || !dealAmount.trim() || !deliverables.trim() || !dueDate.trim() || !paymentExpectedDate.trim()) {
      toast.error('Please fill in all required fields (Brand Name, Amount, Deliverables, Due Date, Payment Expected Date).');
      return;
    }

    const dealAmountNum = parseFloat(dealAmount);
    if (isNaN(dealAmountNum) || dealAmountNum <= 0) {
      toast.error('Please enter a valid deal amount.');
      return;
    }

    // Ensure dates are sent as ISO strings (YYYY-MM-DD is sufficient for Supabase date type)
    const finalDueDate = dueDate.trim();
    const finalPaymentExpectedDate = paymentExpectedDate.trim();
    const finalPaymentReceivedDate = paymentReceivedDate.trim() || null;

    try {
      if (initialData) {
        // Update existing brand deal
        await updateBrandDealMutation.mutateAsync({
          id: initialData.id,
          creator_id: profile.id,
          brand_name: brandName.trim(),
          deal_amount: dealAmountNum,
          deliverables: deliverables.trim(),
          contract_file: contractFile,
          original_contract_file_url: existingContractFileUrl,
          due_date: finalDueDate,
          payment_expected_date: finalPaymentExpectedDate,
          contact_person: contactPerson.trim() || null,
          platform: platform || null,
          status: status,
          brand_email: brandEmail.trim() || null, // New field
          invoice_file: invoiceFile, // New field
          original_invoice_file_url: existingInvoiceFileUrl, // New field
          utr_number: utrNumber.trim() || null, // New field
          payment_received_date: finalPaymentReceivedDate, // New field
        });
        toast.success('Brand deal updated successfully!');
      } else {
        // Add new brand deal
        await addBrandDealMutation.mutateAsync({
          creator_id: profile.id,
          brand_name: brandName.trim(),
          deal_amount: dealAmountNum,
          deliverables: deliverables.trim(),
          contract_file: contractFile,
          due_date: finalDueDate,
          payment_expected_date: finalPaymentExpectedDate,
          contact_person: contactPerson.trim() || null,
          platform: platform || null,
          status: status,
          brand_email: brandEmail.trim() || null, // New field
          invoice_file: invoiceFile, // New field
          utr_number: utrNumber.trim() || null, // New field
          payment_received_date: finalPaymentReceivedDate, // New field
        });
        toast.success('Brand deal added successfully!');
      }
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to save brand deal', { description: error.message });
    }
  };

  const isSubmitting = addBrandDealMutation.isPending || updateBrandDealMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="brandName">Brand Name *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Nike, Coca-Cola"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="brandEmail">Brand Email (Optional)</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="brandEmail"
            type="email"
            value={brandEmail}
            onChange={(e) => setBrandEmail(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., contact@brand.com"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="dealAmount">Deal Amount (₹) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="dealAmount"
            type="number"
            value={dealAmount}
            onChange={(e) => setDealAmount(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., 50000"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="deliverables">Deliverables *</Label>
        <Textarea
          id="deliverables"
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          disabled={isSubmitting}
          placeholder="e.g., 1 Instagram Reel, 2 Stories, 1 YouTube Video"
        />
      </div>
      <div>
        <Label htmlFor="contractFile">Contract File (Optional)</Label>
        <Input
          id="contractFile"
          type="file"
          onChange={handleContractFileChange}
          disabled={isSubmitting}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" // Specify accepted file types
        />
        <p className="text-xs text-muted-foreground mt-1">Accepted formats: PDF, DOC, DOCX, PNG, JPG, JPEG (for screenshots/email agreements).</p>
        {existingContractFileUrl && !contractFile && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <FileText className="h-3 w-3 mr-1" /> Existing file: <a href={existingContractFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">View Contract</a>
          </p>
        )}
        {contractFile && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Upload className="h-3 w-3 mr-1" /> New file selected: {contractFile.name}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dueDate">Deliverable Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="paymentExpectedDate">Payment Expected Date *</Label>
          <Input
            id="paymentExpectedDate"
            type="date"
            value={paymentExpectedDate}
            onChange={(e) => setPaymentExpectedDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="contactPerson">Contact Person (Optional)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="contactPerson"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g., Jane Doe (Brand Manager)"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="platform">Platform (Optional)</Label>
        <Select onValueChange={setPlatform} value={platform} disabled={isSubmitting}>
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 border-t border-border pt-4 mt-4">
        <h3 className="text-lg font-semibold text-foreground">Payment Details</h3>
        <div>
          <Label htmlFor="utrNumber">UTR Number (Optional)</Label>
          <div className="relative">
            <ReceiptText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="utrNumber"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g., 1234567890ABC"
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="invoiceFile">Invoice File (Optional)</Label>
          <Input
            id="invoiceFile"
            type="file"
            onChange={handleInvoiceFileChange}
            disabled={isSubmitting}
          />
          {existingInvoiceFileUrl && !invoiceFile && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <FileText className="h-3 w-3 mr-1" /> Existing file: <a href={existingInvoiceFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">View Invoice</a>
            </p>
          )}
          {invoiceFile && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Upload className="h-3 w-3 mr-1" /> New file selected: {invoiceFile.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="paymentReceivedDate">Payment Received Date (Optional)</Label>
          <Input
            id="paymentReceivedDate"
            type="date"
            value={paymentReceivedDate}
            onChange={(e) => setPaymentReceivedDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select onValueChange={(value: BrandDeal['status']) => setStatus(value)} value={status} disabled={isSubmitting}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {DEAL_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !brandName.trim() || !dealAmount.trim() || !deliverables.trim() || !dueDate.trim() || !paymentExpectedDate.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            initialData ? 'Save Changes' : 'Add Brand Deal'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default BrandDealForm;