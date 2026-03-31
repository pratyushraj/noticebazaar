import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Download, Laptop, Loader2, Moon, ShieldCheck, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';

type ThemePref = 'system' | 'dark' | 'light';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const formatInr = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-IN');
};

const pluralizeDeliverable = (label: string, count: number) => {
  const trimmed = label.trim();
  if (count === 1) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower === 'story') return 'Stories';
  if (lower === 'reel') return 'Reels';
  if (lower.endsWith('s')) return trimmed;
  return `${trimmed}s`;
};

const formatDeliverablesSummary = (deliverables: string[]) => {
  if (!deliverables.length) return 'Deliverables included';
  const parts = deliverables
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((d) => {
      const m = d.match(/^(.*)\s*\(x(\d+)\)\s*$/i);
      if (m) {
        const base = m[1].trim();
        const qty = Number(m[2]);
        const name = pluralizeDeliverable(base, qty);
        return `${qty} ${name}`;
      }
      if (/^\d+/.test(d)) return d;
      return `1 ${pluralizeDeliverable(d, 1)}`;
    });
  return parts.join(' + ');
};

const isIos = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
};

const ProposalSent = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { profile } = useSession();
  const [searchParams] = useSearchParams();

  const THEME_KEY = 'brand_console_theme_preference';
  const [themePreference, setThemePreference] = useState<ThemePref>(() => {
    if (typeof window === 'undefined') return 'system';
    const saved = (localStorage.getItem(THEME_KEY) || '').toLowerCase();
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved as ThemePref;
    return 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_KEY, themePreference);
  }, [themePreference]);

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

  const [loading, setLoading] = useState(true);
  const [consoleData, setConsoleData] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installAttempted, setInstallAttempted] = useState(false);

  const openApp = searchParams.get('openApp') === '1';
  const showInstallUpsell = !openApp && !isStandalone();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const fetchConsole = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const res = await fetch(`${apiBaseUrl}/api/collab/console/${token}`);
        const data = await res.json();
        if (!data?.success) {
          toast.error(data?.error || 'Unable to load proposal');
          setConsoleData(null);
        } else {
          setConsoleData(data);
        }
      } catch {
        toast.error('Network error. Please try again.');
        setConsoleData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchConsole();
  }, [token]);

  const dealSummary = useMemo(() => {
    const cr = consoleData?.collabRequest;
    const amount = cr?.exact_budget ?? cr?.budget ?? null;
    const deliverables = Array.isArray(cr?.deliverables) ? cr.deliverables : (typeof cr?.deliverables === 'string' ? [cr.deliverables] : []);
    return {
      amount,
      deliverables,
      statusLabel: 'Waiting for creator response',
      replySla: 'Most creators reply within 24 hours',
      creatorNotified: Boolean(cr?.last_notified_at),
    };
  }, [consoleData]);

  const fallbackHref = useMemo(() => {
    if (profile?.role === 'brand') return '/brand-dashboard';
    if (token) return `/deal/${token}?source=collab_submit`;
    return '/';
  }, [profile?.role, token]);

  const handleInstall = async () => {
    if (isStandalone()) {
      toast.success('App is already installed.');
      return;
    }
    if (isIos() && !installPrompt) {
      toast.message('On iPhone: Share → “Add to Home Screen” to install.');
      return;
    }
    if (!installPrompt) {
      toast.message('Install is not available in this browser. Try Chrome/Edge or add to home screen.');
      return;
    }
    try {
      setInstallAttempted(true);
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('Installed. Open the app from your home screen for real-time updates.');
      } else {
        toast.message('You can install later from the menu.');
        // If the install prompt is dismissed during the conversion flow,
        // fallback to the dashboard/console so the brand can keep moving.
        navigate(fallbackHref, { replace: true });
      }
    } catch {
      toast.error('Install failed. Please try again.');
    }
  };

  // Trigger prompt immediately for conversion, then fallback to console.
  useEffect(() => {
    if (!openApp) return;
    if (installAttempted) return;
    if (!installPrompt) return;
    handleInstall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openApp, installPrompt, installAttempted]);

  const brandDashboardHref = profile?.role === 'brand' ? '/brand-dashboard' : '/';

  return (
    <div className={cn(isDark ? 'dark' : '', 'min-h-screen')}>
      <div className="min-h-screen bg-gradient-to-br from-[#06281F] via-[#071B18] to-[#0A0A0B] dark:from-[#06281F] dark:via-[#071B18] dark:to-[#0A0A0B] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-[340px] h-[340px] rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute top-[18%] -right-24 w-[380px] h-[380px] rounded-full bg-teal-500/12 blur-3xl" />
        </div>

        <header className="relative z-10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="leading-tight">
              <p className="text-[12px] font-black tracking-wide">Creator Armour</p>
              <p className="text-[11px] text-white/60 font-semibold">Proposal confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-1 py-1">
            <button
              onClick={() => setThemePreference('system')}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                themePreference === 'system' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/60 hover:text-white'
              )}
              aria-label="Theme: system"
            >
              <Laptop className="w-4 h-4" />
            </button>
            <button
              onClick={() => setThemePreference('light')}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                themePreference === 'light' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/60 hover:text-white'
              )}
              aria-label="Theme: light"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setThemePreference('dark')}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                themePreference === 'dark' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/60 hover:text-white'
              )}
              aria-label="Theme: dark"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="relative z-10 max-w-xl mx-auto px-5 pb-12">
          <div className="pt-2 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shadow-[0_20px_60px_rgba(15,164,127,0.18)]"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-300" />
              </motion.div>
            </motion.div>
            <h1 className="mt-4 text-[26px] font-black tracking-tight">Proposal sent successfully</h1>
            <p className="mt-1 text-[13px] text-white/70 font-semibold">
              Your collaboration request has been securely delivered.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.40)] overflow-hidden">
            <div className="p-5">
              {loading ? (
                <div className="py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-emerald-300 animate-spin" />
                  <p className="text-[12px] font-semibold text-white/60">Loading proposal summary…</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Proposal</p>
                  <div className="mt-2 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[22px] font-black leading-tight">₹{formatInr(dealSummary.amount)}</p>
                      <p className="mt-1 text-[13px] font-semibold text-white/70 truncate">
                        {formatDeliverablesSummary(dealSummary.deliverables)}
                      </p>
                    </div>
                    <div className="shrink-0 px-3 py-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 text-[11px] font-black uppercase tracking-widest">
                      Sent
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[12px] font-black text-white">{dealSummary.statusLabel}</p>
                    <p className="mt-1 text-[12px] font-semibold text-white/60">{dealSummary.replySla}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[12px] font-semibold text-white/70">Creator has been notified</p>
                      <span className={cn('text-[11px] font-black', dealSummary.creatorNotified ? 'text-emerald-300' : 'text-white/50')}>
                        {dealSummary.creatorNotified ? 'CONFIRMED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[12px] font-semibold text-white/70">Secure deal workflow enabled</p>
                      <span className="text-[11px] font-black text-emerald-300">ON</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-[12px] font-semibold text-white/70">Updates via email / WhatsApp</p>
                      <span className="text-[11px] font-black text-white/60">ENABLED</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-white/10 bg-gradient-to-r from-emerald-500/10 via-white/5 to-teal-500/10">
              {showInstallUpsell && (
                <div className="rounded-[24px] border border-emerald-400/25 bg-emerald-500/10 p-4 shadow-[0_18px_48px_rgba(15,164,127,0.18)]">
                  <p className="text-[12px] font-black uppercase tracking-[0.18em] text-emerald-100/90">Track this deal in real time</p>
                  <p className="mt-1 text-[13px] font-semibold text-white/75">
                    Install Creator Armour for instant updates, faster approvals, and deal tracking.
                  </p>
                  {isIos() && (
                    <p className="mt-2 text-[12px] font-semibold text-white/70">
                      iPhone/iPad: Share → <span className="text-emerald-200 font-black">Add to Home Screen</span>
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 text-[12px] text-white/70 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-300/80" />
                      Instant notifications when creator responds
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-300/80" />
                      Faster deal management
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-300/80" />
                      Track all collaborations in one place
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Button
                      type="button"
                      onClick={handleInstall}
                      className={cn(
                        'h-12 rounded-2xl font-black uppercase tracking-widest',
                        'bg-[#0FA47F] hover:bg-emerald-600 text-white shadow-[0_16px_40px_rgba(15,164,127,0.30)]',
                        'animate-[pulse_1.6s_ease-in-out_infinite]'
                      )}
                    >
                      Install App
                      <Download className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/deal/${token}?source=collab_submit`, { replace: true })}
                      className="h-12 rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-widest"
                    >
                      Continue in browser
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] text-white/55 font-semibold">
                    You can install later from the menu.
                  </p>
                </div>
              )}

              <div className={cn(showInstallUpsell ? 'mt-4' : 'mt-0', 'grid grid-cols-1 sm:grid-cols-2 gap-2.5')}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(brandDashboardHref)}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-black uppercase tracking-widest"
                >
                  Go to dashboard
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/', { replace: false })}
                  className="h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest"
                >
                  Send another offer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProposalSent;
