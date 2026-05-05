import { useState } from "react";
import { IndianRupee, X, Shield, Loader2, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import * as ds from "@/lib/design-system";

interface Props {
  dealId: string;
  dealAmount?: number;
  creatorName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const PLATFORM_FEE_PCT = 0.10;
const GST_PCT = 0.18;

function computeBreakdown(dealAmountRupees: number) {
  const dealPaise = Math.round(dealAmountRupees * 100);
  const platformFeePaise = Math.round(dealPaise * PLATFORM_FEE_PCT);
  const gstOnFeePaise = Math.round(platformFeePaise * GST_PCT);
  const brandTotalPaise = dealPaise + platformFeePaise + gstOnFeePaise;
  
  return { 
    dealAmount: dealPaise / 100, 
    platformFee: platformFeePaise / 100, 
    gstOnFee: gstOnFeePaise / 100, 
    brandTotal: brandTotalPaise / 100, 
    creatorPayout: dealPaise / 100 
  };
}

const loadRazorpayScript = () =>
  new Promise<void>((resolve, reject) => {
    if (document.getElementById('razorpay-checkout-js')) return resolve();
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'));
    document.body.appendChild(script);
  });

export function ConfirmPaymentPendingModal({ dealId, dealAmount, creatorName, onClose, onSuccess }: Props) {
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const amount = Number(dealAmount || 0);
  const breakdown = amount > 0 ? computeBreakdown(amount) : null;

  const handlePayNow = async () => {
    if (!session?.access_token) {
      toast.error("Session expired. Please refresh and try again.");
      return;
    }
    if (!dealId) {
      toast.error("Deal details unavailable.");
      return;
    }

    triggerHaptic(HapticPatterns.light);
    setIsLoading(true);
    try {
      await loadRazorpayScript();

      const apiUrl = `${getApiBaseUrl()}/api/deals/${dealId}/create-payment-order`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create payment order. Please try again.");
        return;
      }

      if (!data.order_id || !data.key_id) {
        toast.error("Payment checkout details are incomplete. Please try again.");
        return;
      }

      const options = {
        key: data.key_id,
        amount: data?.breakdown?.amountPaise,
        currency: data.currency || 'INR',
        name: 'Creator Armour',
        description: creatorName ? `Escrow payment for ${creatorName}` : 'Escrow payment',
        order_id: data.order_id,
        prefill: {
          name: creatorName || 'Brand User',
          email: session.user?.email || '',
          contact: '',
        },
        theme: { color: '#10b981' },
        handler: async () => {
          triggerHaptic(HapticPatterns.success);
          toast.success('Payment submitted. Processing securely...');
          try {
            const verifyRes = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/verify-payment`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${session?.access_token}` }
            });
            await verifyRes.json();
          } catch (e) {
            // ignore silently, the reload will happen anyway
          }
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.reload();
          }
        },
      };

      const RazorpayCtor = (window as unknown as { Razorpay?: new (options: typeof options) => { on: (event: string, cb: (payload: unknown) => void) => void; open: () => void } }).Razorpay;
      if (!RazorpayCtor) {
        toast.error('Razorpay checkout failed to load.');
        return;
      }

      const rzp = new RazorpayCtor(options);
      rzp.on('payment.failed', (response: unknown) => {
        const description = typeof response === 'object' && response && 'error' in response
          ? String((response as { error?: { description?: string } }).error?.description || '')
          : '';
        toast.error(description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!dealId || isLoading) return;
    
    // Auto-polling for payment verification while modal is open
    const interval = setInterval(() => {
      handleVerify();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [dealId]);

  const handleVerify = async () => {
    if (isLoading) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/verify-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.status === 'content_making' || data.success) {
          if (onSuccess) {
            onSuccess();
          } else {
            onClose();
            window.location.reload();
          }
        }
      }
    } catch (err) {
      // Ignore errors during auto-polling
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={ds.animations.spring}
          className={cn(
            "relative w-full max-w-md overflow-hidden",
            ds.ios.glass.full,
            "rounded-[32px] sm:rounded-[40px]",
            "shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
          )}
          role="dialog"
          aria-modal
        >
          {/* Spotlight Effect */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className={ds.typography.h3}>Secure Checkout</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-black mt-0.5">Escrow Protection Active</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              <X className="h-5 w-5 text-white/40" />
            </button>
          </div>

          <div className="relative p-6 space-y-6">
            {/* Trust Banner */}
            <div className="flex items-start gap-3 p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl">
              <Shield className="h-5 w-5 shrink-0 text-emerald-400/80" />
              <p className="text-[12px] leading-relaxed text-emerald-100/60 font-medium">
                Funds are held in escrow and only released to <span className="text-emerald-300 font-bold">{creatorName || "the creator"}</span> after you approve the final content.
              </p>
            </div>

            {/* Breakdown Card */}
            {breakdown ? (
              <div className="space-y-4">
                <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl space-y-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-white/40">Base Deal Amount</span>
                    <span className="text-white">₹{breakdown.dealAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-medium">
                    <span className="text-white/40">Platform Fee (10%)</span>
                    <span className="text-white">₹{breakdown.platformFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-medium pb-3.5 border-b border-white/5">
                    <span className="text-white/40">GST (18% on fee)</span>
                    <span className="text-white">₹{breakdown.gstOnFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-1">Total Due</p>
                      <h3 className="text-2xl font-black text-white tracking-tight">₹{breakdown.brandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none mb-1">Payout to</p>
                      <p className="text-[11px] font-black text-white/50">{creatorName || "Creator"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Pricing details unavailable</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handlePayNow}
                disabled={isLoading || !breakdown}
                className={cn(
                  "w-full h-14 text-base font-black uppercase tracking-widest transition-all",
                  breakdown && !isLoading ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]" : "bg-white/5",
                  "rounded-2xl"
                )}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Escrow
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <button
                type="button"
                onClick={async () => {
                  triggerHaptic(HapticPatterns.light);
                  setIsLoading(true);
                  try {
                    // Manual UPI/External payment marking
                    const res = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/verify-payment`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ manual_mark_paid: true })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success("Payment marked as successful!");
                      onSuccess?.();
                    } else {
                      toast.info("Marking as paid. Please wait for verification.");
                      onSuccess?.();
                    }
                  } catch (e) {
                    onSuccess?.();
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400/40 hover:text-emerald-400/80 transition-colors border border-emerald-500/10 rounded-xl"
              >
                I've paid via UPI. Mark as Sent
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 grayscale opacity-40">
              <Lock className="h-3 w-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Razorpay Secure 256-bit SSL</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
