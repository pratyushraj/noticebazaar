import { useState, useEffect } from "react";
import { IndianRupee, X, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  dealId: string;
  dealAmount?: number;
  creatorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmPaymentPendingModal({ dealId, dealAmount, creatorName, onClose, onSuccess }: Props) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);

  // Fetch breakdown on mount
  useEffect(() => {
    if (!dealId || !session?.access_token) return;
    
    fetch(`${getApiBaseUrl()}/api/deals/${dealId}/create-payment-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // We just use it to fetch the breakdown + link
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.breakdown) {
          setBreakdown(data);
        } else {
          toast.error(data.error || "Failed to prepare payment");
        }
      })
      .catch(err => {
        console.error(err);
      });
  }, [dealId, session]);

  const handlePayNow = () => {
    if (!breakdown?.short_url) {
      toast.error("Payment link not ready. Please try again.");
      return;
    }
    
    // In MVP, we just open the Razorpay short link in a new tab.
    // The webhook will handle the status update to CONTENT_MAKING.
    window.open(breakdown.short_url, "_blank");
    toast.info("Payment opened in new tab. Deal will update automatically once paid.");
    onClose();
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-white text-base">Confirm Payment</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium mb-1">
                <Shield className="h-3.5 w-3.5" />
                Deal amount
              </div>
              <div className="text-white font-bold text-lg">
                {dealAmount ? `₹${dealAmount.toLocaleString("en-IN")}` : "—"}
              </div>
            </div>
            <div className="rounded-xl bg-blue-500/8 border border-blue-500/20 p-3">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-medium mb-1">
                <Clock className="h-3.5 w-3.5" />
                Creator
              </div>
              <div className="text-white font-semibold text-sm truncate">
                {creatorName || "—"}
              </div>
            </div>
          </div>

          <p className="text-sm text-white/55 leading-relaxed">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 mb-2"><Shield className="w-4 h-4" /> Payments are securely held and released after approval</span>
            By proceeding, you will pay the total amount via Razorpay. The creator will be notified and can start delivering content immediately.
          </p>

          {/* Breakdown */}
          {breakdown ? (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex justify-between text-sm text-white/70">
                <span>Deal amount</span>
                <span>₹{breakdown.breakdown.dealAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Platform fee</span>
                <span>₹{breakdown.breakdown.platformFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>GST (18% on fee)</span>
                <span>₹{breakdown.breakdown.gstOnFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white text-base">
                <span>Total Payable</span>
                <span>₹{breakdown.breakdown.brandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border border-white/5 rounded-xl bg-white/2">
              <span className="h-5 w-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}

          <Button
            type="button"
            onClick={handlePayNow}
            disabled={!breakdown?.short_url}
            className="w-full h-12 font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
          >
            {breakdown ? `Pay ₹${breakdown.breakdown.brandTotal.toLocaleString("en-IN")} via Razorpay` : "Preparing secure payment..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
