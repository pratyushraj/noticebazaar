import { useState } from "react";
import { MapPin, X, Lock, CheckCircle2, Loader2, ArrowRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/utils/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchPincodeData } from "@/lib/utils/pincodeLookup";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import * as ds from "@/lib/design-system";

interface Props {
  brandName?: string;
  onClose: () => void;
  onConfirm: (addressData: { address: string; pincode: string }) => void;
}

export function CreatorShippingConfirmationModal({ brandName, onClose, onConfirm }: Props) {
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        triggerHaptic(HapticPatterns.light);
      }
    } catch { /* silent */ }
    finally { setIsLookingUpPincode(false); }
  };

  const pincodeValid = /^\d{6}$/.test(pincode.trim());
  const addressValid = addressLine.trim().length > 5 && pincodeValid;
  const canSubmit = addressValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onConfirm({
      address: addressLine.trim(),
      pincode: pincode.trim(),
    });
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
                <h2 className={ds.typography.h3}>Confirm Shipping</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-black mt-0.5">Where should {brandName || 'the brand'} send the product?</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close shipping confirmation"
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white/40" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
             <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-blue-400/60" />
              <p className="text-[11px] leading-relaxed text-white/50">
                This address will be used to generate the shipping label. Please ensure it's accurate and you're available to receive the package.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creator-shipping-address" className={labelClass}>Street Address</Label>
                <Input
                  id="creator-shipping-address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat No, Building, Street, Area"
                  className={fieldClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creator-shipping-pincode" className={labelClass}>Pincode</Label>
                  <div className="relative">
                    <Input
                      id="creator-shipping-pincode"
                      value={pincode}
                      onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="400001"
                      className={fieldClass}
                      required
                    />
                    {isLookingUpPincode && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 animate-spin" />
                    )}
                    {pincodeValid && !isLookingUpPincode && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creator-shipping-city" className={labelClass}>City (Auto-filled)</Label>
                  <Input
                    id="creator-shipping-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full h-14 text-base font-black uppercase tracking-widest transition-all",
                canSubmit ? "bg-blue-600 hover:bg-blue-500 shadow-xl" : "bg-white/5",
                "rounded-2xl mt-4"
              )}
            >
              Accept & Confirm Address <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              aria-label="Return to offer details"
              className="w-full h-12 rounded-2xl text-white/70 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Offer
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
