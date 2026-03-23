import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Camera,
  ChevronLeft,
  CreditCard,
  Globe,
  Landmark,
  Loader2,
  LogOut,
  Laptop,
  Moon,
  Save,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { CREATOR_ASSETS_BUCKET, extractFilePathFromUrl } from '@/lib/constants/storage';

const BrandSettings = () => {
  const navigate = useNavigate();
  const { profile, refetchProfile, user } = useSession();

  const THEME_KEY = 'brand_console_theme_preference';
  const [themePreference, setThemePreference] = useState<'system' | 'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = (localStorage.getItem(THEME_KEY) || '').toLowerCase();
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else (mq as any).addListener(onChange);
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
      else (mq as any).removeListener(onChange);
    };
  }, []);

  const isDark = themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';
  const themeModeLabel = themePreference === 'system' ? 'AUTO' : themePreference.toUpperCase();
  const themeIcon =
    themePreference === 'system'
      ? <Laptop className="w-4 h-4" />
      : (isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />);

  const brandName = profile?.first_name || (profile as any)?.business_name || profile?.business_name || 'Brand';
  const [brandLogoDbUrl, setBrandLogoDbUrl] = useState<string | null>(null);
  const storedBrandLogo = (profile as any)?.avatar_url || (profile as any)?.logo_url || brandLogoDbUrl || null;
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const brandLogo = logoPreviewUrl || storedBrandLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=0D8ABC&color=fff`;
  const hasUploadedLogo = !!storedBrandLogo;
  const supportEmailStorageKey = profile?.id ? `brand_settings_support_email:${profile.id}` : 'brand_settings_support_email';
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const cardBorder = isDark ? 'border-white/10' : 'border-slate-200';
  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-white/80';

  const [profileForm, setProfileForm] = useState({
    brandName,
    website: '',
    industry: '',
    location: '',
    description: '',
    supportEmail: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    countered: true,
    accepted: true,
    deliverable: true,
    email: true,
    whatsapp: false,
    push: false,
  });

  const [integrations, setIntegrations] = useState({
    whatsapp: '',
    slack: '',
    webhook: '',
  });

  const [campaignDefaults, setCampaignDefaults] = useState({
    budgetRange: '',
    deliverables: '',
    timeline: '',
    approval: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const teamMembers = useMemo(() => ([
    {
      id: profile?.id || 'me',
      name: brandName,
      role: 'Admin',
      // Profile table often doesn't store email; prefer auth email.
      email: (profile as any)?.email || user?.email || '—',
      avatar: brandLogo,
    },
  ]), [brandLogo, brandName, profile?.email, profile?.id, user?.email]);

  const [metrics, setMetrics] = useState({
    isLoading: true,
    activeDeals: 0,
    completedDeals: 0,
    actionRequired: 0,
    contentPendingReview: 0,
    spendThisMonth: 0,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const uploadBrandLogo = async (file: File) => {
    if (!profile?.id) {
      toast.error('Please sign in again');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
      const filePath = `${profile.id}/brand-logo.${fileExt}`;

      const existingPath = extractFilePathFromUrl(storedBrandLogo, CREATOR_ASSETS_BUCKET);
      if (existingPath) {
        await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([existingPath.split('?')[0]]);
      }

      const { error: uploadError } = await supabase.storage.from(CREATOR_ASSETS_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(CREATOR_ASSETS_BUCKET).getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get logo URL');

      setLogoPreviewUrl(`${publicUrl}?t=${Date.now()}`);

      const now = new Date().toISOString();
      const [{ error: profileError }, { error: brandError }] = await Promise.all([
        supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: now }).eq('id', profile.id),
        supabase.from('brands').update({ logo_url: publicUrl }).eq('external_id', profile.id),
      ]);

      if (profileError) throw profileError;
      if (brandError) {
        // non-fatal in older schemas/environments
        console.warn('[BrandSettings] Failed to update brands.logo_url:', (brandError as any)?.message || brandError);
      }

      toast.success('Logo updated');
      refetchProfile();
      setTimeout(() => setLogoPreviewUrl(null), 1500);
    } catch (err: any) {
      toast.error('Logo upload failed', { description: err?.message || 'Please try again.' });
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    const loadBrandSettings = async () => {
      const fallbackSupportEmail =
        (typeof window !== 'undefined' ? localStorage.getItem(supportEmailStorageKey) : null) ||
        profile.email ||
        '';

      setProfileForm((current) => ({
        ...current,
        brandName: profile.business_name || profile.first_name || current.brandName,
        location: profile.location || current.location,
        description: profile.bio || current.description,
        supportEmail: fallbackSupportEmail || current.supportEmail,
      }));

      const { data: brandRow } = await supabase
        .from('brands')
        .select('name, website_url, industry, description, logo_url')
        .eq('external_id', profile.id)
        .maybeSingle();

      if (cancelled || !brandRow) return;

      setBrandLogoDbUrl((brandRow as any)?.logo_url || null);
      setProfileForm((current) => ({
        ...current,
        brandName: brandRow.name || current.brandName,
        website: brandRow.website_url || current.website,
        industry: brandRow.industry || current.industry,
        description: brandRow.description || current.description,
      }));
    };

    void loadBrandSettings();
    return () => { cancelled = true; };
  }, [profile?.id, profile?.business_name, profile?.first_name, profile?.location, profile?.bio, profile?.email, supportEmailStorageKey]);

  useEffect(() => {
    let cancelled = false;

    const loadMetrics = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          if (!cancelled) setMetrics((m) => ({ ...m, isLoading: false }));
          return;
        }

        const apiBase = getApiBaseUrl();
        const [dealsRes, reqRes] = await Promise.all([
          fetch(`${apiBase}/api/brand-dashboard/deals`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/api/brand-dashboard/requests`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const dealsJson = await dealsRes.json().catch(() => ({}));
        const reqJson = await reqRes.json().catch(() => ({}));

        const deals = Array.isArray(dealsJson?.deals) ? dealsJson.deals : [];
        const requests = Array.isArray(reqJson?.requests) ? reqJson.requests : [];

        const activeDeals = deals.filter((d: any) => String(d?.status || '').toUpperCase() !== 'COMPLETED').length;
        const completedDeals = deals.filter((d: any) => String(d?.status || '').toUpperCase() === 'COMPLETED').length;
        const contentPendingReview = deals.filter((d: any) => String(d?.status || '').toUpperCase() === 'CONTENT_DELIVERED').length;
        const needsActionDeals = deals.filter((d: any) => {
          const s = String(d?.status || '').toUpperCase();
          return s === 'CONTRACT_READY' || s === 'SENT' || s === 'CONTENT_DELIVERED';
        }).length;
        const needsActionOffers = requests.filter((r: any) => String(r?.status || '').toLowerCase() === 'countered').length;

        const now = new Date();
        const spendThisMonth = deals.reduce((sum: number, d: any) => {
          const created = d?.created_at ? new Date(d.created_at) : null;
          const amt = Number(d?.deal_amount || 0);
          if (!created || Number.isNaN(created.getTime())) return sum;
          if (created.getFullYear() !== now.getFullYear() || created.getMonth() !== now.getMonth()) return sum;
          return sum + (Number.isFinite(amt) ? amt : 0);
        }, 0);

        if (cancelled) return;
        setMetrics({
          isLoading: false,
          activeDeals,
          completedDeals,
          actionRequired: needsActionDeals + needsActionOffers,
          contentPendingReview,
          spendThisMonth,
        });
      } catch {
        if (!cancelled) setMetrics((m) => ({ ...m, isLoading: false }));
      }
    };

    void loadMetrics();
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async () => {
    if (!profile?.id) {
      toast.error('Profile not available');
      return;
    }

    const normalizedName = profileForm.brandName.trim();
    if (!normalizedName) {
      toast.error('Brand name is required');
      return;
    }

    setIsSavingProfile(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: normalizedName,
          first_name: normalizedName,
          bio: profileForm.description.trim() || null,
          location: profileForm.location.trim() || null,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // `brands` table usually has RLS enabled; use the backend (service role) to upsert safely.
      try {
        if (token) {
          const apiBase = getApiBaseUrl();
          const resp = await fetch(`${apiBase}/api/brand-dashboard/identity`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: normalizedName,
              website_url: profileForm.website.trim() || null,
              industry: profileForm.industry.trim() || null,
              description: profileForm.description.trim() || null,
              logo_url: (profile as any)?.avatar_url || null,
            }),
          });
          if (!resp.ok) {
            const payload = await resp.json().catch(() => ({}));
            console.warn('[BrandSettings] identity upsert failed:', payload?.error || resp.statusText);
          }
        }
      } catch (err) {
        console.warn('[BrandSettings] identity upsert request failed:', err);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(supportEmailStorageKey, profileForm.supportEmail.trim());
      }

      toast.success('Brand profile saved');
    } catch (error: any) {
      console.error('[BrandSettings] Save profile failed:', error);
      toast.error(error?.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleTheme = () => {
    const next = themePreference === 'system' ? 'dark' : themePreference === 'dark' ? 'light' : 'system';
    setThemePreference(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };

  return (
    <div className={cn('min-h-screen font-sans selection:bg-emerald-500/25', isDark ? 'bg-[#061318]' : 'bg-[#F7FFFB]', textColor)}>
      {!isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.16),transparent_60%)]" />
        </div>
      )}
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
        </div>
      )}

      <header className={cn('sticky top-0 z-20 border-b backdrop-blur-xl', isDark ? 'bg-[#061318]/92 border-white/10' : 'bg-white/90 border-slate-100')}>
        <div className="w-full md:max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/brand-dashboard')}
            className={cn('w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}
          >
            <ChevronLeft className={cn('w-5 h-5', textColor)} />
          </button>
          <div className="text-center">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.2em] opacity-40', textColor)}>Settings</p>
            <p className={cn('text-[16px] font-black tracking-tight', textColor)}>Business control</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn('w-10 h-10 rounded-full border flex items-center justify-center active:scale-90 transition', isDark ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-200 bg-white text-slate-700')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 w-full md:max-w-2xl mx-auto px-5 py-6 pb-24 space-y-6">
        {/* Brand identity */}
        <div className={cn('rounded-[28px] border overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.10)]', cardBorder, cardBg)}>
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className={cn('w-14 h-14 border shadow-sm', isDark ? 'border-white/10' : 'border-slate-200')}>
                  <AvatarImage src={brandLogo} alt={brandName} />
                  <AvatarFallback className={cn(isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900')}>
                    {brandName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  disabled={isUploadingLogo}
                  onClick={() => logoFileInputRef.current?.click()}
                  className={cn(
                    'absolute -bottom-1 -right-1 w-7 h-7 rounded-full border flex items-center justify-center transition active:scale-90',
                    isDark ? 'bg-[#061318] border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-700',
                    isUploadingLogo && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadBrandLogo(file);
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-[18px] font-black tracking-tight truncate', textColor)}>{brandName}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-white/10 bg-white/5 text-white/70' : 'border-slate-200 bg-white text-slate-700')}>
                    Verified Business
                  </span>
                  <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                    Protected by Creator Armour
                  </span>
                  {!hasUploadedLogo && (
                    <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'border-amber-500/25 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800')}>
                      Logo required
                    </span>
                  )}
                </div>
                {!hasUploadedLogo && (
                  <p className={cn('text-[12px] font-semibold mt-2', isDark ? 'text-amber-200/80' : 'text-amber-800/80')}>
                    Upload your logo so creators recognize and trust your offers.
                  </p>
                )}
              </div>
              <ShieldCheck className={cn('w-5 h-5 opacity-60', textColor)} />
            </div>

            <div className="grid grid-cols-1 gap-3 mt-5">
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50 mb-1', textColor)}>Brand name</p>
                <Input value={profileForm.brandName} onChange={(e) => setProfileForm((p) => ({ ...p, brandName: e.target.value }))} className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50 mb-1', textColor)}>Website</p>
                  <Input value={profileForm.website} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://…" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                </div>
                <div>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50 mb-1', textColor)}>Industry</p>
                  <Input value={profileForm.industry} onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))} placeholder="Fashion, SaaS…" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                </div>
              </div>
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50 mb-1', textColor)}>Support email</p>
                <Input value={profileForm.supportEmail} onChange={(e) => setProfileForm((p) => ({ ...p, supportEmail: e.target.value }))} placeholder="billing@…" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
              </div>
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50 mb-1', textColor)}>Description</p>
                <Textarea value={profileForm.description} onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))} placeholder="What you do, who you collaborate with…" className={cn('min-h-[110px]', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
              </div>
            </div>
          </div>

          <div className={cn('p-4 border-t', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-white/60')}>
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className={cn('w-full rounded-2xl font-black uppercase tracking-widest', 'bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500')}>
              <Save className="w-4 h-4 mr-2" />
              {isSavingProfile ? 'Saving…' : 'Save identity'}
            </Button>
          </div>
        </div>

        {/* Payments & Billing */}
        <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Payments & billing</p>
              <CreditCard className={cn('w-5 h-5', isDark ? 'text-sky-200' : 'text-sky-700')} />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Spend this month', value: metrics.isLoading ? '—' : `₹${Math.round(metrics.spendThisMonth).toLocaleString('en-IN')}` },
                { label: 'Active deals', value: metrics.isLoading ? '—' : String(metrics.activeDeals) },
                { label: 'Needs action', value: metrics.isLoading ? '—' : String(metrics.actionRequired), warn: (metrics.actionRequired ?? 0) > 0 },
              ].map((i) => (
                <div key={i.label} className={cn('p-3 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>{i.label}</p>
                  <p className={cn('text-[14px] font-black mt-1', i.warn ? (isDark ? 'text-amber-200' : 'text-amber-800') : textColor)}>{i.value}</p>
                </div>
              ))}
            </div>
            <div className={cn('mt-4 rounded-2xl border p-4', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-[13px] font-black', isDark ? 'text-emerald-200' : 'text-emerald-900')}>Invoices & methods</p>
                  <p className={cn('text-[12px] font-semibold mt-1', isDark ? 'text-emerald-100/70' : 'text-emerald-800/80')}>Full billing history is coming next.</p>
                </div>
                <Landmark className={cn('w-5 h-5', isDark ? 'text-emerald-200' : 'text-emerald-800')} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => toast.message('Payment methods', { description: 'Coming soon.' })} className={cn('h-12 rounded-2xl border text-[13px] font-black', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-emerald-200 text-emerald-900')}>
                  Payment methods
                </button>
                <button onClick={() => toast.message('Invoices', { description: 'Coming soon.' })} className={cn('h-12 rounded-2xl border text-[13px] font-black', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-emerald-200 text-emerald-900')}>
                  Invoice history
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Team members</p>
              <button onClick={() => toast.message('Invite member', { description: 'Team invites are coming next.' })} className={cn('px-3 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest', isDark ? 'border-white/10 bg-white/5 text-white/80' : 'border-slate-200 bg-white text-slate-700')}>
                Invite
              </button>
            </div>
            <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}>
              {teamMembers.map((m) => (
                <div key={m.id} className={cn('p-4 flex items-center justify-between gap-3', isDark ? 'border-b border-white/10 last:border-b-0' : 'border-b border-slate-100 last:border-b-0')}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className={cn('w-10 h-10 border', isDark ? 'border-white/10' : 'border-slate-200')}>
                      <AvatarImage src={m.avatar} alt={m.name} />
                      <AvatarFallback>{String(m.name || 'A').slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={cn('text-[13px] font-black truncate', textColor)}>{m.name}</p>
                      <p className={cn('text-[12px] font-semibold opacity-60 truncate', textColor)}>{m.email}</p>
                    </div>
                  </div>
                  <span className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest', isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-50 border-slate-200 text-slate-700')}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
          <div className="p-5">
            <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50 mb-3', textColor)}>Preferences</p>
            <button onClick={toggleTheme} className={cn('w-full p-4 rounded-2xl border flex items-center justify-between active:scale-[0.99] transition', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-500/10 text-amber-800')}>
                  {themeIcon}
                </div>
                <div className="text-left">
                  <p className={cn('text-[13px] font-black', textColor)}>Theme</p>
                  <p className={cn('text-[12px] font-semibold opacity-60', textColor)}>{themeModeLabel}</p>
                </div>
              </div>
              <span className={cn('text-[11px] font-black uppercase tracking-widest opacity-60', textColor)}>Toggle</span>
            </button>

            <div className={cn('mt-3 rounded-2xl border p-4', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
              <div className="flex items-center justify-between mb-3">
                <p className={cn('text-[13px] font-black', textColor)}>Notifications</p>
                <Bell className={cn('w-4 h-4 opacity-40', textColor)} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'accepted', label: 'Contracts & signatures' },
                  { id: 'deliverable', label: 'Content approvals' },
                  { id: 'countered', label: 'Offer counters' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center justify-between gap-3">
                    <span className={cn('text-[12px] font-semibold', textColor)}>{item.label}</span>
                    <Checkbox checked={(notificationPrefs as any)[item.id]} onCheckedChange={(checked) => setNotificationPrefs((p) => ({ ...p, [item.id]: Boolean(checked) }))} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className={cn('rounded-[28px] border overflow-hidden', isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
          <div className="p-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/12 to-transparent" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-60', isDark ? 'text-emerald-100' : 'text-emerald-900')}>Creator Armour protection</p>
                <p className={cn('text-[15px] font-black mt-2', isDark ? 'text-emerald-200' : 'text-emerald-900')}>Contracts + rights + dispute support</p>
                <p className={cn('text-[12px] font-semibold mt-1', isDark ? 'text-emerald-100/70' : 'text-emerald-800/80')}>Reliable collaboration rails for your team and creators.</p>
              </div>
              <ShieldCheck className={cn('w-6 h-6', isDark ? 'text-emerald-200' : 'text-emerald-800')} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => navigate('/brand-dashboard?tab=collabs&subtab=active')} className={cn('h-12 rounded-2xl border text-[13px] font-black', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-emerald-200 text-emerald-900')}>
                View active deals
              </button>
              <button onClick={() => toast.message('Disputes', { description: 'Coming soon.' })} className={cn('h-12 rounded-2xl border text-[13px] font-black', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-emerald-200 text-emerald-900')}>
                Raise issue
              </button>
            </div>
          </div>
        </div>

        {/* Account health */}
        <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
          <div className="p-5">
            <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50 mb-3', textColor)}>Account health</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Active', value: metrics.isLoading ? '—' : String(metrics.activeDeals), icon: <Landmark className="w-4 h-4" /> },
                { label: 'Pending', value: metrics.isLoading ? '—' : String(metrics.actionRequired), icon: <AlertTriangle className="w-4 h-4" /> },
                { label: 'Completed', value: metrics.isLoading ? '—' : String(metrics.completedDeals), icon: <ShieldCheck className="w-4 h-4" /> },
              ].map((i) => (
                <button key={i.label} type="button" onClick={() => navigate('/brand-dashboard?tab=collabs')} className={cn('p-3 rounded-2xl border text-left active:scale-[0.99] transition', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
                  <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center mb-2', isDark ? 'bg-white/5 text-white/70' : 'bg-slate-50 text-slate-700')}>
                    {i.icon}
                  </div>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>{i.label}</p>
                  <p className={cn('text-[14px] font-black mt-1', textColor)}>{i.value}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced */}
        <button type="button" onClick={() => setShowAdvanced((s) => !s)} className={cn('w-full p-4 rounded-[24px] border text-left active:scale-[0.99] transition', isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/5 text-white/70' : 'bg-slate-50 text-slate-700')}>
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className={cn('text-[13px] font-black', textColor)}>Advanced settings</p>
                <p className={cn('text-[12px] font-semibold opacity-60', textColor)}>Integrations + default campaign terms</p>
              </div>
            </div>
            <span className={cn('text-[11px] font-black uppercase tracking-widest opacity-60', textColor)}>{showAdvanced ? 'Hide' : 'Show'}</span>
          </div>
        </button>

        {showAdvanced && (
          <div className="space-y-6">
            <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
              <div className="p-5">
                <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50 mb-3', textColor)}>Integrations</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input value={integrations.whatsapp} onChange={(e) => setIntegrations((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="WhatsApp number" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                  <Input value={integrations.slack} onChange={(e) => setIntegrations((p) => ({ ...p, slack: e.target.value }))} placeholder="Slack channel" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                  <Input value={integrations.webhook} onChange={(e) => setIntegrations((p) => ({ ...p, webhook: e.target.value }))} placeholder="Webhook URL" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                </div>
              </div>
            </div>

            <div className={cn('rounded-[28px] border overflow-hidden', cardBorder, cardBg)}>
              <div className="p-5">
                <p className={cn('text-[12px] font-black uppercase tracking-[0.2em] opacity-50 mb-3', textColor)}>Default campaign terms</p>
                <div className="grid grid-cols-1 gap-3">
                  <Input value={campaignDefaults.budgetRange} onChange={(e) => setCampaignDefaults((p) => ({ ...p, budgetRange: e.target.value }))} placeholder="Budget range" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                  <Input value={campaignDefaults.deliverables} onChange={(e) => setCampaignDefaults((p) => ({ ...p, deliverables: e.target.value }))} placeholder="Deliverables" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={campaignDefaults.timeline} onChange={(e) => setCampaignDefaults((p) => ({ ...p, timeline: e.target.value }))} placeholder="Timeline" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                    <Input value={campaignDefaults.approval} onChange={(e) => setCampaignDefaults((p) => ({ ...p, approval: e.target.value }))} placeholder="Approval" className={cn(isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={cn('rounded-[24px] border p-4', isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200')}>
          <button onClick={handleLogout} className={cn('w-full h-12 rounded-2xl font-black text-[13px] border transition active:scale-[0.99]', isDark ? 'bg-rose-500/10 border-rose-300/30 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100')}>
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

export default BrandSettings;
