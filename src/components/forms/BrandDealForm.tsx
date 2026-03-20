import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, CalendarDays, DollarSign, User, Globe, Mail, ReceiptText, X, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useAddBrandDeal, useUpdateBrandDeal } from '@/lib/hooks/useBrandDeals';
import { BrandDeal } from '@/types';
import { openContractFile } from '@/lib/utils';

interface BrandDealFormProps {
  initialData?: BrandDeal | null;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const PLATFORM_OPTIONS = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'LinkedIn', 'Twitter', 'Other'];
const DEAL_STATUS_OPTIONS = ['Negotiation', 'Signed', 'Content Making', 'Content Delivered', 'Completed', 'Cancelled'];

// Reusable Components - Purple Theme
const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-5 bg-gradient-to-br from-purple-700/30 via-purple-800/20 to-purple-900/10 border border-purple-400/15 shadow-inner shadow-black/20 ${className}`}>
    {children}
  </div>
);

const FormInput = ({ 
  id, 
  label, 
  icon: Icon, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  disabled = false,
  required = false 
}: {
  id: string;
  label: string;
  icon?: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}) => (
  <div>
    <Label htmlFor={id} className="text-purple-200/80 text-[13px] font-medium mb-1 block">
      {label} {required && <span className="text-purple-300">*</span>}
    </Label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-200/60 pointer-events-none" />
      )}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`h-12 px-4 ${Icon ? 'pl-10' : 'pl-4'} pr-4 rounded-xl w-full bg-white/5 border border-purple-300/20 text-white placeholder:text-purple-200/40 shadow-inner shadow-black/30 focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 ${type === 'date' ? '[color-scheme:dark]' : ''}`}
      />
    </div>
  </div>
);

const FormTextarea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) => (
  <div>
    <Label htmlFor={id} className="text-purple-200/80 text-[13px] font-medium mb-1 block">
      {label} {required && <span className="text-purple-300">*</span>}
    </Label>
    <Textarea
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="min-h-[100px] text-sm px-4 py-3 rounded-xl w-full bg-white/5 border border-purple-300/20 text-white placeholder:text-purple-200/40 shadow-inner shadow-black/30 focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200 resize-none"
    />
  </div>
);

const FileUploader = ({
  id,
  label,
  file,
  existingFileUrl,
  onChange,
  onRemove,
  accept,
  disabled = false,
  fileType = 'contract'
}: {
  id: string;
  label: string;
  file: File | null;
  existingFileUrl: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  accept: string;
  disabled?: boolean;
  fileType?: 'contract' | 'invoice';
}) => (
  <div>
    {label && (
      <Label htmlFor={id} className="text-purple-200/80 text-[13px] font-medium mb-1 block">
        {label}
      </Label>
    )}
    {existingFileUrl && !file && (
      <div className="mb-2 flex items-center gap-2 text-xs text-purple-200/70">
        <FileText className="h-4 w-4" />
        <span>Existing File:</span>
        <button
          type="button"
          onClick={() => openContractFile(existingFileUrl)}
          className="text-purple-300 hover:text-purple-200 underline transition-colors"
        >
          View {fileType === 'contract' ? 'Contract' : 'Invoice'}
        </button>
      </div>
    )}
    {file && (
      <div className="mb-2 flex items-center gap-2 text-xs text-purple-200/70 bg-purple-900/20 rounded-lg p-2 border border-purple-400/10">
        <FileText className="h-4 w-4" />
        <span className="flex-1 truncate">{file.name}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-purple-200/50 hover:text-purple-200/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )}
    <label
      htmlFor={id}
      className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-purple-300/20 bg-white/5 text-purple-200/80 hover:bg-purple-900/30 hover:text-purple-100 hover:border-purple-400/30 transition-all duration-200 cursor-pointer text-sm font-medium shadow-inner shadow-black/20"
    >
      <Upload className="h-5 w-5" />
      {file ? 'Change File' : 'Upload File'}
    </label>
    <Input
      id={id}
      type="file"
      onChange={onChange}
      disabled={disabled}
      accept={accept}
      className="hidden"
    />
  </div>
);

const FormSelect = ({
  id,
  label,
  icon: Icon,
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
  required = false
}: {
  id: string;
  label: string;
  icon?: React.ElementType;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}) => (
  <div>
    <Label htmlFor={id} className="text-purple-200/80 text-[13px] font-medium mb-1 block">
      {label} {required && <span className="text-purple-300">*</span>}
    </Label>
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger
        id={id}
        className="h-12 px-4 rounded-xl w-full bg-white/5 border border-purple-300/20 text-white shadow-inner shadow-black/30 focus:border-purple-400/40 focus:ring-2 focus:ring-purple-400/30 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-purple-200/60" />}
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-b from-purple-900/95 to-purple-800/95 border-purple-400/20 backdrop-blur-xl">
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-white hover:bg-purple-700/30 focus:bg-purple-700/30">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const StickyFooter = ({ 
  onCancel, 
  onSubmit, 
  isSubmitting, 
  isValid,
  submitLabel = 'Save Changes'
}: {
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isValid: boolean;
  submitLabel?: string;
}) => (
  <div 
    className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#2d0055]/95 to-[#3a0079]/40 backdrop-blur-2xl border-t border-purple-300/20 p-4 space-y-3 rounded-b-2xl"
    style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
  >
    <Button
      type="button"
      onClick={onCancel}
      disabled={isSubmitting}
      className="w-full h-12 rounded-xl bg-purple-900/40 text-purple-200 border border-purple-300/20 hover:bg-purple-900/50 transition-all duration-200"
    >
      Cancel
    </Button>
    <Button
      type="submit"
      onClick={onSubmit}
      disabled={isSubmitting || !isValid}
      className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg shadow-purple-600/40 hover:opacity-90 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        submitLabel
      )}
    </Button>
  </div>
);

const BrandDealForm = ({ initialData, onSaveSuccess, onClose }: BrandDealFormProps) => {
  const { profile, organizationId } = useSession();
  const [brandName, setBrandName] = useState(initialData?.brand_name || '');
  const [dealAmount, setDealAmount] = useState(initialData?.deal_amount?.toString() || '');
  const [deliverables, setDeliverables] = useState(initialData?.deliverables || '');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [existingContractFileUrl, setExistingContractFileUrl] = useState(initialData?.contract_file_url || null);
  const [dueDate, setDueDate] = useState(initialData?.due_date || '');
  const [paymentExpectedDate, setPaymentExpectedDate] = useState(initialData?.payment_expected_date || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contact_person || '');
  const [platform, setPlatform] = useState(initialData?.platform || '');
  const [status, setStatus] = useState<BrandDeal['status']>(initialData?.status || 'Negotiation');
  const [brandEmail, setBrandEmail] = useState(initialData?.brand_email || '');
  const [brandPhone, setBrandPhone] = useState(initialData?.brand_phone || '');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [existingInvoiceFileUrl, setExistingInvoiceFileUrl] = useState(initialData?.invoice_file_url || null);
  const [utrNumber, setUtrNumber] = useState(initialData?.utr_number || '');
  const [paymentReceivedDate, setPaymentReceivedDate] = useState(initialData?.payment_received_date || '');

  const addBrandDealMutation = useAddBrandDeal();
  const updateBrandDealMutation = useUpdateBrandDeal();

  useEffect(() => {
    if (initialData) {
      setBrandName(initialData.brand_name);
      setDealAmount(initialData.deal_amount?.toString() || '');
      setDeliverables(initialData.deliverables || '');
      setExistingContractFileUrl(initialData.contract_file_url || null);
      setDueDate(initialData.due_date ? initialData.due_date.split('T')[0] : '');
      setPaymentExpectedDate(initialData.payment_expected_date ? initialData.payment_expected_date.split('T')[0] : '');
      setContactPerson(initialData.contact_person || '');
      setPlatform(initialData.platform || '');
      setStatus(initialData.status);
      setBrandEmail(initialData.brand_email || '');
      setBrandPhone(initialData.brand_phone || '');
      setExistingInvoiceFileUrl(initialData.invoice_file_url || null);
      setUtrNumber(initialData.utr_number || '');
      setPaymentReceivedDate(initialData.payment_received_date ? initialData.payment_received_date.split('T')[0] : '');
    } else {
      setBrandName('');
      setDealAmount('');
      setDeliverables('');
      setContractFile(null);
      setExistingContractFileUrl(null);
      setDueDate('');
      setPaymentExpectedDate('');
      setContactPerson('');
      setPlatform('');
      setStatus('Negotiation');
      setBrandEmail('');
      setInvoiceFile(null);
      setExistingInvoiceFileUrl(null);
      setUtrNumber('');
      setPaymentReceivedDate('');
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

    if (!profile?.id || !organizationId) {
      toast.error('Creator profile or organization ID not found. Cannot save brand deal.');
      return;
    }

    if (!brandName.trim() || !dealAmount.trim() || !deliverables.trim() || !dueDate.trim() || !paymentExpectedDate.trim()) {
      toast.error('Please fill in all required fields (Brand Name, Amount, Deliverables, Due Date, Payment Expected Date).');
      return;
    }

    const dealAmountNum = parseFloat(dealAmount);
    if (isNaN(dealAmountNum) || dealAmountNum <= 0) {
      toast.error('Please enter a valid deal amount.');
      return;
    }

    const finalDueDate = dueDate.trim();
    const finalPaymentExpectedDate = paymentExpectedDate.trim();
    const finalPaymentReceivedDate = paymentReceivedDate.trim() || null;

    const basePayload = {
      creator_id: profile.id,
      organization_id: organizationId,
      brand_name: brandName.trim(),
      deal_amount: dealAmountNum,
      deliverables: deliverables.trim(),
      due_date: finalDueDate,
      payment_expected_date: finalPaymentExpectedDate,
      contact_person: contactPerson.trim() || null,
      platform: platform || null,
      status: status,
      brand_email: brandEmail.trim() || null,
      brand_phone: brandPhone.trim() || null,
      utr_number: utrNumber.trim() || null,
      payment_received_date: finalPaymentReceivedDate,
    };

    try {
      if (initialData) {
        await updateBrandDealMutation.mutateAsync({
          id: initialData.id,
          contract_file: contractFile,
          original_contract_file_url: existingContractFileUrl,
          invoice_file: invoiceFile,
          original_invoice_file_url: existingInvoiceFileUrl,
          ...basePayload,
        });
        toast.success('Brand deal updated successfully!');
      } else {
        await addBrandDealMutation.mutateAsync({
          contract_file: contractFile,
          invoice_file: invoiceFile,
          ...basePayload,
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
  const isValid = !!(brandName.trim() && dealAmount.trim() && deliverables.trim() && dueDate.trim() && paymentExpectedDate.trim());

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto scroll-smooth px-5 pt-6 pb-28"
        style={{ 
          paddingBottom: 'max(112px, calc(112px + env(safe-area-inset-bottom, 0px)))' 
        }}
      >
        <div className="space-y-8">
          {/* 1. Deal Info */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Deal Info</h3>
            <div className="space-y-4">
              <FormInput
                id="brandName"
                label="Brand Name"
                icon={User}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Nike, Coca-Cola"
                disabled={isSubmitting}
                required
              />
              <FormInput
                id="brandEmail"
                label="Brand Email"
                icon={Mail}
                value={brandEmail}
                onChange={(e) => setBrandEmail(e.target.value)}
                placeholder="e.g., contact@brand.com"
                type="email"
                disabled={isSubmitting}
              />
              <FormInput
                id="dealAmount"
                label="Deal Amount (₹)"
                icon={DollarSign}
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                placeholder="e.g., 50000"
                type="number"
                disabled={isSubmitting}
                required
              />
            </div>
          </SectionCard>

          {/* 2. Contract File */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Contract File</h3>
            <FileUploader
              id="contractFile"
              label=""
              file={contractFile}
              existingFileUrl={existingContractFileUrl}
              onChange={handleContractFileChange}
              onRemove={() => setContractFile(null)}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              disabled={isSubmitting}
              fileType="contract"
            />
          </SectionCard>

          {/* 3. Deliverables */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Deliverables</h3>
            <FormTextarea
              id="deliverables"
              label=""
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g., 1 Instagram Reel, 2 Stories, 1 YouTube Video"
              disabled={isSubmitting}
              required
            />
          </SectionCard>

          {/* 4. Key Dates */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Key Dates</h3>
            <div className="space-y-4">
              <FormInput
                id="dueDate"
                label="Deliverable Due Date"
                icon={CalendarDays}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                type="date"
                disabled={isSubmitting}
                required
              />
              <FormInput
                id="paymentExpectedDate"
                label="Payment Expected Date"
                icon={CalendarDays}
                value={paymentExpectedDate}
                onChange={(e) => setPaymentExpectedDate(e.target.value)}
                type="date"
                disabled={isSubmitting}
                required
              />
            </div>
          </SectionCard>

          {/* 5. Payment Details */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Payment Details</h3>
            <div className="space-y-4">
              <FormSelect
                id="platform"
                label="Platform"
                icon={Globe}
                value={platform}
                onValueChange={setPlatform}
                options={PLATFORM_OPTIONS}
                placeholder="Select platform"
                disabled={isSubmitting}
              />
              <FormInput
                id="contactPerson"
                label="Contact Person"
                icon={User}
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g., Jane Doe (Brand Manager)"
                disabled={isSubmitting}
              />
              <FileUploader
                id="invoiceFile"
                label="Invoice File"
                file={invoiceFile}
                existingFileUrl={existingInvoiceFileUrl}
                onChange={handleInvoiceFileChange}
                onRemove={() => setInvoiceFile(null)}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                disabled={isSubmitting}
                fileType="invoice"
              />
              <FormInput
                id="utrNumber"
                label="UTR Number"
                icon={ReceiptText}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g., 1234567890ABC"
                disabled={isSubmitting}
              />
              <FormInput
                id="paymentReceivedDate"
                label="Payment Received Date"
                icon={CalendarDays}
                value={paymentReceivedDate}
                onChange={(e) => setPaymentReceivedDate(e.target.value)}
                type="date"
                disabled={isSubmitting}
              />
            </div>
          </SectionCard>

          {/* 6. Status */}
          <SectionCard>
            <h3 className="text-white font-semibold text-[17px] tracking-wide mb-4">Status</h3>
            <FormSelect
              id="status"
              label=""
              value={status}
              onValueChange={(value: BrandDeal['status']) => setStatus(value)}
              options={DEAL_STATUS_OPTIONS}
              placeholder="Select status"
              disabled={isSubmitting}
              required
            />
          </SectionCard>
        </div>
      </div>

      {/* Sticky Footer */}
      <StickyFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        isValid={isValid}
        submitLabel={initialData ? 'Save Changes' : 'Add Brand Deal'}
      />
    </form>
  );
};

export default BrandDealForm;
