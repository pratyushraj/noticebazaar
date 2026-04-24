

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, UploadCloud, Loader2, CheckCircle2, Camera,
  ArrowRight, Sparkles, Send, User, IndianRupee, ChevronRight,
  Building2, Briefcase, Image as ImageIcon, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { trackEvent } from '@/lib/utils/analytics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SmartIndustrySelector } from '@/components/brand/SmartIndustrySelector';

type OnboardingStep = 'logo' | 'budget' | 'ready';

const BUDGET_OPTIONS = [
  { label: '₹5K – ₹15K', value: '5k-15k', desc: 'Micro & nano creators', emoji: '🌱' },
  { label: '₹15K – ₹50K', value: '15k-50k', desc: 'Growing creators', emoji: '🚀' },
  { label: '₹50K – ₹2L', value: '50k-2l', desc: 'Established creators', emoji: '⭐' },
  { label: '₹2L+', value: '2l+', desc: 'Top-tier creators', emoji: '👑' },
  { label: 'Not sure yet', value: 'undecided', desc: 'I want to explore first', emoji: '🤔' },
];

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const { profile, session, loading: sessionLoading, refetchProfile } = useSession();
  const [step, setStep] = useState<OnboardingStep>('logo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brand info
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');

  // Budget
  const [selectedBudget, setSelectedBudget] = useState('');

  const apiBase = useMemo(() => getApiBaseUrl(), []);

  // Seed brand name from profile
  useEffect(() => {
    if (profile) {
      const bName = (profile as any)?.business_name || '';
      if (bName && !brandName) setBrandName(bName);
    }
  }, [profile]);

  // Redirect guards
  useEffect(() => {
    if (sessionLoading) return;
    if (!profile) {
      navigate('/login', { replace: true });
      return;
    }
    if ((profile as any)?.role !== 'brand') {
      navigate('/creator-dashboard', { replace: true });
      return;
    }
  }, [sessionLoading, profile, navigate]);

  useEffect(() => {
    document.title = 'Set Up Your Brand | Creator Armour';
  }, []);

  const handleLogoFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, SVG, or GIF).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.access_token) return null;
    try {
      const formData = new FormData();
      formData.append('file', logoFile);
      const res = await fetch(`${apiBase}/api/brand-dashboard/upload-logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json.url) {
        throw new Error(json?.error || 'Failed to upload logo');
      }
      return json.url;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload logo.');
      return null;
    }
  };

  const handleComplete = async () => {
    if (!session?.access_token) return;
    setIsSubmitting(true);

    try {
      // Upload logo if selected
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      // Save brand profile with industry + logo
      const payload: Record<string, any> = {};
      if (brandName.trim()) payload.name = brandName.trim();
      if (industry) payload.industry = industry;
      if (logoUrl) payload.logo_url = logoUrl;
      if (selectedBudget) payload.budget_range = selectedBudget;

      if (Object.keys(payload).length > 0) {
        const profileRes = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const profileJson = await profileRes.json().catch(() => ({}));
        if (!profileRes.ok || !profileJson?.success) {
          throw new Error(profileJson?.error || 'Failed to save brand profile');
        }
      }

      if (logoUrl) {
        const { error: avatarSyncError } = await supabase
          .from('profiles')
          .update({ avatar_url: logoUrl })
          .eq('id', session.user.id);

        if (avatarSyncError) {
          throw avatarSyncError;
        }
      }

      // Finalize onboarding status in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      trackEvent('brand_onboarding_complete', {
        has_logo: !!logoUrl,
        budget: selectedBudget || 'skipped',
        industry: industry || 'skipped',
      });

      await refetchProfile?.();
      toast.success('You\'re all set! Welcome to Creator Armour.');
      navigate('/brand-dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    trackEvent('brand_onboarding_skipped', { step });
    navigate('/brand-dashboard', { replace: true });
  };

  const stepNumber = step === 'logo' ? 1 : step === 'budget' ? 2 : 3;
  const totalSteps = 3;

  if (sessionLoading || !profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-[#F4F7FB] font-inter overflow-x-hidden overflow-y-auto"
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Background ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Logo + Brand Identity ── */}
          {step === 'logo' && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-xl">
                {/* Step indicator */}
                <StepIndicator current={stepNumber} total={totalSteps} />

                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mt-6">
                  Brand Console
                </p>
                <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  Set up your brand
                </h1>
                <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                  Upload your logo and pick your industry. Creators see this on every offer you send.
                </p>

                <div className="mt-8 space-y-5">
                  {/* Brand Name */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 block">
                      Brand Name
                    </label>
                    <input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      placeholder="e.g. Nike, Mamaearth..."
                    />
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 block">
                      Industry
                    </label>
                    <SmartIndustrySelector
                      value={industry}
                      onChange={(value) => setIndustry(String(value || ''))}
                      placeholder="Select your industry..."
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2 block">
                      Brand Logo
                    </label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]); }}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer",
                        isDragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
                        logoPreview && "py-4 flex-row justify-start gap-4"
                      )}
                      onClick={() => !logoPreview && fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                      />

                      {logoPreview ? (
                        <>
                          <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm relative group">
                            <img src={logoPreview} className="w-full h-full object-cover transition-opacity group-hover:opacity-40" alt="Logo" />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); }}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-slate-900/60 transition-opacity"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-slate-900">Logo added ✓</p>
                            <p className="text-xs text-slate-500 mt-0.5">{logoFile?.name || 'Ready to upload'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="text-[12px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition-colors border border-slate-300"
                          >
                            Replace
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="w-14 h-14 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center mx-auto mb-3">
                            <UploadCloud className="w-6 h-6 text-slate-500" />
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mb-1">Click or drag to upload</p>
                          <p className="text-xs text-slate-500">PNG, JPG, SVG, GIF · Max 2MB</p>
                          <p className="text-[10px] text-slate-400 mt-2">This appears on every offer you send</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Creator sees</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <Building2 className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-slate-900">{brandName || 'Your Brand'}</p>
                        <p className="text-[12px] text-emerald-600 font-medium">{industry || 'Industry'} · Verified on Creator Armour</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!brandName.trim()) {
                        toast.error('Please enter your brand name');
                        return;
                      }
                      setStep('budget');
                    }}
                    className="h-14 w-full rounded-2xl bg-slate-900 text-[13px] font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full text-center text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors py-2"
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Budget Range ── */}
          {step === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-xl">
                <StepIndicator current={stepNumber} total={totalSteps} />

                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mt-6">
                  Almost there
                </p>
                <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                  What's your budget?
                </h1>
                <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                  Helps us match you with creators in the right range. You can change this anytime.
                </p>

                <div className="mt-8 space-y-3">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedBudget(opt.value)}
                      className={cn(
                        'w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center gap-4',
                        selectedBudget === opt.value
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div className="flex-1">
                        <p className={cn(
                          'text-[15px] font-bold',
                          selectedBudget === opt.value ? 'text-emerald-700' : 'text-slate-900'
                        )}>{opt.label}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </div>
                      {selectedBudget === opt.value && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => setStep('ready')}
                    className="h-14 w-full rounded-2xl bg-slate-900 text-[13px] font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('logo')}
                    className="w-full text-center text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors py-2"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Ready / Send First Offer ── */}
          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-xl">
                <StepIndicator current={stepNumber} total={totalSteps} />

                <div className="flex items-start gap-4 mt-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">
                      You're all set
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                      Your brand is ready
                    </h1>
                    <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                      You can now browse creators and send protected offers.
                    </p>
                  </div>
                </div>

                {/* Summary card */}
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} className="w-full h-full object-cover" alt="Logo" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-900">{brandName || 'Your Brand'}</p>
                      <p className="text-[12px] text-slate-500">{industry || 'No industry selected'}</p>
                    </div>
                  </div>
                  {selectedBudget && selectedBudget !== 'undecided' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <p className="text-[13px] font-semibold text-emerald-700">
                        Budget: {BUDGET_OPTIONS.find(o => o.value === selectedBudget)?.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* What next */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">What happens next</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { n: 1, text: 'Browse creators in your niche' },
                      { n: 2, text: 'Send a protected offer' },
                      { n: 3, text: 'Track the deal end-to-end' },
                    ].map(item => (
                      <div key={item.n} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">0{item.n}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 text-[13px] font-black uppercase tracking-[0.18em] text-white hover:from-emerald-500 hover:to-sky-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Setting up...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Open my dashboard</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('budget')}
                    className="w-full text-center text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors py-2"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step Indicator ──

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isComplete = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={stepNum} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all',
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-200 text-slate-400'
                )}
              >
                {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : stepNum}
              </div>
              {stepNum < total && (
                <div className={cn('w-6 h-1.5 rounded-full transition-all', stepNum < current ? 'bg-emerald-600' : 'bg-slate-200')} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
        Step {current} of {total}
      </p>
    </div>
  );
}
