import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Youtube, Loader2, ChevronRight, ShieldCheck, Target, FileText, ImageIcon, Lock, Clapperboard, FileCheck, Clock, Plus, Minus, Check, CircleDollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { getApiBaseUrl } from '@/lib/utils/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/avatar';

interface Creator {
  id: string;
  name: string;
  username: string;
  profile_photo?: string | null;
  followers?: number | null;
  top_cities?: string[];
  avg_reel_views?: number | null;
  past_brands?: string[];
}

type CollabType = 'paid' | 'barter' | 'hybrid';

interface FormErrors {
  brandName?: string;
  brandEmail?: string;
  brandAddress?: string;
  campaignDescription?: string;
  deliverables?: string;
}

const DELIVERABLE_OPTIONS = [
  { label: 'Reel', value: 'Instagram Reel', icon: <Clapperboard className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Post', value: 'Post', icon: <ImageIcon className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Story', value: 'Story', icon: <FileText className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'YouTube', value: 'YouTube Video', icon: <Youtube className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
  { label: 'Custom', value: 'Custom', icon: <Target className="h-3.5 w-3.5 text-slate-400 inline-block" /> },
];

const ESTIMATED_RATES: Record<string, number> = {
  'Instagram Reel': 8500,
  'Post': 4500,
  'Story': 2500,
  'YouTube Video': 15000,
  'Custom': 5000
};

const CollabLinkLanding = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [collabType, setCollabType] = useState<CollabType>('paid');
  const [brandName, setBrandName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');
  const [brandAddress, setBrandAddress] = useState('');
  const [exactBudget, setExactBudget] = useState('');
  const [barterValue, setBarterValue] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [usageRights, setUsageRights] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [authorizedSignerName, setAuthorizedSignerName] = useState('');
  const [authorizedSignerRole, setAuthorizedSignerRole] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Progressive Flow State
  const [currentStep, setCurrentStep] = useState(1);
  const [deliverableQuantities, setDeliverableQuantities] = useState<Record<string, number>>({});
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [saveDraftSubmitting, setSaveDraftSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showContractPreview, setShowContractPreview] = useState(false);
  const [searchParams] = useSearchParams();

  // Helper functions
  const handleDeliverableQuantityChange = (deliverable: string, delta: number) => {
    setDeliverableQuantities(prev => ({
      ...prev,
      [deliverable]: Math.max(1, (prev[deliverable] || 1) + delta)
    }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!campaignDescription.trim() || campaignDescription.trim().length < 10) {
        setErrors(prev => ({ ...prev, campaignDescription: 'Please provide more campaign details' }));
        toast.error('Please describe your campaign goal');
        return;
      }
      setErrors(prev => ({ ...prev, campaignDescription: '' }));
    }
    if (currentStep === 2) {
      if (deliverables.length === 0) {
        toast.error('Please select at least one deliverable');
        return;
      }
      if (collabType !== 'barter' && !exactBudget) {
        toast.error('Please specify a budget');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeliverableToggle = (deliverable: string) => {
    setDeliverables(prev =>
      prev.includes(deliverable)
        ? prev.filter(d => d !== deliverable)
        : [...prev, deliverable]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!brandName.trim()) newErrors.brandName = 'Brand name is required';
    if (!brandEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail)) newErrors.brandEmail = 'Valid email is required';
    if (!brandAddress.trim() || brandAddress.trim().length < 15) newErrors.brandAddress = 'Full registered address is required';
    if (!campaignDescription.trim() || campaignDescription.trim().length < 20) newErrors.campaignDescription = 'Detailed description required';
    if (deliverables.length === 0) newErrors.deliverables = 'Select at least one deliverable';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraftSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail)) {
      toast.error('Valid email required.');
      return;
    }
    setSaveDraftSubmitting(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/collab/${encodeURIComponent(username || '')}/save-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: draftEmail, formData: { brandName, brandEmail, campaignDescription, deliverables } }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Draft saved!');
        setShowSaveDraftModal(false);
      }
    } catch {
      toast.error('Failed to save draft.');
    } finally {
      setSaveDraftSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/collab/${username}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          brand_email: brandEmail,
          brand_address: brandAddress,
          collab_type: collabType,
          exact_budget: exactBudget ? parseFloat(exactBudget) : undefined,
          campaign_description: campaignDescription,
          deliverables,
          usage_rights: usageRights,
          deadline,
          authorized_signer_name: authorizedSignerName,
          authorized_signer_role: authorizedSignerRole,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsSuccess(true);
        // Wait for animation to play before navigating
        setTimeout(() => {
          navigate(`/deal/${data.request.id}`);
        }, 2200);
      } else {
        toast.error(data.error || 'Submission failed');
      }
    } catch {
      toast.error('Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    const fetchCreator = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/collab/${encodeURIComponent(username)}`);
        const data = await response.json();
        if (data.success) setCreator(data.creator);
      } catch {
        setError('Failed to load creator');
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [username]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;
  if (error || !creator) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error || 'Creator not found'}</div>;

  const creatorName = creator.name || 'Creator';

  return (
    <div className="min-h-screen bg-[#0E061E] text-white selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 pt-6 pb-24 md:pt-12 md:pb-32 max-w-4xl relative">
        <div className="mb-8 md:mb-12 text-center">
          <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Collaboration Link
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            Create Collaboration with <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{creatorName}</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-white/50 text-sm md:text-lg max-w-xl mx-auto font-medium">A professional, secure, and legally-binding workflow for brands.</p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300">
              <Clock className="w-3.5 h-3.5" /> Takes ~45 seconds
            </div>
          </div>
        </div>

        <div className="mb-6 mx-auto max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12 border border-white/20">
            <AvatarImage src={creator.profile_photo || ''} />
            <AvatarFallback>{getInitials(creatorName.split(' ')[0], creatorName.split(' ')[1] || '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Pitching Creator</p>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black truncate">{creatorName}</h3>
            </div>
            {creator.past_brands && creator.past_brands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[9px] font-black uppercase text-white/20">Has worked with:</span>
                {creator.past_brands.slice(0, 3).map((brand, i) => (
                  <span key={i} className="text-[9px] font-bold text-white/60 bg-white/5 px-1.5 py-0.5 rounded shadow-sm border border-white/5">{brand}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8">
            <div id="core-offer-form" className="rounded-[32px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="px-6 pt-8 md:px-10">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-6">
                    {[
                      { step: 1, label: 'Campaign' },
                      { step: 2, label: 'Deliverables' },
                      { step: 3, label: 'Contract' }
                    ].map((s) => (
                      <div key={s.step} className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                          currentStep === s.step ? "bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]" : (currentStep > s.step ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40")
                        )}>
                          {currentStep > s.step ? <Check className="w-3.5 h-3.5" /> : s.step}
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest hidden sm:inline",
                          currentStep === s.step ? "text-white" : "text-white/40"
                        )}>
                          {s.label} {currentStep > s.step && '✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">Stage {currentStep} of 3 • ~1 min left</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isSuccess && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="relative mb-8">
                        {/* Outer glowing ring */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"
                        />
                        {/* Success circle */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                          }}
                          className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 relative z-10"
                        >
                          <motion.div
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                          >
                            <CheckCircle2 className="w-12 h-12 text-white stroke-[3px]" />
                          </motion.div>
                        </motion.div>
                      </div>

                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-3xl font-black mb-2 tracking-tight"
                      >
                        Offer Sent!
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/40 text-sm max-w-[240px]"
                      >
                        Great! Your proposal has been sent to {creatorName}.
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400/60"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" /> Preparing workspace...
                      </motion.div>
                    </motion.div>
                  )}

                  {!isSuccess && currentStep === 1 && (
                    <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-10">
                      <div className="space-y-2"><h2 className="text-2xl font-black">Campaign Details</h2></div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase text-white/40">Deal Type</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['paid', 'barter', 'hybrid'].map(id => (
                            <button key={id} onClick={() => setCollabType(id as any)} className={cn("p-4 rounded-2xl border text-left", collabType === id ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5")}>
                              <p className="text-sm font-black capitalize">{id}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-white/40">Goal</label>
                        <Textarea value={campaignDescription} onChange={e => setCampaignDescription(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl" placeholder="Describe your campaign goals..." />
                      </div>
                    </motion.div>
                  )}

                  {!isSuccess && currentStep === 2 && (
                    <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-10">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black">Deliverables & Budget</h2>
                        <p className="text-white/40 text-sm">Define what is expected and the commercial offer.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DELIVERABLE_OPTIONS.map(opt => {
                          const active = deliverables.includes(opt.value);
                          const qty = deliverableQuantities[opt.value] || 1;
                          const estValue = (ESTIMATED_RATES[opt.value] || 0) * qty;
                          return (
                            <motion.div
                              key={opt.value}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "p-5 rounded-[24px] border transition-all flex items-center justify-between cursor-pointer",
                                active ? "bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5" : "bg-white/5 border-white/5"
                              )}
                              onClick={() => handleDeliverableToggle(opt.value)}
                            >
                              <div className="flex items-center gap-4 flex-1 text-left">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                  active ? "bg-blue-500 text-white shadow-xl shadow-blue-500/30" : "bg-white/5 text-slate-400"
                                )}>
                                  {opt.icon}
                                </div>
                                <div className="flex flex-col">
                                  <span className={cn("text-base font-black tracking-tight", active ? "text-white" : "text-white/40")}>{opt.label}</span>
                                  {active && <span className="text-[10px] font-bold text-blue-400">Est. ₹{estValue.toLocaleString()}</span>}
                                </div>
                              </div>
                              {active && (
                                <div className="flex items-center gap-3 bg-slate-950/40 rounded-xl px-2.5 py-1.5 border border-white/5" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => handleDeliverableQuantityChange(opt.value, -1)} className="p-1.5 text-white/40 hover:text-white transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                                  <span className="text-sm font-black min-w-[24px] text-center">{qty}</span>
                                  <button onClick={() => handleDeliverableQuantityChange(opt.value, 1)} className="p-1.5 text-white/40 hover:text-white transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-blue-400">
                          <CircleDollarSign className="w-5 h-5" /> Commercial Offer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(collabType === 'paid' || collabType === 'hybrid') && (
                            <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Cash Component (INR)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/40">₹</span>
                                <Input type="number" value={exactBudget} onChange={e => setExactBudget(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl pl-8 focus:border-blue-500/50" placeholder="0" />
                              </div>

                              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-black uppercase text-white/40">Deal Strength</span>
                                  <span className={cn("text-[10px] font-black uppercase", Number(exactBudget) >= 15000 ? "text-emerald-400" : "text-amber-400")}>
                                    {Number(exactBudget) >= 15000 ? "Strong" : "Average"}
                                  </span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                    className={cn("h-full", Number(exactBudget) >= 15000 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]")}
                                    animate={{ width: `${Math.min(100, (Number(exactBudget) / 25000) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          {(collabType === 'barter' || collabType === 'hybrid') && (
                            <div className="space-y-3">
                              <label className="text-[11px] font-black uppercase tracking-widest text-white/40">Product/Service Value (INR)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-white/40">₹</span>
                                <Input type="number" value={barterValue} onChange={e => setBarterValue(e.target.value)} className="h-14 bg-white/5 border-white/10 rounded-2xl pl-8 focus:border-blue-500/50" placeholder="0" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {!isSuccess && currentStep === 3 && (
                    <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-10">
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black">Contract Details</h2>
                        <p className="text-white/40 text-sm">Final details to generate the legal agreement.</p>
                      </div>

                      <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-black uppercase tracking-widest text-blue-300 flex items-center gap-2">
                            <FileCheck className="w-4 h-4" /> Offer Summary
                          </h3>
                          <button onClick={() => setShowContractPreview(true)} className="text-[10px] font-black uppercase text-blue-400 hover:text-white transition-colors flex items-center gap-1 group">
                            Preview Contract <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40 font-medium">Type</span>
                            <span className="text-white font-black capitalize">{collabType}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40 font-medium">Budget</span>
                            <span className="text-emerald-400 font-black">₹{Number(exactBudget || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/40 font-medium">Deliverables</span>
                            <span className="text-white font-black">{deliverables.length} Items</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deliverables.map(d => (
                              <span key={d} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white/60">
                                {deliverableQuantities[d] || 1}x {d.split(' ').pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-white/40">Brand Name</label>
                          <Input value={brandName} onChange={e => setBrandName(e.target.value)} className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-white/40">Work Email</label>
                          <Input value={brandEmail} onChange={e => setBrandEmail(e.target.value)} className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase text-white/40">Address</label>
                        <Textarea value={brandAddress} onChange={e => setBrandAddress(e.target.value)} className="bg-white/5 border-white/10 rounded-xl" />
                      </div>

                      <div className="space-y-4 pt-4">
                        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 group transition-all">
                          {submitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                          ) : (
                            <span className="flex items-center gap-2">Send Deal Proposal <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                          )}
                        </Button>

                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 py-2">
                          {[
                            { label: 'Contract auto-generated', icon: FileCheck },
                            { label: 'Creator protected', icon: ShieldCheck },
                            { label: 'Secure deal workflow', icon: Lock }
                          ].map((t, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                              <t.icon className="w-3 h-3" /> {t.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

                {!isSuccess && (
                  <div className="flex items-center justify-between px-6 pb-8 border-t border-white/5 pt-8">
                    <div className="flex gap-4">
                      {currentStep > 1 && <Button onClick={prevStep} variant="outline" className="bg-white/5 border-white/10 rounded-xl">Back</Button>}
                      <Dialog open={showSaveDraftModal} onOpenChange={setShowSaveDraftModal}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="text-white/40 hover:text-white transition-colors">Save Draft</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-sm rounded-[32px] p-8">
                          <DialogHeader><DialogTitle className="text-2xl font-black tracking-tight">Save Progress</DialogTitle></DialogHeader>
                          <div className="space-y-6 py-4">
                            <p className="text-sm text-white/50 leading-relaxed">Enter your work email to receive a magic link. You can resume this proposal at any time.</p>
                            <Input type="email" placeholder="name@company.com" value={draftEmail} onChange={e => setDraftEmail(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                          </div>
                          <DialogFooter><Button onClick={handleSaveDraftSubmit} disabled={saveDraftSubmitting} className="w-full h-12 bg-white text-black font-black rounded-xl hover:bg-slate-100 transition-all">Send Magic Link</Button></DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {currentStep < 3 && <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 font-black">Continue</Button>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block md:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border border-blue-500/10 bg-blue-500/5 space-y-4">
              <div className="flex items-center gap-3"><ShieldCheck className="text-blue-400" /><h3 className="text-xs font-black uppercase tracking-widest">Enterprise Safe</h3></div>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium">This collaboration is governed by CreatorArmour's legal-first workflow. All deliverables, usage duration, and payments are contractually protected.</p>
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/60"><Check className="w-3 h-3 text-emerald-400" /> Auto-Generated Contract</div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/60"><Check className="w-3 h-3 text-emerald-400" /> Creator verification</div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/60"><Check className="w-3 h-3 text-emerald-400" /> Escrow enabled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showContractPreview} onOpenChange={setShowContractPreview}>
        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl rounded-[32px] overflow-hidden p-0 gap-0">
          <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 p-8 border-b border-white/5">
            <h2 className="text-2xl font-black mb-2">Auto-Generated Agreement</h2>
            <p className="text-white/40 text-sm">A legally binding collaboration contract prepared based on your inputs.</p>
          </div>
          <div className="p-8 max-h-[60vh] overflow-y-auto bg-slate-900/40">
            <div className="space-y-6 text-[13px] leading-relaxed font-medium text-white/70">
              <div className="flex justify-between border-b border-white/5 pb-4">
                <span className="font-black uppercase tracking-widest text-[10px] text-white/40">Party A (Brand)</span>
                <span className="text-white font-black">{brandName || '[Your Brand]'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-4">
                <span className="font-black uppercase tracking-widest text-[10px] text-white/40">Party B (Creator)</span>
                <span className="text-white font-black">{creatorName}</span>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white text-[11px] uppercase tracking-widest">Scope of Deliverables:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {deliverables.map(d => (
                    <li key={d}>{deliverableQuantities[d] || 1}x {d}</li>
                  ))}
                  {deliverables.length === 0 && <li className="text-white/20 italic">No deliverables selected yet</li>}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-black text-white text-[11px] uppercase tracking-widest">Commercial Terms:</p>
                <p>The total consideration for the above deliverables is set at <span className="text-emerald-400 font-bold tracking-tight">INR {Number(exactBudget || 0).toLocaleString()}</span> (net payable) payable through the CreatorArmour secure escrow workflow.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-[11px] text-amber-500 font-bold leading-snug">Note: This is a preview. The actual contract will include standard clauses for intellectual property, confidentiality, and termination rights.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-950/80 border-t border-white/5">
            <Button onClick={() => setShowContractPreview(false)} className="w-full bg-white text-black font-black rounded-xl">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollabLinkLanding;
