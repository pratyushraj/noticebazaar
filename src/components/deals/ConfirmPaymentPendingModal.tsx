import { useState } from "react";
import { IndianRupee, X, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";

interface Props {
  dealId: string;
  dealAmount?: number;
  creatorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Client-side fee breakdown (mirrors server/src/lib/payment.ts)
const PLATFORM_FEE_PCT = 0.10;
const GST_PCT = 0.18;

function computeBreakdown(dealAmountRupees: number) {
  const deal = Math.round(dealAmountRupees);
  const platformFee = Math.round(deal * PLATFORM_FEE_PCT);
  const gstOnFee = Math.round(platformFee * GST_PCT);
  const brandTotal = deal + platformFee + gstOnFee;
  const creatorPayout = deal;
  return { dealAmount: deal, platformFee, gstOnFee, brandTotal, creatorPayout };
}

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

    setIsLoading(true);
    try {
      const apiUrl = `${getApiBaseUrl()}/api/deals/${dealId}/create-payment-link`;
      console.log('[ConfirmPayment] Fetching from:', apiUrl);
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      console.log('[ConfirmPayment] Response status:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('[ConfirmPayment] Response data:', data);

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create payment link. Please try again.");
        return;
      }

      const url = data.short_url;
      if (!url) {
        toast.error("Payment link not available. Please try again.");
        return;
      }

      // Redirect to payment page; webhook handles status update to CONTENT_MAKING.
      toast.success("Redirecting to payment page...");
      onSuccess();
      window.location.assign(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal
        aria-label="Confirm payment"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white text-base">Confirm Payment</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Escrow notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <Shield className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-sm text-emerald-300 font-medium leading-relaxed">
              Payment is securely held in escrow and released only after you approve the creator's content.
            </p>
          </div>

          {/* Breakdown */}
          {breakdown ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex justify-between text-sm text-white/70">
                <span>Deal amount</span>
                <span>₹{breakdown.dealAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Platform fee (10%)</span>
                <span>₹{breakdown.platformFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>GST (18% on fee)</span>
                <span>₹{breakdown.gstOnFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white text-base">
                <span>Total Payable</span>
                <span>₹{breakdown.brandTotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-white/40 pt-1">
                Creator receives ₹{breakdown.creatorPayout.toLocaleString("en-IN")} after content approval.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center text-white/50 text-sm">
              No deal amount set. Please contact support.
            </div>
          )}

          <Button
            type="button"
            onClick={handlePayNow}
            disabled={isLoading || !breakdown}
            className="w-full h-12 font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening payment…
              </>
            ) : breakdown ? (
              `Pay ₹${breakdown.brandTotal.toLocaleString("en-IN")} via Razorpay`
            ) : (
              "Amount not available"
            )}
          </Button>

          <p className="text-center text-xs text-white/30">
            Payment processed securely by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
