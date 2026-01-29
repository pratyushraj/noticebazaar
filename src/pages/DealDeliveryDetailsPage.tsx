"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { useBrandDealById } from "@/lib/hooks/useBrandDeals";
import { getApiBaseUrl } from "@/lib/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import { trackEvent } from "@/lib/utils/analytics";
import { cn } from "@/lib/utils";

export default function DealDeliveryDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const { data: deal, isLoading: isLoadingDeal } = useBrandDealById(dealId, profile?.id);

  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ phone: false, address: false });

  const dealType = (deal as any)?.deal_type;
  const hasExistingDelivery =
    (deal as any)?.delivery_name && (deal as any)?.delivery_phone && (deal as any)?.delivery_address;

  useEffect(() => {
    if (deal) {
      setDeliveryName((deal as any).delivery_name ?? "");
      setDeliveryPhone((deal as any).delivery_phone ?? "");
      setDeliveryAddress((deal as any).delivery_address ?? "");
      setDeliveryNotes((deal as any).delivery_notes ?? "");
    }
  }, [deal]);

  // Redirect if not barter or not owner
  useEffect(() => {
    if (isLoadingDeal || !dealId) return;
    if (!profile?.id) return;
    if (!deal) {
      toast.error("Deal not found");
      navigate("/creator-contracts", { replace: true });
      return;
    }
    // Route guard: paid deals skip delivery — redirect to deal page (no delivery UI)
    if (dealType === "paid") {
      navigate(`/creator-contracts/${dealId}`, { replace: true });
      return;
    }
    if (dealType !== "barter") {
      toast.error("Delivery details are only for barter deals");
      navigate(`/creator-contracts/${dealId}`, { replace: true });
      return;
    }
    // Barter deal: user is on delivery screen
    trackEvent("delivery_details_requested", { deal_id: dealId, creator_id: profile?.id });
  }, [deal, dealId, dealType, isLoadingDeal, profile?.id, navigate]);

  const phoneDigits = deliveryPhone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 10;
  const addressValid = deliveryAddress.trim().length > 0;
  const nameValid = deliveryName.trim().length > 0;
  const canSubmit = nameValid && phoneValid && addressValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId || !session?.access_token || !canSubmit) return;
    triggerHaptic(HapticPatterns.light);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/delivery-details`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery_name: deliveryName.trim(),
          delivery_phone: deliveryPhone.trim(),
          delivery_address: deliveryAddress.trim(),
          delivery_notes: deliveryNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        trackEvent("delivery_details_submitted", { deal_id: dealId, creator_id: profile?.id });
        toast.success("Delivery details saved. Contract is being prepared.");
        navigate(`/creator-contracts/${dealId}`, { replace: true });
      } else {
        toast.error(data.error || "Failed to save delivery details");
      }
    } catch {
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDeal || !deal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col gap-4 w-full max-w-md">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (dealType !== "barter") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-safe">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Delivery Details (For Barter Only)</h1>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          This is required so brands can ship your product. Your details are shared only after contract signing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="delivery_name">Full Name</Label>
            <Input
              id="delivery_name"
              value={deliveryName}
              onChange={(e) => setDeliveryName(e.target.value)}
              placeholder="Your full name"
              className="h-12"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_phone">Phone Number</Label>
            <Input
              id="delivery_phone"
              type="tel"
              inputMode="numeric"
              value={deliveryPhone}
              onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="10-digit phone number"
              className={cn("h-12", touched.phone && !phoneValid && "border-destructive")}
              required
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">Used only for delivery updates — never shared publicly</p>
            {touched.phone && !phoneValid && deliveryPhone.length > 0 && (
              <p className="text-xs text-destructive">Enter at least 10 digits</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Where should the product be delivered?</Label>
            <Textarea
              id="delivery_address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              placeholder="Street, city, state, PIN"
              rows={4}
              className={cn("resize-none", touched.address && !addressValid && "border-destructive")}
              required
              autoComplete="street-address"
            />
            {touched.address && !addressValid && deliveryAddress.length > 0 && (
              <p className="text-xs text-destructive">Address is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_notes">Delivery Notes (optional)</Label>
            <Textarea
              id="delivery_notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. gate code, landmark"
              rows={2}
              className="resize-none"
            />
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span aria-hidden>🔒</span> Your address is visible only to this brand for this deal.
          </p>

          <Button
            type="submit"
            className="w-full h-12 font-medium"
            disabled={!canSubmit}
          >
            {isSubmitting ? "Saving…" : "Confirm Delivery Details"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          No product ships without a signed contract.
        </p>

        {hasExistingDelivery && (
          <p className="text-center text-sm text-muted-foreground mt-2">
            You can update your delivery details above and save again.
          </p>
        )}
      </main>
    </div>
  );
}
