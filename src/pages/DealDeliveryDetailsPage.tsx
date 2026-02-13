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
import { useQueryClient } from "@tanstack/react-query";

export default function DealDeliveryDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const queryClient = useQueryClient();
  const { data: deal, isLoading: isLoadingDeal } = useBrandDealById(dealId, profile?.id);

  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState({ phone: false, address: false, city: false, state: false, pincode: false });

  const dealType = (deal as any)?.deal_type;
  const hasExistingDelivery =
    (deal as any)?.delivery_name && (deal as any)?.delivery_phone && (deal as any)?.delivery_address;

  useEffect(() => {
    if (deal) {
      setDeliveryName((deal as any).delivery_name ?? "");
      setDeliveryPhone((deal as any).delivery_phone ?? "");
      const fullAddress = (deal as any).delivery_address ?? "";
      setDeliveryAddress(fullAddress);

      // Try to parse existing address if it follows our pattern: "line, city, state - pincode"
      if (fullAddress && fullAddress.includes(",")) {
        try {
          const parts = fullAddress.split(",");
          if (parts.length >= 3) {
            setAddressLine(parts[0].trim());
            setCity(parts[1].trim());
            const lastPart = parts[2].trim();
            if (lastPart.includes("-")) {
              const [s, p] = lastPart.split("-");
              setState(s.trim());
              setPincode(p.trim());
            } else {
              setState(lastPart);
            }
          } else {
            setAddressLine(fullAddress);
          }
        } catch (e) {
          setAddressLine(fullAddress);
        }
      } else {
        setAddressLine(fullAddress);
      }
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
  const pincodeValid = /^\d{6}$/.test(pincode.trim());
  const addressValid = addressLine.trim().length > 0 && city.trim().length > 0 && state.trim().length > 0 && pincodeValid;
  const nameValid = deliveryName.trim().length > 0;
  const canSubmit = nameValid && phoneValid && addressValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealId || !session?.access_token || !canSubmit) return;
    triggerHaptic(HapticPatterns.light);
    setIsSubmitting(true);

    // Combine structured address
    const combinedAddress = `${addressLine.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;

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
          delivery_address: combinedAddress,
          delivery_notes: deliveryNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        trackEvent("delivery_details_submitted", { deal_id: dealId, creator_id: profile?.id });
        toast.success("Delivery details saved!");

        // Invalidate queries to ensure fresh data on redirect
        queryClient.invalidateQueries({ queryKey: ["brand_deals"] });
        queryClient.invalidateQueries({ queryKey: ["brand_deal", dealId] });

        setIsSubmitted(true);
        // We delay navigation to show the confirmation state
        setTimeout(() => {
          navigate(`/creator-contracts/${dealId}`, { replace: true });
        }, 2500);
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Package className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Delivery details locked for this deal</h2>
        <p className="text-muted-foreground mb-8">
          You can update this before shipment begins from the deal details page.
        </p>
        <div className="animate-pulse text-sm text-primary font-medium">
          Redirecting to your contract...
        </div>
      </div>
    );
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

      <div className="bg-primary/5 border-b border-primary/10">
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-primary">
          <span aria-hidden>🔒</span>
          Your address is shared only after contract signing and only with this brand.
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-1">
            Brands cannot ship your product until this is filled.
          </p>
          <p className="text-sm text-muted-foreground">
            This protects you from fake or delayed deliveries by ensuring brand accountability.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="delivery_name">Receiver Name</Label>
            <Input
              id="delivery_name"
              value={deliveryName}
              onChange={(e) => setDeliveryName(e.target.value)}
              placeholder="Full name for courier label"
              className="h-12 bg-background border-muted-foreground/20 focus:border-primary"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_phone">WhatsApp / Phone Number</Label>
            <Input
              id="delivery_phone"
              type="tel"
              inputMode="numeric"
              value={deliveryPhone}
              onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="10-digit phone number"
              className={cn(
                "h-12 bg-background border-muted-foreground/20 focus:border-primary",
                touched.phone && !phoneValid && "border-destructive focus:border-destructive"
              )}
              required
              autoComplete="tel"
            />
            <p className="text-[11px] leading-tight text-muted-foreground opacity-80">
              Used strictly for courier updates. Never used for marketing. Never shared publicly.
            </p>
            {touched.phone && !phoneValid && deliveryPhone.length > 0 && (
              <p className="text-xs text-destructive font-medium">Please enter a valid 10-digit number</p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Where should the product be delivered?</Label>

            <div className="space-y-2">
              <Input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                placeholder="Flat / Building / Street Address"
                className={cn(
                  "h-12 bg-background border-muted-foreground/20 focus:border-primary",
                  touched.address && !addressLine.trim() && "border-destructive"
                )}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  placeholder="City"
                  className={cn(
                    "h-12 bg-background border-muted-foreground/20 focus:border-primary",
                    touched.city && !city.trim() && "border-destructive"
                  )}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                  placeholder="Pincode"
                  inputMode="numeric"
                  className={cn(
                    "h-12 bg-background border-muted-foreground/20 focus:border-primary",
                    touched.pincode && !pincodeValid && "border-destructive"
                  )}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                placeholder="State"
                className={cn(
                  "h-12 bg-background border-muted-foreground/20 focus:border-primary",
                  touched.state && !state.trim() && "border-destructive"
                )}
                required
              />
            </div>
            {touched.pincode && !pincodeValid && pincode.length > 0 && (
              <p className="text-xs text-destructive font-medium">Valid 6-digit Pincode required</p>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="delivery_notes" className="text-sm">Delivery Notes (optional)</Label>
            <Textarea
              id="delivery_notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Near HDFC Bank, Doorbell not working"
              rows={2}
              className="resize-none bg-background border-muted-foreground/20 focus:border-primary"
            />
          </div>

          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Address...
                </span>
              ) : (
                "Confirm Address & Continue"
              )}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground font-medium uppercase tracking-wider">
              Product ships only after contract signing
            </p>
          </div>
        </form>

        {hasExistingDelivery && !isSubmitted && (
          <div className="mt-8 p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 text-center">
            <p className="text-xs text-muted-foreground">
              You already have delivery details saved. Updating them will regenerate the contract with the new address.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
