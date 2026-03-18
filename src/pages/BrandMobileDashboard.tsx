import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Clock,
  ChevronRight,
  CreditCard,
  Handshake,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  User,
  Users,
  Mail,
  Zap,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type BrandTab = 'dashboard' | 'collabs' | 'creators' | 'profile';
type BrandCollabTab = 'pending' | 'active' | 'completed';

type BrandDashboardStats = {
  totalSent: number;
  needsAction: number;
  activeDeals: number;
  totalInvestment: number;
};

type BrandMobileDashboardProps = {
  profile?: any;
  requests?: any[];
  deals?: any[];
  stats?: BrandDashboardStats;
  initialTab?: BrandTab;
  isLoading?: boolean;
  isDemoBrand?: boolean;
  onRefresh?: () => Promise<void>;
  onLogout?: () => void | Promise<void>;
};

const formatCompactINR = (n: any) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
};

const formatFollowers = (n: any) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num >= 1_00_00_000) return `${(num / 1_00_00_000).toFixed(1)}Cr`.replace('.0', '') + ' followers';
  if (num >= 1_00_000) return `${(num / 1_00_000).toFixed(1)}L`.replace('.0', '') + ' followers';
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`.replace('.0', '') + ' followers';
  return `${num} followers`;
};

const timeSince = (iso: any) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.max(0, Math.round(diffMs / (1000 * 60)));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
};

const safeImageSrc = (url: any) => {
  const s = typeof url === 'string' ? url : '';
  if (!s) return undefined;
  if (s.includes('cdninstagram.com')) return undefined;
  return s;
};

const uniqBy = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
};

const startOfLocalMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sameLocalMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const normalizeStatus = (status: any) => String(status || '').trim().toLowerCase();

const firstNameish = (profile: any) => {
  const label = profile?.business_name || profile?.first_name || profile?.username || 'Creator';
  return String(label || 'Creator').trim() || 'Creator';
};

type SuggestedCreator = {
  id: string;
  username?: string | null;
  name: string;
  category?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  followers?: number | null;
  pricing?: {
    min?: number | null;
    avg?: number | null;
    max?: number | null;
    reel?: number | null;
  } | null;
  trust?: {
    completed_deals?: number;
    total_deals?: number;
    completion_rate?: number;
    avg_response_hours?: number | null;
  } | null;
};

const formatDeliverables = (row: any) => {
  const d = row?.deliverables;
  if (!d) return '';
  if (typeof d === 'string') return d.trim();
  if (Array.isArray(d)) {
    const parts = d
      .map((x: any) => {
        if (!x) return null;
        if (typeof x === 'string') return x.trim();
        const label = x?.type || x?.name || x?.deliverable;
        const qty = x?.qty || x?.count || x?.quantity;
        if (label && qty) return `${qty} ${label}`;
        if (label) return String(label);
        return null;
      })
      .filter(Boolean);
    return parts.slice(0, 3).join(' • ');
  }
  try {
    const asJson = JSON.stringify(d);
    return asJson.length > 5 ? asJson : '';
  } catch {
    return '';
  }
};

const formatBudget = (row: any) => {
  const exact = Number(row?.exact_budget);
  if (Number.isFinite(exact) && exact > 0) return formatCompactINR(exact);
  const dealAmount = Number(row?.deal_amount);
  if (Number.isFinite(dealAmount) && dealAmount > 0) return formatCompactINR(dealAmount);
  const range = String(row?.budget_range || '').trim();
  if (range) return range;
  const barter = Number(row?.barter_value);
  if (Number.isFinite(barter) && barter > 0) return `${formatCompactINR(barter)} barter`;
  return '';
};

const dealStageLabel = (row: any) => {
  const s = normalizeStatus(row?.status);
  if (!s) return 'In progress';
  if (s.includes('draft')) return 'Drafting';
  if (s.includes('create')) return 'Creating';
  if (s.includes('submit')) return 'Submitted';
  if (s.includes('payment') || s.includes('pay')) return 'Payment';
  if (s.includes('accepted')) return 'Accepted';
  return row?.status || 'In progress';
};

const deadlineLabel = (row: any) => {
  const raw = row?.due_date || row?.deadline;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Due today', tone: 'danger' as const };
  if (diffDays <= 2) return { text: `Due in ${diffDays}d`, tone: 'warn' as const };
  return { text: `Due in ${diffDays}d`, tone: 'neutral' as const };
};

const BrandMobileDashboard = ({
  profile,
  requests = [],
  deals = [],
  stats,
  initialTab = 'dashboard',
  isLoading = false,
  onRefresh,
  onLogout,
  isDemoBrand = false,
}: BrandMobileDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const subtabParam = searchParams.get('subtab');
  const highlightedDealId = searchParams.get('dealId');
  const highlightedRequestId = searchParams.get('requestId');
  const activeTab: BrandTab =
    tabParam === 'dashboard' || tabParam === 'collabs' || tabParam === 'creators' || tabParam === 'profile'
      ? tabParam
      : initialTab;
  const activeCollabTab: BrandCollabTab =
    subtabParam === 'pending' || subtabParam === 'active' || subtabParam === 'completed' ? subtabParam : 'pending';

  const setActiveTab = (tab: BrandTab, subtab?: BrandCollabTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab === 'collabs') {
      next.set('subtab', subtab || activeCollabTab || 'pending');
    } else {
      next.delete('subtab');
    }
    setSearchParams(next, { replace: true });
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      triggerHaptic(HapticPatterns.light);
      setTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('light');
    };
  }, [theme]);

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const secondaryTextColor = isDark ? 'text-white/50' : 'text-slate-500';
  const bgColor = isDark ? 'bg-[#061318]' : 'bg-white';
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const cardBgColor = isDark ? 'bg-white/6 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl';

  useEffect(() => {
    setActiveTab(initialTab, initialTab === 'collabs' ? activeCollabTab : undefined);
  }, [initialTab]);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState<number | null>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [selectedDealPage, setSelectedDealPage] = useState<any | null>(null);
  const [quickSendEmail, setQuickSendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isOpeningContract, setIsOpeningContract] = useState(false);
  const [localOffers, setLocalOffers] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('brandMonthlyBudgetInr');
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        setMonthlyBudgetInr(parsed);
        setBudgetDraft(String(Math.round(parsed)));
      }
    } catch {
      // ignore
    }
  }, []);

  const brandName = useMemo(() => {
    const name = profile?.business_name || profile?.first_name || profile?.full_name || (isDemoBrand ? 'Acme Corp' : 'Brand');
    return String(name || 'Brand').trim() || 'Brand';
  }, [profile, isDemoBrand]);

  const brandLogo = useMemo(() => {
    const src = profile?.avatar_url || profile?.logo_url;
    if (src) return src;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=10B981&color=fff`;
  }, [profile, brandName]);

  const displayStats: BrandDashboardStats = useMemo(() => {
    return {
      totalSent: stats?.totalSent ?? 0,
      needsAction: stats?.needsAction ?? 0,
      activeDeals: stats?.activeDeals ?? 0,
      totalInvestment: stats?.totalInvestment ?? 0,
    };
  }, [stats]);

  const spendThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = startOfLocalMonth(now);
    return (deals || []).reduce((acc: number, d: any) => {
      const createdAt = d?.created_at ? new Date(d.created_at) : null;
      const amount = Number(d?.deal_amount) || 0;
      if (!createdAt || !(amount > 0)) return acc;
      if (createdAt >= monthStart && sameLocalMonth(createdAt, now)) return acc + amount;
      return acc;
    }, 0);
  }, [deals]);

  const budgetUsedPct = useMemo(() => {
    if (!monthlyBudgetInr || !(monthlyBudgetInr > 0)) return null;
    const pct = (Number(spendThisMonth) / monthlyBudgetInr) * 100;
    if (!Number.isFinite(pct)) return null;
    return Math.min(999, Math.max(0, Math.round(pct)));
  }, [monthlyBudgetInr, spendThisMonth]);

  const budgetRemaining = useMemo(() => {
    if (!monthlyBudgetInr || !(monthlyBudgetInr > 0)) return null;
    return Math.max(0, Math.round(monthlyBudgetInr - Number(spendThisMonth)));
  }, [monthlyBudgetInr, spendThisMonth]);

  const creatorReplies = useMemo(() => {
    // "Reply" for a brand generally means offer moved beyond "pending".
    return (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      if (!s) return false;
      return s !== 'pending';
    }).length;
  }, [requests]);

  const creatorFeed = useMemo(() => {
    const fromReqs = (requests || []).map((r: any) => ({
      id: String(r?.creator_id || r?.profiles?.id || ''),
      name: firstNameish(r?.profiles),
      username: r?.profiles?.username || '',
      avatar_url: r?.profiles?.avatar_url || '',
      status: String(r?.status || ''),
      href: '/brand-dashboard?tab=collabs',
    }));
    const fromDeals = (deals || []).map((d: any) => ({
      id: String(d?.creator_id || d?.profiles?.id || ''),
      name: firstNameish(d?.profiles),
      username: d?.profiles?.username || '',
      avatar_url: d?.profiles?.avatar_url || '',
      status: String(d?.status || ''),
      href: '/brand-dashboard?tab=collabs',
    }));
    return uniqBy([...fromReqs, ...fromDeals].filter((c) => c.id), (c) => c.id).slice(0, 12);
  }, [requests, deals]);

  const { data: suggestedCreators = [], isLoading: isLoadingSuggestedCreators } = useSupabaseQuery<SuggestedCreator[]>(
    ['brandSuggestedCreators'],
    async () => {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/creators/suggested?limit=10`);
      if (res.status === 404) return [];
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to fetch creators');
      return Array.isArray(data.creators) ? (data.creators as SuggestedCreator[]) : [];
    },
    { staleTime: 60_000 }
  );

  const offers = useMemo(() => {
    const base = (requests || []) as any[];
    return [...localOffers, ...base];
  }, [requests, localOffers]);

  const handleQuickSend = async () => {
    if (!quickSendEmail.trim() || !quickSendEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsSending(true);
    triggerHaptic(HapticPatterns.light);

    // Artificial delay for premium feel
    await new Promise(r => setTimeout(r, 1500));

    const newOffer = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      exact_budget: 12000,
      brand_name: brandName,
      profiles: { 
        username: quickSendEmail.split('@')[0], 
        first_name: quickSendEmail.split('@')[0], 
        last_name: '',
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(quickSendEmail)}&background=random`
      }
    };

    setLocalOffers([newOffer, ...localOffers]);
    toast.success('Offer Sent Successfully!', {
      description: `Campaign brief sent to ${quickSendEmail}`,
      icon: <Zap className="w-4 h-4 text-emerald-500" />
    });
    
    setIsSending(false);
    setShowQuickSend(false);
    setQuickSendEmail('');
    triggerHaptic(HapticPatterns.success);
  };
  // Pending offers = requests that haven't been accepted/declined yet
  const pendingOffersList = useMemo(() => {
    return offers.filter((o: any) => {
      const s = normalizeStatus(o?.status);
      return s === 'pending' || s === 'countered';
    });
  }, [offers]);

  const activeDealsList = useMemo(() => {
    // Include brand_deals that are active (not cancelled/completed)
    const fromDeals = (deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return true;
      if (s.includes('cancel')) return false;
      if (s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid')) return false;
      return true;
    });
    // Also include collab_requests accepted by creator (these are active collabs)
    const fromAcceptedRequests = (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      return s === 'accepted';
    });
    // Merge: prefer brand_deals entry if we have one for same creator
    const dealCreatorIds = new Set(fromDeals.map((d: any) => String(d.creator_id || '')).filter(Boolean));
    const acceptedNotInDeals = fromAcceptedRequests.filter((r: any) => !dealCreatorIds.has(String(r.creator_id || '')));
    return [...fromDeals, ...acceptedNotInDeals] as any[];
  }, [deals, requests]);

  const completedDealsList = useMemo(() => {
    return (deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return false;
      return s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid');
    }) as any[];
  }, [deals]);

  const visibleCollabItems = useMemo(() => {
    if (activeCollabTab === 'active') return activeDealsList;
    if (activeCollabTab === 'completed') return completedDealsList;
    return pendingOffersList;
  }, [activeCollabTab, activeDealsList, completedDealsList, pendingOffersList]);

  useEffect(() => {
    if (activeTab !== 'collabs') return;
    if (!highlightedDealId && !highlightedRequestId) return;

    const match =
      activeDealsList.find((item: any) => String(item?.id) === String(highlightedDealId)) ||
      pendingOffersList.find((item: any) => String(item?.id) === String(highlightedRequestId)) ||
      completedDealsList.find((item: any) => String(item?.id) === String(highlightedDealId));

    if (match) {
      setSelectedOffer((current) => (current?.id === match.id ? current : match));
    }
  }, [
    activeTab,
    highlightedDealId,
    highlightedRequestId,
    activeDealsList,
    pendingOffersList,
    completedDealsList,
  ]);

  const acceptedDealsCount = useMemo(() => {
    const acceptedRequests = (requests || []).filter((r: any) => normalizeStatus(r?.status) === 'accepted').length;
    const activeDeals = (deals || []).filter((d: any) => !normalizeStatus(d?.status).includes('cancel')).length;
    return Math.max(acceptedRequests, activeDeals);
  }, [requests, deals]);

  const conversionRate = useMemo(() => {
    const sent = Math.max(0, Number(displayStats.totalSent) || 0);
    if (sent <= 0) return 0;
    return Math.round((acceptedDealsCount / sent) * 100);
  }, [acceptedDealsCount, displayStats.totalSent]);

  const primaryAction = useMemo(() => {
    if (displayStats.needsAction > 0) {
      return {
        title: `⚡ ${displayStats.needsAction} creator${displayStats.needsAction === 1 ? '' : 's'} awaiting your response`,
        cta: 'Review offers',
        onClick: () => setActiveTab('collabs'),
        tone: 'attention' as const,
      };
    }
    if (displayStats.totalSent === 0 && displayStats.activeDeals === 0) {
      return {
        title: '🚀 Start your first campaign',
        cta: 'Send offer',
        onClick: () => setShowActionSheet(true),
        tone: 'primary' as const,
      };
    }
    return {
      title: 'Send your next offer in 30 seconds',
      cta: 'Send offer',
      onClick: () => setShowActionSheet(true),
      tone: 'neutral' as const,
    };
  }, [displayStats.activeDeals, displayStats.needsAction, displayStats.totalSent]);

  const getSmartTags = (c: SuggestedCreator) => {
    const tags: string[] = [];
    const completion = Number(c?.trust?.completion_rate ?? 0);
    const completed = Number(c?.trust?.completed_deals ?? 0);
    const avgHrs = c?.trust?.avg_response_hours ?? null;
    const rate = Number(c?.pricing?.avg ?? c?.pricing?.reel ?? 0);

    if (completion >= 95 && completed >= 5) tags.push('🔥 High reliability');
    if (avgHrs !== null && avgHrs <= 6) tags.push('⚡ Fast responder');
    if (rate > 0 && rate <= 6000) tags.push('💰 Budget friendly');
    return tags.slice(0, 2);
  };

  const getReliabilityLines = (c: SuggestedCreator) => {
    const lines: string[] = [];
    const completion = Number(c?.trust?.completion_rate ?? 0);
    const completed = Number(c?.trust?.completed_deals ?? 0);
    const avgHrs = c?.trust?.avg_response_hours ?? null;

    if (completion > 0) lines.push(`✔ ${completion}% completion`);
    if (avgHrs !== null && avgHrs > 0) lines.push(`⚡ Responds in ~${avgHrs}h`);
    if (completed > 0) lines.push(`✔ ${completed} completed deals`);
    return lines.slice(0, 3);
  };

  const notifications = useMemo(
    () =>
      [
        displayStats.needsAction > 0
          ? {
              id: 'n-action',
              title: `${displayStats.needsAction} offer${displayStats.needsAction === 1 ? '' : 's'} need your reply`,
              time: 'Today',
              href: '/brand-dashboard?tab=collabs',
            }
          : null,
        displayStats.totalSent > 0
          ? { id: 'n-sent', title: 'Offers sent this week', time: 'This week', href: '/brand-dashboard?tab=collabs' }
          : null,
      ].filter(Boolean) as any[],
    [displayStats.needsAction, displayStats.totalSent]
  );

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isBusy: isPushBusy,
    promptDismissed: isPushPromptDismissed,
    isIOSNeedsInstall,
    hasVapidKey,
    enableNotifications,
    dismissPrompt: dismissPushPrompt,
    sendTestPush,
    refreshStatus: refreshPushStatus,
  } = useDealAlertNotifications();

  const handleEnablePush = async () => {
    try {
      const result = await enableNotifications();
      if (result?.success) {
        toast.success('Notifications enabled');
      } else {
        const reason = result?.reason || 'unknown';
        if (reason === 'missing_vapid_key') toast.error('Notifications not configured yet');
        else if (reason === 'denied') toast.error('Notifications blocked in browser settings');
        else toast.error('Failed to enable notifications');
      }
    } catch {
      toast.error('Failed to enable notifications');
    }
  };

  const PageHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 px-5 py-4 mb-4">
      <button
        onClick={() => {
          triggerHaptic(HapticPatterns.light);
          setActiveSettingsPage(null);
        }}
        className={cn('p-2 -ml-2 rounded-full transition-all active:scale-90', secondaryTextColor, isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100')}
      >
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <h2 className={cn('text-[20px] font-bold tracking-tight', textColor)}>{title}</h2>
    </div>
  );

  const OfferDetailsSheet = ({ offer }: { offer: any }) => {
    if (!offer) return null;
    const title = offer?.profiles ? firstNameish(offer.profiles) : offer?.creator_name || offer?.creator_email || 'Creator';
    const username = String(offer?.profiles?.username || '').trim();
    const isMarkedCompleted = normalizeStatus(offer?.status) === 'completed';
    const canMarkComplete = activeCollabTab === 'active' && !!offer?.id && !isMarkedCompleted && (offer?.deal_amount !== undefined || offer?.due_date !== undefined);
    const deliverables = formatDeliverables(offer) || offer?.collab_type || 'Collaboration';
    const budget = formatBudget(offer);
    const deadlineValue = offer?.due_date || offer?.deadline;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const deadlineText = deadline && !Number.isNaN(deadline.getTime())
      ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;
    const status = String(offer?.status || '').toUpperCase() || 'PENDING';
    const contractUrl = offer?.safe_contract_url || offer?.signed_contract_url || offer?.contract_file_url || null;

    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedOffer(null)}
          className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-md"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'fixed bottom-0 inset-x-0 z-[150] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl',
            isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200'
          )}
        >
          <div className="w-12 h-1 bg-slate-500/20 rounded-full mx-auto mb-6" />
          <div className="max-w-md mx-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Offer</p>
                <h3 className={cn('text-[18px] font-bold tracking-tight truncate', textColor)}>Offer to {title}</h3>
                <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>{deliverables}</p>
              </div>
              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/70 bg-white/5' : 'border-slate-200 text-slate-600 bg-slate-50')}>
                {status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className={cn('p-4 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Budget</p>
                <p className={cn('text-[13px] font-bold mt-1', textColor)}>{budget || '—'}</p>
              </div>
              <div className={cn('p-4 rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50')}>
                <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Deadline</p>
                <p className={cn('text-[13px] font-bold mt-1', textColor)}>{deadlineText || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={async () => {
                  try {
                    triggerHaptic(HapticPatterns.light);
                    if (!offer?.id) {
                      toast.error('Deal details unavailable');
                      return;
                    }

                    setIsOpeningContract(true);
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    if (!token) {
                      toast.error('Authentication required');
                      return;
                    }

                    if (contractUrl) {
                      window.open(contractUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }

                    const apiBase = getApiBaseUrl();
                    const response = await fetch(`${apiBase}/api/deals/${offer.id}/contract-review-link`, {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok || !data?.success || !data?.viewUrl) {
                      throw new Error(data?.error || 'Failed to open contract');
                    }
                    window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
                  } catch (error: any) {
                    if (contractUrl) {
                      window.open(contractUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      toast.error(error?.message || 'Contract not generated yet');
                    }
                  } finally {
                    setIsOpeningContract(false);
                  }
                }}
                disabled={isOpeningContract}
                className={cn(
                  'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] disabled:opacity-60',
                  isDark
                    ? 'border-white/10 bg-white/5 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>{isOpeningContract ? 'Opening Contract...' : 'Review Contract'}</p>
                <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
                  {contractUrl ? 'Open the generated collaboration agreement' : 'Open the protected contract review page'}
                </p>
              </button>
              {!contractUrl && (
                <button
                  onClick={async () => {
                    try {
                      setIsGeneratingContract(true);
                      triggerHaptic(HapticPatterns.light);
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;
                      if (!token) {
                        toast.error('Authentication required');
                        return;
                      }

                      const apiBase = getApiBaseUrl();
                      const response = await fetch(`${apiBase}/api/deals/${offer.id}/regenerate-contract`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok || !data?.success) {
                        throw new Error(data?.error || 'Failed to generate contract');
                      }

                      const nextUrl = data?.contract?.url || null;
                      if (nextUrl) {
                        setSelectedOffer((prev: any) => prev ? {
                          ...prev,
                          contract_file_url: nextUrl,
                          signed_contract_url: prev?.signed_contract_url || null,
                          safe_contract_url: prev?.safe_contract_url || null,
                        } : prev);
                      }
                      toast.success('Contract generated');
                      if (nextUrl) {
                        window.open(nextUrl, '_blank', 'noopener,noreferrer');
                      }
                      await onRefresh?.();
                      triggerHaptic(HapticPatterns.success);
                    } catch (error: any) {
                      toast.error(error?.message || 'Failed to generate contract');
                    } finally {
                      setIsGeneratingContract(false);
                    }
                  }}
                  disabled={isGeneratingContract}
                  className={cn(
                    'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] disabled:opacity-60',
                    isDark ? 'border-cyan-400/20 bg-cyan-500/10 hover:bg-cyan-500/15' : 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100'
                  )}
                >
                  <p className={cn('text-[13px] font-bold', isDark ? 'text-cyan-200' : 'text-cyan-800')}>
                    {isGeneratingContract ? 'Generating contract...' : 'Generate Contract'}
                  </p>
                  <p className={cn('text-[12px] mt-1', isDark ? 'text-cyan-200/70' : 'text-cyan-700/80')}>
                    Create the collaboration agreement for this deal now
                  </p>
                </button>
              )}
              {canMarkComplete && (
                <button
                  onClick={async () => {
                    try {
                      setIsMarkingComplete(true);
                      triggerHaptic(HapticPatterns.light);
                      const { data: { session } } = await supabase.auth.getSession();
                      const token = session?.access_token;
                      if (!token) {
                        toast.error('Authentication required');
                        return;
                      }

                      const apiBase = getApiBaseUrl();
                      const response = await fetch(`${apiBase}/api/deals/${offer.id}/mark-complete`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      const data = await response.json().catch(() => ({}));
                      if (!response.ok || !data?.success) {
                        throw new Error(data?.error || 'Failed to mark complete');
                      }

                      toast.success(data?.alreadyCompleted ? 'Deal already completed' : 'Collaboration marked complete');
                      setSelectedOffer(null);
                      await onRefresh?.();
                      setActiveTab('collabs', 'completed');
                      triggerHaptic(HapticPatterns.success);
                    } catch (error: any) {
                      toast.error(error?.message || 'Failed to mark collaboration complete');
                    } finally {
                      setIsMarkingComplete(false);
                    }
                  }}
                  disabled={isMarkingComplete}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-60',
                    isDark ? 'bg-emerald-500/10 border-emerald-400/25 hover:bg-emerald-500/15' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  )}
                >
                  <p className={cn('text-[13px] font-bold', isDark ? 'text-emerald-200' : 'text-emerald-800')}>
                    {isMarkingComplete ? 'Marking complete...' : 'Mark collaboration complete'}
                  </p>
                  <p className={cn('text-[12px] mt-1', isDark ? 'text-emerald-200/70' : 'text-emerald-700/80')}>
                    Move this deal to completed once the campaign is fully done
                  </p>
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  if (username) {
                    navigate(`/creator/${username}`);
                    return;
                  }
                  toast.message('Creator profile unavailable');
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>View creator profile</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Open the creator page in the same app</p>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  setActiveTab('collabs', normalizeStatus(offer?.status) === 'accepted' ? 'active' : activeCollabTab);
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>Back to {activeCollabTab} list</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Keep reviewing offers without leaving this screen</p>
              </button>
              <button
                onClick={() => setSelectedOffer(null)}
                className={cn('h-12 rounded-2xl font-bold text-[13px] transition-all active:scale-[0.99]', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900')}
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  };

  const BrandDealDetailScreen = ({ offer }: { offer: any }) => {
    if (!offer) return null;

    const creatorName = firstNameish(offer?.profiles);
    const creatorUsername = String(offer?.profiles?.username || '').trim();
    const deliverables = formatDeliverables(offer) || offer?.collab_type || 'Collaboration';
    const amount = Number(offer?.deal_amount || offer?.exact_budget || 0);
    const deadlineValue = offer?.due_date || offer?.deadline;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const deadlineText = deadline && !Number.isNaN(deadline.getTime())
      ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const diffDays = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
    const dueTone = diffDays === null ? secondaryTextColor : diffDays < 0 ? 'text-rose-500' : diffDays <= 7 ? 'text-amber-500' : 'text-sky-500';
    const contractUrl = offer?.safe_contract_url || offer?.signed_contract_url || offer?.contract_file_url || null;
    const usageRights = offer?.usage_rights || offer?.usage_type || 'Organic social media only';
    const usageDuration = offer?.usage_duration || '90 days limit';

    const openContract = async () => {
      try {
        triggerHaptic(HapticPatterns.light);
        if (!offer?.id) {
          toast.error('Deal details unavailable');
          return;
        }

        setIsOpeningContract(true);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        if (contractUrl) {
          window.open(contractUrl, '_blank', 'noopener,noreferrer');
          return;
        }

        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/deals/${offer.id}/contract-review-link`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success || !data?.viewUrl) {
          throw new Error(data?.error || 'Failed to open contract');
        }
        window.open(data.viewUrl, '_blank', 'noopener,noreferrer');
      } catch (error: any) {
        if (contractUrl) {
          window.open(contractUrl, '_blank', 'noopener,noreferrer');
        } else {
          toast.error(error?.message || 'Contract not generated yet');
        }
      } finally {
        setIsOpeningContract(false);
      }
    };

    const generateContract = async () => {
      try {
        setIsGeneratingContract(true);
        triggerHaptic(HapticPatterns.light);
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          toast.error('Authentication required');
          return;
        }

        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/deals/${offer.id}/regenerate-contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to generate contract');
        }

        const nextUrl = data?.contract?.url || null;
        const nextOffer = nextUrl ? { ...offer, contract_file_url: nextUrl } : offer;
        setSelectedDealPage(nextOffer);
        setSelectedOffer(nextOffer);
        toast.success('Contract generated');
        if (nextUrl) {
          window.open(nextUrl, '_blank', 'noopener,noreferrer');
        }
        await onRefresh?.();
        triggerHaptic(HapticPatterns.success);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to generate contract');
      } finally {
        setIsGeneratingContract(false);
      }
    };

    return (
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className={cn('min-h-screen -mx-5 -mt-5', isDark ? 'bg-[#061318]' : 'bg-slate-50')}>
        <div className={cn('px-5 py-3.5 flex items-center justify-between border-b sticky top-0 z-20', isDark ? 'bg-[#061318]/85 backdrop-blur-xl border-white/10' : 'bg-white/95 backdrop-blur-md border-slate-100')}>
          <div className="flex items-center gap-3">
            <button onClick={() => { triggerHaptic(HapticPatterns.light); setSelectedDealPage(null); }} className={cn('w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50')}>
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div>
              <h2 className={cn('text-[16px] font-bold tracking-tight leading-tight', textColor)}>Deal Detail</h2>
              <p className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40 leading-tight', textColor)}>{offer?.brand_name || 'Brand Partner'}</p>
            </div>
          </div>
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border', borderColor, isDark ? 'bg-white/5' : 'bg-white')}>
            <Settings className="w-4 h-4 opacity-40" />
          </div>
        </div>

        <div className="px-5 pt-5 pb-40">
          <div className={cn('rounded-3xl border p-5 mb-6 flex flex-col items-center text-center relative overflow-hidden', isDark ? 'bg-emerald-500/10' : 'bg-emerald-50', borderColor)}>
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.12),transparent_60%)]" />
            <div className="relative z-10 w-full">
              <div className={cn('inline-flex items-center px-3 py-1.5 rounded-full border shadow-sm mb-3', isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
                <span className={cn('text-[11px] font-black tracking-widest uppercase', isDark ? 'text-emerald-400' : 'text-emerald-700')}>🟢 Active Collaboration</span>
              </div>
              <div className={cn('inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-3', offer?.collab_type === 'barter' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10')}>
                {offer?.collab_type === 'barter' ? 'Barter Campaign' : 'Paid Campaign'}
              </div>
              <p className={cn('text-[38px] font-black leading-none tracking-tight', textColor)}>
                {amount > 0 ? formatCompactINR(amount) : '—'} <span className="text-[20px] font-bold opacity-60 ml-1">Offer</span>
              </p>
              <div className={cn('flex items-center justify-center flex-wrap gap-2 text-[14px] font-bold mt-4', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <span>{deliverables}</span>
              </div>
              <div className={cn('flex items-center justify-center gap-3 w-full border-t pt-5 mt-5', isDark ? 'border-white/10' : 'border-slate-100')}>
                <div className={cn('w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center shrink-0 shadow-sm', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200')}>
                  <User className={cn('w-5 h-5', secondaryTextColor)} />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-[14px] font-bold tracking-tight', textColor)}>{creatorName}</p>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                  </div>
                  <p className={cn('text-[10px] font-semibold mt-0.5', secondaryTextColor)}>Verified Creator</p>
                </div>
              </div>
            </div>
          </div>

          <div className={cn('rounded-xl border mb-5 overflow-hidden', cardBgColor, borderColor)}>
            <button
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                if (creatorUsername) navigate(`/creator/${creatorUsername}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3"
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', isDark ? 'bg-blue-500/10' : 'bg-blue-50')}>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={cn('text-[13px] font-bold leading-tight', textColor)}>Creator Information</p>
                <p className={cn('text-[11px] mt-0.5', secondaryTextColor)}>Verified profile · View creator details</p>
              </div>
              <ChevronRight className={cn('w-4 h-4', secondaryTextColor)} />
            </button>
          </div>

          <div className="mb-6">
            <h4 className={cn('text-[13px] font-black uppercase tracking-wider mb-3 opacity-50', textColor)}>Deliverables</h4>
            <div className="flex flex-wrap gap-3">
              {String(deliverables).split(',').map((item, index) => (
                <div key={`${item}-${index}`} className={cn('rounded-2xl border px-4 py-4 text-[14px] font-black', cardBgColor, borderColor, textColor)}>
                  {item.trim()}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h4 className={cn('text-[13px] font-black uppercase tracking-wider mb-3 opacity-50', textColor)}>Usage Rights</h4>
            <div className={cn('rounded-2xl border p-4 flex flex-col gap-1', cardBgColor, borderColor)}>
              <p className={cn('text-[14px] font-black leading-tight', textColor)}>{usageRights}</p>
              <p className={cn('text-[12px] font-semibold', secondaryTextColor)}>{usageDuration}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className={cn('rounded-2xl border p-4 flex flex-col justify-center', cardBgColor, borderColor)}>
              <p className={cn('text-[11px] font-black uppercase tracking-wider mb-2 opacity-50', textColor)}>Payment Method</p>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-blue-500" />
                </div>
                <span className={cn('text-[14px] font-black leading-tight', textColor)}>Direct Bank<br />Transfer</span>
              </div>
            </div>
            <div className={cn('rounded-2xl border p-4 flex flex-col justify-center', cardBgColor, borderColor)}>
              <p className={cn('text-[11px] font-black uppercase tracking-wider mb-2 opacity-50', textColor)}>Deadline</p>
              <span className={cn('text-[14px] font-black leading-tight mb-2', textColor)}>{deadlineText}</span>
              <span className={cn('text-[11px] font-black tracking-tight flex items-center mt-1', dueTone)}>
                ⚡ {diffDays === null ? 'No deadline set' : diffDays > 0 ? `${diffDays} days remaining` : 'Overdue'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h4 className={cn('text-[13px] font-black uppercase tracking-wider mb-3 opacity-50', textColor)}>Legal Protection</h4>
            <div className={cn('rounded-2xl border p-4 relative overflow-hidden', isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')}>
              <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500 rounded-r-full" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('font-black text-[14px] leading-tight', isDark ? 'text-emerald-200' : 'text-emerald-700')}>Protected by Creator Armour</p>
                  <p className={cn('text-[11px] font-semibold mt-0.5', isDark ? 'text-emerald-100/70' : 'text-emerald-800/80')}>Contract + rights + dispute support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('sticky bottom-0 left-0 right-0 px-5 pb-8 pt-4 border-t', isDark ? 'bg-[#0B0F14]/98 backdrop-blur-xl border-white/10' : 'bg-white/98 backdrop-blur-xl border-slate-100')}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={contractUrl ? openContract : generateContract}
            disabled={isOpeningContract || isGeneratingContract}
            className={cn('w-full py-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all flex items-center justify-center active:scale-[0.98] border disabled:opacity-50', isDark ? 'bg-white text-[#0B0F14] border-white' : 'bg-slate-900 text-white border-slate-900')}
          >
            <span className="text-[16px] font-black">
              {contractUrl ? (isOpeningContract ? 'Opening Contract...' : 'Review Contract') : (isGeneratingContract ? 'Generating Contract...' : 'Generate Contract')}
            </span>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderNotificationSettings = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-20"
    >
      <PageHeader title="Notifications" />
      <div className="px-5 space-y-6">
        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#1C1C1E] divide-[#2C2C2E]' : 'bg-white divide-[#E5E5EA] shadow-sm', 'divide-y')}>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-700')}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Push Alerts</p>
                <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Active on this device' : 'Receive deal updates'}</p>
              </div>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                if (isPushSubscribed) {
                  toast.info('To disable, please use your browser settings.');
                } else {
                  await handleEnablePush();
                }
              }}
              className={cn(
                'w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out',
                isPushSubscribed ? 'bg-emerald-500' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EB]'
              )}
            >
              <motion.div
                animate={{ x: isPushSubscribed ? 22 : 2 }}
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {isPushSubscribed && (
            <button
              disabled={isPushBusy}
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                const res = await sendTestPush();
                if (res.success) toast.success('Test notification sent!');
                else toast.error('Failed: ' + res.reason);
              }}
              className={cn('w-full py-4 text-[13px] font-bold text-center transition-all active:bg-opacity-50', isDark ? 'text-sky-400 active:bg-white/5' : 'text-sky-600 active:bg-slate-50')}
            >
              {isPushBusy ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}
        </div>

        <div className={cn('p-5 rounded-[24px] border', borderColor, isDark ? 'bg-white/5' : 'bg-white shadow-sm')}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 mb-1', textColor)}>Current Status</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Supported:</span> {isPushSupported ? 'Yes' : 'No'}
                </p>
                <p className={cn('text-[12px]', textColor)}>
                  <span className="opacity-50">Permission:</span> {pushPermission}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                await refreshPushStatus();
                toast.success('Status refreshed');
              }}
              className={cn('p-2 rounded-xl border transition-all active:scale-95', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}
            >
              <RefreshCw className={cn('w-4 h-4 opacity-60', textColor)} />
            </button>
          </div>
          {isIOSNeedsInstall && (
            <p className={cn('text-[12px] opacity-60', isDark ? 'text-amber-200/80' : 'text-amber-700')}>
              iOS requires “Add to Home Screen” to support push notifications.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const showPushPrompt =
    isPushSupported &&
    hasVapidKey &&
    !isPushSubscribed &&
    !isPushPromptDismissed &&
    activeTab === 'dashboard' &&
    !activeSettingsPage;

  return (
    <div className={cn('fixed inset-0 font-sans selection:bg-emerald-500/25 overflow-hidden', bgColor, textColor)}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
          <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-emerald-400/20 rounded-full blur-[140px]" />
          <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-sky-500/18 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-emerald-500/12 rounded-full blur-[170px]" />
        </div>
      )}

      {!isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(55%_45%_at_95%_10%,rgba(14,165,233,0.16),transparent_60%)]" />
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[60]"
        style={{ transform: `translateY(${pullDistance - 44}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
      >
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#0B0F14]/90 border-white/10' : 'bg-white/90 border-slate-200')}>
          {isRefreshing ? <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-white/60' : 'text-slate-500')} /> : <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-emerald-400/70' : 'bg-emerald-600/70')} />}
        </div>
      </div>

      <div
        className="h-full overflow-y-auto overflow-x-hidden relative z-10 pb-[110px] scrollbar-hide"
        onTouchStart={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (e.touches.length !== 1) return;
          setStartY(e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (isRefreshing) return;
          const target = e.currentTarget as HTMLDivElement;
          if (target.scrollTop > 0) return;
          if (startY <= 0) return;
          const dy = e.touches[0].clientY - startY;
          if (dy <= 0) return;
          setPullDistance(Math.min(90, dy));
        }}
        onTouchEnd={async () => {
          if (isRefreshing) return;
          const shouldRefresh = pullDistance > 60;
          setStartY(0);
          setPullDistance(0);
          if (!shouldRefresh || !onRefresh) return;

          setIsRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
          }
        }}
        onScroll={(e) => {
          if ((e.currentTarget as HTMLDivElement).scrollTop > 10 && pullDistance > 0) {
            setPullDistance(0);
            setStartY(0);
          }
        }}
      >
        <div className="max-w-md md:max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-6 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowActionSheet(true);
                  }}
                  className={cn('p-1.5 -ml-1.5 rounded-full transition-all active:scale-95', secondaryTextColor)}
                >
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-1.5 font-semibold text-[16px] tracking-tight">
                  <Shield className={cn('w-4 h-4', isDark ? 'text-white' : 'text-slate-900')} />
                  <span className={textColor}>Brand Console</span>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                    }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all duration-300',
                      isDark ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDark ? (
                        <motion.span
                          key="moon"
                          initial={{ rotate: -90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: 90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Moon className="w-3.5 h-3.5" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="sun"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="text-[10px] font-bold tracking-wide">{isDark ? 'Dark' : 'Light'}</span>
                  </motion.button>

                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className={cn('relative p-1 rounded-full transition-all active:scale-95', secondaryTextColor)}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 text-[8px] font-black flex items-center justify-center text-white"
                          style={{ borderColor: isDark ? '#0B0F14' : '#F9FAFB' }}
                        >
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    {notificationsOpen && (
                      <div
                        className={cn(
                          'absolute right-0 mt-3 w-[300px] max-w-[calc(100vw-32px)] rounded-[24px] border shadow-2xl p-4 z-50 overflow-hidden',
                          isDark
                            ? 'bg-[#0A0A0B]/95 backdrop-blur-xl border-white/10 text-white'
                            : 'bg-white/95 backdrop-blur-xl border-slate-200/60 text-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className={cn('text-[11px] font-black uppercase tracking-[0.2em]', isDark ? 'text-white/40' : 'text-slate-500')}>
                            Updates
                          </p>
                          <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isDark ? 'bg-emerald-400' : 'bg-emerald-600')} />
                        </div>
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                          {notifications.map((n: any) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                if (n.href) navigate(n.href);
                              }}
                              className={cn(
                                'w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.98]',
                                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              <p className={cn('text-[13px] font-bold leading-tight', textColor)}>{n.title}</p>
                              <p className={cn('text-[11px] mt-1 opacity-50', textColor)}>{n.time}</p>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <div className={cn('p-6 text-center rounded-2xl border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white')}>
                              <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No updates yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setActiveTab('profile');
                    }}
                    className={cn('w-9 h-9 rounded-full border overflow-hidden transition-all active:scale-95', borderColor)}
                  >
                    <img alt={brandName} src={brandLogo} className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn('text-[13px] font-black uppercase tracking-[0.2em] opacity-40', textColor)}>Welcome back</p>
                  <h1 className={cn('text-[28px] font-semibold tracking-tight leading-tight', textColor)}>{brandName}</h1>
                  <p className={cn('text-[13px] mt-1 opacity-60', textColor)}>
                    Trust-first collabs — no vanity metrics.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5">
              {selectedDealPage ? (
                <BrandDealDetailScreen offer={selectedDealPage} />
              ) : (
              <>
              {activeTab === 'dashboard' && (
                <>
                  {showPushPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'mb-5 p-4 rounded-[24px] border shadow-sm',
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-emerald-500/15' : 'bg-emerald-500/10')}>
                          <Bell className={cn('w-5 h-5', isDark ? 'text-emerald-200' : 'text-emerald-700')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                          <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
                            {isIOSNeedsInstall
                              ? 'On iPhone/iPad, install the app (Add to Home Screen) to receive notifications.'
                              : 'Get notified when creators reply and deals need action.'}
                          </p>
                          {pushPermission === 'denied' && (
                            <p className={cn('text-[12px] mt-2', isDark ? 'text-amber-200/80' : 'text-amber-700')}>
                              Notifications are blocked in your browser settings.
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              disabled={isPushBusy || pushPermission === 'denied' || isIOSNeedsInstall}
                              onClick={handleEnablePush}
                              className={cn(
                                'flex-1 h-10 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.99]',
                                isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              )}
                            >
                              Enable
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissPushPrompt()}
                              className={cn(
                                'h-10 px-4 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.99]',
                                isDark ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              Later
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Next action banner (always answers: what should I do next?) */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      primaryAction.onClick();
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 }}
                    className={cn(
                      'w-full mb-5 p-4 rounded-[24px] border text-left transition-all active:scale-[0.99] overflow-hidden relative',
                      isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 opacity-40',
                        primaryAction.tone === 'primary'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-sky-500/10'
                          : primaryAction.tone === 'attention'
                            ? 'bg-gradient-to-br from-amber-500/15 to-rose-500/10'
                            : 'bg-gradient-to-br from-white/0 to-white/0'
                      )}
                    />
                    <div className="relative flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn('text-[13px] font-bold', textColor)}>{primaryAction.title}</p>
                        <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>No views. Just verified deal behavior.</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border',
                          isDark ? 'border-white/10 bg-white/5 text-white/80' : 'border-slate-200 bg-slate-50 text-slate-700'
                        )}
                      >
                        {primaryAction.cta}
                      </span>
                    </div>
                  </motion.button>

                  {/* Quick summary (makes the dashboard feel alive immediately) */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cn('grid grid-cols-3 gap-2.5 mb-6')}>
                    {[
                      { label: 'Active deals', value: displayStats.activeDeals },
                      { label: 'Spend this month', value: formatCompactINR(spendThisMonth) },
                      { label: 'Creator replies', value: creatorReplies },
                    ].map((item) => (
                      <div key={item.label} className={cn('p-3 rounded-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                        <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>{item.label}</p>
                        {isLoading ? (
                          <div className={cn('h-4 rounded-md mt-2 animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                        ) : (
                          <p className={cn('text-[14px] sm:text-[16px] font-bold mt-1', textColor)}>{item.value}</p>
                        )}
                      </div>
                    ))}
                  </motion.div>

                  {/* Budget awareness */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className={cn('mb-6 p-4 rounded-[24px] border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Budget</p>
                        {monthlyBudgetInr ? (
                          <>
                            <p className={cn('text-[13px] font-bold mt-1', textColor)}>
                              {formatCompactINR(spendThisMonth)} spent • {formatCompactINR(budgetRemaining ?? 0)} remaining
                            </p>
                            <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
                              {budgetUsedPct}% used this month
                            </p>
                          </>
                        ) : (
                          <p className={cn('text-[13px] font-bold mt-1', textColor)}>Set a monthly budget to stay on track</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setShowBudgetModal(true);
                        }}
                        className={cn('shrink-0 px-3 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.99]', isDark ? 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')}
                      >
                        {monthlyBudgetInr ? 'Edit' : 'Set'}
                      </button>
                    </div>
                    {monthlyBudgetInr && budgetUsedPct !== null && budgetUsedPct >= 80 && (
                      <p className={cn('text-[12px] mt-3', isDark ? 'text-amber-200/80' : 'text-amber-700')}>
                        ⚠ You’ve used {budgetUsedPct}% of your budget
                      </p>
                    )}
                  </motion.div>

                  {/* Stats grouped for scan speed */}
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="col-span-2">
                      <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Campaign activity</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Send className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Offers sent</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.totalSent}</p>
                      )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <MessageCircle className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Needs reply</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', displayStats.needsAction > 0 ? (isDark ? 'text-amber-200' : 'text-amber-700') : textColor)}>{displayStats.needsAction}</p>
                      )}
                    </motion.div>

                    <div className="col-span-2 mt-4">
                      <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Trust performance</p>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <Handshake className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Active collabs</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-8 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[28px] font-semibold tracking-tight', textColor)}>{displayStats.activeDeals}</p>
                      )}
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className={cn('p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <CreditCard className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Total spend</p>
                      </div>
                      {isLoading ? (
                        <div className={cn('h-7 rounded-xl animate-pulse', isDark ? 'bg-white/10' : 'bg-slate-200')} />
                      ) : (
                        <p className={cn('text-[20px] sm:text-[24px] font-semibold tracking-tight', textColor)}>{formatCompactINR(displayStats.totalInvestment)}</p>
                      )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }} className={cn('col-span-2 p-5 rounded-[16px] border shadow-md transition-all', cardBgColor, borderColor)}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn('text-[12px] uppercase tracking-[0.06em] font-medium', secondaryTextColor)}>Offer conversion</p>
                          <p className={cn('text-[24px] font-semibold tracking-tight mt-1', textColor)}>{conversionRate}%</p>
                        </div>
                        <div className={cn('text-[11px] font-bold leading-relaxed', secondaryTextColor)}>
                          <div>Sent: {displayStats.totalSent}</div>
                          <div>Accepted: {acceptedDealsCount}</div>
                          <div>Completed: {completedDealsList.length}</div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] opacity-50', textColor)}>Suggested creators</p>
                        <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Pick based on reliability — not views.</p>
                      </div>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                        View all
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {(isLoadingSuggestedCreators ? Array.from({ length: 3 }).map((_, i) => ({ id: `sk-${i}`, name: 'Creator' })) : suggestedCreators.slice(0, 6)).map((c: any) => (
                        <div key={c.id} className={cn('min-w-[290px] p-4 rounded-[24px] border', isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm')}>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-11 h-11">
                              <AvatarImage src={safeImageSrc(c.profile_photo || c.avatar_url)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-60 truncate', textColor)}>
                                {(c.category || 'Creator')}{c.followers ? ` • ${formatFollowers(c.followers)}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>From</p>
                              <p className={cn('text-[12px] font-bold', textColor)}>{formatCompactINR(c?.pricing?.avg ?? c?.pricing?.reel ?? 0)} / reel</p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1">
                            {getReliabilityLines(c).map((line) => (
                              <p key={line} className={cn('text-[12px] opacity-70', textColor)}>{line}</p>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {getSmartTags(c).map((t) => (
                              <span key={t} className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-slate-50')}>
                                {t}
                              </span>
                            ))}
                            {getSmartTags(c).length === 0 && (
                              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-slate-50')}>
                                ✔ Verified profile
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('flex-1 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900')}>
                              View profile
                            </button>
                            <button onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }} className={cn('flex-1 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white' : 'bg-gradient-to-br from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white')}>
                              Send offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-6 rounded-[2.5rem] border relative overflow-hidden mb-10', isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
                      <Plus size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 flex items-center justify-center">
                        <Plus className={cn('w-5 h-5', isDark ? 'text-emerald-300' : 'text-emerald-600')} />
                      </div>
                      <div>
                        <h3 className={cn('text-[15px] font-bold tracking-tight', textColor)}>Quick actions</h3>
                        <p className={cn('text-[11px] opacity-40 uppercase font-black tracking-widest', textColor)}>Shortcuts</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <User className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Find creators</span>
                      </button>
                      <button
                        onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }}
                        className={cn(
                          'flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]',
                          isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-300/30 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-emerald-600/40 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg'
                        )}
                      >
                        <Send className="w-4 h-4 mb-2 opacity-90" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Send offer</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <Handshake className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Collabs</span>
                      </button>
                      <button onClick={() => { triggerHaptic(HapticPatterns.light); toast.message('Payments', { description: 'Invoices, GST, UPI payouts — coming soon.' }); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm')}>
                        <CreditCard className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
                        <span className={cn('text-[11px] font-bold', textColor)}>Payments</span>
                      </button>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className={cn('w-4 h-4', secondaryTextColor)} strokeWidth={1.5} />
                        <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
                      </div>
                      <button onClick={() => setActiveTab('collabs', 'pending')} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                        View all
                      </button>
                    </div>
                    <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-white/[0.04] shadow-black/20' : 'bg-white/75 shadow-emerald-100/60')}>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setActiveTab('collabs', 'pending');
                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995] backdrop-blur-md', isDark ? 'border-b border-white/10 hover:bg-white/[0.06]' : 'border-b border-slate-200/80 hover:bg-white/60')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Pending</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{offers.length}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setActiveTab('collabs', 'active');
                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995] backdrop-blur-md', isDark ? 'border-b border-white/10 hover:bg-white/[0.06]' : 'border-b border-slate-200/80 hover:bg-white/60')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Active</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{activeDealsList.length}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(HapticPatterns.light);
                          setActiveTab('collabs', 'completed');
                        }}
                        className={cn('w-full p-4 flex items-center justify-between transition-all active:scale-[0.995]', isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50')}
                      >
                        <p className={cn('text-[12px] font-bold', textColor)}>Completed</p>
                        <p className={cn('text-[12px] font-bold', textColor)}>{completedDealsList.length}</p>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}

              {activeTab === 'collabs' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
                    <button onClick={() => setActiveTab('dashboard')} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                      Back
                    </button>
                  </div>

                  <div className={cn('mb-4 rounded-[24px] border p-1.5 flex gap-1.5 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.12)]', isDark ? 'bg-white/[0.06] border-white/10' : 'bg-white/75 border-emerald-100/80')}>
                    {[
                      { key: 'pending', label: 'Pending', count: pendingOffersList.length },
                      { key: 'active', label: 'Active', count: activeDealsList.length },
                      { key: 'completed', label: 'Completed', count: completedDealsList.length },
                    ].map((item) => {
                      const isSelected = activeCollabTab === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            triggerHaptic(HapticPatterns.light);
                            setActiveTab('collabs', item.key as BrandCollabTab);
                          }}
                          className={cn(
                            'flex-1 rounded-[20px] px-3 py-3 text-left transition-all active:scale-[0.98] border backdrop-blur-lg',
                            isSelected
                              ? isDark
                                ? 'bg-white/90 text-slate-900 border-white/40 shadow-[0_10px_30px_rgba(255,255,255,0.08)]'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-300/70 shadow-[0_12px_30px_rgba(16,185,129,0.24)]'
                              : isDark
                                ? 'text-white/70 border-white/5 hover:bg-white/[0.05]'
                                : 'text-slate-600 border-white/50 hover:bg-white/60'
                          )}
                        >
                          <p className={cn('text-[10px] font-black uppercase tracking-widest', isSelected ? 'opacity-80' : 'opacity-50')}>{item.label}</p>
                          <p className="mt-1 text-[16px] font-black">{item.count}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-white/[0.04] shadow-black/20' : 'bg-white/75 shadow-emerald-100/60')}>
                    <div className={cn('p-4 backdrop-blur-md', isDark ? 'border-b border-white/10 bg-white/[0.03]' : 'border-b border-slate-200/80 bg-white/45')}>
                      <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>
                        {activeCollabTab === 'pending' ? 'Pending Offers' : activeCollabTab === 'active' ? 'Active Collabs' : 'Completed Collabs'}
                      </p>
                    </div>
                    {visibleCollabItems.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[12px] font-bold opacity-50', textColor)}>
                          {activeCollabTab === 'pending'
                            ? 'No pending offers'
                            : activeCollabTab === 'active'
                              ? 'No active collabs yet'
                              : 'No completed collabs yet'}
                        </p>
                        {activeCollabTab === 'pending' && (
                          <Button type="button" onClick={() => setShowActionSheet(true)} className={cn('mt-4 rounded-2xl', isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}>
                            <Send className="w-4 h-4 mr-2" /> Send new offer
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {visibleCollabItems.slice(0, 20).map((item: any, idx: number) => {
                          const isPendingItem = activeCollabTab === 'pending';
                          const isCompletedItem = activeCollabTab === 'completed';
                          const due = deadlineLabel(item);
                          const amount = Number(item?.deal_amount || item?.exact_budget || 0);
                          const title = isPendingItem ? `Offer to ${firstNameish(item?.profiles)}` : firstNameish(item?.profiles);
                          const creatorMeta = item?.profiles?.username || item?.creator_email || item?.creator_name || 'Creator';
                          const stageText = isCompletedItem ? 'Completed' : isPendingItem ? 'Awaiting response' : dealStageLabel(item);
                          const progressStep = isCompletedItem ? 5 : isPendingItem ? 1 : (stageText.toLowerCase().includes('payment') ? 4 : stageText.toLowerCase().includes('submitted') ? 3 : stageText.toLowerCase().includes('creating') ? 2 : 1);
                          return (
                            <motion.button
                              key={item.id}
                              whileTap={{ scale: 0.983 }}
                              onClick={() => {
                                triggerHaptic(HapticPatterns.light);
                                if (activeCollabTab === 'active') {
                                  setSelectedDealPage(item);
                                  return;
                                }
                                setSelectedOffer(item);
                              }}
                              className={cn(
                                'w-full p-4 rounded-2xl border transition-all duration-300 group active:scale-[0.99] relative cursor-pointer text-left backdrop-blur-xl',
                                borderColor,
                                isDark
                                  ? 'bg-[#111827]/40 hover:bg-[#111827]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                                  : 'bg-white/80 shadow-sm hover:shadow-md hover:bg-white/90 active:bg-slate-50'
                              )}
                            >
                              {isPendingItem && (
                                <div className="flex items-center gap-1.5 mb-3 px-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={3} />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Action Required</span>
                                </div>
                              )}

                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={cn('w-11 h-11 rounded-xl overflow-hidden border shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-300 flex items-center justify-center', isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/90')}>
                                    {isPendingItem ? (
                                      <Send className={cn('w-4 h-4', secondaryTextColor)} />
                                    ) : isCompletedItem ? (
                                      <Shield className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                                    ) : (
                                      <Handshake className={cn('w-4 h-4', secondaryTextColor)} />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className={cn('text-[15px] font-bold tracking-tight truncate', textColor)}>{title}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <ShieldCheck className="w-3 h-3 text-blue-500" />
                                      <span className={cn('text-[10px] font-black uppercase tracking-widest opacity-40 truncate', textColor)}>{creatorMeta}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 pl-3">
                                  <p className={cn('text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                                    {amount > 0 ? formatCompactINR(amount) : '—'}
                                  </p>
                                  <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 mt-1', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                                    {isPendingItem ? 'Target Budget' : 'Deal Value'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-3 mb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 px-1 flex-wrap">
                                    <span className={cn('text-[10px] uppercase font-black tracking-widest opacity-40 mr-1', textColor)}>
                                      {isPendingItem ? 'Deliverables' : 'Collab'}
                                    </span>
                                    {[formatDeliverables(item) || item?.collab_type || 'Collaboration'].filter(Boolean).slice(0,1).map((label, i) => (
                                      <span key={i} className={cn('text-[12px] font-black px-2.5 py-1 rounded-lg', isDark ? 'bg-slate-500/10 text-white' : 'bg-slate-50 text-slate-900')}>
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                  {(isPendingItem || due) && (
                                    <div className={cn(
                                      'flex items-center gap-1.5 ml-auto px-2.5 py-1.5 rounded-lg border',
                                      isPendingItem
                                        ? (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')
                                        : due?.tone === 'danger'
                                          ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-300/30' : 'bg-rose-50 text-rose-700 border-rose-200')
                                          : due?.tone === 'warn'
                                            ? (isDark ? 'bg-amber-500/10 text-amber-200 border-amber-300/30' : 'bg-amber-50 text-amber-800 border-amber-200')
                                            : (isDark ? 'bg-white/5 text-white/70 border-white/10' : 'bg-white text-slate-600 border-slate-200')
                                    )}>
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {isPendingItem ? `Sent ${timeSince(item?.created_at || item?.updated_at)} ago` : due?.text}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold', isDark ? 'bg-[#1C2C2A] text-emerald-300' : 'bg-emerald-50 text-emerald-700')}>
                                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                                  {isCompletedItem ? 'Campaign completed and archived' : isPendingItem ? 'Creator can review, accept, reject, or counter' : `${stageText}${amount > 0 ? ` • ${formatCompactINR(amount)}` : ''}`}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-500/10">
                                <div className={cn(
                                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider',
                                  isCompletedItem
                                    ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                    : progressStep === 1
                                      ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                                      : (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                )}>
                                  <span className="opacity-60 text-[9px]">Stage:</span> {stageText}
                                </div>

                                <div className="flex gap-1 items-center">
                                  {[1, 2, 3, 4, 5].map((step) => (
                                    <div
                                      key={step}
                                      className={cn(
                                        'w-4 h-1.5 rounded-full',
                                        step <= progressStep ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : (isDark ? 'bg-white/10' : 'bg-slate-200')
                                      )}
                                    />
                                  ))}
                                  <ChevronRight className={cn('w-4 h-4 opacity-30 ml-1', textColor)} />
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'creators' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Creators</h2>
                    <button onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-sky-300' : 'text-sky-700')}>
                      Browse
                    </button>
                  </div>

                  {/* Discovery cards (makes the platform feel real immediately) */}
                  <div className="mb-5">
                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Suggested</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {(isLoadingSuggestedCreators ? Array.from({ length: 3 }).map((_, i) => ({ id: `sk-${i}`, name: 'Creator' })) : suggestedCreators.slice(0, 10)).map((c: any) => (
                        <div key={c.id} className={cn('min-w-[280px] p-4 rounded-[24px] border', isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm')}>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={safeImageSrc(c.profile_photo || c.avatar)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-60 truncate', textColor)}>
                                {(c.category || c.niche || 'Creator')}{c.followers ? ` • ${formatFollowers(c.followers)}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>From</p>
                              <p className={cn('text-[12px] font-bold', textColor)}>{formatCompactINR(c?.pricing?.avg ?? c?.pricing?.reel ?? c.rate ?? 0)} / reel</p>
                            </div>
                          </div>

                          <div className="mt-2 space-y-1">
                            {getReliabilityLines(c).map((line) => (
                              <p key={line} className={cn('text-[12px] opacity-70', textColor)}>{line}</p>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {getSmartTags(c).map((t) => (
                              <span key={t} className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-slate-50')}>
                                {t}
                              </span>
                            ))}
                            {getSmartTags(c).length === 0 && (
                              <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-slate-50')}>
                                ✔ Verified profile
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => { triggerHaptic(HapticPatterns.light); navigate('/creators'); }}
                              className={cn('flex-1 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900')}
                            >
                              View profile
                            </button>
                            <button
                              onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }}
                              className={cn('flex-1 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white' : 'bg-gradient-to-br from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white')}
                            >
                              Send offer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-white/[0.04] shadow-black/20' : 'bg-white/75 shadow-emerald-100/60')}>
                    {creatorFeed.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className={cn('text-[13px] font-bold', textColor)}>Find creators to collaborate with.</p>
                        <p className={cn('text-[12px] opacity-60 mt-2', textColor)}>Browse our creator database and send your first offer.</p>
                        <div className="flex flex-col gap-2 mt-5">
                          <Button type="button" onClick={() => navigate('/creators')} className={cn('rounded-2xl', isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}>
                            <User className="w-4 h-4 mr-2" /> Browse creators
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => toast.message('Import creator link', { description: 'Coming soon.' })}
                            className={cn('rounded-2xl', isDark ? 'border-white/10 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50')}
                          >
                            Import creator link
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                        {creatorFeed.map((c) => (
                          <button key={c.id} onClick={() => c.href && navigate(c.href)} className={cn('w-full flex items-center gap-3 p-4 transition-all active:scale-[0.99] backdrop-blur-md', isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-white/60')}>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={safeImageSrc(c.avatar_url)} alt={c.name} />
                              <AvatarFallback>{String(c.name || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[13px] font-bold truncate', textColor)}>{c.name}</p>
                              <p className={cn('text-[12px] opacity-50 truncate', textColor)}>{c.username ? `@${c.username}` : 'Creator'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.status && (
                                <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-white/10 text-white/60 bg-white/5' : 'border-slate-200 text-slate-600 bg-white')}>
                                  {c.status}
                                </span>
                              )}
                              <ChevronRight className={cn('w-4 h-4 opacity-30', textColor)} />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}


              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={brandLogo} alt={brandName} />
                      <AvatarFallback>{brandName.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={cn('text-[18px] font-bold truncate', textColor)}>{brandName}</p>
                      <p className={cn('text-[12px] opacity-50 truncate', textColor)}>Brand account</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeSettingsPage === 'notifications' ? (
                      renderNotificationSettings()
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-[#1C1C1E] divide-[#2C2C2E]' : 'bg-white divide-[#E5E5EA] shadow-sm', 'divide-y')}>
                          <button onClick={() => navigate('/brand-settings')} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/15 text-emerald-700')}>
                              <Settings className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Brand settings</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Profile, website, and preferences</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => toast.message('Billing', { description: 'Coming soon.' })} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-500/15 text-indigo-700')}>
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Billing</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Invoices and payment methods</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => toast.message('Team members', { description: 'Coming soon.' })} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-500/15 text-sky-700')}>
                              <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Team members</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Invite teammates and roles</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => { triggerHaptic(HapticPatterns.light); setTheme((t) => (t === 'dark' ? 'light' : 'dark')); }} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/15 text-amber-700')}>
                              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Theme</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isDark ? 'Dark' : 'Light'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => setActiveSettingsPage('notifications')} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/15 text-blue-700')}>
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Notifications</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Enabled' : isPushSupported ? 'Setup push alerts' : 'Not supported'}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 opacity-20" />
                          </button>

                          <button onClick={() => onLogout?.()} className={cn('w-full flex items-center gap-4 py-4 px-4 transition-all active:scale-[0.99]', isDark ? 'active:bg-white/5' : 'active:bg-slate-100')}>
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-500/15 text-red-700')}>
                              <LogOut className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Logout</p>
                              <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>Sign out of this brand account</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className={cn('fixed bottom-0 inset-x-0 border-t z-50 transition-all duration-500', isDark ? 'border-[#1F2937] bg-[#0B0F14]/90' : 'border-slate-200 bg-white/90')} style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-6 py-3 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('dashboard'); }} className="flex flex-col items-center gap-1 w-14">
            <LayoutDashboard className={cn('w-[22px] h-[22px]', activeTab === 'dashboard' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'dashboard' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Home</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className="flex flex-col items-center gap-1 w-14 relative">
            <User className={cn('w-[22px] h-[22px]', activeTab === 'creators' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'creators' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Creators</span>
          </motion.button>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { triggerHaptic(HapticPatterns.success); setShowActionSheet(true); }} className="relative flex flex-col items-center -mt-8">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center transition-all hover:brightness-110', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-4 border-[#061318] text-white shadow-[0_4px_30px_rgba(16,185,129,0.28)] hover:shadow-[0_6px_40px_rgba(14,165,233,0.20)] ring-1 ring-emerald-300/30' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-4 border-white text-white shadow-lg hover:shadow-xl ring-1 ring-slate-200')}>
              <Plus className="w-7 h-7" />
            </div>
            <span className={cn('text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap', isDark ? 'text-slate-400' : 'text-slate-600')}>Create</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className="flex flex-col items-center gap-1 w-14">
            <Handshake className={cn('w-[22px] h-[22px]', activeTab === 'collabs' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'collabs' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Collabs</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.94 }} onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} className="flex flex-col items-center gap-1 w-14">
            <Settings className={cn('w-[22px] h-[22px]', activeTab === 'profile' ? (isDark ? 'text-white' : 'text-slate-900') : secondaryTextColor)} />
            <span className={cn('text-[10px] tracking-tight', activeTab === 'profile' ? (isDark ? 'text-white font-bold' : 'text-slate-900 font-bold') : cn('font-medium', secondaryTextColor))}>Account</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showActionSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActionSheet(false)} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn('fixed bottom-0 inset-x-0 z-[110] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl', isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200')}
            >
              <div className="w-12 h-1 bg-slate-500/20 rounded-full mx-auto mb-6" />
              <div className="max-w-md mx-auto">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Start a collaboration</h2>
                    <p className={cn('text-[13px] mt-1 opacity-60', isDark ? 'text-white' : 'text-slate-900')}>Send an offer, then track it end-to-end.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => { setShowActionSheet(false); setShowQuickSend(true); }}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                      isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-emerald-300/30 hover:from-emerald-400 hover:to-sky-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-emerald-600/40 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-white/10' : 'bg-white/10')}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-widest">Send new offer</p>
                        <p className="text-[12px] opacity-75 mt-1">Draft, negotiate, and lock terms</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => { setShowActionSheet(false); navigate('/creators'); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Browse creators</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Search and shortlist profiles</p>
                  </button>

                  <button onClick={() => { setShowActionSheet(false); toast.message('Import creator profile', { description: 'Coming soon.' }); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Import creator profile</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Paste a link to add quickly</p>
                  </button>

                  <div className="pt-2">
                    <p className={cn('text-[11px] font-black uppercase tracking-[0.2em] mb-2 opacity-50', textColor)}>Notifications</p>
                  </div>
                  {!isPushSubscribed && isPushSupported && (
                    <button
                      disabled={isPushBusy}
                      onClick={async () => {
                        await handleEnablePush();
                        setShowActionSheet(false);
                      }}
                      className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-50', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}
                    >
                      <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                      <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Get notified when creators reply</p>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBudgetModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBudgetModal(false)}
              className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className={cn(
                'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-[90%] max-w-sm rounded-[2rem] border p-6 shadow-2xl',
                isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200'
              )}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className={cn('text-lg font-bold', textColor)}>Monthly budget</h3>
                  <p className={cn('text-xs opacity-60', textColor)}>Used to show “remaining budget” alerts</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('text-[11px] font-black uppercase tracking-widest mb-1.5 block opacity-50', textColor)}>Budget (INR)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. 100000"
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    className={cn(
                      'w-full h-12 px-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none',
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowBudgetModal(false)}
                    className={cn('flex-1 h-12 rounded-xl font-bold text-sm', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const parsed = Number(budgetDraft);
                      if (!Number.isFinite(parsed) || parsed <= 0) {
                        toast.error('Enter a valid budget amount');
                        return;
                      }
                      try {
                        localStorage.setItem('brandMonthlyBudgetInr', String(Math.round(parsed)));
                      } catch {
                        // ignore
                      }
                      setMonthlyBudgetInr(Math.round(parsed));
                      setShowBudgetModal(false);
                      toast.success('Budget saved');
                    }}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Save budget
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showQuickSend && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickSend(false)} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn('fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-[90%] max-w-sm rounded-[2rem] border p-6 shadow-2xl', isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-200')}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className={cn('text-lg font-bold', textColor)}>Quick Send Offer</h3>
                  <p className={cn('text-xs opacity-60', textColor)}>Send a protected collab link</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={cn('text-[11px] font-black uppercase tracking-widest mb-1.5 block opacity-50', textColor)}>Recipient Email</label>
                  <input
                    type="email"
                    placeholder="creator@email.com"
                    value={quickSendEmail}
                    onChange={(e) => setQuickSendEmail(e.target.value)}
                    className={cn('w-full h-12 px-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none', isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')}
                  />
                </div>

                <div className={cn('p-4 rounded-2xl border', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-200')}>
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className={cn('text-[12px] font-bold', textColor)}>Auto-generated Contract</p>
                      <p className={cn('text-[11px] opacity-60 mt-0.5', textColor)}>We'll generate a secure agreement automatically when they accept.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowQuickSend(false)}
                    className={cn('flex-1 h-12 rounded-xl font-bold text-sm', isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleQuickSend}
                    disabled={isSending}
                    className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Offer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOffer && <OfferDetailsSheet offer={selectedOffer} />}
      </AnimatePresence>
    </div>
  );
};

export default BrandMobileDashboard;
