
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    ShieldCheck,
    PenTool,
    Download,
    Link2,
    FileText,
    Copy,
    Package
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { HapticPatterns, triggerHaptic } from '@/lib/utils/haptics';

interface DealStatusCardProps {
    deal: any;
    isContractReady: boolean;
    hasContract: boolean;
    isSigned: boolean;
    isCreatorSigned: boolean;
    isBrandSigned: boolean;
    bothSigned: boolean;
    signedContractUrl: string | null | undefined;
    contractDocxUrl: string | null | undefined;
    signedAtDate: string | null | undefined;
    dealAmount: number;
    onSignCreator: () => void;
    onDownloadContract: () => void;
    brandReplyLink?: string;
    generateBrandReplyLink: (dealId: string) => Promise<string | null>;
    copyToClipboard: (text: string) => Promise<boolean>;
    onGenerateInvoice?: () => void;
}

export const DealStatusCard = ({
    deal,
    isContractReady,
    hasContract,
    isSigned,
    isCreatorSigned,
    isBrandSigned,
    bothSigned,
    signedContractUrl,
    contractDocxUrl,
    signedAtDate,
    dealAmount,
    onSignCreator,
    onDownloadContract,
    brandReplyLink,
    generateBrandReplyLink,
    copyToClipboard,
    onGenerateInvoice
}: DealStatusCardProps) => {

    const isBarter = String(deal?.collab_type || deal?.deal_type || deal?.raw?.collab_type || '').toLowerCase().includes('barter');

    // Calculate current step
    const step = (bothSigned || (isSigned && isCreatorSigned && isBrandSigned)) ? 3 : (isCreatorSigned ? 2 : 1);

    // Trigger confetti when step 3 is reached
    useEffect(() => {
        if (step === 3) {
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [step]);

    // If none of the show conditions are met, null is returned so this component doesn't render
    const showContractCard = (isContractReady && hasContract) || (isSigned && isCreatorSigned) || ((isCreatorSigned || signedContractUrl) && hasContract);

    if (!showContractCard) return null;

    return (
        <div className={cn(
            "backdrop-blur-xl border-2 rounded-2xl p-6 shadow-lg relative overflow-hidden transition-all duration-500",
            isBarter 
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30" 
                : "bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-info/30"
        )}>
            {/* Subtle background glow for active state */}
            {step === 3 && (
                <div className={cn("absolute inset-0 pointer-events-none", isBarter ? "bg-amber-500/5" : "bg-primary/5")} />
            )}

            {/* Header & Steps */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                        {step === 3 ? (
                            <>
                                {isBarter ? 'Product Secured' : 'Deal Active & Signed'}
                                <span className={cn(
                                    "inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full border",
                                    isBarter ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-primary/20 text-primary border-primary/30"
                                )}>
                                    Live
                                </span>
                            </>
                        ) : (step === 2 ? 'Waiting for Brand Signature' : (isBarter ? 'Ready to Claim Product' : 'Contract Ready for Signature'))}
                    </h2>
                    <p className="text-foreground/60 text-sm">
                        {step === 3 
                            ? (isBarter ? 'Agreement executed. Your product shipment is protected.' : 'Legally executed agreement. You are protected.') 
                            : (step === 2 
                                ? 'Your signature is secure. Awaiting brand signature.' 
                                : (isBarter ? 'Sign agreement to secure your product delivery.' : 'Brand identity verified. Ready to sign.'))
                        }
                    </p>
                </div>
                {/* Step Tracker */}
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg self-start md:self-auto backdrop-blur-sm border border-border/5">
                    {/* Step 1: Creator */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 1 ? "text-green-400 bg-green-400/10" : "text-foreground/30")}>
                        {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold border border-current w-4 h-4 rounded-full flex items-center justify-center">1</span>}
                        <span className="text-xs font-bold">Creator</span>
                    </div>
                    <div className="w-4 h-0.5 bg-secondary/50" />
                    {/* Step 2: Brand */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 2 ? (step > 2 ? "text-green-400 bg-green-400/10" : (isBarter ? "text-amber-400 bg-amber-400/10" : "text-info bg-info/10")) : "text-foreground/30")}>
                        {step > 2 ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold border border-current w-4 h-4 rounded-full flex items-center justify-center">2</span>}
                        <span className="text-xs font-bold">Brand</span>
                    </div>
                    <div className="w-4 h-0.5 bg-secondary/50" />
                    {/* Step 3: Active */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 3 ? (isBarter ? "text-amber-500 bg-amber-500/10" : "text-primary bg-primary/10") : "text-foreground/30")}>
                        {isBarter ? <Package className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        <span className="text-xs font-bold">Active</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 relative z-10">
                {step === 1 && (
                    <>
                        <motion.button
                            onClick={() => {
                                triggerHaptic(HapticPatterns.medium);
                                onSignCreator();
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-full px-6 py-4 rounded-xl font-semibold text-foreground transition-all flex items-center justify-center gap-3 shadow-lg group",
                                isBarter 
                                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20" 
                                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/20"
                            )}
                        >
                            <PenTool className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {isBarter ? 'E-Sign Agreement to Claim Product' : 'E-Sign Agreement as Creator'}
                        </motion.button>

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-xs text-foreground/40">Brand can only sign after creator signature is complete.</p>
                            <button type="button"
                                onClick={onDownloadContract}
                                className="text-foreground/40 hover:text-foreground text-xs underline decoration-white/20 hover:decoration-white transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                <Download className="w-3 h-3" />
                                View Agreement PDF
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 mb-2 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground text-sm">Creator Signature Verified</p>
                                <p className="text-xs text-foreground/50">Signed by you. Now waiting for the brand.</p>
                            </div>
                        </div>

                        <motion.button
                            onClick={async () => {
                                if (!deal?.id) return;
                                const link = brandReplyLink || (await generateBrandReplyLink(deal.id));
                                if (link) {
                                    const success = await copyToClipboard(link);
                                    if (success) toast.success('Brand signing link copied!');
                                }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-full px-6 py-3 rounded-xl font-bold text-foreground transition-all flex items-center justify-center gap-2 shadow-lg",
                                isBarter 
                                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20" 
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                            )}
                        >
                            <Link2 className="w-4 h-4" />
                            Send Signature Link to Brand
                        </motion.button>
                    </>
                )}

                {step === 3 && (
                    <div className={cn(
                        "border rounded-xl p-4 animate-in fade-in zoom-in-95 duration-500",
                        isBarter ? "bg-amber-500/10 border-amber-500/20" : "bg-primary/10 border-primary/20"
                    )}>
                        <div className="flex items-center gap-3 mb-2">
                            {isBarter ? <Package className="w-6 h-6 text-amber-500" /> : <ShieldCheck className="w-6 h-6 text-primary" />}
                            <h3 className={cn("font-bold text-lg", isBarter ? "text-amber-500" : "text-primary")}>
                                {isBarter ? 'Product Secured' : 'Terms Locked & Active'}
                            </h3>
                        </div>
                        <p className={cn("text-sm mb-4", isBarter ? "text-amber-500/80" : "text-primary/80")}>
                            {isBarter 
                                ? 'Both parties have signed. Brand is notified to initiate shipping.' 
                                : 'Both parties have signed. Funds are secured in escrow/audit log.'
                            }
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn("rounded-lg p-3", isBarter ? "bg-amber-500/10" : "bg-primary/10")}>
                                <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-60", isBarter ? "text-amber-500" : "text-primary")}>
                                    {isBarter ? 'Product Value' : 'Total Payout'}
                                </p>
                                <p className={cn("text-xl font-black", isBarter ? "text-amber-500" : "text-primary")}>
                                    ₹{Math.round(dealAmount).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className={cn("rounded-lg p-3", isBarter ? "bg-amber-500/10" : "bg-primary/10")}>
                                <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-60", isBarter ? "text-amber-500" : "text-primary")}>Signed On</p>
                                <p className={cn("text-sm font-black", isBarter ? "text-amber-500" : "text-primary")}>
                                    {(() => {
                                        const dateToUse = signedAtDate || deal?.updated_at;
                                        if (!dateToUse) return 'N/A';
                                        const date = new Date(dateToUse);
                                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                    })()}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button type="button" onClick={onDownloadContract} className={cn(
                                "w-full font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm",
                                isBarter ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400" : "bg-primary/20 hover:bg-primary/30 text-primary"
                            )}>
                                <Download className="w-4 h-4" />
                                Agreement
                            </button>
                            {onGenerateInvoice && !isBarter && (
                                <button type="button" onClick={onGenerateInvoice} className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                                    <FileText className="w-4 h-4" />
                                    Invoice
                                </button>
                            )}
                            {isBarter && (
                                <button type="button" onClick={() => window.open('https://wa.me/919999999999', '_blank')} className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm">
                                    <ShieldCheck className="w-4 h-4" />
                                    Support
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Filename & Actions */}
            {(deal?.contract_file_url || signedContractUrl) && (
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 text-foreground/40 overflow-hidden">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-mono truncate">
                            {(() => {
                                const name = (deal?.contract_file_url || signedContractUrl || '').split('/').pop() || 'agreement.pdf';
                                if (name.length > 25) {
                                    return name.substring(0, 12) + '...' + name.slice(-8);
                                }
                                return name;
                            })()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-foreground/30 uppercase font-bold px-2 py-0.5 bg-card rounded border border-border/5">PDF</span>
                        <button type="button" onClick={() => {
                            copyToClipboard(deal?.contract_file_url || signedContractUrl || '');
                            toast.success('Agreement link copied');
                        }} className="text-foreground/20 hover:text-foreground transition-colors p-1">
                            <Copy className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={onDownloadContract} className="text-foreground/20 hover:text-foreground transition-colors p-1">
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
