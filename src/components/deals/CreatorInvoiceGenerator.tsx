import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, AlertCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface InvoiceGeneratorProps {
    deal: any;
    isOpen: boolean;
    onClose: () => void;
}

export const InvoiceGeneratorModal: React.FC<InvoiceGeneratorProps> = ({ deal, isOpen, onClose }) => {
    const { profile } = useSession();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!deal || !profile) return null;

    const dealAmount = deal.deal_amount || 0;

    // Use creator's tax settings, or default to standard rates
    const creatorTdsRate = deal.creator_tds_rate || 0.10; // Default 10%
    const hasGst = !!profile.gstin || !!profile.gst_number;
    const gstRate = hasGst ? 0.18 : 0; // 18% GST if registered

    const gstAmount = Math.round(dealAmount * gstRate);
    const totalAmount = dealAmount + gstAmount;
    const tdsAmount = Math.round(dealAmount * creatorTdsRate);
    const netPayable = totalAmount - tdsAmount;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${deal.id?.substring(0, 6).toUpperCase() || '001'}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    // Extract Deliverables nicely
    const parseDeliverables = (d: any): string[] => {
        if (!d) return ['Deliverables as per agreement'];
        if (typeof d === 'string') {
            try {
                const parsed = JSON.parse(d);
                if (Array.isArray(parsed)) return parsed.map(item => typeof item === 'string' ? item : item.title || item.name || JSON.stringify(item));
            } catch (e) {
                return d.split('\n').filter(Boolean);
            }
        }
        if (Array.isArray(d)) {
            return d.map(item => item?.title || item?.name || item);
        }
        return ['Deliverables as per agreement'];
    };

    const deliverablesList = parseDeliverables(deal.deliverables);
    const brandName = deal.brand_name || 'Brand Partner';

    const handlePrint = () => {
        setIsGenerating(true);
        setTimeout(() => {
            // In a real app, you might use html2pdf or jspdf here.
            // For best cross-browser support, we print the specific div content
            const printContents = invoiceRef.current?.innerHTML;
            if (printContents) {
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = printContents;
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload(); // Quick hack to restore React state cleanly
            }
            setIsGenerating(false);
            onClose();
        }, 500);
    };

    const isMissingTaxInfo = !profile.pan && !profile.pan_number;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl bg-background border border-border text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        Auto-Generated Compliant Invoice
                    </DialogTitle>
                    <DialogDescription className="text-foreground/60">
                        Preview the invoice before generating the PDF. This format is fully compliant for Indian brand deals.
                    </DialogDescription>
                </DialogHeader>

                {isMissingTaxInfo && (
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-warning">Missing Tax Information</h4>
                            <p className="text-xs text-warning/80 mt-1">
                                You haven't added your PAN number. Brands require a PAN to process payments and deduct TDS (10%). Please update your Profile settings.
                            </p>
                        </div>
                    </div>
                )}

                {/* Invoice Preview Container */}
                <div className="bg-card rounded-xl text-black p-8 sm:p-12 shadow-2xl overflow-x-auto relative" id="invoice-preview" ref={invoiceRef}>
                    {/* Print only styles */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
            @media print {
              body * { visibility: hidden; }
              #invoice-preview, #invoice-preview * { visibility: visible; }
              #invoice-preview { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; box-shadow: none; border: none; }
              .no-print { display: none !important; }
            }
          `}} />

                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
                        <div>
                            <h1 className="text-4xl font-black text-muted-foreground tracking-tight">INVOICE</h1>
                            <p className="text-gray-500 mt-2 font-medium">#{invoiceNumber}</p>
                            <p className="text-gray-500 text-sm">Date: {invoiceDate}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                    <span className="text-foreground font-bold text-sm">CA</span>
                                </div>
                                <h2 className="text-xl font-bold text-muted-foreground">Creator Armour</h2>
                            </div>
                            <p className="text-sm text-gray-500 max-w-[200px]">Generated via Creator Armour infrastructure for compliant creator payments.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-10">
                        {/* Creator Info */}
                        <div className="bg-background rounded-xl p-6 border border-border">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Billed By (Creator)</p>
                            <h3 className="font-bold text-lg text-muted-foreground mb-1">{profile.first_name} {profile.last_name}</h3>
                            {profile.business_name && <p className="text-sm text-muted-foreground font-medium">{profile.business_name}</p>}

                            <div className="mt-4 space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-sm text-muted-foreground">PAN:</span>
                                    <span className="text-sm font-medium col-span-2 uppercase">{profile.pan || profile.pan_number || 'NOT PROVIDED'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-sm text-muted-foreground">GSTIN:</span>
                                    <span className="text-sm font-medium col-span-2 uppercase">{profile.gstin || profile.gst_number || 'NOT APPLICABLE (Unregistered)'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-sm text-muted-foreground">State:</span>
                                    <span className="text-sm font-medium col-span-2">{profile.state || 'Not Specified'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Brand Info */}
                        <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Billed To (Brand)</p>
                            <h3 className="font-bold text-lg text-indigo-900 mb-1">{brandName}</h3>
                            {deal.brand_email && <p className="text-sm text-indigo-700">{deal.brand_email}</p>}

                            <div className="mt-4 text-sm text-indigo-800 space-y-1">
                                <p>For Content Collaboration Services</p>
                                <p>Deal ID: {deal.id?.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-border">
                                <th className="text-left py-3 px-2 text-sm font-bold text-muted-foreground">DESCRIPTION OF SERVICES / DELIVERABLES</th>
                                <th className="text-right py-3 px-2 text-sm font-bold text-muted-foreground w-32">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {deliverablesList.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="py-4 px-2 text-sm text-muted-foreground">
                                        <div className="font-medium text-muted-foreground">{idx + 1}. {item}</div>
                                        {idx === 0 && <div className="text-xs text-muted-foreground mt-1">Digital content creation, publishing and usage rights as per agreement.</div>}
                                    </td>
                                    <td className="py-4 px-2 text-right text-sm font-medium text-muted-foreground">
                                        {idx === 0 ? `₹${dealAmount.toLocaleString('en-IN')}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals & TDS Calculation */}
                    <div className="flex justify-end mb-10">
                        <div className="w-full max-w-sm">
                            <div className="bg-background rounded-xl p-6 border border-border">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-muted-foreground font-medium">Base Deal Value</span>
                                    <span className="text-sm font-semibold">₹{dealAmount.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        GST {hasGst ? '(18%)' : '(Not Applicable)'}
                                    </span>
                                    <span className="text-sm font-semibold">{hasGst ? `₹${gstAmount.toLocaleString('en-IN')}` : '₹0'}</span>
                                </div>

                                <div className="border-t border-border my-3 pt-3 flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted-foreground">Total Invoice Value</span>
                                    <span className="text-sm font-bold text-muted-foreground">₹{totalAmount.toLocaleString('en-IN')}</span>
                                </div>

                                <div className="bg-warning rounded-lg p-3 mt-4 border border-warning">
                                    <p className="text-[11px] font-bold text-warning uppercase tracking-wider mb-2">TDS Deduction (Sec 194J)</p>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-warning line-through">Less TDS ({(creatorTdsRate * 100).toFixed(0)}%)</span>
                                        <span className="text-warning font-medium line-through font-mono">- ₹{tdsAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <p className="text-[10px] text-warning/70 mt-1 leading-tight">Brand deducts and deposits this to your PAN.</p>
                                </div>

                                <div className="border-t border-border my-4 pt-4 flex justify-between items-baseline">
                                    <span className="text-base font-black text-muted-foreground">Net Receivable</span>
                                    <span className="text-xl font-black text-indigo-600 tracking-tight">₹{netPayable.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-background rounded-xl p-6 border-l-4 border-indigo-500 mb-8">
                        <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wide">Bank Details For Direct NEFT / RTGS / UPI</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                    <span className="text-xs text-muted-foreground font-medium">Account Name:</span>
                                    <span className="text-sm font-bold text-muted-foreground col-span-2">{profile.bank_account_name || profile.first_name + ' ' + (profile.last_name || '')}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                    <span className="text-xs text-muted-foreground font-medium">Bank Account:</span>
                                    <span className="text-sm font-bold text-muted-foreground col-span-2 tracking-wider">{profile.bank_account_number || 'Pending'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Bank IFSC:</span>
                                    <span className="text-sm font-bold text-muted-foreground col-span-2 tracking-wider uppercase">{profile.bank_ifsc || 'Pending'}</span>
                                </div>
                            </div>

                            <div className="md:border-l md:border-border md:pl-6 space-y-2">
                                <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-border pb-2">
                                    <span className="text-xs text-muted-foreground font-medium mt-1">UPI ID:</span>
                                    <span className="text-sm font-bold text-muted-foreground tracking-wider">
                                        {profile.bank_upi || 'Pending'}
                                    </span>
                                </div>

                                {profile.bank_upi && (
                                    <div className="mt-2 flex justify-center">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${profile.bank_upi}&pn=${encodeURIComponent(profile.first_name)}&am=${netPayable}&cu=INR`} alt="UPI QR" className="w-16 h-16 rounded border border-border shadow-sm opacity-80" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Signature */}
                    <div className="mt-16 flex justify-between items-end border-t border-gray-200 pt-8">
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>1. This is a system-generated invoice.</p>
                            <p>2. Subject to realization of funds.</p>
                            {hasGst && <p>3. Tax is payable on reverse charge basis: No</p>}
                        </div>

                        <div className="text-center">
                            <div className="w-48 border-b-2 border-border mb-2"></div>
                            <p className="text-sm font-bold text-muted-foreground">Authorized Signatory</p>
                            <p className="text-xs text-muted-foreground mt-1">For {profile.business_name || profile.first_name + ' ' + (profile.last_name || '')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border no-print">
                    <Button variant="outline" onClick={onClose} className="border-border hover:bg-secondary/50 text-foreground">
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePrint}
                        disabled={isGenerating || isMissingTaxInfo}
                        className="bg-indigo-600 hover:bg-indigo-500 text-foreground shadow-lg shadow-indigo-500/20"
                    >
                        {isGenerating ? 'Prepping Print...' : 'Download / Print PDF'}
                        <Printer className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
