import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/services/fileService';
import {
  Camera, Check, ChevronDown, Loader2, LogOut, Shield, ShieldCheck,
  Upload, X, AlertTriangle, Globe, Instagram, MessageCircle, Tag,
  Activity, Briefcase, ExternalLink, ArrowRight, FileText,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type BrandProfilePayload = {
  name: string;
  website_url?: string | null;
  industry?: string | null;
  description?: string | null;
  logo_url?: string | null;
  instagram_handle?: string | null;
  whatsapp_handle?: string | null;
  content_niches?: string[];
};

const INDUSTRIES = [
  'Beauty & Skincare', 'Fashion & Apparel', 'Food & Beverage', 'Health & Wellness',
  'Technology', 'Travel & Hospitality', 'Home & Lifestyle', 'Sports & Fitness',
  'Jewellery & Accessories', 'Education & E-learning', 'Finance & FinTech',
  'Automotive', 'Gaming', 'Entertainment & Media', 'D2C / E-commerce', 'Other',
];

const DESC_MAX = 180;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function websiteValid(url: string) {
  if (!url.trim()) return true;
  try { new URL(url.startsWith('http') ? url : `https://${url}`); return true; } catch { return false; }
}
function normalizeUrl(url: string): string {
  const s = url.trim();
  if (!s) return '';
  return s.startsWith('http') ? s : `https://${s}`;
}

/* ─── Logout Modal ───────────────────────────────────────────────────────── */
function LogoutModal({ email, onConfirm, onCancel }: { email: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} />
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-[#0B1324] p-8 shadow-2xl mb-24 sm:mb-0"
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
          <LogOut className="w-6 h-6 text-rose-400" />
        </div>
        <h3 className="text-[20px] font-bold text-white mb-2">Log out?</h3>
        <p className="text-[14px] text-white/40 mb-1">{email}</p>
        <p className="text-[14px] text-white/40 mb-8 leading-relaxed">You'll need to sign in again to access your brand dashboard and manage campaigns.</p>
        <div className="flex flex-col gap-3">
          <button type="button" onClick={onConfirm}
            className="w-full h-12 rounded-2xl bg-rose-500 text-[15px] font-bold text-white hover:bg-rose-600 transition active:scale-[0.98]">
            Log out
          </button>
          <button type="button" onClick={onCancel}
            className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-[15px] font-semibold text-white/60 hover:bg-white/8 transition active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Modular Components ─────────────────────────────────────────────────── */
const SettingsRow = ({ icon, label, subtext, iconColorClass, hasChevron, isDark, onClick, rightElement, labelClassName }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 py-4 px-4 active:opacity-60 transition-all cursor-pointer group",
      isDark ? "hover:bg-white/5 active:bg-white/10" : "hover:bg-slate-50 active:bg-slate-100"
    )}
  >
    <div className={cn("w-6 h-6 flex items-center justify-center shrink-0", iconColorClass)}>
      {icon && React.cloneElement(icon, { size: 20, strokeWidth: 1.5 })}
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-[15px] font-bold leading-tight", isDark ? "text-white" : "text-[#111827]", labelClassName)}>{label}</p>
      {subtext && <p className={cn("text-[12.5px] font-medium leading-tight mt-1 opacity-70", isDark ? "text-white/80" : "text-[#6B7280]")}>{subtext}</p>}
    </div>
    {rightElement}
    {hasChevron && !rightElement && <ChevronDown className={cn("w-5 h-5 -rotate-90", isDark ? "text-[#5C5E64]" : "text-slate-400")} />}
  </div>
);

const SettingsGroup = ({ children, isDark, className }: any) => (
  <div className={cn(
    "overflow-hidden rounded-[2.5rem] border mb-6",
    isDark ? "bg-[#0B1324]/40 border-white/5 divide-white/5" : "bg-white border-slate-200 divide-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]",
    "divide-y backdrop-blur-3xl",
    className
  )}>
    {children}
  </div>
);

const SectionHeader = ({ title, isDark }: any) => (
  <p className={cn(
    "px-6 mb-3 mt-8 text-[11px] font-black uppercase tracking-[0.2em] opacity-80",
    isDark ? "text-white/30" : "text-slate-400"
  )}>
    {title}
  </p>
);

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const BrandSettingsPanel = ({
  embedded = false,
  onLogout,
  activeCount = 0,
  neededActionCount = 0,
  reviewCount = 0,
}: {
  embedded?: boolean;
  onLogout?: () => void | Promise<void>;
  activeCount?: number;
  neededActionCount?: number;
  reviewCount?: number;
}) => {
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const apiBase = useMemo(() => getApiBaseUrl(), []);
  const canCallApi = !!session?.access_token;

  /* ── Form state ── */
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({ instagram: '', whatsapp: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  /* ── Save state ── */
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  /* ── UI state ── */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Theme Detection ── */
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  /* ─── Dirty tracking — seeded AFTER profile loads ── */
  const seededRef = useRef(false);
  const baselineRef = useRef({ name: '', website: '', industry: '', description: '', logo: '' });
  const [isDirty, setIsDirty] = useState(false);

  const brandProfile = profile as any;

  /* ─── Profile Strength Logic ── */
  const completionItems = useMemo(() => [
    { label: 'Basic Info', filled: !!name.trim() && !!industry },
    { label: 'Website', filled: !!website.trim() },
    { label: 'Description', filled: !!description.trim() },
    { label: 'Brand Logo', filled: !!logoPreview },
    { label: 'Social Links', filled: Object.values(socialLinks).some(v => !!v.trim()) },
    { label: 'Identity Tags', filled: tags.length > 0 },
  ], [name, industry, website, description, logoPreview, socialLinks, tags]);

  const completionPercent = useMemo(() => {
    const total = completionItems.length;
    const filled = completionItems.filter(i => i.filled).length;
    return Math.round((filled / total) * 100);
  }, [completionItems]);

  /* ─── Fetch and seed form from profile ── */
  useEffect(() => {
    if (seededRef.current || !session?.access_token) return;

    const fetchBrandProfile = async () => {
      try {
        const res = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        
        if (res.ok && json?.success && json?.brand) {
          const b = json.brand;
          const seededName = b.name || String(brandProfile?.business_name || '').trim() || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
          
          setName(seededName);
          setWebsite(b.website_url || '');
          setIndustry(b.industry || '');
          setDescription(b.description || '');
          setSocialLinks({ instagram: b.instagram_handle || '', whatsapp: b.whatsapp_handle || '' });
          setTags(b.content_niches || []);
          setCurrentLogoUrl(b.logo_url || null);
          setLogoPreview(b.logo_url || null);
          
          baselineRef.current = { 
            name: seededName, 
            website: b.website_url || '', 
            industry: b.industry || '', 
            description: b.description || '', 
            logo: b.logo_url || '',
            instagram: b.instagram_handle || '',
            whatsapp: b.whatsapp_handle || '',
            tags: b.content_niches || []
          };
          seededRef.current = true;
        } else {
          // Fallback if no brand data
          const fallbackName = String(brandProfile?.business_name || '').trim() || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
          if (fallbackName) {
            setName(fallbackName);
            baselineRef.current.name = fallbackName;
            seededRef.current = true;
          }
        }
      } catch (err) {
        console.error('Failed to fetch brand profile:', err);
      }
    };

    fetchBrandProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, brandProfile?.id, brandProfile?.business_name]);

  /* ─── Dirty check ── */
  useEffect(() => {
    if (!seededRef.current) return;
    const b = baselineRef.current;
    setIsDirty(
      name !== b.name ||
      website !== b.website ||
      industry !== b.industry ||
      description !== b.description ||
      socialLinks.instagram !== b.instagram ||
      socialLinks.whatsapp !== b.whatsapp ||
      JSON.stringify(tags) !== JSON.stringify(b.tags) ||
      !!logoFile
    );
  }, [name, website, industry, description, logoFile]);

  /* ─── File validation ── */
  const validateFile = (file: File): boolean => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowed.includes(file.type)) { toast.error('Use JPEG, PNG, WebP, SVG or GIF'); return false; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return false; }
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }, []);

  /* ─── Upload logo ── */
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !session?.user?.id) return currentLogoUrl;
    setLogoUploading(true);
    try {
      const result = await uploadFile(logoFile, {
        category: 'document',
        userId: session.user.id,
        fileName: `brand-logo-${session.user.id}`,
        folder: 'brand',
      });
      setCurrentLogoUrl(result.url);
      setLogoFile(null);
      return result.url;
    } catch {
      toast.error('Logo upload failed');
      return currentLogoUrl;
    } finally {
      setLogoUploading(false);
    }
  };

  /* ─── Validate ── */
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Brand name is required';
    if (website && !websiteValid(website)) e.website = 'Enter a valid URL';
    if (description.length > DESC_MAX) e.description = `Max ${DESC_MAX} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Save ── */
  const saveProfile = async () => {
    if (!validate() || !canCallApi) { if (!canCallApi) toast.error('Please log in again'); return; }
    setIsSaving(true);
    try {
      const logoUrl = logoFile ? await uploadLogo() : currentLogoUrl;
      const payload: BrandProfilePayload = {
        name: name.trim(),
        website_url: website ? normalizeUrl(website) : null,
        industry: industry || null,
        description: description.trim() || null,
        logo_url: logoUrl,
        instagram_handle: socialLinks.instagram.trim() || null,
        whatsapp_handle: socialLinks.whatsapp.trim() || null,
        content_niches: tags,
      };
      const res = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session!.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Save failed');
      setSavedAt(Date.now());
      baselineRef.current = { name: name.trim(), website, industry, description, logo: logoUrl || '' };
      setIsDirty(false);
      toast.success('Profile updated ✓');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  const justSaved = savedAt !== null && Date.now() - savedAt < 4000;

  /* ─── CSS primitives matching existing dashboard ── */
  const card = cn(
    'rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500',
    isDark 
      ? 'bg-[#0B1324]/60 border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] shadow-black/60' 
      : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'
  );
  
  const inputBase = cn(
    'w-full h-14 pl-12 pr-6 rounded-[1.5rem] border text-[15px] font-bold outline-none transition-all duration-300 relative z-10',
    isDark
      ? 'border-white/5 bg-white/[0.02] text-white placeholder:text-white/10 focus:border-emerald-500/30 focus:bg-white/[0.05] focus:ring-[12px] focus:ring-emerald-500/5'
      : 'border-slate-100 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus:border-emerald-500/30 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 shadow-sm'
  );

  const labelSub = cn(
    "text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1 block opacity-40", 
    isDark ? "text-white" : "text-slate-900"
  );

  const sectionLabel = cn(
    "text-[11px] font-black uppercase tracking-[0.25em] mb-4 block opacity-30", 
    isDark ? "text-white" : "text-slate-900"
  );

  const statsCard = (label: string, value: string | number, colorClass: string, icon: any) => (
    <div className={cn(card, "p-5 flex flex-col gap-3", colorClass)}>
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
          {React.cloneElement(icon, { size: 18, strokeWidth: 2.5, className: "opacity-80" })}
        </div>
        <ArrowRight className="w-4 h-4 opacity-20" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
        <p className="text-[22px] font-black tracking-tight">{value}</p>
      </div>
    </div>
  );

  const completionColor = completionPercent > 80 ? 'text-emerald-400' : completionPercent > 50 ? 'text-amber-400' : 'text-rose-400';

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="relative w-full">
      <AnimatePresence>
        {showLogoutModal && (
          <LogoutModal
            email={String(profile?.email || session?.user?.email || '')}
            onConfirm={async () => { setShowLogoutModal(false); await onLogout?.(); }}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 pb-72"
      >
        {/* ── Brand Hero Section (Identity Banner) ────────────────────────── */}
        <div className="relative pt-6">
          <div className={cn(
            "relative h-48 rounded-[3.5rem] overflow-hidden mb-[-70px] z-0 p-8 flex flex-col justify-end transition-all duration-700",
            isDark 
              ? "bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-transparent border border-white/5" 
              : "bg-gradient-to-br from-emerald-50 via-blue-50 to-white border border-slate-200"
          )}>
            <div className="absolute inset-0 opacity-20 filter blur-3xl mix-blend-overlay animate-pulse bg-emerald-400" />
            <div className="absolute top-8 right-8">
               <div className={cn("px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2", 
                 isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-slate-200")}>
                 <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                   completionPercent === 100 ? "bg-emerald-500" : "bg-amber-500")} />
                 <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                   isDark ? "text-white/60" : "text-slate-600")}>
                   {completionPercent}% Strength
                 </span>
               </div>
            </div>
          </div>

          <div className="relative px-8 flex items-end gap-8 z-10">
            <div className="relative group perspective">
              <div className={cn(
                "w-36 h-36 rounded-[3rem] p-1 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105",
                isDark ? "bg-[#0B1324] ring-[6px] ring-[#0B1324]" : "bg-white ring-[6px] ring-[#F9FAFB]"
              )}>
                <div className={cn(
                  "w-full h-full rounded-[2.6rem] overflow-hidden border flex items-center justify-center relative shadow-inner",
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                )}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className={cn("w-12 h-12", isDark ? "text-white/20" : "text-slate-300")} />
                  )}
                  {logoUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "absolute -bottom-2 -right-2 w-12 h-12 rounded-[1.25rem] shadow-2xl flex items-center justify-center transition-all active:scale-95 z-20",
                  isDark ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="pb-4 flex-1 min-w-0">
               <div className="flex flex-wrap items-center gap-2 mb-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                   <Shield className="w-3.5 h-3.5 text-blue-400" />
                   <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Protected</span>
                 </div>
               </div>
               <h2 className={cn("text-[28px] font-black truncate tracking-tighter leading-tight", isDark ? "text-white" : "text-slate-900")}>
                 {name || 'Your Brand'}
               </h2>
               <p className={cn("text-[14px] font-bold opacity-40 italic", isDark ? "text-white" : "text-slate-600")}>
                 {industry || 'Select Industry'}
               </p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {/* ── Guidance / Health Check ────────────────────────────────────── */}
        <div className="px-1 grid grid-cols-3 gap-2.5">
          <div className="col-span-3">
            <SectionHeader title="Campaign Health" isDark={isDark} />
          </div>
          {statsCard('Active', activeCount, isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700', <Briefcase />)}
          {statsCard('Action', neededActionCount, isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700', <AlertTriangle />)}
          {statsCard('Review', reviewCount, isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700', <FileText />)}
        </div>

        {/* ── Basic Setup ────────────────────────────────────────────────── */}
        <div className="space-y-4 px-1">
          <SectionHeader title="Brand Essentials" isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <div className="p-6 space-y-6">
              <div className="space-y-2 relative group">
                <label className={labelSub}>Official Brand Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <Tag className={isDark ? "text-white" : "text-slate-900"} size={18} />
                  </div>
                  <input
                    className={cn(inputBase, errors.name && 'border-rose-500/40 focus:border-rose-500/60')}
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                    placeholder="e.g. Acme Fashion"
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-400 font-bold px-4">{errors.name}</p>}
              </div>

              <div className="space-y-2 relative group">
                <label className={labelSub}>Global Website</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <Globe className={isDark ? "text-white" : "text-slate-900"} size={18} />
                  </div>
                  <input
                    className={cn(inputBase, errors.website && 'border-rose-500/40')}
                    value={website}
                    onChange={e => { setWebsite(e.target.value); setErrors(p => ({ ...p, website: '' })); }}
                    placeholder="acme.com"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                {errors.website && <p className="text-[11px] text-rose-400 font-bold px-4">{errors.website}</p>}
              </div>

              <div className="space-y-2 relative group">
                <label className={labelSub}>Market Niche</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <Briefcase className={isDark ? "text-white" : "text-slate-900"} size={18} />
                  </div>
                  <select
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    className={cn(inputBase, 'appearance-none pr-10 cursor-pointer', !industry && (isDark ? 'text-white/20' : 'text-slate-400'))}
                  >
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <ChevronDown className={cn("absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40 transition-transform group-hover:translate-y-[-40%]")} />
                </div>
              </div>
            </div>
          </SettingsGroup>
        </div>

        {/* ── Visual Asset Management (Logo) ────────────────────────────── */}
        <div className="space-y-4 px-1">
          <SectionHeader title="Visual Assets" isDark={isDark} />
          <div className={cn(
             "rounded-[2.5rem] border p-8 flex flex-col items-center text-center gap-4 border-dashed",
             isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50/50 border-slate-200"
          )}>
             <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center border overflow-hidden", 
               isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200")}>
               {logoPreview ? (
                 <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-2" />
               ) : (
                 <Upload className="w-8 h-8 opacity-20" />
               )}
             </div>
             <div>
               <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>Official Brand Logo</p>
               <p className={cn("text-[12px] font-medium opacity-40 mt-1", isDark ? "text-white" : "text-slate-600")}>
                 PNG, JPG, SVG · Max 2MB
               </p>
             </div>
             <button
               type="button"
               onClick={() => fileRef.current?.click()}
               className={cn("px-6 h-11 rounded-2xl text-[13px] font-black border transition-all active:scale-95", 
                 isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-700 shadow-sm")}
             >
               {logoPreview ? 'Change Logo' : 'Upload Logo'}
             </button>
          </div>
        </div>

        {/* ── Social Hub ─────────────────────────────────────────────────── */}
        <div className="space-y-4 px-1">
          <SectionHeader title="Social Discovery" isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <div className="p-6 space-y-6">
               <div className="space-y-2 relative group">
                <label className={labelSub}>Instagram Handle</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <Instagram className={isDark ? "text-white" : "text-slate-900"} size={18} />
                  </div>
                  <input
                    className={inputBase}
                    value={socialLinks.instagram}
                    onChange={e => setSocialLinks(p => ({...p, instagram: e.target.value}))}
                    placeholder="@yourhandle"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[12px] font-black text-rose-400 group-focus-within:opacity-100 opacity-0 transition-opacity">
                    Required
                  </div>
                </div>
              </div>

               <div className="space-y-2 relative group">
                <label className={labelSub}>WhatsApp (Operations)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-30 group-focus-within:opacity-100 transition-opacity">
                    <MessageCircle className={isDark ? "text-white" : "text-slate-900"} size={18} />
                  </div>
                  <input
                    className={inputBase}
                    value={socialLinks.whatsapp}
                    onChange={e => setSocialLinks(p => ({...p, whatsapp: e.target.value}))}
                    placeholder="+91..."
                  />
                </div>
              </div>
            </div>
          </SettingsGroup>
        </div>

        {/* ── Brand Narrative ────────────────────────────────────────────── */}
        <div className="space-y-4 px-1">
          <SectionHeader title="Brand Narrative" isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <div className="p-6 space-y-4">
              <label className={labelSub}>Who are you looking for?</label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })); }}
                  placeholder="We are a D2C fashion brand looking for Instagram reels that showcase aesthetic utility..."
                  rows={6}
                  className={cn(
                    'w-full px-6 py-6 rounded-[2rem] border text-[15px] font-bold outline-none resize-none transition-all leading-relaxed duration-300',
                    isDark
                      ? 'border-white/5 bg-white/[0.02] text-white placeholder:text-white/10 focus:border-emerald-500/30 focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white/[0.05]'
                      : 'border-slate-100 bg-slate-50/50 text-slate-900 placeholder:text-slate-300 focus:border-emerald-500/30 focus:ring-[12px] focus:ring-emerald-500/5 focus:bg-white shadow-sm',
                    errors.description && 'border-rose-500/40'
                  )}
                />
                
                {/* Character Progress Bar */}
                <div className="absolute bottom-6 left-6 right-6">
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((description.length / DESC_MAX) * 100, 100)}%` }}
                        className={cn("h-full transition-colors", description.length > DESC_MAX ? "bg-rose-500" : "bg-emerald-500")}
                      />
                   </div>
                   <div className="flex justify-between items-center mt-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", description.length > DESC_MAX ? "text-rose-400" : "opacity-20", isDark ? "text-white" : "text-slate-900")}>
                        {description.length > DESC_MAX ? 'Over limit' : `${DESC_MAX - description.length} chars left`}
                      </p>
                      <p className={cn("text-[11px] font-black tabular-nums transition-all", description.length > DESC_MAX ? "text-rose-400 scale-110" : "opacity-30", isDark ? "text-white" : "text-slate-900")}>
                        {description.length} / {DESC_MAX}
                      </p>
                   </div>
                </div>
              </div>
              {errors.description && <p className="text-[11px] text-rose-400 font-bold px-4">{errors.description}</p>}
            </div>
          </SettingsGroup>
        </div>

        {/* ── Brand Tags Hub ─────────────────────────────────────────────── */}
        <div className="space-y-4 px-1">
          <SectionHeader title="Strategic Tags" isDark={isDark} />
          <div className="flex flex-wrap gap-2 px-2">
            {[
              'Fashion', 'Tech', 'Fitness', 'Beauty', 'D2C', 'Lifestyle', 'Gaming', 'Finance'
            ].map(tag => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setTags(p => active ? p.filter(t => t !== tag) : [...p, tag]);
                  }}
                  className={cn(
                    "px-5 py-2.5 rounded-full text-[13px] font-black border transition-all active:scale-90",
                    active 
                      ? (isDark ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10" : "bg-emerald-500 text-white border-emerald-500")
                      : (isDark ? "bg-white/[0.02] border-white/5 text-white/30" : "bg-white border-slate-200 text-slate-400 shadow-sm")
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Session Hierarchy ─────────────────────────────────────────── */}
        <div className="space-y-4 px-1 pt-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <SectionHeader title="Advanced Ops" isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow 
              icon={<LogOut />}
              label="Deactivate Session"
              subtext="Log out of this brand account"
              iconColorClass="text-rose-500/60"
              isDark={isDark}
              onClick={() => setShowLogoutModal(true)}
              labelClassName="text-rose-500/60"
            />
          </SettingsGroup>
        </div>
      </motion.div>

      {/* ── Premium Sticky Save ─────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-[100] px-6 pt-16"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 120px)',
          background: isDark
            ? 'linear-gradient(to top, #0B1324 60%, rgba(11,19,36,0.95) 80%, transparent 100%)'
            : 'linear-gradient(to top, #F9FAFB 60%, rgba(249,250,251,0.95) 80%, transparent 100%)'
        }}
      >
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {isDirty && !isSaving && (
              <motion.div 
                key="unsaved"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="flex items-center justify-center gap-2 mb-5"
              >
                <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/20 backdrop-blur-xl flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Unsaved Session Progress</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={saveProfile}
            disabled={isSaving || logoUploading || !isDirty}
            className={cn(
              'w-full h-16 rounded-[2rem] text-[16px] font-black tracking-tight transition-all duration-700 flex items-center justify-center gap-3 relative overflow-hidden',
              isDirty && !isSaving
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)]'
                : justSaved
                  ? 'bg-emerald-500 text-white shadow-[0_20px_50px_rgba(16,185,129,0.3)]'
                  : isDark
                    ? 'bg-white/[0.04] border border-white/5 text-white/10 cursor-not-allowed'
                    : 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed shadow-none'
            )}
          >
            {isSaving || logoUploading ? (
              <div className="flex items-center gap-3">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span>{logoUploading ? 'OPTIMIZING ASSETS...' : 'SYCHRONIZING...'}</span>
              </div>
            ) : justSaved ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>PROFILE VERIFIED</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <span>SAVE CHANGES</span>
                <div className={cn("w-1.5 h-1.5 rounded-full bg-white/40", isDirty ? "animate-pulse" : "hidden")} />
              </div>
            )}
            
            {/* Gloss shine effect for active state */}
            {isDirty && !isSaving && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12"
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

/* ─── Standalone page ─────────────────────────────────────────────────────── */
export default function BrandSettings() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-[#0B1324] text-white">
      <div
        className="sticky top-0 z-[110] px-6 border-b border-white/[0.03]"
        style={{ background: 'rgba(11,19,36,0.85)', backdropFilter: 'blur(30px)', paddingTop: 'max(env(safe-area-inset-top), 20px)' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between py-5">
          <div className="flex items-center gap-4">
            <button
              type="button" onClick={() => navigate('/brand-dashboard')}
              className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-0.5">Settings</p>
              <h1 className="text-[18px] font-bold text-white tracking-tight">Brand Account</h1>
            </div>
          </div>
          
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>
      <div className="max-w-md mx-auto px-5 pt-2">
        <BrandSettingsPanel />
      </div>
    </div>
  );
}
