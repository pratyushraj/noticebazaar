import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, X, Lock, CheckCircle2, Loader2, ArrowRight, ChevronLeft, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fetchPincodeData } from "@/lib/utils/pincodeLookup";
import { triggerHaptic, HapticPatterns } from "@/lib/utils/haptics";
import * as ds from "@/lib/design-system";

interface Props {
  brandName?: string;
  /** Pre-fill name from creator profile */
  defaultName?: string;
  /** Pre-fill phone from creator profile */
  defaultPhone?: string;
  onClose: () => void;
  onConfirm: (addressData: { address: string; pincode: string; name: string; phone: string }) => void;
}

export function CreatorShippingConfirmationModal({ brandName, defaultName = "", defaultPhone = "", onClose, onConfirm }: Props) {
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Pre-fill name/phone when defaults arrive (profile loaded asynchronously)
  useEffect(() => { if (defaultName && !name) setName(defaultName); }, [defaultName]);
  useEffect(() => { if (defaultPhone && !phone) setPhone(defaultPhone); }, [defaultPhone]);

  const handlePincodeChange = async (val: string) => {
    setPincode(val);
    if (val.length !== 6 || !/^\d{6}$/.test(val)) return;
    setIsLookingUpPincode(true);
    try {
      const data = await fetchPincodeData(val);
      if (data?.city) {
        if (!city.trim()) setCity(data.city);
        triggerHaptic(HapticPatterns.light);
      }
    } catch { /* silent */ }
    finally { setIsLookingUpPincode(false); }
  };

  const phoneValid = /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""));
  const pincodeValid = /^\d{6}$/.test(pincode.trim());
  const addressValid = addressLine.trim().length > 5 && pincodeValid;
  const nameValid = name.trim().length >= 2;
  const canSubmit = nameValid && phoneValid && addressValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      name: name.trim(),
      phone: phone.replace(/\s/g, "").trim(),
      address: [addressLine.trim(), city.trim()].filter(Boolean).join(", "),
      pincode: pincode.trim(),
    });
  };

  const fieldClass = cn(
    "h-12 bg-white/5 border-white/5 text-white placeholder:text-white/20 rounded-xl transition-all",
    "focus:bg-white/[0.08] focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10",
    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
  );
  const labelClass = ds.typography.label;

  const modalContent = (
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
                <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-black mt-0.5">
                  Where should {brandName || 'the brand'} send the product?
                </p>
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

          <form onSubmit={handleSubmit} className="relative p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
              <Lock className="h-4 w-4 mt-0.5 shrink-0 text-blue-400/60" />
              <p className="text-[11px] leading-relaxed text-white/50">
                This address will only be shared with <span className="text-white/70 font-bold">{brandName || 'the brand'}</span> for product delivery. Please ensure your name and phone number are accurate.
              </p>
            </div>

            <div className="space-y-4">
              {/* Name + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="creator-shipping-name" className={labelClass}>
                    <span className="flex items-center gap-1.5"><User className="h-3 w-3 opacity-50" />Full Name</span>
                  </Label>
                  <Input
                    id="creator-shipping-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rohit Sharma"
                    className={cn(fieldClass, !nameValid && name.length > 0 && "border-rose-500/30")}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="creator-shipping-phone" className={labelClass}>
                    <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-50" />Phone No.</span>
                  </Label>
                  <Input
                    id="creator-shipping-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="tel"
                    placeholder="9876543210"
                    className={cn(fieldClass, phone.length > 0 && !phoneValid && "border-rose-500/30")}
                    required
                    autoComplete="tel"
                  />
                  {phone.length === 10 && phoneValid && (
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">✓ Valid</p>
                  )}
                  {phone.length === 10 && !phoneValid && (
                    <p className="text-[10px] text-rose-400 font-bold mt-0.5">Invalid number</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label htmlFor="creator-shipping-address" className={labelClass}>Street Address</Label>
                <Input
                  id="creator-shipping-address"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Flat No, Building, Street, Area"
                  className={fieldClass}
                  required
                  autoComplete="street-address"
                />
              </div>

              {/* Pincode + City row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label htmlFor="creator-shipping-city" className={labelClass}>City (Auto-filled)</Label>
                  <Input
                    id="creator-shipping-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className={fieldClass}
                    autoComplete="address-level2"
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
                "rounded-2xl mt-2"
              )}
            >
              Accept &amp; Confirm Address <ArrowRight className="w-4 h-4 ml-2" />
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

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
