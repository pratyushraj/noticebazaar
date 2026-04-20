import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/services/fileService';
import {
  Camera, Check, ChevronDown, Loader2, LogOut, Shield, ShieldCheck,
  Upload, X, AlertTriangle,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type BrandProfilePayload = {
  name: string;
  website_url?: string | null;
  industry?: string | null;
  description?: string | null;
  logo_url?: string | null;
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl border border-white/8 bg-[#0a1a12] p-6 shadow-2xl mb-24 sm:mb-0">
        <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <LogOut className="w-5 h-5 text-rose-400" />
        </div>
        <h3 className="text-[16px] font-bold text-white mb-1">Log out?</h3>
        <p className="text-[13px] text-white/40 mb-1">{email}</p>
        <p className="text-[13px] text-white/40 mb-6">You'll need to sign in again to access your brand dashboard.</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 text-[13px] font-semibold text-white/60 hover:bg-white/8 transition active:scale-[0.98]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-[1.3] h-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-[13px] font-bold text-rose-400 hover:bg-rose-500/20 transition active:scale-[0.98]">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const BrandSettingsPanel = ({
  embedded = false,
  onLogout,
}: {
  embedded?: boolean;
  onLogout?: () => void | Promise<void>;
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

  /* ─── Seed form from profile once ── */
  useEffect(() => {
    if (seededRef.current) return;
    const seededName =
      String(brandProfile?.business_name || '').trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    if (seededName || brandProfile?.logo_url) {
      setName(seededName);
      setCurrentLogoUrl(brandProfile?.logo_url || null);
      setLogoPreview(brandProfile?.logo_url || null);
      baselineRef.current = { name: seededName, website: '', industry: '', description: '', logo: brandProfile?.logo_url || '' };
      seededRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandProfile?.id, brandProfile?.business_name]);

  /* ─── Dirty check ── */
  useEffect(() => {
    if (!seededRef.current) return;
    const b = baselineRef.current;
    setIsDirty(
      name !== b.name ||
      website !== b.website ||
      industry !== b.industry ||
      description !== b.description ||
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
    'rounded-[22px] border backdrop-blur-xl',
    isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
  );
  const inputBase = cn(
    'w-full h-12 px-4 rounded-xl border text-[14px] font-medium outline-none transition-all',
    isDark
      ? 'border-white/8 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:bg-white/[0.07] focus:ring-2 focus:ring-emerald-500/10'
      : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500/40 focus:bg-white focus:ring-4 focus:ring-emerald-500/5'
  );
  const sectionLabel = cn(
    'text-[10px] font-black uppercase tracking-[0.18em] mb-3',
    isDark ? 'text-white/30' : 'text-slate-400'
  );
  const labelSub = cn(
    'text-[11px] font-semibold uppercase tracking-widest',
    isDark ? 'text-white/35' : 'text-slate-500'
  );

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="relative w-full">
      {showLogoutModal && (
        <LogoutModal
          email={String(profile?.email || session?.user?.email || '')}
          onConfirm={async () => { setShowLogoutModal(false); await onLogout?.(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <div className="space-y-3 pb-32">

        {/* ── Logo ───────────────────────────────────────────────────────── */}
        <div className={cn(card, 'p-4')}>
          <p className={sectionLabel}>Brand Logo</p>

          {logoPreview ? (
            /* Has logo — show preview strip */
            <div className="flex items-center gap-4">
              <div className="relative w-[60px] h-[60px] shrink-0 rounded-2xl border border-white/10 bg-black/5 overflow-hidden flex items-center justify-center">
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                {logoUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-semibold truncate", isDark ? "text-white/80" : "text-slate-700")}>{logoFile?.name || 'Current logo'}</p>
                <p className={cn("text-[11px] mt-0.5", isDark ? "text-white/30" : "text-slate-400")}>Visible on all offers you send</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button" onClick={() => fileRef.current?.click()}
                  className="w-8 h-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-white/50" />
                </button>
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); setCurrentLogoUrl(null); setIsDirty(true); }}
                  className="w-8 h-8 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 transition active:scale-95"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'h-24 rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none',
                dragging
                  ? 'border-emerald-500/50 bg-emerald-500/8'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              )}
            >
              <Upload className={cn("w-5 h-5", isDark ? "text-white/25" : "text-slate-300")} />
              <p className={cn("text-[12px] font-medium", isDark ? "text-white/35" : "text-slate-400")}>
                {dragging ? 'Drop here' : 'Drag & drop or tap to upload'}
              </p>
              <p className={cn("text-[10px]", isDark ? "text-white/20" : "text-slate-300")}>JPEG · PNG · WebP · SVG · Max 2 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>

        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <div className={cn(card, 'p-4 space-y-3')}>
          <p className={sectionLabel}>Basic Info</p>

          <div className="space-y-1.5">
            <label className={labelSub}>Brand Name</label>
            <input
              className={cn(inputBase, errors.name && 'border-rose-500/40 focus:border-rose-500/60')}
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              placeholder="Your brand name"
            />
            {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelSub}>Website</label>
            <input
              className={cn(inputBase, errors.website && 'border-rose-500/40')}
              value={website}
              onChange={e => { setWebsite(e.target.value); setErrors(p => ({ ...p, website: '' })); }}
              placeholder="yourwebsite.com"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
            />
            {errors.website ? (
              <p className="text-[11px] text-rose-400">{errors.website}</p>
            ) : (
              <p className={cn("text-[11px]", isDark ? "text-white/20" : "text-slate-400")}>Optional · auto-adds https://</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={labelSub}>Industry</label>
            <div className="relative">
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                className={cn(inputBase, 'appearance-none pr-9 cursor-pointer', !industry && 'text-white/25')}
              >
                <option value="" className="bg-[#0a1a12] text-white/50">Select industry…</option>
                {INDUSTRIES.map(i => (
                  <option key={i} value={i} className={isDark ? "bg-[#0a1a12] text-white" : "bg-white text-slate-800"}>{i}</option>
                ))}
              </select>
              <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none", isDark ? "text-white/25" : "text-slate-400")} />
            </div>
          </div>
        </div>

        {/* ── About ──────────────────────────────────────────────────────── */}
        <div className={cn(card, 'p-4 space-y-3')}>
          <p className={sectionLabel}>About</p>
          <div className="space-y-1.5">
            <label className={labelSub}>Description</label>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })); }}
                placeholder="What does your brand sell? Give creators context."
                rows={4}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border text-[14px] font-medium outline-none resize-none transition-all',
                  isDark
                    ? 'border-white/8 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 focus:bg-white/[0.07]'
                    : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 focus:bg-white',
                  errors.description && 'border-rose-500/40'
                )}
              />
              <span className={cn(
                'absolute bottom-3 right-3 text-[11px] font-mono tabular-nums',
                description.length > DESC_MAX ? 'text-rose-400' : (isDark ? 'text-white/20' : 'text-slate-400')
              )}>
                {description.length}/{DESC_MAX}
              </span>
            </div>
            {errors.description && <p className="text-[11px] text-rose-400">{errors.description}</p>}
          </div>
        </div>

        {/* ── Session ────────────────────────────────────────────────────── */}
        <div className={cn(card, 'p-4')}>
          <p className={sectionLabel}>Session</p>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-2xl border transition active:scale-[0.99]",
              isDark ? "border-rose-500/15 bg-rose-500/[0.05] hover:bg-rose-500/10" : "border-rose-200 bg-rose-50/50 hover:bg-rose-50"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-left min-w-0">
              <p className={cn("text-[13px] font-semibold", isDark ? "text-rose-300" : "text-rose-600")}>Log out of account</p>
              <p className={cn("text-[11px] truncate", isDark ? "text-white/25" : "text-slate-400")}>{profile?.email || session?.user?.email || ''}</p>
            </div>
          </button>
        </div>

      </div>

      {/* ── Sticky Save ────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 inset-x-0 z-40 px-4 pt-5"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 110px)',
          background: isDark
            ? 'linear-gradient(to top, #061318 65%, rgba(6,19,24,0.9) 85%, transparent 100%)'
            : 'linear-gradient(to top, #f8fafc 65%, rgba(248,250,252,0.92) 85%, transparent 100%)'
        }}
      >
        <div className="max-w-md mx-auto">
          {isDirty && !isSaving && (
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <AlertTriangle className="w-3 h-3 text-amber-400/80" />
              <span className="text-[11px] font-medium text-amber-400/80">Unsaved changes</span>
            </div>
          )}
          <button
            type="button"
            onClick={saveProfile}
            disabled={isSaving || logoUploading || !isDirty}
            className={cn(
              'w-full h-12 rounded-2xl text-[14px] font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-2',
              isDirty && !isSaving
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_6px_28px_rgba(16,185,129,0.28)] active:scale-[0.98]'
                : justSaved
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : isDark
                    ? 'bg-white/[0.08] border border-white/[0.14] text-white/30 cursor-not-allowed'
                    : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
            )}
          >
            {isSaving || logoUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{logoUploading ? 'Uploading…' : 'Saving…'}</>
            ) : justSaved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Standalone page ─────────────────────────────────────────────────────── */
export default function BrandSettings() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-[#061318] text-white">
      <div
        className="sticky top-0 z-30 px-5 border-b border-white/6"
        style={{ background: 'rgba(6,19,24,0.95)', backdropFilter: 'blur(20px)', paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between py-3.5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Brand Settings</p>
            <h1 className="text-[17px] font-bold text-white tracking-tight">Account</h1>
          </div>
          <button
            type="button" onClick={() => navigate('/brand-dashboard')}
            className="w-9 h-9 rounded-full border border-white/8 bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 pt-4">
        <BrandSettingsPanel />
      </div>
    </div>
  );
}
