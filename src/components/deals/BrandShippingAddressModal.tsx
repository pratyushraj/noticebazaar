import { useState, useEffect } from "react";
import { MapPin, X, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchPincodeData } from "@/lib/utils/pincodeLookup";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import * as ds from "@/lib/design-system";

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
        const [profileRes, dealRes] = await Promise.all([
          fetch(`${getApiBaseUrl()}/api/brand-dashboard/profile`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`${getApiBaseUrl()}/api/deals/${dealId}?t=${Date.now()}`, {
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

        if (dealJson.success && dealJson.deal?.brand_address) {
          addr = dealJson.deal.brand_address;
          phoneVal = dealJson.deal.brand_phone || "";
          if (dealJson.deal.contact_person) setContactName(dealJson.deal.contact_person);
        } else if (profileJson.success && profileJson.brand?.company_address) {
          addr = profileJson.brand.company_address;
          phoneVal = profileJson.brand.whatsapp_handle || "";
        }

        if (addr) {
          const parts = addr.split(",");
          if (parts.length >= 3) {
            setAddressLine(parts[0].trim());
            if (parts.length > 3) setAddressLine2(parts[1].trim());
            
            const lastPart = parts[parts.length - 1].trim();
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

      triggerHaptic(HapticPatterns.success);
      toast.success("Shipping address saved successfully.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = cn(
    "h-12 bg-white/5 border-white/5 text-white placeholder:text-white/20 rounded-xl transition-all",
    "focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10",
    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
  );

  const labelClass = ds.typography.label;

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
            "relative w-full max-w-lg overflow-hidden",
            ds.ios.glass.full,
            "rounded-[32px] sm:rounded-[40px]",
            "shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
          )}
          role="dialog"
          aria-modal
        >
          {/* Spotlight Effect */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-6 py-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <MapPin className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className={ds.typography.h3}>Fulfillment Address</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-black mt-0.5">Logistics & Compliance</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
            >
              <X className="h-5 w-5 text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
            {/* Privacy Note */}
            <div className="flex items-start gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-blue-400/60" />
              <p className="text-[11px] leading-relaxed text-white/50">
                Encrypted storage. Shared only with{" "}
                <span className="text-white/80 font-bold">{creatorName || "the creator"}</span>{" "}
                for shipping, legal contracts, and tax compliance.
              </p>
            </div>

            {/* Contact Group */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Contact Name</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Dispatch head"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  inputMode="numeric"
                  placeholder="Fulfillment contact"
                  className={fieldClass}
                />
              </div>
            </div>

            {/* Address Lines */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className={labelClass}>Street Address *</Label>
                <Input
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                  placeholder="Building, Street, Locality"
                  className={cn(fieldClass, touched.address && !addressLine.trim() && "border-red-500/50 bg-red-500/5")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Suite / Floor (Optional)</Label>
                <Input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Landmark, Suite, Floor"
                  className={fieldClass}
                />
              </div>
            </div>

            {/* City + Pincode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>City *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  placeholder="Mumbai"
                  className={cn(fieldClass, touched.city && !city.trim() && "border-red-500/50 bg-red-500/5")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Pincode *</Label>
                <div className="relative">
                  <Input
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                    inputMode="numeric"
                    placeholder={isLookingUpPincode ? "Looking up..." : "400001"}
                    className={cn(fieldClass, touched.pincode && !pincodeValid && "border-red-500/50 bg-red-500/5")}
                    required
                  />
                  {pincodeValid && !isLookingUpPincode && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  )}
                </div>
              </div>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label className={labelClass}>State *</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                placeholder="Maharashtra"
                className={cn(fieldClass, touched.state && !state.trim() && "border-red-500/50 bg-red-500/5")}
                required
              />
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-4">
              {/* Default Toggle */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSaveAsDefault(!saveAsDefault);
                }}
                className="flex items-center gap-3 group"
              >
                <div className={cn(
                  "w-10 h-6 rounded-full relative transition-all duration-300",
                  saveAsDefault ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-white/10"
                )}>
                  <div className={cn(
                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md",
                    saveAsDefault ? "translate-x-4" : "translate-x-0"
                  )} />
                </div>
                <span className="text-[13px] font-medium text-white/50 group-hover:text-white/80 transition-colors">Save as default profile address</span>
              </button>

              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={cn(
                  "w-full h-14 text-base font-black uppercase tracking-widest transition-all",
                  canSubmit ? "bg-blue-600 hover:bg-blue-500 shadow-[0_10px_30px_rgba(37,99,235,0.3)]" : "bg-white/5",
                  "rounded-2xl"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Synchronizing...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Confirm Address
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
