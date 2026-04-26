import { useState } from "react";
import { MapPin, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useSession } from "@/contexts/SessionContext";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

  // Pincode auto-fill
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    if (val.length !== 6 || !/^\d{6}$/.test(val)) return;
    setIsLookingUpPincode(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        if (!city.trim()) setCity(po.District || "");
        if (!state.trim()) setState(po.State || "");
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

      queryClient.invalidateQueries({ queryKey: ["brand_deal", dealId] });
      queryClient.invalidateQueries({ queryKey: ["brand_deals"] });

      toast.success("Shipping address saved. Creator can now proceed.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    "h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15";

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
            <span className="font-bold text-white text-base">Your Shipping Address</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Privacy note */}
          <div className="flex items-start gap-2 text-xs text-white/45 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-white/30" />
            <span>
              This address is shared only with{" "}
              <span className="text-white/65 font-medium">{creatorName || "the creator"}</span>{" "}
              for this deal's product fulfillment.
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
