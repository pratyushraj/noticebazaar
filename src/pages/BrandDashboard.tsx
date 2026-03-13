import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Bell, Plus, FileText, CheckCircle2,
    Clock, TrendingUp, LayoutDashboard, Shield, CreditCard,
    Activity, LogOut, AlertTriangle,
    Sun, Moon, Laptop, Briefcase, BarChart3
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { SectionCard } from '@/components/ui/card-variants';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { toast } from 'sonner';

// -----------------------------
// Types (mock now, API later)
// -----------------------------
interface Creator {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  niche?: string;
  followers?: number;
  avgViews?: number;
  availability?: string; // e.g. "Available next week"
  tags?: string[];
}

interface Campaign {
  id: string;
  name: string;
  creators: Creator[];
  budget: number;
  deliverablesCompleted: number;
  deliverablesTotal: number;
}

type DealKind = 'paid' | 'barter' | 'hybrid';

const BrandDashboard = () => {
    const navigate = useNavigate();
    const { profile, user } = useSession();
    const location = useLocation();
    const activeTab = useMemo<'pipeline' | 'creators' | 'analytics'>(() => {
      if (location.pathname.includes('/brand/collaborations')) return 'creators';
      if (location.pathname.includes('/brand/analytics')) return 'analytics';
      return 'pipeline';
    }, [location.pathname]);
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [campaignDraft, setCampaignDraft] = useState({
      name: '',
      budget: '',
      creators: '', // comma-separated usernames
      deliverables: '', // comma-separated items
      notes: '',
    });
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
    } = useDealAlertNotifications();

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
      // Safari fallback
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
    const cardTheme: 'dark' | 'light' = isDark ? 'dark' : 'light';

    const brandName = profile?.first_name || profile?.business_name || 'Brand';
    const brandLogo = profile?.avatar_url || `https://ui-avatars.com/api/?name=${brandName}&background=0D8ABC&color=fff`;
    const isDemoBrand = (user?.email || '').toLowerCase() === 'brand-demo@noticebazaar.com'
      || ['1', 'true', 'yes'].includes((new URLSearchParams(window.location.search).get('demo') || '').toLowerCase());

    

    const demoRequests: any[] = useMemo(() => ([
      {
        id: 'demo-rahul-countered',
        status: 'countered',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        collab_type: 'Engagement Package',
        __dealKind: 'hybrid' as DealKind,
        exact_budget: 15000,
        budget_range: null,
        counter_offer: { exact_budget: 20000 },
        barter_value: 2500,
        profiles: {
          username: 'ddindialive',
          business_name: 'Rahul',
          avatar_url: 'https://i.pravatar.cc/150?img=12',
        },
        __demo: true,
        __href: '/brand-console-demo',
      },
      {
        id: 'demo-neha-accepted',
        status: 'accepted',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
        collab_type: 'Product Review',
        __dealKind: 'barter' as DealKind,
        exact_budget: 15000,
        budget_range: null,
        barter_value: 4500,
        profiles: {
          username: 'neha.verma',
          business_name: 'Neha',
          avatar_url: 'https://i.pravatar.cc/150?img=47',
        },
        __demo: true,
        __href: '/brand-console-demo',
      },
      {
        id: 'demo-ajay-pending',
        status: 'pending',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
        collab_type: 'Starter Creator Package',
        __dealKind: 'paid' as DealKind,
        exact_budget: 15000,
        budget_range: null,
        profiles: {
          username: 'ajay.patel',
          business_name: 'Ajay',
          avatar_url: 'https://i.pravatar.cc/150?img=33',
        },
        __demo: true,
        __href: '/brand-console-demo',
      },
    ]), []);

    const getStatusMeta = (statusRaw: any) => {
      const status = String(statusRaw || '').toLowerCase();
      if (status === 'countered') {
        return { label: 'Countered', hint: 'Respond within 24h', tone: 'warning' as const };
      }
      if (status === 'pending') {
        return { label: 'Pending', hint: 'Awaiting creator response', tone: 'info' as const };
      }
      if (status === 'accepted') {
        return { label: 'Accepted', hint: 'Campaign ready to start', tone: 'success' as const };
      }
      if (status === 'declined') {
        return { label: 'Declined', hint: 'Offer closed', tone: 'neutral' as const };
      }
      return { label: status ? status : 'Unknown', hint: '', tone: 'neutral' as const };
    };

    const formatCompactINR = (n: any) => {
      const num = Number(n);
      const safe = Number.isFinite(num) ? num : 0;
      return `₹${safe.toLocaleString('en-IN')}`;
    };

    const normalize = (s: any) =>
      String(s || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

    const getDealKind = (row: any): DealKind => {
      if (row?.__dealKind === 'paid' || row?.__dealKind === 'barter' || row?.__dealKind === 'hybrid') return row.__dealKind;
      const ct = String(row?.collab_type || '').toLowerCase();
      if (ct === 'paid') return 'paid';
      if (ct === 'barter') return 'barter';
      if (ct === 'both') return 'hybrid';
      // Infer from values when collab_type is overloaded as package label in the UI.
      const cash = Number(row?.exact_budget ?? 0);
      const pv = Number(row?.barter_value ?? 0);
      if (pv > 0 && cash > 0) return 'hybrid';
      if (pv > 0 && !(cash > 0)) return 'barter';
      return 'paid';
    };

    const getCashValue = (row: any) => {
      const v = Number((row?.counter_offer as any)?.exact_budget ?? row?.exact_budget ?? 0);
      return Number.isFinite(v) ? v : 0;
    };

    const getProductValue = (row: any) => {
      const v = Number(row?.barter_value ?? 0);
      return Number.isFinite(v) ? v : 0;
    };



    const buildProfilesById = (profiles: any[] | null | undefined) => {
      const map = new Map<string, any>();
      (profiles || []).forEach((p) => {
        if (!p?.id) return;
        map.set(String(p.id), p);
      });
      return map;
    };

    const isMissingColumnError = (err: any, column: string) => {
      const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
      const col = String(column || '').toLowerCase();
      return (
        msg.includes(`could not find the '${col}' column`) ||
        msg.includes(`could not find the \"${col}\" column`) ||
        msg.includes(`column ${col} does not exist`) ||
        msg.includes(`column "${col}" does not exist`) ||
        msg.includes(`${col} does not exist`) ||
        (msg.includes('column') && msg.includes(col) && msg.includes('does not exist')) ||
        (msg.includes('schema cache') && msg.includes(col))
      );
    };

    // Fetch collaboration requests sent by this brand
    const { data: requests } = useSupabaseQuery(
        ['brandRequests', user?.id],
        async () => {
            if (!user?.id) return [];
            const selectV2 = `
                    id, 
                    brand_name, 
                    brand_email, 
                    collab_type, 
                    status, 
                    created_at, 
                    budget_range, 
                    exact_budget, 
                    barter_value,
                    barter_description,
                    deliverables,
                    deadline,
                    creator_id,
                    counter_offer,
                    brand_id
                `;

            const selectV1 = `
                    id, 
                    brand_name, 
                    brand_email, 
                    collab_type, 
                    status, 
                    created_at, 
                    budget_range, 
                    exact_budget, 
                    barter_value,
                    barter_description,
                    deliverables,
                    deadline,
                    creator_id,
                    counter_offer
                `;

            const run = async (select: string, canUseBrandId: boolean) => {
              const baseQuery = supabase
                  .from('collab_requests')
                  .select(select)
                  .order('created_at', { ascending: false }) as any;

              if (canUseBrandId) {
                // Prefer brand_id when set, but fall back to email so older rows still show up.
                const query = (user.email
                  ? baseQuery.or(`brand_id.eq.${user.id},brand_email.eq.${user.email}`)
                  : baseQuery.eq('brand_id', user.id)) as any;
                const { data, error } = await query;
                if (error) throw error;
                return (data || []) as any[];
              }

              // Legacy schema: no brand_id column. Email-only filtering.
              if (!user.email) return [] as any[];
              const { data, error } = await baseQuery.eq('brand_email', user.email);
              if (error) throw error;
              return (data || []) as any[];
            };

            let data: any[] = [];
            try {
              data = await run(selectV2, true);
            } catch (err: any) {
              if (isMissingColumnError(err, 'brand_id')) {
                data = await run(selectV1, false);
              } else {
                throw err;
              }
            }

            const rows = (data || []) as any[];
            const creatorIds = Array.from(new Set(rows.map(r => String(r.creator_id || '')).filter(Boolean)));
            if (creatorIds.length === 0) return rows;

            // Avoid embedded relationship selects; some environments have schema cache mismatch.
            const { data: profs, error: profErr } = await supabase
              .from('profiles')
              .select('id, username, first_name, last_name, business_name, avatar_url')
              .in('id' as any, creatorIds as any[]);

            if (profErr) {
              console.warn('[BrandDashboard] Failed to fetch creator profiles for requests:', profErr.message);
              return rows;
            }
            const byId = buildProfilesById(profs);
            return rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
        },
        { enabled: !!user?.id }
    );

    // Fetch active deals for this brand
    const { data: deals } = useSupabaseQuery(
        ['brandDeals', user?.id],
        async () => {
            if (!user?.id) return [];
            const selectV2 = `
                    id,
                    creator_id,
                    status,
                    created_at,
                    deal_amount,
                    due_date,
                    brand_id,
                    brand_email
                `;

            const selectV1 = `
                    id,
                    creator_id,
                    status,
                    created_at,
                    deal_amount,
                    due_date,
                    brand_email
                `;

            const run = async (select: string, canUseBrandId: boolean) => {
              const baseQuery = supabase
                  .from('brand_deals')
                  .select(select)
                  .order('created_at', { ascending: false }) as any;

              if (canUseBrandId) {
                const query = (user.email
                  ? baseQuery.or(`brand_id.eq.${user.id},brand_email.eq.${user.email}`)
                  : baseQuery.eq('brand_id', user.id)) as any;
                const { data, error } = await query;
                if (error) throw error;
                return (data || []) as any[];
              }

              // Legacy schema: no brand_id column. Email-only filtering.
              if (!user.email) return [] as any[];
              const { data, error } = await baseQuery.eq('brand_email', user.email);
              if (error) throw error;
              return (data || []) as any[];
            };

            let data: any[] = [];
            try {
              data = await run(selectV2, true);
            } catch (err: any) {
              if (isMissingColumnError(err, 'brand_id')) {
                data = await run(selectV1, false);
              } else {
                throw err;
              }
            }

            const rows = (data || []) as any[];
            const creatorIds = Array.from(new Set(rows.map(r => String(r.creator_id || '')).filter(Boolean)));
            if (creatorIds.length === 0) return rows;

            const { data: profs, error: profErr } = await supabase
              .from('profiles')
              .select('id, username, first_name, last_name, business_name, avatar_url')
              .in('id' as any, creatorIds as any[]);

            if (profErr) {
              console.warn('[BrandDashboard] Failed to fetch creator profiles for deals:', profErr.message);
              return rows;
            }
            const byId = buildProfilesById(profs);
            return rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
        },
        { enabled: !!user?.id }
    );



    const stats = useMemo(() => {
        const totalSent = (requests?.length || 0);
        const activeDeals = deals?.filter(d => d.status !== 'completed' && d.status !== 'cancelled').length || 0;
        const totalInvestment = deals?.reduce((acc, d) => acc + (Number((d as any).deal_amount) || 0), 0) || 0;
        const needsAction = requests?.filter(r => r.status === 'countered').length || 0;

        return {
            totalSent,
            activeDeals,
            totalInvestment,
            needsAction
        };
    }, [requests, deals]);

    const displayStats = useMemo(() => {
        if (!isDemoBrand) return stats;
        const hasReal = (requests?.length || 0) > 0 || (deals?.length || 0) > 0;
        if (hasReal) return stats;
        return {
          totalSent: 10,
          needsAction: 2,
          activeDeals: 4,
          totalInvestment: 52800,
        };
    }, [isDemoBrand, stats, requests, deals]);

    const dealPipeline = useMemo(() => {
      const reqs = (((isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0) ? demoRequests : (requests || [])) as any[]);
      const ds = (deals || []) as any[];

      const pendingCash = reqs
        .filter(r => ['pending'].includes(String(r.status || '').toLowerCase()))
        .reduce((acc, r) => {
          const kind = getDealKind(r);
          if (kind === 'barter') return acc;
          return acc + getCashValue(r);
        }, 0);

      const pendingProduct = reqs
        .filter(r => ['pending'].includes(String(r.status || '').toLowerCase()))
        .reduce((acc, r) => {
          const kind = getDealKind(r);
          if (kind === 'paid') return acc;
          return acc + getProductValue(r);
        }, 0);

      const counteredCash = reqs
        .filter(r => ['countered'].includes(String(r.status || '').toLowerCase()))
        .reduce((acc, r) => {
          const kind = getDealKind(r);
          if (kind === 'barter') return acc;
          return acc + getCashValue(r);
        }, 0);

      const stageOfDeal = (statusRaw: any) => {
        const s = String(statusRaw || '').toLowerCase();
        if (!s) return 'accepted' as const;
        if (s.includes('complete') || s.includes('completed') || s.includes('paid') || s.includes('closed')) return 'completed' as const;
        if (s.includes('cancel')) return 'cancelled' as const;
        return 'accepted' as const;
      };

      const accepted = ds
        .filter((d) => stageOfDeal(d.status) === 'accepted')
        .reduce((acc, d) => acc + (Number((d as any).deal_amount) || 0), 0);

      const completed = ds
        .filter((d) => stageOfDeal(d.status) === 'completed')
        .reduce((acc, d) => acc + (Number((d as any).deal_amount) || 0), 0);

      const isDemoNoReal = isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0;
      if (isDemoNoReal) {
        return {
          pendingCash: 38000,
          pendingProduct: 12000,
          counteredCash: 12000,
          acceptedCash: 52800,
          acceptedProduct: 4500,
          completedCash: 112000,
          completedProduct: 18000,
          // Legacy fields consumed by the UI card (cash-only, INR).
          pending: 38000,
          countered: 12000,
          accepted: 52800,
          completed: 112000,
        };
      }
      // Note: product value is not stored in brand_deals yet; accepted/completed product stays 0 until backend supports it.
      return {
        pendingCash,
        pendingProduct,
        counteredCash,
        acceptedCash: accepted,
        acceptedProduct: 0,
        completedCash: completed,
        completedProduct: 0,
        // Legacy fields consumed by the UI card (cash-only, INR).
        pending: pendingCash,
        countered: counteredCash,
        accepted,
        completed,
      };
    }, [isDemoBrand, requests, deals, demoRequests]);

    const pipelineStages = useMemo(() => {
      const reqs = (((isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0) ? demoRequests : (requests || [])) as any[]);
      const ds = (deals || []) as any[];

      const toCreator = (p: any, fallbackName: string) => ({
        id: String(p?.id || fallbackName),
        name: p?.business_name || p?.username || fallbackName,
        username: p?.username || 'creator',
        avatarUrl: p?.avatar_url || null,
      });

      const pendingCreators = reqs
        .filter(r => String(r.status || '').toLowerCase() === 'pending')
        .map((r) => toCreator(r.profiles, 'Creator'));

      const counteredCreators = reqs
        .filter(r => String(r.status || '').toLowerCase() === 'countered')
        .map((r) => toCreator(r.profiles, 'Creator'));

      const stageOfDeal = (statusRaw: any) => {
        const s = String(statusRaw || '').toLowerCase();
        if (!s) return 'accepted' as const;
        if (s.includes('complete') || s.includes('completed') || s.includes('paid') || s.includes('closed')) return 'completed' as const;
        if (s.includes('cancel')) return 'cancelled' as const;
        return 'accepted' as const;
      };

      const acceptedCreators = ds
        .filter((d) => stageOfDeal(d.status) === 'accepted')
        .map((d) => toCreator(d.profiles, 'Creator'));

      const completedCreators = ds
        .filter((d) => stageOfDeal(d.status) === 'completed')
        .map((d) => toCreator(d.profiles, 'Creator'));

      const uniq = (list: any[]) => {
        const seen = new Set<string>();
        return list.filter((c) => {
          const key = `${c.id}:${c.username}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      return {
        pending: { creators: uniq(pendingCreators).slice(0, 3), campaigns: Math.max(1, pendingCreators.length > 0 ? 1 : 0) },
        countered: { creators: uniq(counteredCreators).slice(0, 3), campaigns: Math.max(1, counteredCreators.length > 0 ? 1 : 0) },
        accepted: { creators: uniq(acceptedCreators).slice(0, 3), campaigns: Math.max(1, acceptedCreators.length > 0 ? 1 : 0) },
        completed: { creators: uniq(completedCreators).slice(0, 3), campaigns: Math.max(1, completedCreators.length > 0 ? 1 : 0) },
      };
    }, [isDemoBrand, requests, deals, demoRequests]);

    const performanceMetrics = useMemo(() => {
      const reqs = (requests || []) as any[];
      const ds = (deals || []) as any[];

      const acceptedCount = reqs.filter(r => String(r.status || '').toLowerCase() === 'accepted').length;
      const sentCount = reqs.length || 0;
      const acceptanceRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const monthlySpend = ds
        .filter(d => {
          const t = new Date(d.created_at || 0).getTime();
          return Number.isFinite(t) && t >= thirtyDaysAgo;
        })
        .reduce((acc, d) => acc + (Number((d as any).deal_amount) || 0), 0);

      const creatorCounts = new Map<string, number>();
      ds.forEach(d => {
        const cid = String((d as any).creator_id || '');
        if (!cid) return;
        creatorCounts.set(cid, (creatorCounts.get(cid) || 0) + 1);
      });
      const repeatCreators = Array.from(creatorCounts.values()).filter(v => v >= 2).length;

      const isDemoNoReal = isDemoBrand && sentCount === 0 && ds.length === 0;
      if (isDemoNoReal) {
        return {
          monthlySpend: 9500,
          acceptanceRate: 70,
          repeatCreators: 4,
          totalReach: 245000,
          engagementRate: 6.2,
          avgCreatorResponse: '2h 18m',
        };
      }
      // Placeholders for now; later these can come from campaign analytics tables.
      return {
        monthlySpend,
        acceptanceRate,
        repeatCreators,
        totalReach: 245000,
        engagementRate: 6.2,
        avgCreatorResponse: '2h 18m',
      };
    }, [requests, deals, isDemoBrand]);

    const initialCampaigns: Campaign[] = useMemo(() => ([
      {
        id: 'camp-1',
        name: 'Summer Launch Campaign',
        creators: [
          { id: 'c-rahul', name: 'Rahul', username: 'ddindialive', tags: ['Fashion', 'Delhi', 'High Engagement'], avatarUrl: 'https://i.pravatar.cc/150?img=12' },
          { id: 'c-neha', name: 'Neha', username: 'neha.verma', tags: ['Beauty', 'Mumbai', 'Fast Replies'], avatarUrl: 'https://i.pravatar.cc/150?img=47' },
          { id: 'c-ajay', name: 'Ajay', username: 'ajay.patel', tags: ['Lifestyle', 'Pune', 'Reliable'], avatarUrl: 'https://i.pravatar.cc/150?img=33' },
        ],
        budget: 45000,
        deliverablesCompleted: 2,
        deliverablesTotal: 3,
      },
      {
        id: 'camp-2',
        name: 'UGC Retargeting',
        creators: [{ id: 'c-aditi', name: 'Aditi', username: 'aaditxstyle', tags: ['UGC', 'Bangalore', 'Cost Efficient'], avatarUrl: 'https://i.pravatar.cc/150?img=47' }],
        budget: 12000,
        deliverablesCompleted: 1,
        deliverablesTotal: 2,
      },
    ]), []);

    const [campaigns, setCampaigns] = useState<Campaign[]>(() => initialCampaigns);



    const campaignRoi = useMemo(() => {
      const spend = (displayStats.totalInvestment || 0) > 0 ? displayStats.totalInvestment : performanceMetrics.monthlySpend;
      const reach = Number((performanceMetrics as any).totalReach || 0);
      const er = Number((performanceMetrics as any).engagementRate || 0);
      const engagements = reach > 0 && er > 0 ? (reach * er) / 100 : 0;
      const cpe = engagements > 0 ? spend / engagements : 0;
      const isDemoNoReal = isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0;
      if (isDemoNoReal) return { spend: 52800, reach: 245000, engagementRate: 6.3, cpe: 0.42 };
      return { spend, reach, engagementRate: er, cpe };
    }, [displayStats.totalInvestment, performanceMetrics, isDemoBrand, requests, deals]);

    function getRequestHref(request: any) {
      if (request?.__demo && request?.__href) return request.__href as string;
      return `/deal-details/${request.id}`;
    }



    const [dismissedApprovalQueueIds, setDismissedApprovalQueueIds] = useState<string[]>([]);

    const approvalQueue = useMemo(() => {
      const source = (((isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0) ? demoRequests : (requests || [])) as any[]);
      const countered = source
        .filter(r => String(r.status || '').toLowerCase() === 'countered')
        .slice(0, 2)
        .map((r) => ({
          id: `aq-${r.id}`,
          kind: 'countered' as const,
          requestId: r.id,
          creator: {
            id: (r.profiles as any)?.id || (r as any).creator_id || r.id,
            name: (r.profiles as any)?.business_name || (r.profiles as any)?.first_name || (r.profiles as any)?.username || 'Creator',
            username: (r.profiles as any)?.username || 'creator',
            avatarUrl: (r.profiles as any)?.avatar_url || null,
          } satisfies Creator,
          message: 'countered your offer',
          packageName: (r.collab_type || 'Engagement package') as string,
          campaignName: (r.campaign_name || 'Summer Launch') as string,
          budgetRemaining: 25000,
          stats: {
            followers: 172000,
            avgViews: '3–10K',
            responseTimeHours: 3,
          },
          tags: ['Fashion', 'Delhi'],
          amountFrom: Number(r.exact_budget) || null,
          amountTo: Number((r.counter_offer as any)?.exact_budget) || null,
          timestamp: r.created_at,
          cta: { label: 'View Offer', href: getRequestHref(r) },
        }));

      // Mock queue items for future states (draft uploaded / pending approval)
      const mockMore = [
        {
          id: 'aq-draft',
          kind: 'draft' as const,
          creator: { id: 'c-neha', name: 'Neha', username: 'neha.verma', avatarUrl: 'https://i.pravatar.cc/150?img=47' },
          message: 'uploaded reel draft',
          packageName: 'Product Review',
          campaignName: 'UGC Retargeting',
          budgetRemaining: 12000,
          stats: {
            followers: 98000,
            avgViews: '2–6K',
            responseTimeHours: 4,
          },
          tags: ['Beauty', 'Mumbai'],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          cta: { label: 'Review', href: '/brand-console-demo' },
        },
        {
          id: 'aq-approval',
          kind: 'approval' as const,
          creator: { id: 'c-ajay', name: 'Ajay', username: 'ajay.patel', avatarUrl: 'https://i.pravatar.cc/150?img=33' },
          message: 'awaiting campaign approval',
          packageName: 'Starter package',
          campaignName: 'Lifestyle UGC',
          budgetRemaining: 18000,
          stats: {
            followers: 112000,
            avgViews: '4–9K',
            responseTimeHours: 5,
          },
          tags: ['Lifestyle', 'Pune'],
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
          cta: { label: 'Approve', href: '/brand-console-demo' },
        },
      ];

      const base = countered.length > 0 ? countered : [];
      const rest = (isDemoBrand ? mockMore : mockMore.slice(0, 1));
      return [...base, ...rest]
        .filter((i) => !dismissedApprovalQueueIds.includes(i.id))
        .slice(0, 3);
    }, [isDemoBrand, requests, deals, demoRequests, dismissedApprovalQueueIds]);

    const draftCampaigns = useMemo(() => ([
      { id: 'draft-1', name: 'Summer Fitness', creators: 3, budget: 45000, updatedAt: 'Mar 12' },
      { id: 'draft-2', name: 'UGC Retargeting', creators: 1, budget: 12000, updatedAt: 'Mar 09' },
    ]), []);

    const collaborationStages = useMemo(() => {
      const demo = [
        { id: 'deal-1', creator: 'Rahul', campaign: 'Summer Fitness', deliverables: '1 Reel • 3 Stories', status: 'Awaiting Content', deadline: 'Mar 20' },
        { id: 'deal-2', creator: 'Neha', campaign: 'Beauty Launch', deliverables: '1 Reel • 2 Stories', status: 'Awaiting Approval', deadline: 'Mar 18' },
        { id: 'deal-3', creator: 'Ajay', campaign: 'Lifestyle UGC', deliverables: '2 Reels', status: 'Completed', deadline: 'Mar 05' },
      ];
      return demo;
    }, []);

    const spendByCampaign = useMemo(() => ([
      { id: 'sp-1', name: 'Fitness Campaign', spend: 30000 },
      { id: 'sp-2', name: 'Beauty Campaign', spend: 22000 },
      { id: 'sp-3', name: 'UGC Creators', spend: 10800 },
    ]), []);

    const creatorSpendPerf = useMemo(() => ([
      { id: 'cp-1', name: 'Rahul', spend: 20000, views: '1.2M', cpm: 16 },
      { id: 'cp-2', name: 'Neha', spend: 18000, views: '820K', cpm: 22 },
      { id: 'cp-3', name: 'Ajay', spend: 14800, views: '610K', cpm: 24 },
    ]), []);

    const paymentStatus = useMemo(() => ([
      { id: 'pay-1', label: 'Pending Payments', value: 2 },
      { id: 'pay-2', label: 'Completed Payments', value: 12 },
      { id: 'pay-3', label: 'Invoices', value: 6 },
    ]), []);

    const handlePrimaryCta = () => {
      triggerHaptic(HapticPatterns.light);
      navigate('/brand/offers');
      
    };

    const handleTabClick = (tabId: 'pipeline' | 'creators' | 'analytics') => {
      const path =
        tabId === 'creators'
          ? '/brand/collaborations'
          : tabId === 'analytics'
            ? '/brand/analytics'
            : '/brand/offers';
      navigate(path);
    };

    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const bgColor = isDark ? 'bg-black' : 'bg-slate-50';
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const upcomingDeliverables = useMemo(() => ([
      { id: 'ud-1', date: 'Mar 15', creator: 'Rahul', label: 'Reel' },
      { id: 'ud-2', date: 'Mar 17', creator: 'Neha', label: 'Story' },
      { id: 'ud-3', date: 'Mar 18', creator: 'Ajay', label: 'Post' },
    ]), []);

    const notifications = useMemo(() => ([
      { id: 'n-1', title: 'Rahul countered your offer', time: '2h ago', href: '/brand-console-demo' },
      { id: 'n-2', title: 'Neha uploaded reel draft', time: '4h ago', href: '/brand-console-demo' },
      { id: 'n-3', title: 'Ajay accepted campaign', time: 'Yesterday', href: '/brand-console-demo' },
    ]), []);

    const creatorShortlist = useMemo(() => ([
      { id: 's-1', name: 'Rahul', username: 'ddindialive', avatarUrl: 'https://i.pravatar.cc/150?img=12' },
      { id: 's-2', name: 'Neha', username: 'neha.verma', avatarUrl: 'https://i.pravatar.cc/150?img=47' },
      { id: 's-3', name: 'Ajay', username: 'ajay.patel', avatarUrl: 'https://i.pravatar.cc/150?img=33' },
    ]), []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        // Full-bleed inside the shared <Layout> which applies padding on <main>.
        // Negative margins prevent a dark "gutter" from showing around the light dashboard on mobile.
        <div className={cn(
          "min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden pb-20",
          "-mx-4 md:-mx-6 lg:-mx-8 -mt-6 -mb-6",
          bgColor,
          textColor
        )}>

            {/* Spotlight Background Effect */}
            {isDark && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                </div>
            )}

            <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-10 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >

		                {/* Dashboard Stats Hero */}
		                <div className="mb-10 sm:mb-12">
		                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
		                        <div className="flex-1 min-w-0">
		                            <h2 className={cn("text-3xl sm:text-4xl font-black tracking-tight font-outfit mb-2", textColor)}>
		                                Welcome back, {brandName.split(' ')[0]}
		                            </h2>
		                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={cn("font-medium", isDark ? "text-white/50" : "text-slate-600")}
                                >
                                    {activeTab === 'pipeline' && (
                                      <>You have <span className={cn("font-black", isDark ? "text-white/80" : "text-slate-900")}>{displayStats.needsAction}</span> creator offers requiring your feedback today.</>
                                    )}
                                    {activeTab === 'creators' && <>Track active collaborations, deliverables, and approvals.</>}
                                    {activeTab === 'analytics' && <>Monitor spend, ROI, and creator performance.</>}
		                                </motion.p>
		                        </div>
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                onClick={() => navigate('/creators')}
                                className={cn(
                                  "h-10 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border",
                                  isDark ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                + Send Offer
                              </Button>
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
                                  isDark
                                    ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                                aria-label="Toggle theme"
                                title="Theme: Auto, Dark, Light"
                              >
                                <span className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center",
                                  isDark ? "bg-white/5" : "bg-slate-100"
                                )}>
                                  {themeIcon}
                                </span>
                                <span className="hidden sm:inline">{themeModeLabel}</span>
                              </button>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setNotificationsOpen((prev) => !prev)}
                                  className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  )}
                                  aria-label="Notifications"
                                >
                                  <Bell className="w-5 h-5" />
                                </button>
                                {notificationsOpen && (
                                  <div
                                    className={cn(
                                      "absolute right-0 mt-3 w-[300px] rounded-[24px] border shadow-2xl p-4 z-50 overflow-hidden",
                                      isDark 
                                        ? "bg-[#0A0A0B]/95 backdrop-blur-xl border-white/10 text-white" 
                                        : "bg-white/95 backdrop-blur-xl border-slate-200/60 text-slate-900"
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-4 px-1">
                                      <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-slate-500")}>
                                        Notifications
                                      </p>
                                      <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isDark ? "bg-blue-500" : "bg-blue-600")} />
                                    </div>

                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                                      {!isPushSubscribed && isPushSupported && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            enableNotifications();
                                            triggerHaptic(HapticPatterns.medium);
                                          }}
                                          disabled={isPushBusy}
                                          className={cn(
                                            "w-full mb-4 rounded-2xl p-4 border border-dashed flex flex-col items-center gap-2 transition-all duration-300 group relative overflow-hidden",
                                            isDark 
                                              ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10" 
                                              : "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-2.5 relative z-10">
                                            <div className={cn(
                                              "p-1.5 rounded-lg",
                                              isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-500/10 text-blue-600"
                                            )}>
                                              <Bell className="w-3.5 h-3.5 animate-bounce" />
                                            </div>
                                            <span className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-blue-400" : "text-blue-600")}>
                                              {isPushBusy ? "Enabling..." : "Enable Push Alerts"}
                                            </span>
                                          </div>
                                          <p className={cn("text-[10px] font-medium leading-tight relative z-10", isDark ? "text-white/60" : "text-slate-600")}>
                                            Get real-time deal counters & collaborator updates.
                                          </p>
                                          
                                          {/* Subtle glow effect */}
                                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      )}

                                      {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                          <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => {
                                              setNotificationsOpen(false);
                                              navigate(n.href);
                                            }}
                                            className={cn(
                                              "w-full text-left rounded-xl border p-3.5 transition-all duration-200 group",
                                              isDark 
                                                ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10" 
                                                : "border-slate-100 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-200"
                                            )}
                                          >
                                            <p className={cn("text-[12px] font-bold leading-tight mb-1 group-hover:translate-x-0.5 transition-transform", isDark ? "text-white/90" : "text-slate-800")}>
                                              {n.title}
                                            </p>
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", isDark ? "text-white/40" : "text-slate-500")}>
                                              {n.time}
                                            </p>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="py-8 text-center">
                                          <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-30", isDark ? "text-white" : "text-slate-400")}>
                                            No new alerts
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className={cn(
                                      "mt-4 pt-3 border-t flex items-center justify-between",
                                      isDark ? "border-white/10" : "border-slate-100"
                                    )}>
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          pushPermission === 'granted' ? "bg-emerald-500" : (pushPermission === 'denied' ? "bg-red-500" : "bg-amber-500")
                                        )} />
                                        <p className={cn("text-[8px] font-black uppercase tracking-[0.15em]", isDark ? "text-white/40" : "text-slate-400")}>
                                          Push {pushPermission.toUpperCase()}
                                        </p>
                                      </div>
                                      {hasVapidKey && (
                                        <div className="flex items-center gap-2">
                                          {isPushSubscribed && (
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                triggerHaptic(HapticPatterns.light);
                                                const res = await sendTestPush();
                                                if (res.success) toast.success("Test push sent!");
                                                else toast.error(res.reason || "Failed to send test push");
                                              }}
                                              disabled={isPushBusy}
                                              className={cn(
                                                "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border transition-all",
                                                isDark ? "border-white/10 text-white/40 hover:bg-white/5 hover:text-white" : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                              )}
                                            >
                                              Send Test
                                            </button>
                                          )}
                                          <div className="flex items-center gap-1.5 ml-1">
                                            <span className={cn("text-[8px] font-bold uppercase tracking-widest", isDark ? "text-emerald-500/50" : "text-emerald-600/50")}>Ready</span>
                                            <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Avatar className={cn("h-10 w-10 ring-2 ring-primary/20", isDark ? "border border-white/10" : "border border-slate-200")}>
                                <AvatarImage src={brandLogo} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{brandName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <Button
                                type="button"
                                onClick={handleLogout}
                                className={cn(
                                  "h-10 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border flex items-center gap-2",
                                  isDark ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Log out</span>
                              </Button>
                            </div>
                        </div>

                        {/* Desktop Tab Switcher */}
                        <div className="hidden xl:flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-2xl w-fit mb-8">
                          {[
                            { id: 'pipeline', label: 'Offer Pipeline', icon: LayoutDashboard },
                            { id: 'creators', label: 'Collaborations', icon: Briefcase },
                            { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
                          ].map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabClick(tab.id as any)}
                                className={cn(
                                  "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-black uppercase tracking-widest text-[10px]",
                                  active
                                    ? (isDark ? "bg-white/10 text-white shadow-lg" : "bg-slate-900 text-white shadow-lg")
                                    : (isDark ? "text-white/40 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Primary Actions Row */}
                        {activeTab === 'pipeline' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-6">
                            <Button
                              type="button"
                              onClick={() => navigate('/creators')}
                              className={cn(
                                "h-12 sm:h-14 rounded-2xl font-black uppercase tracking-[0.16em] text-[10px] sm:text-[11px] shadow-xl w-full min-w-0 px-3 sm:px-4 justify-center text-center whitespace-normal leading-tight",
                                isDark ? "bg-white/5 border border-white/10 text-white hover:bg-white/10" : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                              )}
                            >
                              <Search className="w-5 h-5 mr-3" strokeWidth={3} />
                              Search Creators
                            </Button>
                            <Button
                              type="button"
                              className={cn(
                                "h-12 sm:h-14 rounded-2xl text-white font-black uppercase tracking-[0.16em] text-[10px] sm:text-[11px] shadow-xl w-full min-w-0 px-3 sm:px-4 justify-center text-center whitespace-normal leading-tight sm:col-span-2 xl:col-span-1",
                                isDark ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                              )}
                              onClick={handlePrimaryCta}
                            >
                              <Search className="w-5 h-5 mr-3" strokeWidth={3} />
                              Review Creator Offers
                            </Button>

                            <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "h-12 sm:h-14 rounded-2xl font-black uppercase tracking-[0.16em] text-[10px] sm:text-[11px] border w-full min-w-0 px-3 sm:px-4 justify-center text-center whitespace-normal leading-tight",
                                    isDark ? "bg-white/0 border-white/10 text-white/80 hover:bg-white/10" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                                  )}
                                >
                                  <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
                                  Create Campaign
                                </Button>
                              </DialogTrigger>
                              <DialogContent className={cn(
                                "sm:max-w-[520px] rounded-2xl",
                                isDark ? "bg-black border border-white/10 text-white" : "bg-white border border-slate-200 text-slate-900"
                              )}>
                                <DialogHeader>
                                  <DialogTitle className={cn("font-outfit font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                    Create Campaign
                                  </DialogTitle>
                                  <DialogDescription className={cn(isDark ? "text-white/50" : "text-slate-600")}>
                                    Quick-create a campaign. This uses demo data now and will connect to backend campaigns later.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Campaign name</p>
                                      <Input
                                        value={campaignDraft.name}
                                        onChange={(e) => setCampaignDraft((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Summer Launch"
                                        className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
                                      />
                                    </div>
                                    <div>
                                      <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Budget (INR)</p>
                                      <Input
                                        value={campaignDraft.budget}
                                        onChange={(e) => setCampaignDraft((p) => ({ ...p, budget: e.target.value.replace(/[^\d]/g, '') }))}
                                        placeholder="45000"
                                        inputMode="numeric"
                                        className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Creators (usernames)</p>
                                    <Input
                                      value={campaignDraft.creators}
                                      onChange={(e) => setCampaignDraft((p) => ({ ...p, creators: e.target.value }))}
                                      placeholder="ddindialive, neha.verma, ajay.patel"
                                      className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
                                    />
                                  </div>

                                  <div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Deliverables</p>
                                    <Input
                                      value={campaignDraft.deliverables}
                                      onChange={(e) => setCampaignDraft((p) => ({ ...p, deliverables: e.target.value }))}
                                      placeholder="Reel, 2 Stories"
                                      className={cn(isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
                                    />
                                  </div>

                                  <div>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isDark ? "text-white/40" : "text-slate-500")}>Notes (optional)</p>
                                    <Textarea
                                      value={campaignDraft.notes}
                                      onChange={(e) => setCampaignDraft((p) => ({ ...p, notes: e.target.value }))}
                                      placeholder="Brief / instructions..."
                                      className={cn("min-h-[88px]", isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200")}
                                    />
                                  </div>
                                </div>

                                <DialogFooter className="mt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      "rounded-xl font-black uppercase tracking-widest text-[11px] border",
                                      isDark ? "bg-white/0 border-white/10 text-white/80 hover:bg-white/10" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                                    )}
                                    onClick={() => setIsCreateCampaignOpen(false)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    className={cn(
                                      "rounded-xl text-white font-black uppercase tracking-widest text-[11px]",
                                      isDark ? "bg-emerald-500 hover:bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                                    )}
                                    disabled={!normalize(campaignDraft.name) || !Number(campaignDraft.budget)}
                                    onClick={() => {
                                      triggerHaptic(HapticPatterns.success);
                                      const id = (globalThis.crypto as any)?.randomUUID?.() || `camp-${Date.now()}`;
                                      const budget = Number(campaignDraft.budget) || 0;
                                      const creators = campaignDraft.creators
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                        .slice(0, 6)
                                        .map((u) => ({
                                          id: `c-${u}`,
                                          name: u.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
                                          username: u,
                                        }));
                                      const deliverables = campaignDraft.deliverables
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean);

                                      setCampaigns((prev) => ([
                                        {
                                          id,
                                          name: campaignDraft.name.trim(),
                                          creators: creators.length > 0 ? creators : [{ id: 'c-creator', name: 'Creator', username: 'creator' }],
                                          budget,
                                          deliverablesCompleted: 0,
                                          deliverablesTotal: Math.max(1, deliverables.length || 1),
                                        },
                                        ...prev,
                                      ]));

                                      setCampaignDraft({ name: '', budget: '', creators: '', deliverables: '', notes: '' });
                                      setIsCreateCampaignOpen(false);
                                    }}
                                  >
                                    Create
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}

		                    {/* Key stats */}
                        {(activeTab === 'pipeline' || activeTab === 'analytics') && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className={cn(
                                "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 pb-2 overflow-x-auto no-scrollbar",
                            )}
                          >
                            {[
                              { label: 'Pending Actions', value: displayStats.needsAction, icon: <Activity className="w-5 h-5 text-orange-400" />, trend: displayStats.needsAction > 0 ? { value: 12, isPositive: false } : undefined },
                              { label: 'Active Deals', value: displayStats.activeDeals, icon: <Briefcase className="w-5 h-5 text-blue-400" />, trend: { value: 8, isPositive: true } },
                              { label: 'Offers Sent', value: displayStats.totalSent, icon: <FileText className="w-5 h-5 text-purple-400" /> },
                              { label: 'Total Spend', value: formatCompactINR(displayStats.totalInvestment), icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, trend: { value: 15, isPositive: true } },
                            ].map((stat, idx) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (idx * 0.1) }}
                              >
                                <div className={cn(
                                  "relative overflow-hidden group rounded-3xl border p-4 sm:p-5 transition-all duration-300",
                                  "hover:scale-[1.03] hover:shadow-2xl",
                                  isDark 
                                    ? "bg-gradient-to-br from-white/[0.05] to-white/[0.01] border-white/10 hover:border-white/20 shadow-black/40" 
                                    : "bg-white border-slate-200 hover:border-slate-300 shadow-slate-200/50"
                                )}>
                                  {/* Glass highlight */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                  
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12",
                                      isDark ? "bg-white/5" : "bg-slate-100"
                                    )}>
                                      {stat.icon}
                                    </div>
                                    <span className={cn(
                                      "text-[10px] font-black uppercase tracking-[0.2em]",
                                      isDark ? "text-white/40" : "text-slate-500"
                                    )}>
                                      {stat.label}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-baseline justify-between gap-2">
                                    <p className={cn(
                                      "text-2xl sm:text-3xl font-black tabular-nums tracking-tight",
                                      isDark ? "text-white" : "text-slate-900"
                                    )}>
                                      {stat.value}
                                    </p>
                                    {stat.trend && (
                                      <div className={cn(
                                        "flex items-center gap-1 text-[11px] font-black tracking-widest uppercase",
                                        stat.trend.isPositive ? "text-emerald-400" : "text-orange-400"
                                      )}>
                                        {stat.trend.isPositive ? '↑' : '↓'}{stat.trend.value}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}

                      </div>

				                <div id="requests-section" className="space-y-8">
                {activeTab === 'pipeline' && (
                          <>
                        {/* Needs Action */}
                        <SectionCard
                          theme={cardTheme}
                          title="Needs Action"
                          subtitle="Countered offers, draft approvals, and pending decisions"
                          icon={<AlertTriangle className={cn("w-4 h-4", isDark ? "text-orange-400" : "text-orange-600")} />}
                          variant="tertiary"
                          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                        >
                          <div className="space-y-3">
                            {approvalQueue.length === 0 ? (
                              <div className={cn(
                                "rounded-2xl border p-4 text-center",
                                isDark ? "bg-white/[0.03] border-white/10" : "bg-slate-50 border-slate-200"
                              )}>
                                <p className={cn("text-[12px] font-bold", isDark ? "text-white/70" : "text-slate-700")}>
                                  No approvals needed right now.
                                </p>
                                <p className={cn("mt-1 text-[11px] font-semibold", isDark ? "text-white/40" : "text-slate-600")}>
                                  New counter-offers and drafts will appear here.
                                </p>
                              </div>
	                            ) : (
                              approvalQueue.map((item) => {
                                const urgencyLabel =
                                  item.kind === 'countered'
                                    ? 'Respond within 24h'
                                    : item.kind === 'draft'
                                      ? 'Review today'
                                      : item.kind === 'approval'
                                        ? 'Approval pending'
                                        : null;
                                const hoursElapsed = Math.max(0, Math.floor((Date.now() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60)));
                                const hoursRemaining = Math.max(0, 24 - hoursElapsed);

                                return (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: 0.1 * (approvalQueue.indexOf(item) % 10) }}
                                    className={cn(
                                      "group rounded-2xl border p-4 flex items-start justify-between gap-3 transition-all duration-300",
                                      urgencyLabel
                                        ? (isDark ? "bg-amber-500/10 border-amber-400/40 border-l-4" : "bg-amber-50/60 border-amber-200/70 border-l-4")
                                        : (isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"),
                                      "hover:shadow-lg hover:border-white/20"
                                    )}
                                  >
	                                  <div className="flex items-start gap-3 min-w-0">
	                                    <Avatar className={cn("h-10 w-10 border", isDark ? "border-white/10" : "border-slate-200")}>
	                                      <AvatarImage src={item.creator.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.creator.name)}&background=0D8ABC&color=fff`} />
	                                      <AvatarFallback className={cn(isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-700")}>
	                                        {item.creator.name.charAt(0)}
	                                      </AvatarFallback>
	                                    </Avatar>
	                                    <div className="min-w-0">
	                                      <p className={cn("text-[13px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>
	                                        {item.creator.name}
	                                      </p>
                                      <p className={cn("text-[11px] font-semibold truncate", isDark ? "text-white/50" : "text-slate-600")}>
                                        {item.packageName}
                                      </p>
                                      <p className={cn("mt-1 text-[11px] font-semibold truncate", isDark ? "text-white/50" : "text-slate-600")}>
                                        {(item.stats?.followers ? item.stats.followers.toLocaleString() : '—')} followers • {item.stats?.avgViews || '—'} avg views • {item.stats?.responseTimeHours || '—'}h response
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        {(item.tags || []).map((tag) => (
                                          <span
                                            key={tag}
                                            className={cn(
                                              "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em]",
                                              isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-600"
                                            )}
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
	                                      <p className={cn("text-[12px] font-semibold truncate", isDark ? "text-white/60" : "text-slate-700")}>
	                                        {item.message}
	                                      </p>
	                                      {item.kind === 'countered' && (item.amountFrom || item.amountTo) && (
	                                        <p className={cn("mt-1 text-[12px] font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>
	                                          {item.amountFrom ? formatCompactINR(item.amountFrom) : '—'}{' '}
	                                          <span className={cn("mx-1", isDark ? "text-white/40" : "text-slate-500")}>→</span>{' '}
	                                          {item.amountTo ? formatCompactINR(item.amountTo) : '—'}
	                                        </p>
	                                      )}
                                      <p className={cn("mt-1 text-[11px] font-semibold", isDark ? "text-white/50" : "text-slate-600")}>
                                        Campaign: {item.campaignName} • Budget remaining: {item.budgetRemaining ? formatCompactINR(item.budgetRemaining) : '—'}
                                      </p>
	                                      <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.14em]", isDark ? "text-white/30" : "text-slate-500")}>
	                                        {new Date(item.timestamp).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
	                                      </p>
                                      {urgencyLabel && (
                                        <div className="mt-2 flex items-center gap-2">
                                          <span className={cn(
                                            "inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                            isDark ? "bg-amber-500/20 text-amber-200" : "bg-amber-100 text-amber-700"
                                          )}>
                                            {urgencyLabel}
                                          </span>
                                          <span className={cn(
                                            "inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                            isDark ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-600"
                                          )}>
                                            ⏳ {hoursRemaining}h remaining
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
	                                  {item.kind === 'countered' ? (
	                                    <div className="shrink-0 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
	                                      <Button
	                                        type="button"
	                                        onClick={() => {
	                                          triggerHaptic(HapticPatterns.light);
	                                          navigate(item.cta.href);
	                                        }}
	                                        className={cn(
	                                          "h-11 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all hover:shadow-md",
	                                          isDark ? "bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/30" : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/30"
	                                        )}
	                                      >
	                                        Accept
	                                      </Button>
	                                      <Button
	                                        type="button"
	                                        onClick={() => {
	                                          triggerHaptic(HapticPatterns.light);
	                                          navigate(item.cta.href);
	                                        }}
	                                        className={cn(
	                                          "h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all hover:shadow-sm",
	                                          isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
	                                        )}
	                                      >
	                                        Counter
	                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic(HapticPatterns.light);
                                          navigate(`/creator/${item.creator.username}`);
                                        }}
                                        className={cn(
                                          "h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all hover:shadow-sm",
                                          isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                                        )}
                                      >
                                        View Profile
                                      </Button>
	                                      <Button
	                                        type="button"
	                                        onClick={async () => {
	                                          triggerHaptic(HapticPatterns.light);
	                                          setDismissedApprovalQueueIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
	                                          // Best effort: in some environments brands may not have UPDATE policy yet.
	                                          try {
	                                            if (!item.requestId || String(item.requestId).startsWith('demo-')) return;
	                                            const { error } = await supabase
	                                              .from('collab_requests')
 	                                              .update({ status: 'declined' } as any)
	                                              .eq('id', item.requestId);
	                                            if (error) console.warn('[BrandDashboard] Decline failed:', error.message);
	                                          } catch (e) {
	                                            console.warn('[BrandDashboard] Decline failed:', e);
	                                          }
	                                        }}
	                                        className={cn(
	                                          "h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all hover:shadow-sm",
	                                          isDark ? "bg-white/0 hover:bg-red-500/10 text-white/70 hover:text-red-300 border-white/10" : "bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200"
	                                        )}
	                                      >
	                                        Decline
	                                      </Button>
	                                    </div>
	                                  ) : (
	                                    <div className="shrink-0 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          triggerHaptic(HapticPatterns.light);
                                          navigate(item.cta.href);
                                        }}
                                        className={cn(
                                          "h-11 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm transition-all hover:shadow-md",
                                          isDark ? "bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/30" : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/30"
                                        )}
                                      >
                                        {item.cta.label}
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => navigate(`/creator/${item.creator.username}`)}
                                        className={cn(
                                          "h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all",
                                          isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                                        )}
                                      >
                                        View Profile
                                      </Button>
                                    </div>
	                                  )}
                                  </motion.div>
                                );
                              })
	                            )}
	                          </div>
                        </SectionCard>

                        {/* Upcoming Deliverables */}
                        <SectionCard
                          theme={cardTheme}
                          title="Upcoming Deliverables"
                          subtitle="Next creator outputs due"
                          icon={<Clock className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")} />}
                          variant="tertiary"
                          className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                        >
                          <div className="space-y-3">
                            {upcomingDeliverables.map((d, idx) => (
                              <motion.div
                                key={d.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className={cn(
                                  "group rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all duration-300",
                                  isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200",
                                  "hover:bg-white/[0.06] hover:border-white/20"
                                )}
                              >
                                <div>
                                  <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-slate-500")}>{d.date}</p>
                                  <p className={cn("text-[13px] font-black group-hover:text-primary transition-colors", isDark ? "text-white" : "text-slate-900")}>
                                    {d.creator} • {d.label}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  className={cn(
                                    "h-9 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all",
                                    isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200",
                                    "group-hover:scale-105"
                                  )}
                                >
                                  View
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </SectionCard>

                          {/* Offer Pipeline */}
                          <div className={cn(
                            "rounded-3xl border p-4 sm:p-5",
                            isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-slate-200"
                          )}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-slate-500")}>
                                  Offer Pipeline
                                </p>
                                <p className={cn("mt-1 text-[14px] font-black", isDark ? "text-white" : "text-slate-900")}>
                                  Pending → Countered → Accepted → Completed
                                </p>
                              </div>
                              <p className={cn("text-[11px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-500")}>
                                INR
                              </p>
                            </div>
                            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {['Campaign', 'Creator', 'Budget', 'Status'].map((label) => (
                                <Button
                                  key={label}
                                  variant="outline"
                                  className={cn(
                                    "h-10 rounded-2xl font-black uppercase tracking-[0.16em] text-[10px] border flex items-center justify-between px-4",
                                    isDark ? "bg-white/0 border-white/10 text-white/80 hover:bg-white/10" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  )}
                                >
                                  {label}
                                  <span className={cn("text-[12px]", isDark ? "text-white/40" : "text-slate-400")}>▾</span>
                                </Button>
                              ))}
                            </div>

                            <div className="mt-4 grid grid-cols-4 gap-3 text-[10px] font-black uppercase tracking-[0.18em]">
                              <div className={cn("col-span-2", isDark ? "text-white/40" : "text-slate-500")}>Offer Stage</div>
                              <div className={cn(isDark ? "text-white/40" : "text-slate-500")}>Active Campaign</div>
                              <div className={cn(isDark ? "text-white/40" : "text-slate-500")}>Finished</div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                              {[
                                { id: 'pending', label: 'Pending', value: dealPipeline.pending, tone: 'bg-orange-500', meta: pipelineStages.pending },
                                { id: 'countered', label: 'Countered', value: dealPipeline.countered || 0, tone: 'bg-amber-400', meta: pipelineStages.countered },
                                { id: 'accepted', label: 'Accepted', value: dealPipeline.accepted, tone: 'bg-emerald-500', meta: pipelineStages.accepted },
                                { id: 'completed', label: 'Completed', value: dealPipeline.completed, tone: 'bg-blue-600', meta: pipelineStages.completed },
                              ].map((p, idx) => (
                                <motion.div
                                  key={p.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 * idx }}
                                  className={cn(
                                    "group rounded-2xl border p-3 transition-all duration-300",
                                    isDark ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]" : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100",
                                    "hover:shadow-md hover:-translate-y-1"
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>
                                      {p.label}
                                    </p>
                                    <span className={cn("h-2 w-2 rounded-full", p.tone)} />
                                  </div>
                                  <p className={cn("mt-2 text-[15px] font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                                    {formatCompactINR(p.value)}
                                  </p>
                                  <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.14em]", isDark ? "text-white/30" : "text-slate-500")}>
                                    {p.meta.creators.length} creators • {p.meta.campaigns} campaigns
                                  </p>
                                  <div className="mt-2 flex items-center -space-x-2">
                                    {p.meta.creators.map((c: any) => (
                                      <Avatar key={c.id} className={cn("h-6 w-6 border", isDark ? "border-white/10" : "border-slate-200")}>
                                        <AvatarImage src={c.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0D8ABC&color=fff`} />
                                        <AvatarFallback className={cn(isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-700")}>
                                          {c.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            <div className={cn("mt-4 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-200/60")}>
                              {(() => {
                                const total = Math.max(1, dealPipeline.pending + (dealPipeline.countered || 0) + dealPipeline.accepted + dealPipeline.completed);
                                const p1 = Math.round((dealPipeline.pending / total) * 100);
                                const p2 = Math.round(((dealPipeline.countered || 0) / total) * 100);
                                const p3 = Math.round((dealPipeline.accepted / total) * 100);
                                const p4 = Math.max(0, 100 - p1 - p2 - p3);
                                return (
                                  <div className="h-full w-full flex">
                                    <div className="h-full bg-orange-500" style={{ width: `${p1}%` }} />
                                    <div className="h-full bg-amber-400" style={{ width: `${p2}%` }} />
                                    <div className="h-full bg-emerald-500" style={{ width: `${p3}%` }} />
                                    <div className="h-full bg-blue-600" style={{ width: `${p4}%` }} />
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          </>
                        )}

                        {activeTab === 'creators' && (
                          <>
                          {/* Campaigns */}
                          <SectionCard
                            theme={cardTheme}
                            title="Campaigns"
                            subtitle="Drafts and active campaigns"
                            icon={<Activity className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")} />}
                            variant="tertiary"
                            className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                          >
                            <div className="space-y-3">
                              {[
                                ...draftCampaigns.map((d) => ({
                                  id: d.id,
                                  name: d.name,
                                  creators: d.creators,
                                  budget: d.budget,
                                  updatedAt: d.updatedAt,
                                  cta: 'Resume',
                                  deliverables: null,
                                })),
                                ...campaigns.map((c) => ({
                                  id: c.id,
                                  name: c.name,
                                  creators: c.creators.length,
                                  budget: c.budget,
                                  updatedAt: 'Updated today',
                                  cta: 'View',
                                  deliverables: `${c.deliverablesCompleted}/${c.deliverablesTotal} deliverables`,
                                })),
                              ]
                                .slice(0, 3)
                                .map((c, idx) => (
                                  <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className={cn(
                                      "group rounded-2xl border p-3 flex items-start justify-between gap-3 transition-all duration-300",
                                      isDark ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                                      "hover:shadow-lg hover:-translate-y-1"
                                    )}
                                  >
                                    <div className="min-w-0">
                                      <p className={cn("text-[12px] font-black truncate group-hover:text-primary transition-colors", isDark ? "text-white" : "text-slate-900")}>{c.name}</p>
                                      <p className={cn("text-[11px] font-semibold truncate", isDark ? "text-white/50" : "text-slate-600")}>
                                        {c.creators} creators • {formatCompactINR(c.budget)} • {c.updatedAt}
                                      </p>
                                      {c.deliverables && (
                                        <p className={cn("mt-1 text-[10px] font-black uppercase tracking-[0.14em]", isDark ? "text-white/30" : "text-slate-500")}>
                                          {c.deliverables}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      type="button"
                                      className={cn(
                                        "h-9 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all",
                                        isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900",
                                        "group-hover:scale-105"
                                      )}
                                    >
                                      {c.cta}
                                    </Button>
                                  </motion.div>
                                ))}
                            </div>
                            <div className="mt-4">
                              <Button
                                type="button"
                                className={cn(
                                  "h-10 w-full rounded-xl font-black uppercase tracking-widest text-[10px] border",
                                  isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                                )}
                              >
                                View All Campaigns →
                              </Button>
                            </div>
                          </SectionCard>

                          {/* Activity Feed */}
                          <SectionCard
                            theme={cardTheme}
                            title="Activity Feed"
                            subtitle="Latest updates across offers and campaigns"
                            icon={<Activity className="w-4 h-4 text-blue-500" />}
                            variant="tertiary"
                            className={cn("p-6 sm:p-8", isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                          >
                            <div className={cn(
                              "space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px]",
                              isDark ? "before:bg-white/5" : "before:bg-slate-200"
                            )}>
                              {(((isDemoBrand && (requests?.length || 0) === 0 && (deals?.length || 0) === 0) ? demoRequests : (requests || [])) as any[])
                                .slice(0, 3)
                                .map((r, idx) => {
                                  const meta = getStatusMeta(r.status);
                                  const creatorLabel =
                                    (r.profiles as any)?.business_name ||
                                    (r.profiles as any)?.username ||
                                    'Creator';
                                  const when = new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                  const icon =
                                    meta.tone === 'warning' ? <AlertTriangle className="w-4 h-4 text-orange-500" /> :
                                      meta.tone === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                        meta.tone === 'info' ? <Clock className="w-4 h-4 text-blue-500" /> :
                                          <FileText className="w-4 h-4 text-slate-400" />;
                                  const msg =
                                    meta.tone === 'warning' ? `${creatorLabel} countered your offer` :
                                      meta.tone === 'success' ? `${creatorLabel} accepted your collaboration` :
                                        meta.tone === 'info' ? `${creatorLabel} offer pending` :
                                          `Update from ${creatorLabel}`;

                                  return (
                                    <motion.button
                                      key={idx}
                                      type="button"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 * idx }}
                                      onClick={() => navigate(getRequestHref(r))}
                                      className={cn(
                                        "w-full text-left flex gap-4 relative z-10 rounded-2xl p-3 transition-all border group",
                                        isDark ? "border-white/5 hover:bg-white/[0.04] hover:border-white/20" : "border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                                        "hover:shadow-md hover:-translate-y-0.5"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-[28px] h-[28px] rounded-full border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                        isDark ? "border-white/10 bg-black" : "border-slate-200 bg-white"
                                      )}>
                                        {icon}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className={cn("text-[13px] font-black leading-tight truncate group-hover:text-primary transition-colors", isDark ? "text-white" : "text-slate-900")}>
                                          {msg}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between gap-3">
                                          <p className={cn("text-[10px] font-black uppercase tracking-[0.1em]", isDark ? "text-white/30" : "text-slate-400")}>
                                            {when}
                                          </p>
                                          <span className={cn("text-[10px] font-black uppercase tracking-[0.14em] text-primary transition-transform group-hover:translate-x-1")}>
                                            Open →
                                          </span>
                                        </div>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                            </div>
                            <div className={cn("mt-6 pt-5 border-t", isDark ? "border-white/10" : "border-slate-200")}>
                              <div className="flex items-center justify-between gap-3">
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-slate-500")}>
                                  Creator Shortlist
                                </p>
                                <Button
                                  type="button"
                                  className={cn(
                                    "h-8 px-3 rounded-xl font-black uppercase tracking-widest text-[9px] border",
                                    isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"
                                  )}
                                >
                                  View All
                                </Button>
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                {creatorShortlist.map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => navigate(`/creator/${c.username}`)}
                                    className={cn(
                                      "flex items-center gap-2 rounded-2xl border px-3 py-2 transition-all",
                                      isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                                    )}
                                  >
                                    <Avatar className={cn("h-7 w-7 border", isDark ? "border-white/10" : "border-slate-200")}>
                                      <AvatarImage src={c.avatarUrl} />
                                      <AvatarFallback className={cn(isDark ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-700")}>
                                        {c.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className={cn("text-[11px] font-semibold", isDark ? "text-white" : "text-slate-800")}>{c.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </SectionCard>
                            <SectionCard
                              theme={cardTheme}
                              title="Active Deals"
                              subtitle="Campaigns currently running"
                              icon={<Activity className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")} />}
                              variant="tertiary"
                              className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                            >
                              <div className="space-y-3">
                                {campaigns.slice(0, 3).map((c) => {
                                  const pct = Math.round((c.deliverablesCompleted / Math.max(1, c.deliverablesTotal)) * 100);
                                  return (
                                    <div
                                      key={c.id}
                                      className={cn(
                                        "rounded-2xl border p-3 sm:p-4",
                                        isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className={cn("text-[13px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>
                                            {c.name}
                                          </p>
                                          <p className={cn("mt-1 text-[11px] font-semibold", isDark ? "text-white/40" : "text-slate-600")}>
                                            {c.creators.length} creators • {formatCompactINR(c.budget)} budget
                                          </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-500")}>Progress</p>
                                          <p className={cn("mt-1 text-[12px] font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                                            {c.deliverablesCompleted}/{c.deliverablesTotal}
                                          </p>
                                        </div>
                                      </div>
                                      <div className={cn("mt-3 h-2 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-slate-200/60")}>
                                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                                      </div>
                                      <div className="mt-3 flex items-center justify-end">
                                        <Button
                                          type="button"
                                          onClick={() => navigate('/brand-console-demo')}
                                          className={cn(
                                            "h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm",
                                            isDark ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                          )}
                                        >
                                          View Deliverables
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </SectionCard>

                            {[
                              { id: 'awaiting', title: 'Awaiting Submission', status: 'Awaiting Content' },
                              { id: 'approval', title: 'Content Approved', status: 'Awaiting Approval' },
                              { id: 'completed', title: 'Completed Deals', status: 'Completed' },
                            ].map((section) => (
                              <SectionCard
                                key={section.id}
                                theme={cardTheme}
                                title={section.title}
                                subtitle="Track current status and next actions"
                                icon={<CheckCircle2 className={cn("w-4 h-4", isDark ? "text-emerald-400" : "text-emerald-600")} />}
                                variant="tertiary"
                                className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                              >
                                <div className="space-y-3">
                                  {collaborationStages.filter((s) => s.status === section.status).map((deal) => (
                                    <div
                                      key={deal.id}
                                      className={cn(
                                        "rounded-2xl border p-3 flex items-center justify-between gap-3",
                                        isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"
                                      )}
                                    >
                                      <div className="min-w-0">
                                        <p className={cn("text-[12px] font-black truncate", isDark ? "text-white" : "text-slate-900")}>
                                          {deal.creator} • {deal.campaign}
                                        </p>
                                        <p className={cn("text-[11px] font-semibold truncate", isDark ? "text-white/40" : "text-slate-600")}>
                                          {deal.deliverables} • Deadline {deal.deadline}
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        className={cn(
                                          "h-9 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border",
                                          isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                                        )}
                                      >
                                        View
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </SectionCard>
                            ))}
                          </>
                        )}

                        {activeTab === 'analytics' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                          >
                            <SectionCard
                              theme={cardTheme}
                              title="Total Spend"
                              subtitle="This month and lifetime totals"
                              icon={<CreditCard className={cn("w-4 h-4", isDark ? "text-emerald-400" : "text-emerald-600")} />}
                              variant="tertiary"
                              className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={cn("rounded-2xl border p-3", isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200")}>
                                  <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>This month</p>
                                  <p className={cn("mt-1 text-[18px] font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                                    {formatCompactINR(campaignRoi.spend)}
                                  </p>
                                </div>
                                <div className={cn("rounded-2xl border p-3", isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-slate-200")}>
                                  <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>Lifetime</p>
                                  <p className={cn("mt-1 text-[18px] font-black tabular-nums", isDark ? "text-white" : "text-slate-900")}>
                                    {formatCompactINR(displayStats.totalInvestment)}
                                  </p>
                                </div>
                              </div>
                            </SectionCard>

                            <SectionCard
                              theme={cardTheme}
                              title="Spend by Campaign"
                              subtitle="Where your budget is going"
                              icon={<Activity className={cn("w-4 h-4", isDark ? "text-blue-400" : "text-blue-600")} />}
                              variant="tertiary"
                              className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                            >
                              <div className="space-y-3">
                                {spendByCampaign.map((row) => (
                                  <div key={row.id} className={cn(
                                    "group rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all duration-300",
                                    isDark ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  )}>
                                    <p className={cn("text-[12px] font-black group-hover:text-primary transition-colors", isDark ? "text-white" : "text-slate-900")}>{row.name}</p>
                                    <p className={cn("text-[12px] font-black tabular-nums transition-transform group-hover:scale-110", isDark ? "text-white" : "text-slate-900")}>{formatCompactINR(row.spend)}</p>
                                  </div>
                                ))}
                              </div>
                            </SectionCard>

                            <SectionCard
                              theme={cardTheme}
                              title="Creator Performance"
                              subtitle="Spend, views, and CPM"
                              icon={<TrendingUp className={cn("w-4 h-4", isDark ? "text-emerald-400" : "text-emerald-600")} />}
                              variant="tertiary"
                              className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                            >
                              <div className="space-y-3">
                                {creatorSpendPerf.map((c) => (
                                  <div key={c.id} className={cn(
                                    "group rounded-2xl border p-3 flex items-center justify-between gap-3 transition-all duration-300",
                                    isDark ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                  )}>
                                    <div className="min-w-0">
                                      <p className={cn("text-[12px] font-black truncate group-hover:text-primary transition-colors", isDark ? "text-white" : "text-slate-900")}>{c.name}</p>
                                      <p className={cn("text-[11px] font-semibold truncate", isDark ? "text-white/40" : "text-slate-600")}>
                                        Spend {formatCompactINR(c.spend)} • Views {c.views} • CPM ₹{c.cpm}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      className={cn(
                                        "h-9 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all",
                                        isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900",
                                        "group-hover:scale-105"
                                      )}
                                    >
                                      View
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </SectionCard>

                            <SectionCard
                              theme={cardTheme}
                              title="Payment Status"
                              subtitle="Track pending and completed payments"
                              icon={<Shield className={cn("w-4 h-4", isDark ? "text-orange-400" : "text-orange-600")} />}
                              variant="tertiary"
                              className={cn(isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white")}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {paymentStatus.map((p) => (
                                  <div key={p.id} className={cn("rounded-2xl border p-3", isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200")}>
                                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>{p.label}</p>
                                    <p className={cn("mt-1 text-[18px] font-black", isDark ? "text-white" : "text-slate-900")}>{p.value}</p>
                                  </div>
                                ))}
                              </div>
                            </SectionCard>
                          </motion.div>
                        )}

                        </div>
                        </motion.div>
                </main>

              {/* Bottom navigation (matches creator dashboard style) */}
              <BrandBottomNav activeTab={activeTab as any} onTabChange={handleTabClick} isDark={isDark} />

              {/* iOS Install Guide for PWAs (Push Support) */}
              {(isIOSNeedsInstall && !isPushPromptDismissed) && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className={cn(
                    "w-full max-w-sm rounded-2xl border p-5 shadow-2xl",
                    isDark ? "border-white/20 bg-[#1b1037]/95" : "border-slate-200 bg-white"
                  )}>
                    <h3 className={cn("text-lg font-bold", isDark ? "text-white" : "text-slate-900")}>Add to Home Screen</h3>
                    <p className={cn("text-sm mt-1", isDark ? "text-white/75" : "text-slate-500")}>Get instant collaboration alerts & counter updates in app mode.</p>
                    <div className={cn("mt-4 space-y-3 text-sm", isDark ? "text-white/85" : "text-slate-600")}>
                      <p><span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>Step 1</span><br />Tap the Share icon ↓</p>
                      <p><span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>Step 2</span><br />Tap “Add to Home Screen”</p>
                      <p><span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>Step 3</span><br />Open the Console from your Home Screen</p>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic();
                          dismissPushPrompt();
                        }}
                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 transition-colors uppercase tracking-widest"
                      >
                        Got it
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic();
                          dismissPushPrompt();
                        }}
                        className={cn(
                          "rounded-xl border text-sm font-bold px-4 py-2 transition-colors uppercase tracking-widest",
                          isDark ? "border-white/25 text-white/85 hover:bg-white/10" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        Later
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}

	        </div>
	    );
	};

export default BrandDashboard;
