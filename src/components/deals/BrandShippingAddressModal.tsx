import { useState, useEffect } from "react";
import { MapPin, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchPincodeData } from "@/lib/utils/pincodeLookup";

interface Props {
  dealId: string;
  creatorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BrandShippingAddressModal({ dealId, creatorName, onClose, onSuccess }: Props) {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const [addressLine, setAddressLine] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    address: false, city: false, state: false, pincode: false,
  });
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [brandProfileData, setBrandProfileData] = useState<any>(null);

  // Pre-fill from deal or brand profile if available
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return;
      try {
        // Fetch both profile and deal data
        const [profileRes, dealRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/brand-dashboard/profile`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`${getApiBaseUrl()}/api/deals/${dealId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        ]);

        const profileJson = await profileRes.json();
        const dealJson = await dealRes.json();

        let addr = "";
        let phoneVal = "";

        if (profileJson.success && profileJson.brand) {
          setBrandProfileData(profileJson.brand);
        }

        // Prioritize deal-specific address if already set, else use profile default
        if (dealJson.success && dealJson.deal?.brand_address) {
          addr = dealJson.deal.brand_address;
          phoneVal = dealJson.deal.brand_phone || "";
        } else if (profileJson.success && profileJson.brand?.company_address) {
          addr = profileJson.brand.company_address;
          phoneVal = profileJson.brand.whatsapp_handle || "";
        }

        if (addr) {
          // Basic heuristic to parse "Street, City, State - Pincode"
          const parts = addr.split(",");
          if (parts.length >= 3) {
            setAddressLine(parts[0].trim());
            if (parts.length > 3) setAddressLine2(parts[1].trim());
            
            const lastPart = parts[parts.length - 1].trim(); // "State - Pincode" or just "Pincode"
            const cityPart = parts[parts.length - 2].trim();
            setCity(cityPart);

            if (lastPart.includes("-")) {
              const [s, p] = lastPart.split("-");
              setState(s.trim());
              setPincode(p.trim());
            } else {
              setState(lastPart);
            }
          } else {
            setAddressLine(addr);
          }
        }
        
        if (phoneVal) {
          setPhone(phoneVal.replace(/\D/g, "").slice(0, 15));
        }
      } catch (e) {
        console.error("[BrandShippingAddressModal] Failed to pre-fill data:", e);
      }
    };
    fetchData();
  }, [session?.access_token, dealId]);

  // Pincode auto-fill
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    if (val.length !== 6 || !/^\d{6}$/.test(val)) return;
    setIsLookingUpPincode(true);
    try {
      const data = await fetchPincodeData(val);
      if (data?.city) {
        if (!city.trim()) setCity(data.city);
        if (!state.trim()) setState(data.state || "");
      }
    } catch { /* silent */ }
    finally { setIsLookingUpPincode(false); }
  };

  const pincodeValid = /^\d{6}$/.test(pincode.trim());
  const addressValid =
    addressLine.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    pincodeValid;
  const canSubmit = addressValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !session?.access_token) return;

    const combinedAddress = `${addressLine.trim()}${addressLine2.trim() ? `, ${addressLine2.trim()}` : ""}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/deals/${dealId}/brand-shipping-address`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: combinedAddress,
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save address");

      // 2. Save as default if checked and we have profile data
      if (saveAsDefault && brandProfileData) {
        try {
          await fetch(`${getApiBaseUrl()}/api/brand-dashboard/profile`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...brandProfileData,
              company_address: combinedAddress,
            }),
          });
        } catch (e) {
          console.error("Failed to update default address:", e);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["brand_deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["brand_deals"] });
      queryClient.invalidateQueries({ queryKey: ["brand_profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Shipping address saved.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "h-11 bg-[#161B22] border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal
        aria-label="Provide shipping address"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            <span className="font-bold text-white text-base">Business & Return Address</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Privacy & Rationale note */}
          <div className="flex items-start gap-2 text-xs text-white/45 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/30" />
            <span>
              This address is shared only with{" "}
              <span className="text-white/65 font-medium">{creatorName || "the creator"}</span>{" "}
              for return logistics, legal contract verification, and tax compliance.
            </span>
          </div>

          {/* Optional contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Contact name (optional)</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Dispatch contact"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Phone (optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                inputMode="numeric"
                placeholder="Contact number"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Address line 1 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Address line 1 *</Label>
            <Input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, address: true }))}
              placeholder="Building / street / locality"
              className={cn(fieldClass, touched.address && !addressLine.trim() && "border-red-500/60")}
              required
            />
            {touched.address && !addressLine.trim() && (
              <p className="text-xs text-red-400">Address is required</p>
            )}
          </div>

          {/* Address line 2 */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">Address line 2 (optional)</Label>
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Landmark / floor / suite"
              className={fieldClass}
            />
          </div>

          {/* City + Pincode */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                placeholder="City"
                className={cn(fieldClass, touched.city && !city.trim() && "border-red-500/60")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/50">Pincode *</Label>
              <Input
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                inputMode="numeric"
                placeholder={isLookingUpPincode ? "Looking up..." : "Pincode"}
                className={cn(fieldClass, touched.pincode && !pincodeValid && "border-red-500/60")}
                required
              />
            </div>
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <Label className="text-xs text-white/50">State *</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, state: true }))}
              placeholder="State"
              className={cn(fieldClass, touched.state && !state.trim() && "border-red-500/60")}
              required
            />
          </div>

          {/* Save as default toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSaveAsDefault(!saveAsDefault)}
              className={cn(
                "w-10 h-6 rounded-full relative transition-colors duration-200",
                saveAsDefault ? "bg-blue-600" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200",
                  saveAsDefault ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
            <span className="text-xs font-medium text-white/60">Save as default in my profile</span>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full h-12 font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Shipping Address"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
