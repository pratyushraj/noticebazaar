

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Package, Lock } from 'lucide-react';
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
import { CreatorNavigationWrapper } from "@/components/navigation/CreatorNavigationWrapper";
import { gradients, spacing, typography, animations, buttons } from "@/lib/design-system";
import { fetchPincodeData } from "@/lib/utils/pincodeLookup";

const DELIVERY_PREFS_STORAGE_KEY = "nb_creator_delivery_prefs_v1";

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
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, phone: false, address: false, city: false, state: false, pincode: false });

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
          if (parts.length >= 4) {
            setAddressLine(parts[0].trim());
            setAddressLine2(parts[1].trim());
            setCity(parts[2].trim());
            const lastPart = parts[3].trim();
            if (lastPart.includes("-")) {
              const [s, p] = lastPart.split("-");
              setState(s.trim());
              setPincode(p.trim());
            } else {
              setState(lastPart);
            }
          } else if (parts.length >= 3) {
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

  // Removed auto-fill from localStorage for security/privacy.
  // Profile pre-fill (below) handles the user's saved data securely from the DB.

  // Auto-fill from profile if no existing delivery details
  useEffect(() => {
    if (hasExistingDelivery) return;
    if (!profile) return;
    const profileName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    if (profileName) setDeliveryName((current) => current || profileName);
    if ((profile as any)?.phone) setDeliveryPhone((current) => current || String((profile as any).phone));
  }, [profile, hasExistingDelivery]);

  useEffect(() => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;
    
    const lookupPincode = async () => {
      setIsLookingUpPincode(true);
      try {
        const data = await fetchPincodeData(pincode);
        if (data?.city) {
          if (!city.trim()) setCity(data.city);
          if (!state.trim()) setState(data.state || "");
        }
      } catch {
        // Silent fail - user can fill manually
      } finally {
        setIsLookingUpPincode(false);
      }
    };
    
    lookupPincode();
  }, [pincode]);

  // Redirect if not relevant or not owner
  useEffect(() => {
    if (isLoadingDeal || !dealId) return;
    if (!profile?.id) return;
    if (!deal) {
      toast.error("Deal not found");
      navigate("/creator-dashboard", { replace: true });
      return;
    }
    const requiresShipping = (deal as any)?.shipping_required;
    // Only barter deals and paid deals with explicit shipping_required should see this page.
    // Pure paid/service deals without shipping_required skip to the deal page.
    if (!requiresShipping && dealType !== "barter") {
      navigate(`/deal/${dealId}`, { replace: true });
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
    setSubmitError(null);

    // Combine structured address
    const combinedAddress = `${addressLine.trim()}${addressLine2.trim() ? `, ${addressLine2.trim()}` : ""}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;

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

        // Security: Removed local storage of PII (address/phone) to protect users on shared devices.
        // We now rely purely on the database for persistence.

        // We delay navigation to show the confirmation state
        setTimeout(() => {
          navigate(`/deal/${dealId}`, { replace: true });
        }, 2500);
      } else {
        const err = data?.error || "Failed to save delivery details";
        setSubmitError(err);
        toast.error(err);
      }
    } catch {
      const err = "Failed to save. Please try again.";
      setSubmitError(err);
      toast.error(err);
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

  if ((deal as any)?.shipping_required === false && dealType !== "barter") {
    return null;
  }

  // Force readable input contrast across webviews/browsers where input backgrounds may be normalized to white.
  const fieldClass =
    "h-11 sm:h-12 !bg-card !text-neutral-900 !caret-neutral-900 border-border placeholder:!text-neutral-500 focus:!border-info focus:ring-2 focus:ring-blue-400/20";
  const textAreaFieldClass =
    "!bg-card !text-neutral-900 !caret-neutral-900 border-border placeholder:!text-neutral-500 focus:!border-info focus:ring-2 focus:ring-blue-400/20";

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Package className="h-8 w-8 text-primary animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Address saved!</h2>
        <p className="text-muted-foreground mb-8">
          You can update this anytime from the deal page.
        </p>
        <div className="animate-pulse text-sm text-primary font-medium">
          Taking you back to your deal...
        </div>
      </div>
    );
  }

  return (
    <CreatorNavigationWrapper
      title="Add Your Address"
      subtitle="Only needed for product deals."
      showBackButton
    >
      <div className="bg-secondary/6 border-b border-border/12">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-start gap-2 text-xs font-semibold text-foreground/80">
          <span className="mt-0.5 text-foreground/70" aria-hidden>
            <Lock className="h-4 w-4" />
          </span>
          Your address is shared only after contract signing and only with this brand.
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-1">
            Add your address so the brand can ship the product.
          </p>
          <p className="text-sm text-muted-foreground">
            You only do this when shipping is required. We will save it for the next product deal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
          <div className="space-y-2">
            <Label htmlFor="delivery_name" className="text-foreground/70">Your name</Label>
            <Input
              id="delivery_name"
              value={deliveryName}
              onChange={(e) => setDeliveryName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Your full name"
              className={cn(
                fieldClass,
                touched.name && !nameValid && "border-destructive focus:border-destructive"
              )}
              required
              autoComplete="name"
            />
            {touched.name && !nameValid && (
              <p className="text-xs text-destructive font-medium">Receiver name is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_phone" className="text-foreground/70">Phone number</Label>
            <Input
              id="delivery_phone"
              type="tel"
              inputMode="numeric"
              value={deliveryPhone}
              onChange={(e) => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="For delivery updates only"
              className={cn(
                fieldClass,
                touched.phone && !phoneValid && "border-destructive focus:border-destructive"
              )}
              required
              autoComplete="tel"
            />
            <p className="text-[11px] leading-tight text-foreground/55">
              Used only for delivery updates.
            </p>
            {touched.phone && !phoneValid && deliveryPhone.length > 0 && (
              <p className="text-xs text-destructive font-medium">Please enter a valid 10-digit number</p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-foreground/70">Delivery address</Label>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/55">Address line 1</Label>
              <Input
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                placeholder="House / flat / street / area"
                className={cn(
                  fieldClass,
                  touched.address && !addressLine.trim() && "border-destructive"
                )}
                required
              />
              {touched.address && !addressLine.trim() && (
                <p className="text-xs text-destructive font-medium">Address line 1 is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/55">Address line 2 (optional)</Label>
              <Input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Landmark / apartment / delivery hint"
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-foreground/55">City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  placeholder="City"
                  className={cn(
                    fieldClass,
                    touched.city && !city.trim() && "border-destructive"
                  )}
                  required
                />
                {touched.city && !city.trim() && (
                  <p className="text-xs text-destructive font-medium">City is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-foreground/55">Pincode</Label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                  placeholder={isLookingUpPincode ? "Looking up..." : "Pincode"}
                  inputMode="numeric"
                  className={cn(
                    fieldClass,
                    touched.pincode && !pincodeValid && "border-destructive"
                  )}
                  required
                />
                {touched.pincode && !pincodeValid && pincode.length > 0 && (
                  <p className="text-xs text-destructive font-medium">Valid 6-digit Pincode required</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-foreground/55">State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                placeholder="State"
                className={cn(
                  fieldClass,
                  touched.state && !state.trim() && "border-destructive"
                )}
                required
              />
              {touched.state && !state.trim() && (
                <p className="text-xs text-destructive font-medium">State is required</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="delivery_notes" className="text-sm text-foreground/70">Delivery notes (optional)</Label>
            <Textarea
              id="delivery_notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Near HDFC Bank, gate code, or delivery timing note"
              rows={2}
              className={cn("resize-none", textAreaFieldClass)}
            />
          </div>

          <div className="sticky bottom-0 -mx-4 px-4 pb-4 pt-3 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/95 to-transparent backdrop-blur border-t border-border space-y-3">
            {submitError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm px-3 py-2">
                {submitError}
              </div>
            )}
            <button type="submit"
              className={cn(buttons.primary, "w-full h-14 text-base font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed")}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-border border-t-white rounded-full animate-spin" />
                  Saving address...
                </span>
              ) : (
                "Save Address"
              )}
            </button>
            <p className="text-[11px] text-center text-muted-foreground font-medium uppercase tracking-wider">
              The brand sees this only for this product deal
            </p>
          </div>
        </form>

        {hasExistingDelivery && !isSubmitted && (
          <div className="mt-8 p-4 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 text-center">
            <p className="text-xs text-muted-foreground">
              You already have an address saved. Updating it will update the contract.
            </p>
          </div>
        )}
      </main>
    </CreatorNavigationWrapper>
  );
}
