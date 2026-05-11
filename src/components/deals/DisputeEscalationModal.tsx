import React, { useState } from "react";
import { AlertTriangle, Scale, RefreshCcw, X, Ban, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Resolution = "partial_refund" | "final_arbitration" | "cancel_deal" | "last_revision";

interface Option {
  id: Resolution;
  icon: React.ReactNode;
  label: string;
  description: string;
  consequence: string;
  color: string;
  iconBg: string;
}

const OPTIONS: Option[] = [
  {
    id: "last_revision",
    icon: <RefreshCcw className="h-5 w-5" />,
    label: "Grant One Last Revision",
    description: "Give the creator a final chance to fix the content before escalating further.",
    consequence: "Creator is notified and gets one more revision attempt.",
    color: "border-blue-500/40 hover:border-blue-500",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    id: "partial_refund",
    icon: <Scale className="h-5 w-5" />,
    label: "Request Partial Refund",
    description: "Acknowledge partial effort and negotiate a refund for undelivered value.",
    consequence: "Payout is frozen. Support team initiates refund process.",
    color: "border-amber-500/40 hover:border-amber-500",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    id: "final_arbitration",
    icon: <AlertTriangle className="h-5 w-5" />,
    label: "Request Final Arbitration",
    description: "Escalate to our team for a binding review and resolution within 72 hours.",
    consequence: "Payout frozen. Team reviews both sides and makes a final decision.",
    color: "border-orange-500/40 hover:border-orange-500",
    iconBg: "bg-orange-500/10 text-orange-400",
  },
  {
    id: "cancel_deal",
    icon: <Ban className="h-5 w-5" />,
    label: "Cancel Deal",
    description: "Terminate the collaboration. No further content obligations on either side.",
    consequence: "Deal is cancelled immediately. No payout will be processed.",
    color: "border-red-500/40 hover:border-red-500",
    iconBg: "bg-red-500/10 text-red-400",
  },
];

interface Props {
  dealId: string;
  brandName?: string;
  onClose: () => void;
  onSuccess: (resolution: Resolution, newStatus: string) => void;
}

export function DisputeEscalationModal({ dealId, brandName, onClose, onSuccess }: Props) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Resolution | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = OPTIONS.find((o) => o.id === selected);

  const handleConfirm = async () => {
    if (!selected || !session?.access_token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/escalate-dispute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resolution: selected, notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to escalate");

      queryClient.invalidateQueries({ queryKey: ["brand_deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["brand_deals"] });

      toast.success(data.message || "Dispute escalated.");
      onSuccess(selected, data.new_status);
    } catch (err: any) {
      toast.error(err.message || "Failed to escalate dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal
        aria-label="Dispute escalation options"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <span className="font-bold text-white text-base">Resolve Dispute</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "select" && (
          <div className="p-5 space-y-3">
            <p className="text-sm text-white/55 mb-4">
              The revision was rejected. Choose how to resolve this dispute with{" "}
              <span className="text-white/80 font-medium">{brandName || "the creator"}</span>.
            </p>

            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all duration-200",
                  "bg-white/3 hover:bg-white/5",
                  selected === opt.id
                    ? opt.color.replace("hover:", "") + " ring-2 ring-offset-0"
                    : opt.color
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-lg p-2 shrink-0", opt.iconBg)}>{opt.icon}</div>
                  <div>
                    <div className="font-semibold text-white/90 text-sm mb-0.5">{opt.label}</div>
                    <div className="text-xs text-white/50 leading-relaxed">{opt.description}</div>
                    <div className="text-[11px] text-white/35 mt-1.5 italic">{opt.consequence}</div>
                  </div>
                  {selected === opt.id && (
                    <ChevronRight className="h-4 w-4 text-white/60 ml-auto shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}

            <div className="space-y-2 pt-1">
              <label className="text-xs text-white/50 font-medium">Additional notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any context for our support team..."
                rows={2}
                className="resize-none bg-white/4 border-white/10 text-white placeholder:text-white/25 text-sm"
              />
            </div>

            <Button
              onClick={() => selected && setStep("confirm")}
              disabled={!selected}
              className="w-full h-12 mt-1 font-bold bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40"
            >
              Review & Confirm
            </Button>
          </div>
        )}

        {step === "confirm" && selectedOption && (
          <div className="p-5 space-y-4">
            <div className={cn("rounded-xl border p-4 bg-white/3", selectedOption.color.split(" ")[0])}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("rounded-lg p-2", selectedOption.iconBg)}>{selectedOption.icon}</div>
                <div className="font-bold text-white/90">{selectedOption.label}</div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{selectedOption.consequence}</p>
              {notes && (
                <p className="text-xs text-white/40 mt-2 italic border-t border-white/8 pt-2">
                  Your note: {notes}
                </p>
              )}
            </div>

            <p className="text-xs text-white/40 text-center">
              This action cannot be undone. Are you sure?
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                disabled={isSubmitting}
                className="flex-1 h-11 border-white/15 text-white/70 hover:bg-white/5"
              >
                Go Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="flex-1 h-11 font-bold bg-orange-600 hover:bg-orange-500 text-white"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm Resolution"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
