import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Building2, CreditCard, Globe, LogOut, Settings, Shield,
  Sun, Moon, Laptop, Users, Save, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { SectionCard } from '@/components/ui/card-variants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const BrandSettings = () => {
  const navigate = useNavigate();
  const { profile } = useSession();

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
  const themeIcon = themePreference === 'system'
    ? <Laptop className="w-4 h-4" />
    : (isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />);

  const brandName = profile?.first_name || profile?.business_name || 'Brand';
  const brandLogo = profile?.avatar_url || `https://ui-avatars.com/api/?name=${brandName}&background=0D8ABC&color=fff`;
  const supportEmailStorageKey = profile?.id ? `brand_settings_support_email:${profile.id}` : 'brand_settings_support_email';

  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const bgColor = isDark ? 'bg-black' : 'bg-slate-50';

  const [profileForm, setProfileForm] = useState({
    brandName,
    website: 'https://brand.com',
    industry: 'Fashion',
    location: 'Mumbai, India',
    description: 'We build creator-first campaigns across fashion and lifestyle categories.',
    supportEmail: 'marketing@brand.com',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [billingForm, setBillingForm] = useState({
    plan: 'Growth',
    billingEmail: 'billing@brand.com',
    cardLast4: '4242',
    nextInvoice: 'Apr 05, 2026',
  });

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
    budgetRange: '₹15,000 – ₹30,000',
    deliverables: '1 Reel, 2 Stories',
    timeline: '7 days',
    approval: 'Required',
  });

  const teamMembers = useMemo(() => ([
    { id: 't-1', name: 'Priya Mehta', role: 'Brand Owner', email: 'priya@brand.com', avatar: 'https://i.pravatar.cc/150?img=47' },
    { id: 't-2', name: 'Rahul Shah', role: 'Marketing Lead', email: 'rahul@brand.com', avatar: 'https://i.pravatar.cc/150?img=12' },
    { id: 't-3', name: 'Aditi Kapoor', role: 'Campaign Manager', email: 'aditi@brand.com', avatar: 'https://i.pravatar.cc/150?img=33' },
  ]), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    const loadBrandSettings = async () => {
      const fallbackSupportEmail =
        (typeof window !== 'undefined' ? localStorage.getItem(supportEmailStorageKey) : null) ||
        profile.email ||
        'marketing@brand.com';

      setProfileForm((current) => ({
        ...current,
        brandName: profile.business_name || profile.first_name || current.brandName,
        location: profile.location || current.location,
        description: profile.bio || current.description,
        supportEmail: fallbackSupportEmail,
      }));

      const { data: brandRow, error } = await supabase
        .from('brands')
        .select('name, website_url, industry, description')
        .eq('external_id', profile.id)
        .maybeSingle();

      if (cancelled || error || !brandRow) return;

      setProfileForm((current) => ({
        ...current,
        brandName: brandRow.name || current.brandName,
        website: brandRow.website_url || current.website,
        industry: brandRow.industry || current.industry,
        description: brandRow.description || current.description,
      }));
    };

    void loadBrandSettings();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.business_name, profile?.first_name, profile?.location, profile?.bio, profile?.email, supportEmailStorageKey]);

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

      const { data: existingBrand, error: existingBrandError } = await supabase
        .from('brands')
        .select('id')
        .eq('external_id', profile.id)
        .maybeSingle();

      if (existingBrandError) throw existingBrandError;

      const brandPayload = {
        external_id: profile.id,
        name: normalizedName,
        website_url: profileForm.website.trim() || null,
        industry: profileForm.industry.trim() || 'General',
        description: profileForm.description.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (existingBrand?.id) {
        const { error: brandUpdateError } = await supabase
          .from('brands')
          .update(brandPayload as any)
          .eq('id', existingBrand.id);
        if (brandUpdateError) throw brandUpdateError;
      } else {
        const { error: brandInsertError } = await supabase
          .from('brands')
          .insert({
            ...brandPayload,
            created_at: new Date().toISOString(),
          } as any);
        if (brandInsertError) throw brandInsertError;
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

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden pb-20",
      "-mx-4 md:-mx-6 lg:-mx-8 -mt-6 -mb-6",
      bgColor,
      textColor
    )}>
      {/* Top Navigation */}
      <header className={cn(
        "h-16 sm:h-20 border-b px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl transition-all duration-300",
        isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-slate-200"
      )}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/brand-dashboard')}
            className={cn(
              "min-h-12 px-4 rounded-xl flex items-center gap-2 border text-[11px] font-black uppercase tracking-widest touch-manipulation",
              isDark ? "bg-white/0 border-white/10 text-white/70 hover:bg-white/10" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={cn("text-[14px] sm:text-[16px] font-black tracking-tight font-outfit uppercase", textColor)}>
                {brandName}
              </h1>
              <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40", textColor)}>
                Brand Settings
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              const next =
                themePreference === 'system' ? 'dark' :
                  themePreference === 'dark' ? 'light' : 'system';
              setThemePreference(next);
              try {
                localStorage.setItem(THEME_KEY, next);
              } catch { /* ignore */ }
            }}
            className={cn(
              "h-10 px-2.5 sm:px-3 rounded-xl flex items-center gap-2 transition-all border text-[11px] font-black uppercase tracking-widest",
              isDark ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <span className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              isDark ? "bg-white/5" : "bg-slate-100"
            )}>
              {themeIcon}
            </span>
            <span className="hidden sm:inline">{themeModeLabel}</span>
          </button>
          <button className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
            isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          )}>
            <Bell className="w-5 h-5" />
          </button>
          <Avatar className={cn("h-10 w-10 ring-2 ring-primary/20", isDark ? "border border-white/10" : "border border-slate-200")}>
            <AvatarImage src={brandLogo} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{brandName.charAt(0)}</AvatarFallback>
          </Avatar>
          <button
            onClick={handleLogout}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              isDark ? "text-white/40 hover:text-red-400 hover:bg-red-400/10" : "text-slate-500 hover:text-red-600 hover:bg-red-50"
            )}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        {/* Brand Profile */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Brand Profile"
          subtitle="Core brand details and public info"
          icon={<Building2 className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Brand name</p>
              <Input
                value={profileForm.brandName}
                onChange={(e) => setProfileForm((p) => ({ ...p, brandName: e.target.value }))}
                className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
              />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Website</p>
              <Input
                value={profileForm.website}
                onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
                className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
              />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Industry</p>
              <Input
                value={profileForm.industry}
                onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))}
                className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
              />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Location</p>
              <Input
                value={profileForm.location}
                onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))}
                className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Brand description</p>
            <Textarea
              value={profileForm.description}
              onChange={(e) => setProfileForm((p) => ({ ...p, description: e.target.value }))}
              className={cn("min-h-[90px]", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
            />
          </div>
          <div className="mt-4">
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Support email</p>
            <Input
              value={profileForm.supportEmail}
              onChange={(e) => setProfileForm((p) => ({ ...p, supportEmail: e.target.value }))}
              className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className={cn(
              "h-11 px-5 rounded-xl text-white font-black uppercase tracking-widest text-[11px] shadow-sm",
              isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
            )}>
              <Save className="w-4 h-4 mr-2" />
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SectionCard>

        {/* Team Members */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Team & Roles"
          subtitle="Manage people who can access the brand console"
          icon={<Users className={cn("w-4 h-4", isDark ? "text-purple-400" : "text-purple-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="space-y-3">
            {teamMembers.map((m) => (
              <div key={m.id} className={cn(
                "rounded-2xl border p-3 flex items-center justify-between gap-3",
                isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"
              )}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className={cn("h-10 w-10 border", isDark ? "border-white/10" : "border-slate-200")}>
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className={cn(isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-700")}>
                      {m.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className={cn("text-[12px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>{m.name}</p>
                    <p className={cn("text-[11px] font-semibold truncate", isDark ? "text-white/40" : "text-slate-600")}>{m.role} • {m.email}</p>
                  </div>
                </div>
                <Button variant="outline" className={cn(
                  "h-9 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border",
                  isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                )}>
                  Manage
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button className={cn(
              "h-10 px-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] shadow-sm",
              isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
            )}>
              Invite Member
            </Button>
          </div>
        </SectionCard>

        {/* Billing */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Billing & Invoices"
          subtitle="Plan, payment method, and invoices"
          icon={<CreditCard className={cn("w-4 h-4", isDark ? "text-emerald-400" : "text-emerald-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Plan</p>
              <Input value={billingForm.plan} onChange={(e) => setBillingForm((p) => ({ ...p, plan: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Billing email</p>
              <Input value={billingForm.billingEmail} onChange={(e) => setBillingForm((p) => ({ ...p, billingEmail: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Card</p>
              <Input value={`•••• ${billingForm.cardLast4}`} readOnly className={cn(isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Next invoice</p>
              <Input value={billingForm.nextInvoice} readOnly className={cn(isDark ? "bg-white/5 border-white/10 text-white/70" : "bg-white border-slate-200 text-slate-600")} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button className={cn(
              "h-10 px-4 rounded-xl text-white font-black uppercase tracking-widest text-[10px] shadow-sm",
              isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
            )}>
              Manage Billing
            </Button>
          </div>
        </SectionCard>

        {/* Notification Preferences */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Notification Preferences"
          subtitle="Control when and how we notify your team"
          icon={<Bell className={cn("w-4 h-4", isDark ? "text-orange-400" : "text-orange-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDark ? "text-white/40" : "text-slate-500")}>Notify when</p>
              {[
                { id: 'countered', label: 'Creator counters offer' },
                { id: 'accepted', label: 'Creator accepts offer' },
                { id: 'deliverable', label: 'Creator uploads deliverable' },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={(notificationPrefs as any)[item.id]}
                    onCheckedChange={(checked) => setNotificationPrefs((p) => ({ ...p, [item.id]: Boolean(checked) }))}
                  />
                  <span className={cn("text-[12px] font-semibold", isDark ? "text-white/70" : "text-slate-700")}>{item.label}</span>
                </label>
              ))}
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDark ? "text-white/40" : "text-slate-500")}>Channels</p>
              {[
                { id: 'email', label: 'Email' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'push', label: 'Push notifications' },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={(notificationPrefs as any)[item.id]}
                    onCheckedChange={(checked) => setNotificationPrefs((p) => ({ ...p, [item.id]: Boolean(checked) }))}
                  />
                  <span className={cn("text-[12px] font-semibold", isDark ? "text-white/70" : "text-slate-700")}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Integrations */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Integrations"
          subtitle="Connect messaging and automation channels"
          icon={<Globe className={cn("w-4 h-4", isDark ? "text-indigo-400" : "text-indigo-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>WhatsApp number</p>
              <Input value={integrations.whatsapp} onChange={(e) => setIntegrations((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="+91 90000 00000" className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Slack channel</p>
              <Input value={integrations.slack} onChange={(e) => setIntegrations((p) => ({ ...p, slack: e.target.value }))} placeholder="#campaigns" className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Webhook URL</p>
              <Input value={integrations.webhook} onChange={(e) => setIntegrations((p) => ({ ...p, webhook: e.target.value }))} placeholder="https://hooks.brand.com" className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")} />
            </div>
          </div>
        </SectionCard>

        {/* Default Campaign Settings */}
        <SectionCard
          theme={isDark ? 'dark' : 'light'}
          title="Default Campaign Settings"
          subtitle="Pre-fill new offers with your standard terms"
          icon={<Settings className={cn("w-4 h-4", isDark ? "text-slate-300" : "text-slate-600")} />}
          variant="tertiary"
          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Default budget range</p>
              <Input value={campaignDefaults.budgetRange} onChange={(e) => setCampaignDefaults((p) => ({ ...p, budgetRange: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Default deliverables</p>
              <Input value={campaignDefaults.deliverables} onChange={(e) => setCampaignDefaults((p) => ({ ...p, deliverables: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Default timeline</p>
              <Input value={campaignDefaults.timeline} onChange={(e) => setCampaignDefaults((p) => ({ ...p, timeline: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
            <div>
              <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Approval required</p>
              <Input value={campaignDefaults.approval} onChange={(e) => setCampaignDefaults((p) => ({ ...p, approval: e.target.value }))} className={cn(isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200")} />
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
};

export default BrandSettings;
