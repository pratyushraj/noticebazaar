
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    ShieldCheck,
    PenTool,
    Download,
    Link2,
    FileText,
    Copy
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
    copyToClipboard
}: DealStatusCardProps) => {

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
    // Logic from original file:
    // const showContractCard = (isContractReady && hasContract) || (isSigned && isCreatorSigned) || ((isCreatorSigned || signedContractUrl) && hasContract);
    const showContractCard = (isContractReady && hasContract) || (isSigned && isCreatorSigned) || ((isCreatorSigned || signedContractUrl) && hasContract);

    if (!showContractCard) return null;

    return (
        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border-2 border-blue-400/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
            {/* Subtle background glow for active state */}
            {step === 3 && (
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
            )}

            {/* Header & Steps */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {step === 3 ? (
                            <>
                                Deal Active & Signed
                                <span className="inline-flex items-center justify-center bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                                    Live
                                </span>
                            </>
                        ) : (step === 2 ? 'Waiting for Brand Signature' : 'Contract Ready for Signature')}
                    </h2>
                    <p className="text-white/60 text-sm">
                        {step === 3 ? 'Legally executed agreement. You are protected.' : (step === 2 ? 'Your signature is secure. Awaiting brand signature.' : 'Brand identity verified. Ready to sign.')}
                    </p>
                </div>
                {/* Step Tracker */}
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg self-start md:self-auto backdrop-blur-sm border border-white/5">
                    {/* Step 1: Creator */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 1 ? "text-green-400 bg-green-400/10" : "text-white/30")}>
                        {step > 1 ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold border border-current w-4 h-4 rounded-full flex items-center justify-center">1</span>}
                        <span className="text-xs font-bold">Creator</span>
                    </div>
                    <div className="w-4 h-0.5 bg-white/10" />
                    {/* Step 2: Brand */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 2 ? (step > 2 ? "text-green-400 bg-green-400/10" : "text-blue-400 bg-blue-400/10") : "text-white/30")}>
                        {step > 2 ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold border border-current w-4 h-4 rounded-full flex items-center justify-center">2</span>}
                        <span className="text-xs font-bold">Brand</span>
                    </div>
                    <div className="w-4 h-0.5 bg-white/10" />
                    {/* Step 3: Active */}
                    <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded transition-colors", step >= 3 ? "text-emerald-400 bg-emerald-400/10" : "text-white/30")}>
                        <ShieldCheck className="w-4 h-4" />
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
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 group"
                        >
                            <PenTool className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            E-Sign Agreement as Creator
                        </motion.button>

                        <div className="text-center space-y-2 pt-2">
                            <p className="text-xs text-white/40">Brand can only sign after creator signature is complete.</p>
                            <button
                                onClick={onDownloadContract}
                                className="text-white/40 hover:text-white text-xs underline decoration-white/20 hover:decoration-white transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                                <Download className="w-3 h-3" />
                                View Contract PDF
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-2 animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Creator Signature Verified</p>
                                <p className="text-xs text-white/50">Signed by you. Now waiting for the brand.</p>
                            </div>
                        </div>

                        <motion.button
                            onClick={async () => {
                                if (!deal?.id) return;
                                const link = brandReplyLink || (await generateBrandReplyLink(deal.id));
                                if (link) {
                                    const success = await copyToClipboard(link);
                                    if (success) toast.success('Brand signing link copied!');
                                    // window.open(link, '_blank'); // Optional: open for them
                                }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Link2 className="w-4 h-4" />
                            Send Signature Link to Brand
                        </motion.button>
                    </>
                )}

                {step === 3 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                            <h3 className="font-bold text-emerald-400 text-lg">Terms Locked & Active</h3>
                        </div>
                        <p className="text-sm text-emerald-400/80 mb-4">
                            Both parties have signed. Funds are secured in escrow/audit log.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-500/10 rounded-lg p-3">
                                <p className="text-xs text-emerald-400/60 uppercase font-bold">Total Value</p>
                                <p className="text-xl font-bold text-emerald-400">₹{Math.round(dealAmount).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-emerald-500/10 rounded-lg p-3">
                                <p className="text-xs text-emerald-400/60 uppercase font-bold">Signed On</p>
                                <p className="text-sm font-bold text-emerald-400">
                                    {(() => {
                                        const dateToUse = signedAtDate || deal?.updated_at;
                                        if (!dateToUse) return 'N/A';
                                        const date = new Date(dateToUse);
                                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                    })()}
                                </p>
                            </div>
                        </div>
                        <button onClick={onDownloadContract} className="w-full mt-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Download className="w-4 h-4" />
                            Download Final PDF
                        </button>
                    </div>
                )}
            </div>

            {/* Footer - Filename & Actions */}
            {(deal?.contract_file_url || signedContractUrl) && (
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 text-white/40 overflow-hidden">
                        <FileText className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-mono truncate">
                            {/* Filename with middle truncation */}
                            {(() => {
                                const name = (deal?.contract_file_url || signedContractUrl || '').split('/').pop() || 'contract.pdf';
                                if (name.length > 25) {
                                    return name.substring(0, 12) + '...' + name.slice(-8);
                                }
                                return name;
                            })()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white/30 uppercase font-bold px-2 py-0.5 bg-white/5 rounded border border-white/5">PDF</span>
                        <button onClick={() => {
                            copyToClipboard(deal?.contract_file_url || signedContractUrl || '');
                            toast.success('Contract link copied');
                        }} className="text-white/20 hover:text-white transition-colors p-1">
                            <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={onDownloadContract} className="text-white/20 hover:text-white transition-colors p-1">
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
