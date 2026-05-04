import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, MutableRefObject, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ArrowLeft, BarChart3, Bell, Briefcase, Calendar, Camera, Check, CheckCircle2, ChevronRight, Clock, Copy, CreditCard, ExternalLink, Eye, FileText, Globe, Handshake, History, Info, Landmark, LayoutDashboard, Loader2, Lock, Mail, MapPin, Menu, MessageSquare, Moon, MoreHorizontal, MoreVertical, PenTool, Play, PlayCircle, Plus, RefreshCw, RotateCcw, Search, Send, Settings, Shield, ShieldCheck, Sparkles, Sun, Truck, User, Video, Wallet, Zap } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { getApiBaseUrl } from '@/lib/utils/api';
import { supabase } from '@/integrations/supabase/client';
import * as ds from '@/lib/design-system';
const { buttons: dsButtons } = ds;
import { dealPrimaryCtaButtonClass, getDealPrimaryCta, getCanonicalDealStatus } from '@/lib/deals/primaryCta';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { isBarterLikeCollab, isPaidLikeCollab } from '@/lib/deals/collabType';
import { BrandSettingsPanel } from '@/pages/BrandSettings';
import { toast } from 'sonner';
import { DiscoveryStack } from '@/components/brand-dashboard/DiscoveryStack';
import { DisputeEscalationModal } from '@/components/deals/DisputeEscalationModal';
import { BrandShippingAddressModal } from '@/components/deals/BrandShippingAddressModal';
import { ConfirmPaymentPendingModal } from '@/components/deals/ConfirmPaymentPendingModal';
import { BrandDashboardSkeleton } from '@/components/brand-dashboard/BrandDashboardSkeleton';
import PushNotificationPrompt from '@/components/dashboard/PushNotificationPrompt';

import { optimizeImage, safeAvatarSrc, withCacheBuster } from '@/lib/utils/image';

const renderClickableLinks = (text: string, isDark: boolean) => {
    if (!text) return text;
    // URL detection regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a 
                    key={i} 
                    href={part} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-500 transition-all inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
            );
        }
        return part;
    });
};

type BrandTab = 'dashboard' | 'collabs' | 'creators' | 'profile' | 'payments';
type BrandCollabTab = 'action_required' | 'active' | 'completed';

import type { Profile, BrandDeal } from '@/types';

type BrandDashboardStats = {
  totalSent: number;
  needsAction: number;
  activeDeals: number;
  totalInvestment: number;
};

type BrandMobileDashboardProps = {
  profile?: Profile;
  requests?: BrandDeal[];
  deals?: BrandDeal[];
  stats?: BrandDashboardStats;
  initialTab?: BrandTab;
  isLoading?: boolean;
  isDemoBrand?: boolean;
  onRefresh?: () => Promise<void>;
  onLogout?: () => void | Promise<void>;
};

const formatCompactINR = (n: number | string | null | undefined) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  // If the amount is small or has non-zero decimals, show precise values
  const hasDecimals = safe % 1 !== 0;
  if (safe < 100 || hasDecimals) {
    return `₹${safe.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${safe.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatCompactCount = (n: number | string | null | undefined) => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString('en-IN');
};

const formatFollowers = (n: number | string | null | undefined) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num >= 1_00_00_000) return `${(num / 1_00_00_000).toFixed(1)}Cr`.replace('.0', '') + ' followers';
  if (num >= 1_00_000) return `${(num / 1_00_000).toFixed(1)}L`.replace('.0', '') + ' followers';
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`.replace('.0', '') + ' followers';
  return `${num} followers`;
};

const timeSince = (iso: string | Date | null | undefined) => {
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

const hoursSince = (iso: string | Date | null | undefined) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (!Number.isFinite(hrs) || hrs < 0) return null;
  return hrs;
};

const safeImageSrc = (url: string | null | undefined) => {
  return optimizeImage(url, { width: 300, height: 300, fit: 'cover' });
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

const uniqById = <T extends { id?: string | number }>(items: T[]) => {
  // Preserve first occurrence, avoid duplicated cards when backend returns duplicates.
  const withId = items.filter((x) => String(x?.id || '').trim());
  const withoutId = items.filter((x) => !String(x?.id || '').trim());
  return [...uniqBy(withId, (x) => String(x.id)), ...withoutId];
};

const dealFingerprint = (row: BrandDeal | null | undefined) => {
  // Prefer contract identifiers; fall back to a conservative composite.
  const signedKey = row?.signed_contract_path || row?.signed_contract_url || row?.signed_pdf_url || null;
  if (signedKey) return `signed:${String(signedKey)}`;
  const contractKey = row?.safe_contract_url || row?.contract_file_url || null;
  if (contractKey) return `contract:${String(contractKey)}`;
  const creator = String(row?.creator_id || row?.profiles?.id || '');
  const amount = String(row?.deal_amount || row?.exact_budget || row?.barter_value || row?.product_value || '');
  const due = String(row?.due_date || row?.deadline || '');
  const deliverables = String(formatDeliverables(row) || row?.deliverables || row?.collab_type || '').toLowerCase();
  // Important: do NOT include created_at here. Some environments duplicate the same deal with different ids/timestamps.
  // This fallback is intentionally aggressive and only used when there is no contract identifier.
  return `fallback:${creator}:${amount}:${due}:${deliverables}`;
};

const uniqDeals = (rows: BrandDeal[]) => {
  // If the backend contains duplicated deals with different ids but same contract, collapse them.
  return uniqById(uniqBy(rows, (r) => dealFingerprint(r)));
};

const startOfLocalMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const sameLocalMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const normalizeStatus = (status: string | null | undefined) => String(status || '').trim().toLowerCase();

const firstNameish = (profile: Profile | null | undefined, fallbackName?: string) => {
  const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
  const label = nameParts || profile?.business_name || profile?.username || fallbackName || 'Creator';
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

function formatDeliverables(row: BrandDeal | null | undefined) {
  // Prioritize package name if present in campaign_description
  if (row?.campaign_description) {
    const packageMatch = row.campaign_description.match(/\|\|Package: ([^|]+)/);
    if (packageMatch && packageMatch[1]) {
      return packageMatch[1].trim();
    }
  }

  const d = row?.deliverables;
  if (!d) return '';
  const uniq = (parts: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of parts) {
      const clean = String(p || '').trim();
      if (!clean) continue;
      // Smarter normalization for duplicate detection (handles unboxing/review variants)
      const key = clean.toLowerCase()
        .replace(/unboxing \/ review/g, 'review / unboxing')
        .replace(/unboxing or review/g, 'review / unboxing')
        .replace(/product unboxing/g, 'product review')
        .replace(/\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out;
  };
  if (typeof d === 'string') {
    const parts = uniq(
      d
        .split(/[,•\n]+/g)
        .map((x) => x.trim())
        .filter(Boolean)
    );
    // If it doesn't look like a list, keep the raw string.
    if (parts.length <= 1) return d.trim();
    return parts.slice(0, 3).join(' • ');
  }
  if (Array.isArray(d)) {
    const parts = uniq(
      d
        .map((x: any) => {
          if (!x) return null;
          if (typeof x === 'string') return x.trim();
          const label = x?.type || x?.name || x?.deliverable;
          const qty = x?.qty || x?.count || x?.quantity;
          if (label && qty) return `${qty} ${label}`;
          if (label) return String(label);
          return null;
        })
        .filter(Boolean)
    );
    return parts.slice(0, 3).join(' • ');
  }
  try {
    const asJson = JSON.stringify(d);
    return asJson.length > 5 ? asJson : '';
  } catch {
    return '';
  }
}

const formatBudget = (row: BrandDeal | null | undefined) => {
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

const effectiveDealStatus = (row: BrandDeal | null | undefined) => {
  return getCanonicalDealStatus(row);
};

const collectSignatureHints = (row: BrandDeal | null | undefined) => {
  const sources = [
    row,
    row?.raw,
    row?.contract,
    row?.contract_data,
    row?.contract_metadata,
    row?.esign,
    row?.signature,
    row?.signatures,
  ].filter((x) => x && typeof x === 'object');

  const truthyKeys = (pattern: RegExp) => {
    const keys: string[] = [];
    for (const src of sources) {
      for (const key of Object.keys(src)) {
        if (!pattern.test(key)) continue;
        const v = (src as any)[key];
        const truthy =
          v === true ||
          (typeof v === 'number' && Number.isFinite(v) && v > 0) ||
          (typeof v === 'string' && v.trim().length > 0) ||
          (v instanceof Date && !Number.isNaN(v.getTime()));
        if (truthy) keys.push(key);
      }
    }
    return Array.from(new Set(keys)).slice(0, 6);
  };

  return {
    brand: truthyKeys(/(brand.*signed|signed.*brand|brand_signature|brand_esign|brand_signed_at)/i),
    creator: truthyKeys(/(creator.*signed|signed.*creator|creator_signature|creator_esign|creator_signed_at)/i),
  };
};

const dealStageLabel = (row: BrandDeal | null | undefined) => {
  const s = effectiveDealStatus(row);
  const isBarterDeal = isBarterLikeCollab(row) && !isPaidLikeCollab(row);
  if (!s) return 'In Progress';
  if (s === 'DISPUTED') return 'Issue Reported';
  if (s === 'DISPUTE_ARBITRATION') return 'Under Arbitration';
  if (s === 'DISPUTE_PARTIAL_REFUND') return 'Refund Pending';
  if (s === 'PAYMENT_PENDING') return isBarterDeal ? 'Shipping Required' : 'Payment Required';
  if (s === 'AWAITING_BRAND_ADDRESS') return 'Address Needed';
  if (s === 'CONTRACT_READY' || s === 'AWAITING_BRAND_SIGNATURE') return 'Ready to Sign';
  if (s === 'SENT' || s === 'AWAITING_CREATOR_SIGNATURE') return 'Awaiting Creator';
  if (s === 'FULLY_EXECUTED') return (isBarterDeal || row?.shipping_required === true) ? 'Awaiting Shipment' : 'Collab Active';
  if (s === 'CONTENT_MAKING') return 'In Production';
  if (s === 'REVISION_REQUESTED') return 'Revision Needed';
  if (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE') return 'Review Content';
  if (s === 'CONTENT_APPROVED' || s === 'PAYMENT_RELEASED') return 'Approved';
  if (s === 'COMPLETED') return 'Completed';
  return 'In Progress';
};

const deadlineLabel = (row: BrandDeal | null | undefined) => {
  const raw = row?.due_date || row?.deadline;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Due today', tone: 'danger' as const };
  const dayText = diffDays === 1 ? 'day' : 'days';
  if (diffDays <= 2) return { text: `Due in ${diffDays} ${dayText}`, tone: 'danger' as const };
  if (diffDays <= 7) return { text: `Due in ${diffDays} ${dayText}`, tone: 'warn' as const };
  return { text: `Due in ${diffDays} ${dayText}`, tone: 'neutral' as const };
};

const offerExpiryLabel = (row: BrandDeal | null | undefined) => {
  const raw = row?.offer_expires_at || row?.expires_at || null;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return { text: 'Offer expired', tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Expires today', tone: 'danger' as const };
  if (diffDays <= 2) return { text: `Expires in ${diffDays}d`, tone: 'danger' as const };
  if (diffDays <= 7) return { text: `Expires in ${diffDays}d`, tone: 'warn' as const };
  return { text: `Expires in ${diffDays}d`, tone: 'neutral' as const };
};

const brandDealCardUi = (row: BrandDeal | null | undefined) => {
  const s = effectiveDealStatus(row);
  const isBarterDeal = isBarterLikeCollab(row) && !isPaidLikeCollab(row);
  const human = dealStageLabel({ status: s });
  const stageBadge =
    s === 'DISPUTED' ? 'ISSUE'
      : (s === 'DISPUTE_ARBITRATION' || s === 'DISPUTE_PARTIAL_REFUND') ? 'DISPUTE'
      : (s === 'CONTENT_APPROVED' || s === 'PAYMENT_RELEASED' || s === 'COMPLETED') ? 'DONE'
      : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE') ? 'REVIEW'
        : s === 'CONTENT_MAKING' ? 'CREATE'
          : s === 'PAYMENT_PENDING' ? (isBarterDeal ? 'SHIP' : 'PAY')
          : s === 'AWAITING_BRAND_ADDRESS' ? 'ADDRESS'
          : s === 'FULLY_EXECUTED' ? 'SIGNED'
            : 'CONTRACT';

  const primaryCta = getDealPrimaryCta({ role: 'brand', deal: row });
  const needsAction = primaryCta.tone === 'action' && !primaryCta.disabled;
  const primaryActionLabel = primaryCta.label;

  const statusLine =
    s === 'DISPUTED'
      ? 'Dispute raised — your action is required'
      : s === 'DISPUTE_ARBITRATION'
      ? 'Under arbitration — Creator Armour team reviewing'
      : s === 'DISPUTE_PARTIAL_REFUND'
        ? 'Partial refund is currently processing'
      : s === 'PAYMENT_PENDING'
        ? ((isBarterDeal || row?.shipping_required === true) 
            ? (row?.brand_address ? 'Review the agreement to get started' : 'Add shipping details to start the collaboration') 
            : 'Fund the escrow to start collaboration')
      : s === 'AWAITING_BRAND_ADDRESS'
        ? (row?.brand_address ? 'Review the agreement to get started' : 'Shipping address required to proceed')
      : s === 'COMPLETED'
        ? 'Collaboration successfully completed'
        : (s === 'CONTENT_APPROVED' || s === 'PAYMENT_RELEASED')
          ? 'Content approved & payment released'
        : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE')
          ? 'Creator has submitted content for review'
          : s === 'REVISION_REQUESTED'
            ? 'Awaiting revised content from creator'
            : s === 'CONTENT_MAKING'
              ? (((isBarterDeal || row?.shipping_required === true) && (primaryActionLabel === 'Track Progress' || primaryActionLabel === 'Confirm Product Receipt'))
                  ? (row?.shipping_status === 'delivered' || row?.shipping_status === 'received' 
                      ? 'Creator has received the product' 
                      : 'Creator is waiting for product delivery confirmation')
                  : primaryActionLabel === 'Ship Product'
                    ? 'Please ship the product to the creator'
                    : 'Creator is now crafting your content')
              : (s === 'FULLY_EXECUTED' || s === 'CONTRACT_READY')
                ? ((isBarterDeal || row?.shipping_required === true) 
                    ? (row?.brand_address ? 'Creator is now crafting your content' : 'Contract signed — please ship the product') 
                    : 'Contract signed — awaiting content')
                : s === 'AWAITING_CREATOR_SIGNATURE' || s === 'SENT'
                  ? "Waiting for creator's signature"
                  : 'Review the agreement to get started';

  const step =
    s === 'COMPLETED' ? 5
      : (s === 'CONTENT_APPROVED' || s === 'PAYMENT_RELEASED') ? 5
        : (s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE' || s === 'DISPUTED' || s === 'DISPUTE_ARBITRATION' || s === 'DISPUTE_PARTIAL_REFUND') ? 4
          : (s === 'CONTENT_MAKING' || s === 'REVISION_REQUESTED') ? 3
            : (s === 'FULLY_EXECUTED' || s === 'PAYMENT_PENDING' || s === 'AWAITING_BRAND_ADDRESS') ? 2
              : 1;

  return { status: s, human, stageBadge, needsAction, primaryActionLabel, statusLine, step, ctaTone: primaryCta.tone, ctaDisabled: primaryCta.disabled, ctaAction: primaryCta.action };
};

const BrandMobileDashboard = ({
  profile,
  requests = [],
  deals = [],
  stats,
  initialTab,
  isLoading,
  isDemoBrand,
  onRefresh,
  onLogout,
}: BrandMobileDashboardProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  const tabParam = searchParams.get('tab');
  const subtabParam = searchParams.get('subtab');
  const highlightedDealId = searchParams.get('dealId');
  const highlightedRequestId = searchParams.get('requestId');
  const activeTab: BrandTab =
    tabParam === 'dashboard' || tabParam === 'collabs' || tabParam === 'creators' || tabParam === 'profile' || tabParam === 'payments'
      ? (tabParam as BrandTab)
      : (initialTab === 'dashboard' || initialTab === 'collabs' || initialTab === 'creators' || initialTab === 'profile' || initialTab === 'payments'
        ? (initialTab as BrandTab)
        : 'dashboard');

	  const activeCollabTab: BrandCollabTab = (() => {
	    const raw = String(subtabParam || '').trim().toLowerCase();
	    if (raw === 'pending' || raw === 'action_required' || raw === 'action-required' || raw === 'action') return 'action_required';
	    if (raw === 'active') return 'active';
	    if (raw === 'completed') return 'completed';
	    return 'action_required';
	  })();

	  const showSignatureDebug = useMemo(() => {
	    if (typeof window === 'undefined') return false;
	    const params = new URLSearchParams(window.location.search);
	    return params.get('debugSig') === '1';
	  }, []);

	  const setActiveTab = (tab: BrandTab | string, subtab?: BrandCollabTab) => {
	    const next = new URLSearchParams(searchParams);
      const safeTab = tab || 'dashboard';
	    next.set('tab', safeTab);
	    if (safeTab === 'collabs') {
      next.set('subtab', subtab || activeCollabTab || 'action_required');
    } else {
      next.delete('subtab');
    }
    setSearchParams(next, { replace: true });
  };

  const setDashboardCollabTab = (subtab: BrandCollabTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('subtab', subtab);
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
    if (activeTab === 'creators') {
      fetchFeaturedCreators();
    }
  }, [activeTab]);

  const fetchFeaturedCreators = async () => {
    setIsLoadingFeatured(true);
    try {
      const eliteUsernames = ['aria_tech', 'kaelan_fitness', 'maya_travels', 'marcus_style', 'elara_beauty'];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('username', eliteUsernames)
        .eq('role', 'creator');
      
      if (error) throw error;
      setFeaturedCreators(data || []);
    } catch (err) {
      console.error('[BrandMobileDashboard] Failed to fetch featured creators:', err);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

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
	  const textColor = isDark ? 'text-foreground' : 'text-muted-foreground';
	  const secondaryTextColor = isDark ? 'text-foreground/50' : 'text-muted-foreground';
	  // Match Creator dashboard light-mode tokens (MobileDashboardDemo): neutral base + iOS-like borders.
	  const bgColor = isDark ? 'bg-[#061318]' : 'bg-[#F9FAFB]';
	  const borderColor = isDark ? 'border-border' : 'border-[#E5E5EA]';
	  const cardBgColor = isDark
	    ? 'bg-secondary/6 backdrop-blur-xl'
	    : 'bg-card';

  const PageHeader = useMemo(() => ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 px-6 py-6 mb-2">
      <button type="button"
        onClick={() => {
          triggerHaptic(HapticPatterns.light);
          setActiveSettingsPage(null);
        }}
        className={cn('p-2.5 -ml-2.5 rounded-2xl transition-all active:scale-90', isDark ? 'hover:bg-white/5 text-white/40' : 'hover:bg-black/5 text-black/40')}
      >
        <ChevronRight className="w-6 h-6 rotate-180" />
      </button>
      <h2 className={ds.typography.h2}>{title}</h2>
    </div>
  ), [isDark, textColor, secondaryTextColor]);

  const DealCard = useMemo(() => ({ children, className }: { children: ReactNode; className?: string }) => (
    <div
      className={cn(
        'rounded-3xl border shadow-[0_10px_40px_rgba(2,6,23,0.06)] overflow-hidden bg-card border-border',
        className
      )}
    >
      {children}
    </div>
  ), []);

  const SectionTitle = useMemo(() => ({ children }: { children: ReactNode }) => (
    <p className={cn(
        "px-4 mb-3 mt-8 text-[11px] font-black uppercase tracking-widest opacity-80",
        isDark ? "text-white/30" : "text-slate-400"
    )}>
        {children}
    </p>
  ), [isDark]);

  const Pill = useMemo(() => ({ children }: { children: ReactNode }) => (
    <div className={cn('rounded-[2rem] border px-4 py-3 text-[14px] font-black tracking-widest uppercase', isDark ? 'bg-card border-border text-foreground' : 'bg-card border-border text-muted-foreground')}>
      {children}
    </div>
  ), [isDark]);

  const primaryButtonClass = cn('flex-1', dsButtons.ecosystemPrimary, 'h-10 text-[12px] disabled:opacity-50');
  const secondaryButtonClass = cn('h-10 px-4 text-[12px]', isDark ? dsButtons.ecosystemSecondaryDark : dsButtons.ecosystemSecondaryLight);

  useEffect(() => {
    // Sync activeTab with URL param on mount and whenever URL tab changes
    if (tabParam) {
      // Avoid infinite loop if tabParam is already valid, but fix if it's "undefined" string
      if (tabParam === 'undefined' || !['dashboard', 'collabs', 'creators', 'profile', 'payments'].includes(tabParam)) {
        setActiveTab('dashboard');
      }
    } else {
      setActiveTab(activeTab); // Use the computed activeTab (which now has a fallback)
    }
  }, [tabParam]);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [monthlyBudgetInr, setMonthlyBudgetInr] = useState<number | null>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [selectedDealPage, setSelectedDealPage] = useState<any | null>(null);
  const [overlayDeal, setOverlayDeal] = useState<any | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);
  const [isOpeningContract, setIsOpeningContract] = useState(false);
  const [brandLogoDbUrl, setBrandLogoDbUrl] = useState<string | null>(null);
  const [showBrandSigningModal, setShowBrandSigningModal] = useState(false);
  const [brandSigningDeal, setBrandSigningDeal] = useState<any | null>(null);
  const [brandSigningToken, setBrandSigningToken] = useState<string | null>(null);
  const [brandSigningEmail, setBrandSigningEmail] = useState('');
  const [brandSigningStep, setBrandSigningStep] = useState<'send' | 'verify'>('send');
  const [brandSigningOtp, setBrandSigningOtp] = useState('');
  const [isSendingBrandOTP, setIsSendingBrandOTP] = useState(false);
  const [isVerifyingBrandOTP, setIsVerifyingBrandOTP] = useState(false);
  const [isSigningBrandContract, setIsSigningBrandContract] = useState(false);
  const [brandSigningInitError, setBrandSigningInitError] = useState<string | null>(null);

  // ── New enforcement modal states ────────────────────────────────────────────
  const [showDisputeEscalationModal, setShowDisputeEscalationModal] = useState(false);
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
  const [showBrandShippingModal, setShowBrandShippingModal] = useState(false);

  // ── Deal detail screen hooks (hoisted to prevent remount focus loss) ──────
  const dealDetailContractRef = useRef<HTMLDivElement | null>(null);
  const dealDetailDeliverablesRef = useRef<HTMLDivElement | null>(null);
  const dealDetailProgressRef = useRef<HTMLDivElement | null>(null);
  const dealDetailContentRef = useRef<HTMLDivElement | null>(null);
  const dealDetailShippingRef = useRef<HTMLDivElement | null>(null);
  const [ddIsReviewingContent, setDdIsReviewingContent] = useState(false);
  const [ddIsReleasingPayment, setDdIsReleasingPayment] = useState(false);
  const [ddIsUpdatingShipping, setDdIsUpdatingShipping] = useState(false);
  const [ddShowPaymentProofBox, setDdShowPaymentProofBox] = useState(false);
  const [ddPaymentReferenceDraft, setDdPaymentReferenceDraft] = useState('');
  const [ddPaymentDateDraft, setDdPaymentDateDraft] = useState(() => new Date().toISOString().slice(0, 10));
  const [ddPaymentNotesDraft, setDdPaymentNotesDraft] = useState('');
  const [ddPaymentProofFile, setDdPaymentProofFile] = useState<File | null>(null);
  const [ddShowShippingBox, setDdShowShippingBox] = useState(false);
  const [ddCourierNameDraft, setDdCourierNameDraft] = useState('');
  const [ddTrackingNumberDraft, setDdTrackingNumberDraft] = useState('');
  const [ddTrackingUrlDraft, setDdTrackingUrlDraft] = useState('');
  const [ddExpectedDeliveryDateDraft, setDdExpectedDeliveryDateDraft] = useState('');
  const [ddShowRevisionBox, setDdShowRevisionBox] = useState(false);
  const [ddRevisionFeedbackDraft, setDdRevisionFeedbackDraft] = useState('');
  const [ddShowDisputeBox, setDdShowDisputeBox] = useState(false);
  const [ddDisputeNotesDraft, setDdDisputeNotesDraft] = useState('');

  // ── Offer details sheet hooks (hoisted to prevent remount focus loss) ──────
  const [odsIsRequestBusy, setOdsIsRequestBusy] = useState(false);
  const [odsShowCounterEditor, setOdsShowCounterEditor] = useState(false);
  const [odsCounterBudget, setOdsCounterBudget] = useState('');
  const [odsCounterDeliverables, setOdsCounterDeliverables] = useState('');
  const [odsCounterDeadline, setOdsCounterDeadline] = useState('');

  const handleBrandDealPrimaryAction = (
    event: MouseEvent<HTMLButtonElement> | undefined,
    item: BrandDeal | null | undefined,
    ui: ReturnType<typeof brandDealCardUi> | null | undefined,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (ui?.ctaDisabled) return;

    triggerHaptic(HapticPatterns.light);

    const action = ui?.ctaAction;

    if (action === 'confirm_payment') {
      setOverlayDeal(item);
      setShowConfirmPaymentModal(true);
      return;
    }

    if (action === 'escalate_dispute') {
      setOverlayDeal(item);
      setShowDisputeEscalationModal(true);
      return;
    }

    if (action === 'provide_shipping_address') {
      if (item && isBarterLikeCollab(item) && !isPaidLikeCollab(item)) {
        setSelectedDealPage(item);
        setDdShowShippingBox(true);
        return;
      }
      setOverlayDeal(item);
      setShowBrandShippingModal(true);
      return;
    }

    if (action === 'track_progress') {
      setSelectedDealPage(item);
      if (item && isBarterLikeCollab(item) && !isPaidLikeCollab(item)) {
        setDdShowShippingBox(true);
        setTimeout(() => {
          dealDetailShippingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      } else {
        setTimeout(() => {
          dealDetailProgressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
      return;
    }

    if (activeCollabTab === 'active') setSelectedDealPage(item);
    else setSelectedOffer(item);
  };

  const resolveDealProductImageUrl = (dealLike: any) => {
    const raw = String(
      dealLike?.barter_product_image_url ||
      dealLike?.product_image_url ||
      dealLike?.barterProductImageUrl ||
      dealLike?.productImageUrl ||
      dealLike?.brand_submission_details?.barter_product_image_url ||
      dealLike?.brand_submission_details?.product_image_url ||
      dealLike?.brand_submission_details?.form_data?.barter_product_image_url ||
      dealLike?.brand_submission_details?.form_data?.product_image_url ||
      dealLike?.form_data?.barter_product_image_url ||
      dealLike?.form_data?.product_image_url ||
      dealLike?.form_data?.barterProductImageUrl ||
      dealLike?.form_data?.productImageUrl ||
      dealLike?.brand_logo_url ||
      dealLike?.brand_details?.logo_url ||
      dealLike?.raw?.barter_product_image_url ||
      dealLike?.raw?.product_image_url ||
      dealLike?.raw?.brand_logo_url ||
      ''
    ).trim();

    return optimizeImage(raw, { width: 500, quality: 75 }) || '';
  };

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

  // When the parent refreshes `deals`, re-hydrate any "detail view" state objects so
  // status/signature UI updates immediately after actions like signing.
  useEffect(() => {
    if (!Array.isArray(deals) || deals.length === 0) return;

    const findDeal = (id: any) => {
      const needle = String(id || '');
      if (!needle) return null;
      return deals.find((d: any) => String(d?.id || '') === needle) || null;
    };

    if (selectedOffer?.id) {
      const updated = findDeal(selectedOffer.id);
      if (updated && updated !== selectedOffer) setSelectedOffer(updated);
    }
    if (selectedDealPage?.id) {
      const updated = findDeal(selectedDealPage.id);
      if (updated && updated !== selectedDealPage) setSelectedDealPage(updated);
    }
    if (overlayDeal?.id) {
      const updated = findDeal(overlayDeal.id);
      if (updated && updated !== overlayDeal) setOverlayDeal(updated);
    }
  }, [deals, selectedOffer?.id, selectedDealPage?.id, overlayDeal?.id]);

  // ── Initialize hoisted deal details drafts when deal changes ──────────────
  useEffect(() => {
    if (!selectedDealPage) return;
    const deal = selectedDealPage;
    setDdPaymentReferenceDraft(deal.payment_id || deal.raw?.payment_id || '');
    setDdPaymentDateDraft(deal.paid_at ? new Date(deal.paid_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setDdPaymentNotesDraft(deal.payment_notes || '');
    setDdCourierNameDraft(deal.shipping_courier || deal.courier_name || '');
    setDdTrackingNumberDraft(deal.shipping_tracking_id || deal.tracking_number || '');
    setDdTrackingUrlDraft(deal.shipping_tracking_url || deal.tracking_url || '');
    setDdExpectedDeliveryDateDraft(deal.expected_delivery_date ? new Date(deal.expected_delivery_date).toISOString().slice(0, 10) : '');
    setDdRevisionFeedbackDraft('');
    setDdDisputeNotesDraft('');
  }, [selectedDealPage?.id]);

  // ── Initialize hoisted offer details drafts when offer changes ────────────
  useEffect(() => {
    if (!selectedOffer) return;
    const offer = selectedOffer;
    setOdsCounterBudget(String(offer.exact_budget ?? offer.deal_amount ?? ''));
    setOdsCounterDeliverables(String(formatDeliverables(offer) || '').trim());
    setOdsCounterDeadline(offer.due_date ? new Date(offer.due_date).toISOString().slice(0, 10) : '');
    setOdsShowCounterEditor(false);
    setOdsIsRequestBusy(false);
  }, [selectedOffer?.id]);

		  const brandName = useMemo(() => {
		    const name = profile?.business_name || profile?.first_name || profile?.full_name || 'Brand';
		    return String(name || 'Brand').trim() || 'Brand';
		  }, [profile, isDemoBrand]);

  const startBrandSigningFlow = async (deal: any) => {
    if (!deal?.id) {
      toast.error('Deal details unavailable');
      return;
    }
    toast.message('Opening signing…');
    setBrandSigningDeal(deal);
    setBrandSigningToken(null);
    setBrandSigningInitError(null);
    setBrandSigningOtp('');
    setBrandSigningStep('send');
    setShowBrandSigningModal(true);
  };

  useEffect(() => {
    if (!showBrandSigningModal || !brandSigningDeal?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setBrandSigningInitError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const email = session?.user?.email || profile?.email || brandSigningDeal?.brand_email || '';
        if (!cancelled) setBrandSigningEmail(String(email || ''));
        if (!accessToken) {
          if (!cancelled) setBrandSigningInitError('Authentication required. Please log in again.');
          return;
        }

        const apiBase = getApiBaseUrl();
        const resp = await fetch(`${apiBase}/api/deals/${brandSigningDeal.id}/contract-review-link`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.success || !data?.token) {
          throw new Error(data?.error || 'Failed to initialize signing');
        }
        if (!cancelled) setBrandSigningToken(String(data.token));
      } catch (e: any) {
        if (!cancelled) setBrandSigningInitError(e?.message || 'Failed to initialize signing');
      }
	    })();
	    return () => {
	      cancelled = true;
	    };
  }, [showBrandSigningModal, brandSigningDeal?.id, profile?.email]);

  const handleSendBrandOTP = async () => {
    try {
      const email = String(brandSigningEmail || '').trim();
      if (!brandSigningToken) {
        toast.error('Signing token not ready yet');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Enter a valid email address');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      setIsSendingBrandOTP(true);
      const apiBase = getApiBaseUrl();
      const resp = await fetch(`${apiBase}/api/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: brandSigningToken, email }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) throw new Error(data?.error || 'Failed to send OTP');
      toast.success('OTP sent to your email');
      setBrandSigningStep('verify');
      triggerHaptic(HapticPatterns.success);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send OTP');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsSendingBrandOTP(false);
    }
  };

  const handleVerifyAndSignBrand = async () => {
    try {
      const otp = String(brandSigningOtp || '').replace(/\D/g, '');
      if (!brandSigningToken) {
        toast.error('Signing token not ready yet');
        return;
      }
      if (otp.length !== 6) {
        toast.error('Enter the 6-digit OTP');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error('Authentication required');
        return;
      }

      setIsVerifyingBrandOTP(true);
      const apiBase = getApiBaseUrl();
      const verifyResp = await fetch(`${apiBase}/api/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: brandSigningToken, otp }),
      });
      const verifyData = await verifyResp.json().catch(() => ({}));
      if (!verifyResp.ok || !verifyData?.success) throw new Error(verifyData?.error || 'OTP verification failed');

      setIsSigningBrandContract(true);
      const signerEmail = String(brandSigningEmail || '').trim();
      const signedAt = new Date().toISOString();
      const signPayload = {
        signerName: brandName || 'Brand',
        signerEmail,
        signerPhone: profile?.phone || null,
        contractVersionId: brandSigningDeal?.contract_version || 'v3',
        contractSnapshotHtml: brandSigningDeal?.contract_file_url
          ? `Contract URL: ${brandSigningDeal.contract_file_url}\nSigned at: ${signedAt}`
          : undefined,
        otpVerified: true,
        otpVerifiedAt: signedAt,
      };
      const signResp = await fetch(`${apiBase}/api/contract-ready-tokens/${brandSigningToken}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(signPayload),
      });
      const signData = await signResp.json().catch(() => ({}));
      if (!signResp.ok || !signData?.success) throw new Error(signData?.error || 'Failed to sign contract');

      toast.success('Contract signed');
      triggerHaptic(HapticPatterns.success);
      setShowBrandSigningModal(false);
      setBrandSigningDeal(null);
      setBrandSigningToken(null);
      await onRefresh?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to sign');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsVerifyingBrandOTP(false);
      setIsSigningBrandContract(false);
    }
  };

  const closeBrandSigningModal = () => {
    setShowBrandSigningModal(false);
    setBrandSigningDeal(null);
    setBrandSigningToken(null);
    setBrandSigningInitError(null);
    setBrandSigningStep('send');
    setBrandSigningOtp('');
    setIsSendingBrandOTP(false);
    setIsVerifyingBrandOTP(false);
    setIsSigningBrandContract(false);
  };

  useEffect(() => {
    if (!showBrandSigningModal) return;
    // Reset step state when the modal opens.
    setBrandSigningInitError(null);
    setBrandSigningStep('send');
    setBrandSigningOtp('');
    setIsSendingBrandOTP(false);
    setIsVerifyingBrandOTP(false);
    setIsSigningBrandContract(false);

    // Debug: confirm portal nodes exist. If they don't, rendering is being blocked/unmounted.
    setTimeout(() => {
      try {
        const overlay = document.querySelector('[data-brand-signing-overlay]');
        const panel = document.querySelector('[data-brand-signing-panel]');
      } catch (e) {
        // signing modal DOM check failed silently
      }
    }, 0);
  }, [showBrandSigningModal]);

	  useEffect(() => {
	    if (!profile?.id) return;
	    let cancelled = false;

	    (async () => {
	      try {
	        const { data: { session } } = await supabase.auth.getSession();
	        const token = session?.access_token;
	        if (!token) return;

	        const apiBase = getApiBaseUrl();
	        const res = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
	          headers: { Authorization: `Bearer ${token}` },
	        });
	        const json = await res.json().catch(() => ({}));
	        if (cancelled) return;
	        if (res.ok && json?.success) setBrandLogoDbUrl(json?.brand?.logo_url || null);
	      } catch {
	        // ignore
	      }
	    })();

	    return () => { cancelled = true; };
	  }, [profile?.id]);

  const brandLogo = useMemo(() => {
    const rawSrc = brandLogoDbUrl || profile?.logo_url || profile?.avatar_url;
    const src = optimizeImage(rawSrc, { width: 200, height: 200 });
    return src || null; // Let AvatarFallback render initials — avoids ui-avatars.com CORS issues
  }, [brandLogoDbUrl, profile?.avatar_url, profile?.logo_url]);

  const hasUploadedBrandLogo = useMemo(() => {
    return !!(brandLogoDbUrl || profile?.logo_url || profile?.avatar_url);
  }, [brandLogoDbUrl, profile?.avatar_url, profile?.logo_url]);

	  const openCreateOfferSheet = () => {
	    if (hasUploadedBrandLogo) {
	      setShowActionSheet(true);
	      return;
	    }

    toast.error('Upload your brand logo first', {
      description: 'Go to Brand Settings \u2192 Upload logo \u2192 Come back and send your offer',
    });
    navigate('/brand-settings');
	  };

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
      const amount = Number(d?.deal_amount || d?.exact_budget || d?.barter_value || d?.product_value) || 0;
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
      if (!res.ok || !data?.success) return []; // fail silently — non-critical API
      return Array.isArray(data.creators) ? (data.creators as SuggestedCreator[]) : [];
    },
    { staleTime: 60_000, retry: false }
  );

  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorSearchResults, setCreatorSearchResults] = useState<SuggestedCreator[]>([]);
  const [isSearchingCreators, setIsSearchingCreators] = useState(false);

  useEffect(() => {
    const raw = String(creatorSearch || '').trim();
    const term = raw.replace(/^@+/, '').trim();
    if (term.length < 2) {
      setCreatorSearchResults([]);
      setIsSearchingCreators(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingCreators(true);
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/creators?username=${encodeURIComponent(term)}&limit=8`, {
          signal: controller.signal,
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          setCreatorSearchResults([]);
          return;
        }
        setCreatorSearchResults(Array.isArray(data.creators) ? data.creators : []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setCreatorSearchResults([]);
      } finally {
        setIsSearchingCreators(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [creatorSearch]);

	  // Pending offers = requests that haven't been accepted/declined yet
		  const pendingOffersList = useMemo(() => {
		    const base = uniqById((requests || []).filter((o: any) => {
		      const s = normalizeStatus(o?.status);
		      return !s || s === 'pending' || s === 'countered' || s === 'sent' || s === 'offer_sent' || s === 'action_required' || s === 'action-required' || s === 'submitted';
		    }));
      // Sort: counters first, then expiring soonest, then newest.
      return base.sort((a: any, b: any) => {
        const aCounter = normalizeStatus(a?.status) === 'countered' ? 1 : 0;
        const bCounter = normalizeStatus(b?.status) === 'countered' ? 1 : 0;
        if (aCounter !== bCounter) return bCounter - aCounter;
        const aExp = a?.offer_expires_at || a?.expires_at || null;
        const bExp = b?.offer_expires_at || b?.expires_at || null;
        const aT = aExp ? new Date(aExp).getTime() : Number.POSITIVE_INFINITY;
        const bT = bExp ? new Date(bExp).getTime() : Number.POSITIVE_INFINITY;
        if (aT !== bT) return aT - bT;
        const aCreated = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return bCreated - aCreated;
	      });
		  }, [requests]);

      // Backward-compatible alias (older UI used `offers`).
      const offers = pendingOffersList;

  const activeDealsList = useMemo(() => {
    // Include brand_deals that are active (not cancelled/completed)
    const fromDeals = uniqDeals((deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return true;
      // Explicitly exclude statuses that are clearly finished
      if (s.includes('cancel')) return false;
      if (s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid') || s.includes('released')) return false;
      // Include everything else as active (including approved, content_making, payment_pending, etc.)
      return true;
    }));
    // Also include collab_requests accepted by creator (these are active collabs)
    const fromAcceptedRequests = (requests || []).filter((r: any) => {
      const s = normalizeStatus(r?.status);
      return s === 'accepted';
    });
    // Merge: prefer brand_deals entry if we have one for same creator
    const dealCreatorIds = new Set(fromDeals.map((d: any) => String(d.creator_id || '')).filter(Boolean));
    const acceptedNotInDeals = fromAcceptedRequests.filter((r: any) => !dealCreatorIds.has(String(r.creator_id || '')));
    // Avoid merging duplicates by contract fingerprint as well.
    return uniqDeals([...fromDeals, ...acceptedNotInDeals] as any[]);
  }, [deals, requests]);

  const completedDealsList = useMemo(() => {
    return uniqDeals((deals || []).filter((d: any) => {
      const s = normalizeStatus(d?.status);
      if (!s) return false;
      return s.includes('complete') || s.includes('completed') || s.includes('closed') || s.includes('paid') || s.includes('released') || s.includes('cancel');
    }) as any[]);
  }, [deals]);

  const visibleCollabItems = useMemo(() => {
    if (activeCollabTab === 'active') return activeDealsList;
    if (activeCollabTab === 'completed') return completedDealsList;
    // Include BOTH pending offers (requests) AND active deals that need brand attention (e.g. signature, review).
    const needsActionDeals = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction);
    return uniqById([...pendingOffersList, ...needsActionDeals]);
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

  const pushPromptStorageKey = useMemo(() => {
    const id = String(profile?.id || '').trim() || 'anon';
    return `brand_push_prompt_dismissed:${id}`;
  }, [profile?.id]);

  const [pushPromptDismissedLocal, setPushPromptDismissedLocal] = useState(false);

  useEffect(() => {
    try {
      setPushPromptDismissedLocal(localStorage.getItem(pushPromptStorageKey) === '1');
    } catch {
      // ignore
    }
  }, [pushPromptStorageKey]);

  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if supported, not subscribed, and not dismissed
    const hasDeals = (deals?.length || 0) > 0 || (requests?.length || 0) > 0;
    if (isPushSupported && hasVapidKey && pushPermission === 'default' && !isPushSubscribed && !isPushPromptDismissed && !pushPromptDismissedLocal && !isPushBusy && activeTab === 'dashboard' && !activeSettingsPage && hasDeals) {
        const timer = setTimeout(() => {
            setShowPushPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [isPushSupported, hasVapidKey, pushPermission, isPushSubscribed, isPushPromptDismissed, pushPromptDismissedLocal, isPushBusy, activeTab, activeSettingsPage, deals?.length, requests?.length]);

  const handleEnablePush = async () => {
    try {
      const res = await enableNotifications();
      if (res.success) {
        toast.success('Instant alerts active! 🚀');
        setShowPushPrompt(false);
      } else {
        if (res.reason === 'denied') {
          toast.error('Permission denied', { description: 'Please enable notifications in your browser settings.' });
        }
        setShowPushPrompt(false);
      }
    } catch (err) {
      console.error('[Push] Error:', err);
      setShowPushPrompt(false);
    }
  };

  const dismissPushPromptPersisted = () => {
    dismissPushPrompt();
    try {
      localStorage.setItem(pushPromptStorageKey, '1');
    } catch {
      // ignore
    }
    setPushPromptDismissedLocal(true);
  };



  const renderOfferDetailsSheet = (offer: any) => {
    if (!offer) return null;

    const isRequestBusy = odsIsRequestBusy;
    const setIsRequestBusy = setOdsIsRequestBusy;
    const showCounterEditor = odsShowCounterEditor;
    const setShowCounterEditor = setOdsShowCounterEditor;
    const counterBudget = odsCounterBudget;
    const setCounterBudget = setOdsCounterBudget;
    const counterDeliverables = odsCounterDeliverables;
    const setCounterDeliverables = setOdsCounterDeliverables;
    const counterDeadline = odsCounterDeadline;
    const setCounterDeadline = setOdsCounterDeadline;

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
    const isRequest = ['pending', 'countered', 'declined', 'expired'].includes(normalizeStatus(offer?.status)) && offer?.deal_amount === undefined;
    const sentAt = offer?.created_at || offer?.updated_at || null;
    const expires = offerExpiryLabel(offer);
    const requestStage = normalizeStatus(offer?.status) === 'countered' ? 'CREATOR COUNTERED' : 'AWAITING RESPONSE';
    const isCounteredRequest = normalizeStatus(offer?.status) === 'countered';

    const updateRequest = async (path: string, body?: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Authentication required');
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}${path}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Request failed');
      }
      return data;
    };

    const acceptCounter = async () => {
      try {
        const counter = offer?.counter_offer || null;
        if (!counter) {
          toast.message('No counter offer to accept yet');
          return;
        }
        const finalPrice = counter?.final_price ?? counter?.budget ?? null;
        const deliverablesNext = counter?.deliverables ?? null;
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/revise`, {
          exact_budget: finalPrice,
          deliverables: deliverablesNext,
        });
        toast.success('Accepted counter and re-sent offer');
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to accept counter');
      } finally {
        setIsRequestBusy(false);
      }
    };

    const submitCounter = async () => {
      try {
        const amount = counterBudget ? Number(counterBudget) : null;
        const deliverablesList = counterDeliverables
          .split('•')
          .join(',')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/revise`, {
          exact_budget: amount,
          deliverables: deliverablesList,
        });
        toast.success('Updated and re-sent offer');
        setShowCounterEditor(false);
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to update offer');
      } finally {
        setIsRequestBusy(false);
      }
    };

    const declineOffer = async () => {
      try {
        setIsRequestBusy(true);
        await updateRequest(`/api/brand-dashboard/requests/${offer.id}/withdraw`);
        toast.success('Offer withdrawn');
        setSelectedOffer(null);
        await onRefresh?.();
      } catch (e: any) {
        toast.error(e?.message || 'Failed to withdraw offer');
      } finally {
        setIsRequestBusy(false);
      }
    };

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
	            isDark ? 'bg-background border-border' : 'bg-secondary/95 backdrop-blur-xl border-[#E5E5EA]'
	          )}
	        >
	          <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-6" />
	          <div className="max-w-md mx-auto">
	            {isRequest ? (
	              <>
	                <div className="flex items-start justify-between gap-3 mb-5">
	                  <div className="min-w-0">
	                    <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-50', textColor)}>Pending offer</p>
	                    <h3 className={cn('text-[18px] font-bold tracking-tight truncate', textColor)}>{title}</h3>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>{String(deliverables).replaceAll(',', ' • ')}</p>
	                  </div>
	                  <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/70 bg-card' : 'border-border text-muted-foreground bg-background')}>
	                    {requestStage}
	                  </span>
	                </div>

	                <div className="grid grid-cols-2 gap-2 mb-4">
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>You will pay</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{budget || '—'}</p>
	                  </div>
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Sent</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{sentAt ? `${timeSince(sentAt)} ago` : '—'}</p>
	                  </div>
	                </div>

	                <div className="flex items-center justify-between gap-2 mb-4">
	                  <div className={cn('px-3 py-2 rounded-xl border text-[11px] font-semibold', isDark ? 'bg-[#1C2C2A] text-primary border-primary/15' : 'bg-background text-muted-foreground border-[#E5E5EA]')}>
	                    <Landmark className="w-4 h-4 inline-block mr-2 -mt-0.5" />
	                    Payment released after content approval
	                  </div>
	                  {expires && (
	                    <div className={cn(
	                      'px-3 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-2',
	                      expires.tone === 'danger'
	                        ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-300/30' : 'bg-rose-50 text-rose-800 border-rose-200')
	                        : expires.tone === 'warn'
	                          ? (isDark ? 'bg-warning/10 text-warning border-warning/30' : 'bg-warning text-white border-warning')
	                          : (isDark ? 'bg-card text-foreground/70 border-border' : 'bg-card text-muted-foreground border-border')
	                    )}>
	                      <Clock className="w-4 h-4" /> {expires.text}
	                    </div>
	                  )}
	                </div>

	                <div className="grid grid-cols-3 gap-2">
	                  {isCounteredRequest ? (
	                    <>
	                      <button type="button"
	                        onClick={acceptCounter}
	                        disabled={isRequestBusy}
	                        className="h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-blue-600 to-sky-600 text-foreground border-transparent"
	                      >
	                        Accept Counter
	                      </button>
	                      <button type="button"
	                        onClick={() => setShowCounterEditor(true)}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
	                        )}
	                      >
	                        Revise Terms
	                      </button>
	                      <button type="button"
	                        onClick={declineOffer}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-rose-500/10 border-rose-300/30 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
	                        )}
	                      >
	                        Withdraw
	                      </button>
	                    </>
	                  ) : (
	                    <>
	                      <button type="button"
	                        onClick={() => setShowCounterEditor(true)}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'col-span-2 h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-card border-border text-foreground hover:bg-secondary/50' : 'bg-card border-border text-muted-foreground hover:bg-background'
	                        )}
	                      >
	                        Edit Offer
	                      </button>
	                      <button type="button"
	                        onClick={declineOffer}
	                        disabled={isRequestBusy}
	                        className={cn(
	                          'h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60',
	                          isDark ? 'bg-rose-500/10 border-rose-300/30 text-rose-200 hover:bg-rose-500/15' : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
	                        )}
	                      >
	                        Withdraw
	                      </button>
	                    </>
	                  )}
	                </div>

	                <AnimatePresence>
	                  {showCounterEditor && [
	                    <motion.div
	                      key="counterEditorBackdrop"
	                      initial={{ opacity: 0 }}
	                      animate={{ opacity: 1 }}
	                      exit={{ opacity: 0 }}
	                      className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm"
	                      onClick={() => setShowCounterEditor(false)}
	                    />,
	                    <motion.div
	                      key="counterEditorPanel"
	                      initial={{ opacity: 0, y: 12 }}
	                      animate={{ opacity: 1, y: 0 }}
	                      exit={{ opacity: 0, y: 12 }}
	                      className={cn(
	                        'fixed inset-x-0 top-[18%] z-[170] mx-auto max-w-md rounded-[2rem] border p-5 shadow-2xl',
	                        isDark ? 'bg-background border-border' : 'bg-card border-border'
	                      )}
	                    >
	                      <div className="flex items-center justify-between mb-4">
	                        <div>
	                          <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-50', textColor)}>Counter offer</p>
	                          <p className={cn('text-[16px] font-black tracking-tight', textColor)}>Update terms</p>
	                        </div>
	                        <button type="button"
	                          onClick={() => setShowCounterEditor(false)}
	                          className={cn('w-10 h-10 rounded-full border flex items-center justify-center', borderColor, isDark ? 'bg-card' : 'bg-background')}
	                        >
	                          <ChevronRight className={cn('w-4 h-4 rotate-180', textColor)} />
	                        </button>
	                      </div>

	                        <div className="space-y-3">
	                          <div className={cn('rounded-2xl border p-3', cardBgColor, borderColor)}>
	                            <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Budget (₹)</p>
	                            <input
	                              value={counterBudget}
	                              onChange={(e) => setCounterBudget(e.target.value)}
	                              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
	                              enterKeyHint="done"
	                              inputMode="numeric"
	                              className={cn('mt-2 w-full bg-transparent text-[14px] font-bold outline-none', textColor)}
	                              placeholder="10379"
	                            />
	                          </div>
	                          <div className={cn('rounded-2xl border p-3', cardBgColor, borderColor)}>
	                            <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Deliverables</p>
	                            <textarea
	                              value={counterDeliverables}
	                              onChange={(e) => setCounterDeliverables(e.target.value)}
	                              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
	                              enterKeyHint="done"
	                              rows={3}
	                              className={cn('mt-2 w-full bg-transparent text-[13px] font-semibold outline-none resize-none', textColor)}
	                              placeholder="e.g. 1 Reel, 1 Static Post, 2 Stories"
	                            />
	                          </div>
	                        </div>

	                        <div className="grid grid-cols-2 gap-2 mt-4">
	                          <button type="button"
	                            onClick={() => setShowCounterEditor(false)}
	                            disabled={isRequestBusy}
	                            className={cn('h-12 rounded-2xl border text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60', isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground')}
	                          >
	                            Cancel
	                          </button>
	                          <button type="button"
	                            onClick={submitCounter}
	                            disabled={isRequestBusy}
	                            className={cn('h-12 rounded-2xl text-[13px] font-black transition active:scale-[0.98] disabled:opacity-60', 'bg-gradient-to-r from-blue-600 to-sky-600 text-foreground')}
	                          >
	                            {isRequestBusy ? 'Saving...' : 'Send'}
	                          </button>
	                        </div>
	                    </motion.div>,
	                  ]}
	                </AnimatePresence>
	              </>
	            ) : (
	              <div className="max-w-md mx-auto">
	                <div className="flex items-start justify-between gap-3 mb-5">
	                  <div className="min-w-0">
	                    <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-50', textColor)}>Deal offer</p>
	                    <h3 className={cn('text-[18px] font-bold tracking-tight truncate', textColor)}>{title}</h3>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>{deliverables}</p>
	                  </div>
	                  <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/70 bg-card' : 'border-border text-muted-foreground bg-background')}>
	                    {status}
	                  </span>
	                </div>

	                <div className="grid grid-cols-2 gap-2 mb-5">
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>You’ll pay</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{budget || '—'}</p>
	                  </div>
	                  <div className={cn('p-4 rounded-2xl border', cardBgColor, borderColor)}>
	                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-50', textColor)}>Deadline</p>
	                    <p className={cn('text-[13px] font-bold mt-1', textColor)}>{deadlineText || '—'}</p>
	                  </div>
	                </div>

	                {(() => {
	                  const links = Array.isArray(offer?.content_links) ? offer.content_links : [];
	                  if (links.length === 0) return null;
	                  return (
	                    <div className="mb-5 space-y-2">
	                      <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-50 px-1 mb-3', textColor)}>Delivered Content</p>
	                      <div className="grid grid-cols-1 gap-2">
	                        {links.map((link: string, idx: number) => (
	                          <button
	                            key={idx}
	                            type="button"
	                            onClick={() => {
	                              triggerHaptic(HapticPatterns.light);
	                              window.open(link, '_blank', 'noopener,noreferrer');
	                            }}
	                            className={cn(
	                              'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] flex items-center justify-between group',
	                              isDark
	                                ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
	                                : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
	                            )}
	                          >
	                            <div className="flex items-center gap-3">
	                              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-emerald-500/20' : 'bg-white shadow-sm')}>
	                                <Play className="w-5 h-5 text-emerald-500" />
	                              </div>
	                              <div>
	                                <p className={cn('text-[13px] font-bold', textColor)}>View Content #{idx + 1}</p>
	                                <p className={cn('text-[11px] opacity-60 truncate max-w-[200px]', textColor)}>{link}</p>
	                              </div>
	                            </div>
	                            <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
	                          </button>
	                        ))}
	                      </div>
	                    </div>
	                  );
	                })()}

	                <div className="grid grid-cols-1 gap-2">
		                  <button type="button"
		                    onClick={async () => {
		                      triggerHaptic(HapticPatterns.light);
			                      if (!offer?.id) {
			                        toast.error('Deal details unavailable');
			                        return;
			                      }

			                      setIsOpeningContract(true);
			                      try {
			                        setSelectedOffer(null);
			                        await startBrandSigningFlow(offer);
			                      } catch (error: any) {
			                        toast.error(error?.message || 'Failed to open signing');
			                      } finally {
			                        setIsOpeningContract(false);
			                      }
				                    }}
		                    disabled={isOpeningContract}
		                    className={cn(
		                      'p-5 rounded-[1.6rem] text-left border transition active:scale-[0.98] disabled:opacity-60',
		                      isDark
	                        ? 'border-border bg-card hover:bg-secondary/50'
	                        : 'border-border bg-background hover:bg-background'
	                    )}
	                  >
	                    <p className={cn('text-[13px] font-bold', textColor)}>{isOpeningContract ? 'Opening Contract...' : 'Review Contract'}</p>
	                    <p className={cn('text-[12px] mt-1 opacity-60', textColor)}>
	                      {contractUrl ? 'Open the generated collaboration agreement' : 'Open the protected contract review page'}
	                    </p>
	                  </button>
		                  {!contractUrl && (
		                    <button type="button"
		                      onClick={async () => {
		                        // Pre-open a tab synchronously to avoid iOS popup blocking after async work.
		                        let popup: Window | null = null;
		                        try {
		                          popup = window.open('about:blank', '_blank', 'noopener,noreferrer');
		                          if (popup) popup.opener = null;
		                        } catch {
		                          popup = null;
		                        }

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
		                            const finalUrl = String(nextUrl);
		                            if (popup && !popup.closed) popup.location.href = finalUrl;
		                            else window.location.assign(finalUrl);
		                          }
		                          await onRefresh?.();
		                          triggerHaptic(HapticPatterns.success);
		                        } catch (error: any) {
		                          try {
		                            popup?.close();
		                          } catch {
		                            // ignore
		                          }
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
	                </div>
	              </div>
		            )}
		            <div className="grid grid-cols-1 gap-2 mt-2">
		              {canMarkComplete && (
		                <button type="button"
		                  onClick={async () => {
                    if (!canSubmitCompletion) {
                      toast.message(`Cannot complete yet: ${completionBlockers.join(', ')}`);
                      return;
                    }
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
                  disabled={isMarkingComplete || !canSubmitCompletion}
                  className={cn(
                    'p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-60',
                    isDark ? 'bg-primary/10 border-primary/25 hover:bg-primary/15' : 'bg-primary border-primary hover:bg-primary'
                  )}
                >
                  <p className={cn('text-[13px] font-bold', isDark ? 'text-primary' : 'text-primary')}>
                    {isMarkingComplete ? 'Marking complete...' : 'Mark collaboration complete'}
                  </p>
                  <p className={cn('text-[12px] mt-1', isDark ? 'text-primary/70' : 'text-primary/80')}>
                    {canSubmitCompletion
                      ? 'All required obligations are done. Move this deal to completed.'
                      : `Complete after ${completionBlockers.join(', ')}.`}
                  </p>
		                </button>
		              )}
              <button type="button"
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  if (username) {
                    navigate(`/creator/${username}`);
                    return;
                  }
                  toast.message('Creator profile unavailable');
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
              >
                <p className={cn('text-[13px] font-bold', textColor)}>View creator profile</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Open the creator page in the same app</p>
              </button>
              <button type="button"
                onClick={() => {
                  triggerHaptic(HapticPatterns.light);
                  setSelectedOffer(null);
                  setActiveTab('collabs', normalizeStatus(offer?.status) === 'accepted' ? 'active' : activeCollabTab);
                }}
                className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
              >
                <p className={cn('text-[13px] font-bold', isDark ? 'text-foreground/60' : 'text-muted-foreground')}>← {activeCollabTab === 'action_required' ? 'Pending' : activeCollabTab === 'active' ? 'Active' : 'Completed'}</p>
                <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Keep reviewing offers without leaving this screen</p>
              </button>
	              <button type="button"
	                onClick={() => setSelectedOffer(null)}
	                className={cn('h-12 rounded-2xl font-bold text-[13px] transition-all active:scale-[0.99]', isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}
	              >
	                Close
	              </button>
	            </div>
          </div>
        </motion.div>
      </>
    );
  };

  const renderBrandDealDetail = (offer: any) => {
    if (!offer) return null;

    const contractSectionRef = dealDetailContractRef;
    const deliverablesSectionRef = dealDetailDeliverablesRef;
    const progressSectionRef = dealDetailProgressRef;
    const contentSectionRef = dealDetailContentRef;
    const shippingSectionRef = dealDetailShippingRef;

    const isReviewingContent = ddIsReviewingContent;
    const setIsReviewingContent = setDdIsReviewingContent;
    const isReleasingPayment = ddIsReleasingPayment;
    const setIsReleasingPayment = setDdIsReleasingPayment;
    const isUpdatingShipping = ddIsUpdatingShipping;
    const setIsUpdatingShipping = setDdIsUpdatingShipping;
    const showPaymentProofBox = ddShowPaymentProofBox;
    const setShowPaymentProofBox = setDdShowPaymentProofBox;
    const paymentReferenceDraft = ddPaymentReferenceDraft;
    const setPaymentReferenceDraft = setDdPaymentReferenceDraft;
    const paymentDateDraft = ddPaymentDateDraft;
    const setPaymentDateDraft = setDdPaymentDateDraft;
    const paymentNotesDraft = ddPaymentNotesDraft;
    const setPaymentNotesDraft = setDdPaymentNotesDraft;
    const paymentProofFile = ddPaymentProofFile;
    const setPaymentProofFile = setDdPaymentProofFile;
    const showShippingBox = ddShowShippingBox;
    const setShowShippingBox = setDdShowShippingBox;
    const courierNameDraft = ddCourierNameDraft;
    const setCourierNameDraft = setDdCourierNameDraft;
    const trackingNumberDraft = ddTrackingNumberDraft;
    const setTrackingNumberDraft = setDdTrackingNumberDraft;
    const trackingUrlDraft = ddTrackingUrlDraft;
    const setTrackingUrlDraft = setDdTrackingUrlDraft;
    const expectedDeliveryDateDraft = ddExpectedDeliveryDateDraft;
    const setExpectedDeliveryDateDraft = setDdExpectedDeliveryDateDraft;
    const showRevisionBox = ddShowRevisionBox;
    const setShowRevisionBox = setDdShowRevisionBox;
    const revisionFeedbackDraft = ddRevisionFeedbackDraft;
    const setRevisionFeedbackDraft = setDdRevisionFeedbackDraft;
    const showDisputeBox = ddShowDisputeBox;
    const setShowDisputeBox = setDdShowDisputeBox;
    const disputeNotesDraft = ddDisputeNotesDraft;
    const setDisputeNotesDraft = setDdDisputeNotesDraft;

    const creatorName = firstNameish(offer?.profiles, offer?.creator_name || offer?.creator_email);
    const creatorUsername = String(offer?.profiles?.username || '').trim();
    const deliverables = formatDeliverables(offer) || offer?.collab_type || 'Collaboration';
    const amount = Number(offer?.deal_amount || offer?.exact_budget || offer?.barter_value || offer?.product_value || 0);
    const deadlineValue = offer?.due_date || offer?.deadline;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const deadlineText = deadline && !Number.isNaN(deadline.getTime())
      ? deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const diffDays = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;
    const dueTone = diffDays === null ? secondaryTextColor : diffDays < 0 ? 'text-rose-500' : diffDays <= 7 ? 'text-warning' : 'text-info';
    const contractUrl = offer?.safe_contract_url || offer?.signed_contract_url || offer?.contract_file_url || null;
    
    const collabType = String(offer?.collab_type || offer?.deal_type || offer?.raw?.collab_type || '').trim().toLowerCase();
    const isPureBarter = collabType === 'barter';
    const requiresPayment = isPaidLikeCollab(offer) && !isPureBarter;
    const requiresShipping = offer?.shipping_required === true || isBarterLikeCollab(offer);
    const shippingStatus = String(offer?.shipping_status || '').trim().toLowerCase();
    const shippingDelivered = shippingStatus === 'delivered' || shippingStatus === 'received';
    const trackingNumber = String(offer?.tracking_number || '').trim();
    const courierName = String(offer?.courier_name || '').trim();
    const creatorUpiId = String(offer?.profiles?.bank_upi || '').trim();

    const normalizedDealStatus = effectiveDealStatus(offer);
    const canReviewContent = normalizedDealStatus === 'CONTENT_DELIVERED' || normalizedDealStatus === 'REVISION_DONE';
    const isEscrowDeal = Boolean((offer as any)?.payment_status === 'captured' || (offer?.payment_id && String(offer.payment_id).startsWith('pay_')));
    const canReleasePayment = requiresPayment && normalizedDealStatus === 'CONTENT_APPROVED' && !isEscrowDeal;
    
    const cardUi = brandDealCardUi(offer);
    const primaryCta = getDealPrimaryCta({ role: 'brand', deal: offer });
    const dealUi = (() => {
      const label = cardUi.human || 'In progress';
      const tone = primaryCta.tone === 'action' ? 'bg-warning/10 text-warning border-warning/20' : 'bg-info/10 text-info border-sky-500/20';
      const stepIndex = Math.max(0, Math.min(4, (cardUi.step || 1) - 1));
      return { label, tone, stepIndex };
    })();

    const copyText = async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
      } catch {
        toast.error('Failed to copy');
      }
    };

    const openContract = async () => {
      setIsOpeningContract(true);
      try { await startBrandSigningFlow(offer); } finally { setIsOpeningContract(false); }
    };

    const generateContract = async () => {
      setIsGeneratingContract(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const apiBase = getApiBaseUrl();
        const response = await fetch(`${apiBase}/api/deals/${offer.id}/regenerate-contract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        });
        if (response.ok) {
          toast.success('Contract regenerated');
          await onRefresh?.();
        }
      } catch {
        toast.error('Failed to regenerate');
      } finally { setIsGeneratingContract(false); }
    };

    const patchDeal = async (path: string, body?: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const apiBase = getApiBaseUrl();
      const resp = await fetch(`${apiBase}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      return await resp.json();
    };

    const approveContent = async () => {
      setIsReviewingContent(true);
      try {
        await patchDeal(`/api/deals/${offer.id}/review-content`, { status: 'approved' });
        toast.success('Content approved');
        await onRefresh?.();
      } finally { setIsReviewingContent(false); }
    };

    const requestRevision = async () => {
      if (!revisionFeedbackDraft.trim()) { toast.error('Note is required'); return; }
      setIsReviewingContent(true);
      try {
        await patchDeal(`/api/deals/${offer.id}/review-content`, { status: 'changes_requested', feedback: revisionFeedbackDraft });
        toast.success('Revision requested');
        setShowRevisionBox(false);
        await onRefresh?.();
      } finally { setIsReviewingContent(false); }
    };

    const updateShipping = async () => {
      if (!trackingNumberDraft.trim()) { toast.error('ID is required'); return; }
      setIsUpdatingShipping(true);
      try {
        await patchDeal(`/api/deals/${offer.id}/shipping/update`, {
          status: 'shipped',
          courier_name: courierNameDraft,
          tracking_number: trackingNumberDraft,
        });
        toast.success('Shipping updated');
        setShowShippingBox(false);
        // Optimistic update
        setSelectedDealPage(prev => prev ? { 
            ...prev, 
            shipping_status: 'shipped',
            tracking_number: trackingNumberDraft,
            courier_name: courierNameDraft
        } : prev);
        await onRefresh?.();
      } finally { setIsUpdatingShipping(false); }
    };

    const releasePayment = async () => {
      if (!paymentReferenceDraft.trim()) { toast.error('UTR is required'); return; }
      setIsReleasingPayment(true);
      try {
        await patchDeal(`/api/deals/${offer.id}/release-payment`, { paymentReference: paymentReferenceDraft });
        toast.success('Payment released');
        setShowPaymentProofBox(false);
        await onRefresh?.();
      } finally { setIsReleasingPayment(false); }
    };

    const raiseDispute = async () => {
      setIsReviewingContent(true);
      try {
        await patchDeal(`/api/deals/${offer.id}/raise-dispute`, { notes: disputeNotesDraft });
        toast.success('Dispute raised. Support will contact you.');
        setShowDisputeBox(false);
        await onRefresh?.();
      } finally { setIsReviewingContent(false); }
    };

    const onPrimaryCta = () => {
      if (primaryCta.action === 'review_sign_contract') {
        openContract();
        return;
      }
      if (primaryCta.action === 'review_content') {
        contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (primaryCta.action === 'confirm_payment') {
        setOverlayDeal(offer);
        setShowConfirmPaymentModal(true);
        return;
      }
      if (primaryCta.action === 'escalate_dispute') {
        setOverlayDeal(offer);
        setShowDisputeEscalationModal(true);
        return;
      }
      if (primaryCta.action === 'track_progress') {
        if (requiresShipping && !shippingDelivered) {
          setDdShowShippingBox(true);
          shippingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        progressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      toast.message(primaryCta.label);
    };

    const scrollToRef = (ref: any) => ref.current?.scrollIntoView({ behavior: 'smooth' });

    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        className={cn(
          'fixed inset-0 z-[200] overflow-y-auto',
          isDark ? 'bg-[#061318]' : 'bg-[#F9FAFB]'
        )}
      >
        {/* Sticky Header */}
        <div className={cn('px-4 py-3.5 flex items-center justify-between border-b sticky top-0 z-[210]', isDark ? 'bg-[#061318]/92 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-border/60')}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setSelectedDealPage(null); }} aria-label="Close deal detail" className={cn('w-10 h-10 rounded-[1.25rem] flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-card hover:bg-secondary/50' : 'bg-white hover:bg-slate-50')}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-border/50">
                <AvatarImage src={safeAvatarSrc(offer?.profiles?.avatar_url || offer?.profiles?.profile_image_url || offer?.creator_avatar_url || offer?.creator_photo_url)} alt={creatorName} />
                <AvatarFallback>{(creatorName || 'C').slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className={cn('text-[14px] font-black tracking-tight leading-tight truncate max-w-[120px]', textColor)}>{creatorName || 'Creator'}</h2>
                <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 leading-tight', textColor)}>Deal Details</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); toast.info('Status History', { description: 'Chronology of deal events coming soon.' }); }} className={cn('w-10 h-10 rounded-[1.25rem] flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-card' : 'bg-white shadow-sm')}>
              <History className={cn('w-4.5 h-4.5', isDark ? 'text-white/40' : 'text-slate-400')} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" onClick={() => triggerHaptic(HapticPatterns.light)} className={cn('w-10 h-10 rounded-[1.25rem] flex items-center justify-center border transition-all active:scale-90', borderColor, isDark ? 'bg-card' : 'bg-white shadow-sm')}>
                  <MoreHorizontal className={cn('w-4.5 h-4.5', isDark ? 'text-white/40' : 'text-slate-400')} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn('w-56 rounded-[1.75rem] border p-2', isDark ? 'bg-[#0B0F14] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl')}>
                <DropdownMenuItem onClick={openContract} className="rounded-xl py-3 cursor-pointer">
                  <Eye className="w-4 h-4 mr-3 opacity-60" />
                  <span className="font-bold">View Contract</span>
                </DropdownMenuItem>
                
                {!normalizedDealStatus.includes('FULLY_EXECUTED') && (
                  <DropdownMenuItem onClick={generateContract} className="rounded-xl py-3 cursor-pointer">
                    <RotateCcw className="w-4 h-4 mr-3 opacity-60" />
                    <span className="font-bold">Regenerate Contract</span>
                  </DropdownMenuItem>
                )}

                {contractUrl && (
                  <DropdownMenuItem onClick={() => copyText(contractUrl, 'Contract Link')} className="rounded-xl py-3 cursor-pointer">
                    <Copy className="w-4 h-4 mr-3 opacity-60" />
                    <span className="font-bold">Copy Contract Link</span>
                  </DropdownMenuItem>
                )}

                {!normalizedDealStatus.includes('CANCELLED') && !normalizedDealStatus.includes('COMPLETED') && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setOverlayDeal(offer);
                      setShowDisputeEscalationModal(true);
                    }} 
                    className="rounded-xl py-3 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-3 opacity-60" />
                    <span className="font-bold">Cancel Deal</span>
                  </DropdownMenuItem>
                )}

                <div className="h-px bg-white/5 my-1" />
                
                <DropdownMenuItem onClick={() => { triggerHaptic(HapticPatterns.light); toast.info('Status History', { description: 'Chronology of deal events coming soon.' }); }} className="rounded-xl py-3 cursor-pointer opacity-50">
                  <History className="w-4 h-4 mr-3" />
                  <span className="font-bold">Deal History</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-5 pt-5 pb-dashboard max-w-md md:max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="mb-5 relative">
            <div className={cn(
              'rounded-[42px] border p-8 overflow-hidden relative shadow-2xl transition-all duration-700',
              isDark 
                ? 'bg-gradient-to-br from-emerald-500/20 via-sky-500/5 to-transparent border-white/5' 
                : 'bg-gradient-to-br from-emerald-50 via-sky-50 to-white border-primary/20 shadow-primary/10'
            )}>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                <Sparkles size={180} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className={cn('px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2', dealUi.tone)}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {dealUi.label}
                  </div>
                  <div className={cn('px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm', isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-500')}>
                    {offer?.collab_type?.toUpperCase() || 'COLLAB'}
                  </div>
                </div>

                <div className="text-center mb-5">
                  <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 mb-3', textColor)}>Investment</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn('text-[20px] font-black mb-4 mr-1', isDark ? 'text-primary' : 'text-primary')}>₹</span>
                    <h1 className={cn('text-[64px] font-black tracking-tighter leading-none', textColor)}>
                      <CountUp end={amount} duration={1.5} separator="," />
                    </h1>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 py-5 border-y border-white/5 bg-white/[0.02] -mx-4 px-4 mb-5">
                  <div className="text-center">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 mb-1.5', textColor)}>Type</p>
                    <p className={cn('text-[13px] font-bold', textColor)}>{String(deliverables).split('•')[0] || 'Reel'}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 mb-1.5', textColor)}>Rights</p>
                    <p className={cn('text-[13px] font-bold', textColor)}>Organic</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className={cn('text-[9px] font-black uppercase tracking-widest opacity-40 mb-1.5', textColor)}>Platform</p>
                    <p className={cn('text-[13px] font-bold', textColor)}>Instagram</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-12 h-12 border-2 border-white/10 shadow-xl">
                      <AvatarImage src={safeAvatarSrc(offer?.profiles?.avatar_url || offer?.profiles?.profile_image_url || offer?.creator_avatar_url || offer?.creator_photo_url)} alt={creatorName} />
                      <AvatarFallback className="bg-primary/20 text-primary font-black">
                        {(creatorName || 'C').slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn('text-[15px] font-black truncate', textColor)}>{creatorName}</p>
                        <ShieldCheck className="w-4 h-4 text-info" />
                      </div>
                      <p className={cn('text-[11px] font-bold opacity-50 truncate', textColor)}>@{creatorUsername || 'creator'}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate(`/${creatorUsername || ''}`)} className={cn('px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-95', isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm')}>
                    Profile
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Any other requirements section */}
          {offer?.campaign_description && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4 px-1">
                <SectionTitle>Any other requirements</SectionTitle>
                <div className={cn('px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100')}>
                  Briefing
                </div>
              </div>
              <div className={cn('p-6 rounded-[32px] border relative overflow-hidden', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                <p className={cn('text-[13px] font-medium leading-relaxed opacity-70 whitespace-pre-wrap', textColor)}>
                  {renderClickableLinks(offer.campaign_description.split('||Package:')[0].trim(), isDark)}
                </p>
              </div>
            </div>
          )}

          {/* Timeline Section */}
          <div ref={progressSectionRef} className="mb-5">
            <div className="flex items-center justify-between mb-4 px-1">
              <SectionTitle>{requiresShipping && !requiresPayment ? 'Fulfillment Timeline' : 'Deal Timeline'}</SectionTitle>
              <div className={cn('px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>
                {requiresShipping && !requiresPayment ? 'BARTER' : dealUi.label}
              </div>
            </div>
            <div className={cn('p-6 rounded-[32px] border relative overflow-hidden', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="relative flex justify-between">
                <div className={cn('absolute top-5 left-0 right-0 h-[2px] z-0', isDark ? 'bg-white/5' : 'bg-slate-100')}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(dealUi.stepIndex / 4) * 100}%` }}
                    className={cn('h-full bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]')}
                  />
                </div>
                  {(requiresShipping && !requiresPayment
                    ? [
                        { label: 'Contract', icon: FileText },
                        { label: 'Signed', icon: PenTool },
                        { label: 'Dispatch', icon: Truck },
                        { label: 'Received', icon: CheckCircle2 },
                        { label: 'Complete', icon: Wallet },
                      ]
                    : [
                        { label: 'Contract', icon: FileText },
                        { label: 'Signed', icon: PenTool },
                        { label: 'Create', icon: PlayCircle },
                        { label: 'Deliver', icon: CheckCircle2 },
                        { label: 'Done', icon: Wallet },
                      ]
                  ).map((step, idx) => {
                  const isCompleted = idx <= dealUi.stepIndex;
                  const isActive = idx === dealUi.stepIndex;
                  return (
                    <div key={step.label} className="relative z-10 flex flex-col items-center gap-3 w-12">
                      <div className={cn(
                        'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-2',
                        isCompleted ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-white/10 text-white shadow-lg' : isDark ? 'bg-secondary/40 border-white/5 text-white/20' : 'bg-slate-50 border-slate-100 text-slate-300'
                      )}>
                        <step.icon className={cn('w-4.5 h-4.5', isActive && 'animate-pulse')} strokeWidth={isCompleted ? 3 : 2} />
                      </div>
                      <span className={cn('text-[9px] font-black uppercase tracking-widest text-center', isCompleted ? textColor : 'opacity-30')}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Info Tiles */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className={cn('p-5 rounded-[32px] border relative overflow-hidden transition-all', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mb-3 opacity-40', textColor)}>
                {requiresPayment ? 'Payment' : requiresShipping ? 'Fulfillment' : 'Deal type'}
              </p>
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-600')}>
                  {requiresPayment ? <ShieldCheck className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-[14px] font-black leading-tight truncate', textColor)}>
                    {requiresPayment ? 'Escrow' : requiresShipping ? 'Product' : 'Collab'}
                  </p>
                  <p className={cn('text-[10px] font-bold mt-1 truncate', dueTone)}>
                    {diffDays === null ? 'No limit' : diffDays > 0 ? `${diffDays}d left` : 'Overdue'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={cn('p-5 rounded-[32px] border relative overflow-hidden transition-all', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <p className={cn('text-[10px] font-black uppercase tracking-widest mb-3 opacity-40', textColor)}>Deadline</p>
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600')}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-[14px] font-black leading-tight truncate', textColor)}>{deadlineText}</p>
                </div>
              </div>
            </div>
          </div>


          {/* Fulfillment (Shipping) Section */}
          {requiresShipping && (
            <div ref={shippingSectionRef} className="mb-6">
              <div className="flex items-center justify-between mb-4 px-1">
                <SectionTitle>{requiresPayment ? 'Fulfillment' : 'Product Briefing'}</SectionTitle>
                <div className={cn('px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100')}>
                  {requiresPayment ? 'Product' : 'SHIPPING REQUIRED'}
                </div>
              </div>
              <div className={cn('p-6 rounded-[32px] border relative overflow-hidden', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[17px] font-black tracking-tight leading-none', textColor)}>
                      {requiresPayment ? (shippingDelivered ? 'Product Delivered' : 'In Transit') : (shippingDelivered ? 'Product Delivered' : 'Awaiting Shipping Details')}
                    </p>
                    <p className={cn('text-[11px] font-bold mt-2 opacity-50', textColor)}>
                      {requiresPayment
                        ? (shippingDelivered ? 'Confirming arrival of item.' : 'Keep the creator updated.')
                        : (shippingDelivered ? 'Product has reached the creator.' : 'Add shipping details so the creator can receive the product.')}
                    </p>
                  </div>
                  <span className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0', shippingDelivered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-warning/10 text-warning border-warning/20')}>
                    {shippingDelivered ? 'ARRIVED' : requiresPayment ? 'ACTION' : 'NEEDS SHIP'}
                  </span>
                </div>

                {/* Address managed via Edit button below */}

                {!shippingDelivered && (
                  <div className={cn('flex gap-3', isPureBarter && 'grid grid-cols-1')}>
                    {!isPureBarter && (
                      <button
                        type="button"
                        onClick={() => {
                          setOverlayDeal(offer);
                          setShowBrandShippingModal(true);
                        }}
                        className={cn('flex-1 h-12 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2', isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50')}
                      >
                        <MapPin className="w-4 h-4 opacity-40" />
                        {offer?.brand_address ? 'Edit Address' : 'Add Address'}
                      </button>
                    )}

                    <button 
                      type="button" 
                      onClick={() => setShowShippingBox(true)} 
                      className={cn('flex-1 h-12 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2', isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-slate-200 shadow-sm hover:bg-slate-50')}
                    >
                      <Truck className="w-4 h-4 opacity-40" />
                      {trackingNumber ? 'Update Tracking' : isPureBarter ? 'Add Dispatch Details' : 'Add Tracking'}
                    </button>
                  </div>
                )}

                {showShippingBox && !shippingDelivered && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-6 border-t border-white/5 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', textColor)}>Courier Name</label>
                      <input
                        value={courierNameDraft}
                        onChange={(e) => setCourierNameDraft(e.target.value)}
                        placeholder="e.g. Delhivery, BlueDart"
                        className={cn('w-full h-12 px-4 rounded-xl border text-[14px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all', isDark ? 'bg-[#0B0F14] border-white/10' : 'bg-white border-slate-200')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', textColor)}>Tracking ID / AWB</label>
                      <input
                        value={trackingNumberDraft}
                        onChange={(e) => setTrackingNumberDraft(e.target.value)}
                        placeholder="Enter tracking number"
                        className={cn('w-full h-12 px-4 rounded-xl border text-[14px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all', isDark ? 'bg-[#0B0F14] border-white/10' : 'bg-white border-slate-200')}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setShowShippingBox(false)}
                        className={cn('flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest border', borderColor, isDark ? 'bg-white/5' : 'bg-white')}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={updateShipping}
                        disabled={isUpdatingShipping || !trackingNumberDraft.trim()}
                        className={cn('flex-[2] h-11 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-white flex items-center justify-center gap-2')}
                      >
                        {isUpdatingShipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save Tracking
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Content Submission Section */}
          {(offer?.submission_url || canReviewContent) && (
            <div ref={contentSectionRef} className="mb-5">
              <div className="flex items-center justify-between mb-4 px-1">
                <SectionTitle>Content Review</SectionTitle>
                <div className={cn('px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', canReviewContent ? (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100') : (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'))}>
                  {canReviewContent ? 'Needs Review' : 'Deliverable'}
                </div>
              </div>
              <div className={cn('p-6 rounded-[32px] border relative overflow-hidden', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                {(() => {
                  const rawUrl = String(offer?.content_submission_url || offer?.content_url || offer?.submission_url || '').trim();
                  if (rawUrl) {
                    const urlSegments = rawUrl.split('/');
                    const rawFileName = urlSegments[urlSegments.length - 1] || 'content-file';
                    // Clean up timestamp suffixes from filename
                    const cleanName = decodeURIComponent(rawFileName).replace(/-\d{13,}\./, '.');
                    const ext = cleanName.split('.').pop()?.toLowerCase() || '';
                    const isVideo = ['mp4', 'mov', 'webm', 'm4v', 'avi'].includes(ext);
                    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
                    const fileIcon = isVideo ? '🎬' : isImage ? '🖼️' : '📄';
                    const fileType = isVideo ? 'Video File' : isImage ? 'Image File' : ext.toUpperCase() + ' File';

                    return (
                      <div className="mb-6">
                        <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-40 mb-4', textColor)}>Submitted Content</p>
                        <div className={cn('rounded-[24px] border overflow-hidden', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100')}>
                          <div className={cn('px-5 py-5 flex items-center gap-4', isDark ? 'border-b border-white/5' : 'border-b border-slate-100')}>
                            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner border', isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100')}>
                              {fileIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-[14px] font-black truncate leading-tight', textColor)}>{cleanName}</p>
                              <p className={cn('text-[11px] font-bold mt-1.5 flex items-center gap-2', isDark ? 'text-white/40' : 'text-slate-400')}>
                                <span>{fileType}</span>
                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                <span className="uppercase">.{ext}</span>
                              </p>
                            </div>
                            <div className={cn('px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0', isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>
                              Received
                            </div>
                          </div>
                          <div className="px-5 py-4 flex items-center gap-3">
                            <a
                              href={rawUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn('flex-1 h-11 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] border', isDark ? 'bg-info/10 text-info border-info/20 hover:bg-info/20' : 'bg-info/10 text-info border-info/20 hover:bg-info/15')}
                            >
                              <ExternalLink className="w-4 h-4" />
                              {isVideo ? 'Watch' : 'View'} Content
                            </a>
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(rawUrl); toast.success('Link copied!'); }}
                              className={cn('w-11 h-11 rounded-2xl flex items-center justify-center border transition-all active:scale-[0.98]', isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm hover:bg-slate-50')}
                            >
                              <Copy className="w-4 h-4 opacity-50" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mb-6 py-8 text-center">
                      <div className={cn('w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4', isDark ? 'bg-white/5' : 'bg-slate-50')}>
                        <Clock className="w-7 h-7 opacity-20" />
                      </div>
                      <p className={cn('text-[15px] font-black opacity-40 mb-1', textColor)}>Awaiting Delivery</p>
                      <p className={cn('text-[12px] font-bold opacity-30', textColor)}>Creator hasn't submitted content yet.</p>
                    </div>
                  );
                })()}

                {canReviewContent && (
                  <div className="space-y-3">
                    <button type="button" onClick={approveContent} disabled={isReviewingContent} className={cn('h-14 w-full rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-xl', isDark ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/20' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-200')}>
                      {isReviewingContent ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Approve Content
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setShowRevisionBox(true)} className={cn('h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all active:scale-[0.98] flex items-center justify-center gap-2', borderColor, isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50 shadow-sm')}>
                        <RotateCcw className="w-3.5 h-3.5 opacity-50" />
                        Revision
                      </button>
                      <button type="button" onClick={() => setShowDisputeBox(true)} className={cn('h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-rose-500/20 text-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2', isDark ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'bg-rose-50 hover:bg-rose-100')}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Raise Issue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Section */}
          {requiresPayment && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-4 px-1">
                <SectionTitle>Payout Status</SectionTitle>
                <div className={cn('px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest', isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>
                  Payment
                </div>
              </div>
              <div className={cn('p-6 rounded-[32px] border relative overflow-hidden', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[17px] font-black tracking-tight leading-none', textColor)}>
                      {isEscrowDeal ? 'Funds Secured' : normalizedDealStatus === 'COMPLETED' ? 'Paid' : 'Awaiting Release'}
                    </p>
                    <p className={cn('text-[11px] font-bold mt-2 opacity-50', textColor)}>
                      {isEscrowDeal ? 'Creator will be paid upon approval.' : isPureBarter ? 'No escrow for this collaboration.' : 'Direct payment to creator.'}
                    </p>
                  </div>
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className={cn('rounded-[24px] border p-4 mb-6', isDark ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100')}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', textColor)}>Amount Due</p>
                    <p className={cn('text-[16px] font-black', textColor)}>₹{amount.toLocaleString('en-IN')}</p>
                  </div>
                  {creatorUpiId && !isEscrowDeal && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <p className={cn('text-[10px] font-black uppercase tracking-widest opacity-40', textColor)}>Creator UPI</p>
                      <div className="flex items-center gap-2">
                        <p className={cn('text-[13px] font-bold', textColor)}>{creatorUpiId}</p>
                        <button onClick={() => copyText(creatorUpiId, 'UPI')} className="p-1 hover:bg-white/10 rounded">
                          <Copy className="w-3 h-3 opacity-40" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {canReleasePayment && (
                  <button type="button" onClick={() => setShowPaymentProofBox(true)} disabled={isReleasingPayment} className={cn('h-12 w-full rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2', isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white')}>
                    {isReleasingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Confirm Payout
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Usage Rights */}
          <div className="mb-5">
            <SectionTitle>Usage Rights</SectionTitle>
            <div className={cn('p-6 rounded-[32px] border', isDark ? 'bg-card/40 border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="flex items-center gap-4 mb-4">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-600')}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn('text-[15px] font-black', textColor)}>Organic Usage</p>
                  <p className={cn('text-[12px] font-bold opacity-50', textColor)}>Perpetual organic rights included.</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className={cn('text-[12px] leading-relaxed opacity-70', textColor)}>
                  Creator grants the brand perpetual, non-exclusive rights to use the content on brand's own social channels and website for organic marketing purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        <div className={cn('fixed bottom-0 inset-x-0 z-[220] px-4 pb-8 pt-4 border-t backdrop-blur-2xl', isDark ? 'bg-[#061318]/80 border-white/5' : 'bg-white/80 border-slate-100')}>
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button type="button" onClick={() => scrollToRef(progressSectionRef)} className={cn('w-14 h-14 rounded-[22px] border flex items-center justify-center transition-all active:scale-90', borderColor, isDark ? 'bg-card' : 'bg-white shadow-sm')}>
              <Info className={cn('w-5 h-5 opacity-60', textColor)} />
            </button>
            <button type="button" onClick={() => toast.info('Chat coming soon')} className={cn('w-14 h-14 rounded-[22px] border flex items-center justify-center transition-all active:scale-90', borderColor, isDark ? 'bg-card' : 'bg-white shadow-sm')}>
              <MessageSquare className={cn('w-5 h-5 opacity-60', textColor)} />
            </button>
            <button
              type="button"
              onClick={onPrimaryCta}
              disabled={primaryCta.disabled || isOpeningContract || isGeneratingContract}
              className={cn(
                'flex-1 h-14 rounded-[22px] text-[15px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl',
                dealPrimaryCtaButtonClass(primaryCta.tone)
              )}
            >
              {isOpeningContract ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {primaryCta.label}
            </button>
          </div>
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
        <div className={cn('rounded-[24px] border overflow-hidden', borderColor, isDark ? 'bg-card divide-[#2C2C2E]' : 'bg-card divide-[#E5E5EA] shadow-sm', 'divide-y')}>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0', isDark ? 'bg-info/20 text-info' : 'bg-info/15 text-info')}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[17px] font-medium leading-tight', textColor)}>Push Alerts</p>
                <p className={cn('text-[13px] opacity-50 mt-0.5', textColor)}>{isPushSubscribed ? 'Active on this device' : 'Receive deal updates'}</p>
              </div>
            </div>
            <button type="button"
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
                isPushSubscribed ? 'bg-primary' : isDark ? 'bg-[#39393D]' : 'bg-[#E9E9EB]'
              )}
            >
              <motion.div
                animate={{ x: isPushSubscribed ? 22 : 2 }}
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow-md"
              />
            </button>
          </div>

          {isPushSubscribed && (
            <button type="button"
              disabled={isPushBusy}
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                const res = await sendTestPush();
                if (res.success) toast.success('Test notification sent!');
                else toast.error('Failed: ' + res.reason);
              }}
              className={cn('w-full py-4 text-[13px] font-bold text-center transition-all active:bg-opacity-50', isDark ? 'text-info active:bg-card' : 'text-info active:bg-background')}
            >
              {isPushBusy ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}
        </div>

        <div className={cn('p-5 rounded-[24px] border', borderColor, isDark ? 'bg-card' : 'bg-card shadow-sm')}>
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
            <button type="button"
              onClick={async () => {
                triggerHaptic(HapticPatterns.light);
                await refreshPushStatus();
                toast.success('Status refreshed');
              }}
              className={cn('p-2 rounded-xl border transition-all active:scale-95', isDark ? 'border-border bg-card' : 'border-border bg-card')}
            >
              <RefreshCw className={cn('w-4 h-4 opacity-60', textColor)} />
            </button>
          </div>
          {isIOSNeedsInstall && (
            <p className={cn('text-[12px] opacity-60', isDark ? 'text-warning/80' : 'text-warning')}>
              iOS requires “Add to Home Screen” to support push notifications.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );


  const renderBrandSigningPortal = (): ReactNode => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <AnimatePresence>
        {showBrandSigningModal && (
          <>
            <motion.div
              key="brandSigningOverlay"
              data-brand-signing-overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[40000] bg-black/70 backdrop-blur-xl"
            />
            <div
              key="brandSigningPanelWrap"
              data-brand-signing-panel
              className="fixed left-1/2 top-1/2 z-[40010] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                className="rounded-3xl border border-border bg-neutral-950/95 text-foreground shadow-2xl shadow-black/60 overflow-hidden"
              >
              <div className="px-6 pt-6 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground/50">Contract</p>
                    <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
                      <FileText className="w-5 h-5 text-info" />
                      Sign Agreement
                    </h3>
                    <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                      {brandSigningStep === 'send'
                        ? 'We will send a secure OTP to your email to verify your identity and sign the contract.'
                        : 'Enter the 6-digit code sent to your email to complete signing.'}
                    </p>
                  </div>
                  <button type="button"
                    onClick={closeBrandSigningModal}
                    className="w-10 h-10 rounded-full border border-border bg-card hover:bg-secondary/50 flex items-center justify-center"
                    aria-label="Close"
                  >
                    <ChevronRight className="w-4 h-4 rotate-45 text-foreground/70" />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {brandSigningInitError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {brandSigningInitError}
                  </div>
                )}

                {!brandSigningToken && !brandSigningInitError && (
                  <div className="rounded-2xl border border-border bg-card px-4 py-4 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-foreground/70" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Preparing signing…</p>
                      <p className="text-xs text-foreground/60">Fetching your secure contract token.</p>
                    </div>
                  </div>
                )}

                {brandSigningToken && brandSigningStep === 'send' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email for OTP
                      </label>
                      <input
                        value={brandSigningEmail}
                        onChange={(e) => setBrandSigningEmail(e.target.value)}
                        placeholder="you@company.com"
                        inputMode="email"
                        autoComplete="email"
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3 text-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 outline-none transition-all placeholder:text-neutral-500"
                      />
                    </div>

                    <motion.button
                      onClick={handleSendBrandOTP}
                      disabled={isSendingBrandOTP || !!brandSigningInitError}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-info hover:bg-info py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                      {isSendingBrandOTP ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending OTP…
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Send OTP
                        </>
                      )}
                    </motion.button>
                  </>
                )}

                {brandSigningToken && brandSigningStep === 'verify' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300 tracking-wide uppercase">OTP Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={brandSigningOtp}
                        onChange={(e) => setBrandSigningOtp(e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="w-full bg-neutral-900 border border-neutral-600 rounded-xl px-4 py-3.5 text-center text-3xl tracking-[0.32em] font-mono text-foreground focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25 outline-none transition-all placeholder:text-neutral-500 placeholder:tracking-normal"
                      />
                      <p className="text-xs text-neutral-400">Code expires in 10 minutes.</p>
                    </div>

                    <motion.button
                      onClick={handleVerifyAndSignBrand}
                      disabled={isVerifyingBrandOTP || isSigningBrandContract || brandSigningOtp.replace(/\D/g, '').length !== 6}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary hover:bg-primary py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                      {isVerifyingBrandOTP || isSigningBrandContract ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {isSigningBrandContract ? 'Signing…' : 'Verifying…'}
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Verify & Sign
                        </>
                      )}
                    </motion.button>

                    <button type="button"
                      onClick={() => {
                        setBrandSigningStep('send');
                        setBrandSigningOtp('');
                      }}
                      disabled={isVerifyingBrandOTP || isSigningBrandContract}
                      className="w-full text-xs text-neutral-400 hover:text-neutral-200 py-2 transition-all tracking-wide font-semibold"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 border-t border-border px-6 py-4">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure OTP-based e-signature powered by Creator Armour</span>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const renderGlobalOverlays = () => {
    const activeOverlayDeal = selectedDealPage || overlayDeal;

    return (
      <>
        <AnimatePresence>
          {selectedOffer && renderOfferDetailsSheet(selectedOffer)}
        </AnimatePresence>

        {renderBrandSigningPortal()}

        {/* Dispute escalation modal */}
        {showDisputeEscalationModal && activeOverlayDeal && (
          <DisputeEscalationModal
            dealId={String(activeOverlayDeal.id || '')}
            brandName={activeOverlayDeal.brand_name || profile?.business_name || 'Creator'}
            onClose={() => {
              setShowDisputeEscalationModal(false);
              setOverlayDeal(null);
            }}
            onSuccess={(_resolution: any, newStatus: string) => {
              setShowDisputeEscalationModal(false);
              setOverlayDeal(null);
              setSelectedDealPage((prev: any) => (prev?.id === activeOverlayDeal.id
                ? { ...prev, status: newStatus, updated_at: new Date().toISOString() }
                : prev));
              onRefresh?.();
            }}
          />
        )}

        {/* Confirm payment pending modal */}
        {showConfirmPaymentModal && activeOverlayDeal && (
          <ConfirmPaymentPendingModal
            dealId={String(activeOverlayDeal.id || '')}
            dealAmount={Number(activeOverlayDeal.deal_amount || 0) || undefined}
            creatorName={activeOverlayDeal.creator_name || activeOverlayDeal.creator_username || 'Creator'}
            onClose={() => {
              setShowConfirmPaymentModal(false);
              setOverlayDeal(null);
            }}
          />
        )}

        {/* Brand shipping address modal */}
        {showBrandShippingModal && activeOverlayDeal && (
          <BrandShippingAddressModal
            dealId={String(activeOverlayDeal.id || '')}
            creatorName={activeOverlayDeal.creator_name || activeOverlayDeal.creator_username || 'Creator'}
            onClose={() => {
              setShowBrandShippingModal(false);
              setOverlayDeal(null);
            }}
            onSuccess={() => {
              setShowBrandShippingModal(false);
              setOverlayDeal(null);
              onRefresh?.();
            }}
          />
        )}
      </>
    );
  };

  if (selectedDealPage) {
    return (
      <>
        {renderBrandDealDetail(selectedDealPage)}
        {renderGlobalOverlays()}
      </>
    );
  }

  return (
    <div className={cn('fixed inset-0 font-sans selection:bg-primary/25 overflow-hidden', bgColor, textColor)}>
      {isDark && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent" />
          <div className="absolute top-[-12%] left-[-14%] w-[45%] h-[45%] bg-primary/20 rounded-full blur-[140px]" />
          <div className="absolute top-[8%] right-[-18%] w-[48%] h-[48%] bg-info/18 rounded-full blur-[160px]" />
          <div className="absolute bottom-[-14%] left-[20%] w-[52%] h-[52%] bg-primary/12 rounded-full blur-[170px]" />
        </div>
      )}

	      {!isDark && (
	        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
	          <div className="absolute inset-0 bg-background" />
	        </div>
	      )}

      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 inset-x-0 flex justify-center pointer-events-none z-[60]"
        style={{ transform: `translateY(${pullDistance - 44}px)`, opacity: pullDistance > 10 ? 1 : 0 }}
      >
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg border', isDark ? 'bg-[#0B0F14]/90 border-border' : 'bg-secondary/90 border-border')}>
          {isRefreshing ? <Loader2 className={cn('w-5 h-5 animate-spin', isDark ? 'text-foreground/60' : 'text-muted-foreground')} /> : <div className={cn('w-2.5 h-2.5 rounded-full', isDark ? 'bg-primary/70' : 'bg-primary/70')} />}
        </div>
      </div>

      <div
        className="h-full overflow-y-auto overflow-x-hidden relative z-10 pb-dashboard scrollbar-hide"
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
          {isLoading && activeTab === 'dashboard' ? (
            <BrandDashboardSkeleton isDark={isDark} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
            <div className="px-6 pb-4 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>

              {/* Brand Getting Started Banner — shown when no deals exist */}
              {!isLoading && deals.length === 0 && (
                <div className="mb-5 p-4 rounded-[2.5rem] bg-gradient-to-r from-emerald-50 to-teal-50 border border-primary/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-muted-foreground">Get started with your first deal</p>
                      <p className="text-[12px] text-muted-foreground">Pick a creator and send a protected offer</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { n: 1, label: 'Find a creator in your niche', action: () => navigate('/discover-creators') },
                      { n: 2, label: 'Send a protected offer', action: () => navigate('/brand-dashboard?tab=creators') },
                      { n: 3, label: 'Track deals and get paid', action: () => navigate('/brand-dashboard?tab=collabs') },
                    ].map(step => (
                      <button
                        key={step.n}
                        onClick={step.action}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/20 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-black flex items-center justify-center">{step.n}</span>
                        <span className="text-[13px] font-semibold text-muted-foreground">{step.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <button type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setShowActionSheet(true);
                  }}
                  className={cn('w-10 h-10 -ml-1 rounded-2xl border flex items-center justify-center transition-all active:scale-95', isDark ? 'border-border bg-card text-foreground/70' : 'border-border bg-secondary/80 text-muted-foreground shadow-sm')}
                >
                  <Menu className="w-6 h-6" strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-2 font-semibold text-[16px] tracking-tight">
                  <Shield className={cn('w-4 h-4', isDark ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={textColor}>Brand Console</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                    }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'flex items-center gap-1 px-2.5 h-10 rounded-2xl border transition-all duration-300',
                      isDark ? 'bg-card border-border text-foreground/70' : 'bg-secondary/80 border-border text-muted-foreground shadow-sm'
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
                    <button type="button"
                      onClick={() => setNotificationsOpen((v) => !v)}
                      className={cn('relative w-11 h-11 rounded-2xl border flex items-center justify-center transition-all active:scale-95', isDark ? 'border-border bg-card text-foreground/70' : 'border-border bg-secondary/80 text-muted-foreground shadow-sm')}
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 text-[8px] font-black flex items-center justify-center text-foreground"
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
                            ? 'bg-[#0A0A0B]/95 backdrop-blur-xl border-border text-foreground'
                            : 'bg-secondary/95 backdrop-blur-xl border-border/60 text-muted-foreground'
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 px-1">
                          <p className={cn('text-[11px] font-black uppercase tracking-widest', isDark ? 'text-foreground/40' : 'text-muted-foreground')}>
                            Updates
                          </p>
                          <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isDark ? 'bg-primary' : 'bg-primary')} />
                        </div>
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                          {notifications.map((n: any) => (
                            <button type="button"
                              key={n.id}
                              onClick={() => {
                                setNotificationsOpen(false);
                                if (n.href) navigate(n.href);
                              }}
                              className={cn(
                                'w-full text-left p-3 rounded-2xl border transition-all active:scale-[0.98]',
                                isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-secondary/80 border-[#E5E5EA] hover:bg-card backdrop-blur-xl'
                              )}
                            >
                              <p className={cn('text-[13px] font-bold leading-tight', textColor)}>{n.title}</p>
                              <p className={cn('text-[11px] mt-1 opacity-50', textColor)}>{n.time}</p>
                            </button>
                          ))}
                          {notifications.length === 0 && (
                            <div className={cn('p-6 text-center rounded-2xl border', isDark ? 'border-border bg-card' : 'border-border bg-card')}>
                              <p className={cn('text-[12px] font-bold opacity-50', textColor)}>No updates yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="button"
                    onClick={() => {
                      triggerHaptic(HapticPatterns.light);
                      setActiveTab('profile');
                    }}
                    className={cn('w-10 h-10 rounded-2xl border overflow-hidden transition-all active:scale-95', borderColor, isDark ? 'bg-card' : 'bg-secondary/80 shadow-sm')}
                  >
                    <img alt={brandName} src={brandLogo} loading="eager" fetchpriority="high" className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>


            </div>

            <div className="px-6 pb-20">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <BrandDashboardTab 
                    key="dashboard"
                    isDark={isDark}
                    textColor={textColor}
                    secondaryTextColor={secondaryTextColor}
                    borderColor={borderColor}
                    cardBgColor={cardBgColor}
                    brandName={brandName}
                    brandLogo={brandLogo}
                    hasUploadedBrandLogo={hasUploadedBrandLogo}
                    navigate={navigate}
                    activeDealsList={activeDealsList}
                    pendingOffersList={pendingOffersList}
                    completedDealsList={completedDealsList}
                    activeCollabTab={activeCollabTab}
                    setDashboardCollabTab={setDashboardCollabTab}
                    visibleCollabItems={visibleCollabItems}
                    setSelectedOffer={setSelectedOffer}
                    handleBrandDealPrimaryAction={handleBrandDealPrimaryAction}
                    showSignatureDebug={showSignatureDebug}
                    isLoadingSuggestedCreators={isLoadingSuggestedCreators}
                    suggestedCreators={suggestedCreators}
                    getReliabilityLines={getReliabilityLines}
                    getSmartTags={getSmartTags}
                    setActiveTab={setActiveTab}
                    openCreateOfferSheet={openCreateOfferSheet}
                    resolveDealProductImageUrl={resolveDealProductImageUrl}
                  />
                )}
                {activeTab === 'collabs' && (
                  <BrandCollabsTab 
                    key="collabs"
                    isDark={isDark}
                    textColor={textColor}
                    secondaryTextColor={secondaryTextColor}
                    borderColor={borderColor}
                    activeCollabTab={activeCollabTab}
                    setActiveTab={setActiveTab}
                    pendingOffersList={pendingOffersList}
                    activeDealsList={activeDealsList}
                    completedDealsList={completedDealsList}
                    visibleCollabItems={visibleCollabItems}
                    setSelectedOffer={setSelectedOffer}
                    handleBrandDealPrimaryAction={handleBrandDealPrimaryAction}
                    openCreateOfferSheet={openCreateOfferSheet}
                    resolveDealProductImageUrl={resolveDealProductImageUrl}
                  />
                )}
                {activeTab === 'creators' && (
                  <BrandCreatorsTab 
                    key="creators"
                    isDark={isDark}
                  />
                )}
                {activeTab === 'profile' && (
                  <BrandProfileTab 
                    key="profile"
                    isDark={isDark}
                    pendingOffersList={pendingOffersList}
                    activeDealsList={activeDealsList}
                    onLogout={onLogout}
                  />
                )}
                {activeTab === 'payments' && (
                  <BrandPaymentsTab 
                    key="payments"
                    isDark={isDark}
                    textColor={textColor}
                    secondaryTextColor={secondaryTextColor}
                    borderColor={borderColor}
                  />
                )}
              </AnimatePresence>
            </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className={cn(
        'fixed bottom-0 inset-x-0 z-50 transition-all duration-500', 
        isDark ? 'border-t border-white/5 bg-[#061318]/80' : 'border-t border-slate-100 bg-white/80'
      )} style={{ backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center justify-between px-8 py-3 pb-safe">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('dashboard'); }} 
            className="flex flex-col items-center gap-1 w-12"
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              activeTab === 'dashboard' ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : 'bg-transparent'
            )}>
              <LayoutDashboard className={cn('w-[24px] h-[24px] transition-colors duration-300', activeTab === 'dashboard' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)} />
            </div>
            <span className={cn('text-[9px] font-black uppercase tracking-widest transition-colors duration-300', activeTab === 'dashboard' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)}>Home</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} 
            className="flex flex-col items-center gap-1 w-12"
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              activeTab === 'collabs' ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : 'bg-transparent'
            )}>
              <Handshake className={cn('w-[24px] h-[24px] transition-colors duration-300', activeTab === 'collabs' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)} />
            </div>
            <span className={cn('text-[9px] font-black uppercase tracking-widest transition-colors duration-300', activeTab === 'collabs' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)}>Deals</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={() => { triggerHaptic(HapticPatterns.success); openCreateOfferSheet(); }} 
            className="relative flex flex-col items-center -mt-10"
          >
            <div className={cn(
              'w-16 h-16 rounded-[22px] flex items-center justify-center transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]',
              isDark 
                ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-2 border-white/20 text-white' 
                : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-2 border-white text-white'
            )}>
              <Plus className="w-8 h-8" />
            </div>
            <span className={cn('text-[10px] font-black uppercase tracking-[0.15em] mt-2 whitespace-nowrap', isDark ? 'text-white/40' : 'text-slate-400')}>Offer</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} 
            className="flex flex-col items-center gap-1 w-12"
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              activeTab === 'creators' ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : 'bg-transparent'
            )}>
              <User className={cn('w-[24px] h-[24px] transition-colors duration-300', activeTab === 'creators' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)} />
            </div>
            <span className={cn('text-[9px] font-black uppercase tracking-widest transition-colors duration-300', activeTab === 'creators' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)}>Find</span>
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('profile'); }} 
            className="flex flex-col items-center gap-1 w-12"
          >
            <div className={cn(
              "p-2 rounded-xl transition-all duration-300",
              activeTab === 'profile' ? (isDark ? 'bg-blue-500/10' : 'bg-blue-50') : 'bg-transparent'
            )}>
              <Settings className={cn('w-[24px] h-[24px] transition-colors duration-300', activeTab === 'profile' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)} />
            </div>
            <span className={cn('text-[9px] font-black uppercase tracking-widest transition-colors duration-300', activeTab === 'profile' ? (isDark ? 'text-blue-400' : 'text-blue-600') : secondaryTextColor)}>More</span>
          </motion.button>
        </div>
      </div>

	      <AnimatePresence>
	        {showActionSheet && [
	          <motion.div
	            key="actionSheetBackdrop"
	            initial={{ opacity: 0 }}
	            animate={{ opacity: 1 }}
	            exit={{ opacity: 0 }}
	            onClick={() => setShowActionSheet(false)}
	            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md"
	          />,
	          <motion.div
	            key="actionSheetPanel"
	            initial={{ y: '100%' }}
	            animate={{ y: 0 }}
	            exit={{ y: '100%' }}
	            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
	            className={cn('fixed bottom-0 inset-x-0 z-[110] rounded-t-[2.5rem] border-t p-6 pb-safe overflow-hidden shadow-2xl', isDark ? 'bg-background border-border' : 'bg-card border-border')}
	          >
	              <div className="w-12 h-1 bg-background/20 rounded-full mx-auto mb-6" />
	              <div className="max-w-md mx-auto">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-foreground' : 'text-muted-foreground')}>Start a collaboration</h2>
                    <p className={cn('text-[13px] mt-1 opacity-60', isDark ? 'text-foreground' : 'text-muted-foreground')}>Send an offer, then track it end-to-end.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
	                  <button type="button"
	                    onClick={() => {
	                      if (!hasUploadedBrandLogo) {
	                        toast.error('Upload your brand logo first', {
	                          description: 'Go to Brand Settings \u2192 Upload logo \u2192 Come back and send your offer',
	                        });
	                        setShowActionSheet(false);
                        navigate('/brand-settings');
                        return;
                      }
                      setShowActionSheet(false);
                      // Stay inside the brand console (avoid jumping to the public directory page).
                      setActiveTab('creators');
                    }}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all active:scale-[0.99]',
                      isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-primary/30 hover:from-emerald-400 hover:to-sky-400 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-primary/40 hover:from-emerald-500 hover:to-sky-500 text-foreground shadow-lg'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-secondary/50' : 'bg-secondary/50')}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black uppercase tracking-widest">Send new offer</p>
                        <p className="text-[12px] opacity-75 mt-1">Pick a creator and send a protected offer</p>
                      </div>
                    </div>
                  </button>

                  <button type="button"
                    onClick={() => {
                      setShowActionSheet(false);
                      setActiveTab('creators');
                    }}
                    className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                  >
                    <p className={cn('text-[13px] font-bold', textColor)}>Browse creators</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Search and shortlist profiles</p>
                  </button>

                  <button type="button" onClick={() => { setShowActionSheet(false); toast.info('Import creator profile', { description: 'Coming soon.' }); }} className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}>
                    <p className={cn('text-[13px] font-bold', textColor)}>Import creator profile</p>
                    <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Paste a link to add quickly</p>
                  </button>

                  <div className="pt-2">
                    <p className={cn('text-[11px] font-black uppercase tracking-widest mb-2 opacity-50', textColor)}>Notifications</p>
                  </div>
                  {!isPushSubscribed && isPushSupported && (
                    <button type="button"
                      disabled={isPushBusy}
                      onClick={async () => {
                        await handleEnablePush();
                        setShowActionSheet(false);
                      }}
                      className={cn('p-4 rounded-2xl border text-left transition-all active:scale-[0.99] disabled:opacity-50', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background')}
                    >
                      <p className={cn('text-[13px] font-bold', textColor)}>Enable deal alerts</p>
                      <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Get notified when creators reply</p>
                    </button>
                  )}
                </div>
              </div>
	          </motion.div>,
	        ]}
	      </AnimatePresence>
	      <AnimatePresence>
	        {showBudgetModal && [
	          <motion.div
	            key="budgetModalBackdrop"
	            initial={{ opacity: 0 }}
	            animate={{ opacity: 1 }}
	            exit={{ opacity: 0 }}
	            onClick={() => setShowBudgetModal(false)}
	            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl"
	          />,
	          <motion.div
	            key="budgetModalPanel"
	            initial={{ opacity: 0, scale: 0.92, y: 20 }}
	            animate={{ opacity: 1, scale: 1, y: 0 }}
	            exit={{ opacity: 0, scale: 0.92, y: 20 }}
	            className={cn(
	              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[130] w-[90%] max-w-sm rounded-[2rem] border p-6 shadow-2xl',
	              isDark ? 'bg-background border-border' : 'bg-card border-border'
	            )}
	          >
	              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
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
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    enterKeyHint="done"
                    className={cn(
                      'w-full h-12 px-4 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none',
                      isDark ? 'bg-card border-border text-foreground' : 'bg-background border-border text-muted-foreground'
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className={cn('flex-1 h-12 rounded-xl font-bold text-sm', isDark ? 'bg-card text-foreground' : 'bg-background text-muted-foreground')}
                  >
                    Cancel
                  </button>
	                  <button type="button"
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
	                    className={cn("flex-[2] h-12 rounded-xl text-sm active:scale-95 flex items-center justify-center gap-2", dsButtons.ecosystemPrimary)}
	                  >
	                    Save budget
	                  </button>
                </div>
              </div>
	          </motion.div>,
	        ]}
	      </AnimatePresence>

        {renderGlobalOverlays()}

        {/* Notification Pop-up */}
        {showPushPrompt && (
          <PushNotificationPrompt 
            onEnable={handleEnablePush}
            onDismiss={() => {
              dismissPushPrompt();
              try {
                localStorage.setItem(pushPromptStorageKey, '1');
                setPushPromptDismissedLocal(true);
              } catch {}
              setShowPushPrompt(false);
            }}
            isBusy={isPushBusy}
            isDark={isDark}
          />
        )}
      </div>
    );
};

export default BrandMobileDashboard;

const BrandDashboardTab = React.memo(({
  isDark,
  textColor,
  secondaryTextColor,
  borderColor,
  cardBgColor,
  brandName,
  brandLogo,
  hasUploadedBrandLogo,
  navigate,
  activeDealsList,
  pendingOffersList,
  completedDealsList,
  activeCollabTab,
  setDashboardCollabTab,
  visibleCollabItems,
  setSelectedOffer,
  handleBrandDealPrimaryAction,
  showSignatureDebug,
  isLoadingSuggestedCreators,
  suggestedCreators,
  getReliabilityLines,
  getSmartTags,
  setActiveTab,
  openCreateOfferSheet,
  resolveDealProductImageUrl
}: any) => {
  const activeValue = (activeDealsList || []).reduce((sum: number, d: any) => sum + Number(d?.deal_amount || d?.exact_budget || 0), 0);
  const pendingCounterCount = pendingOffersList.length;
  
  const contractsWaitingSignature = activeDealsList.filter((d: any) => {
    const s = effectiveDealStatus(d);
    return s === 'CONTRACT_READY' || s === 'SENT' || s === 'AWAITING_BRAND_SIGNATURE';
  }).length;
  
  const needsActionDeals = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction).length;
  const needsActionTotal = pendingCounterCount + needsActionDeals;
  
  const contentPendingReview = activeDealsList.filter((d: any) => {
    const s = effectiveDealStatus(d);
    return s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE';
  }).length;
  
  const attentionTotal = pendingCounterCount + contractsWaitingSignature + contentPendingReview;
  
  const newToday = activeDealsList.filter((d: any) => {
    const created = d?.created_at ? new Date(d.created_at) : null;
    if (!created || Number.isNaN(created.getTime())) return false;
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).length;

  return (
    <>
      {/* Welcome Header moved into Tab */}
      <div className="relative z-10 -mt-2 mb-6">
        <div className="pt-8 pb-4">
          <div className="flex items-start justify-between gap-6 mb-2">
            <div className="flex flex-col flex-1 min-w-0">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  'text-[10px] font-black uppercase tracking-[0.3em] mb-1.5', 
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )}
              >
                Brand Dashboard
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className={cn('text-[28px] font-black tracking-tight leading-tight mb-2', textColor)}
              >
                Welcome back, {brandName || 'Partner'} 👋
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn('text-[14px] opacity-70 leading-relaxed', secondaryTextColor)}
              >
                Your performance and incoming applications are ready for you below.
              </motion.p>
            </div>
            {brandLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="flex-shrink-0"
              >
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] p-0.5 border-2 shadow-2xl relative group",
                  isDark ? "bg-white/5 border-white/10 shadow-blue-500/10" : "bg-white border-blue-100 shadow-blue-200/50"
                )}>
                  <div className="w-full h-full rounded-[1.3rem] overflow-hidden">
                    <img 
                      src={brandLogo} 
                      alt="Brand Logo" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                      loading="eager"
                      fetchpriority="high"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-[#020D0A] flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      {!hasUploadedBrandLogo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mb-5 p-4 rounded-[24px] border shadow-sm',
            isDark ? 'bg-warning/10 border-warning/20' : 'bg-warning/80 border-warning'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', isDark ? 'bg-warning/15' : 'bg-warning/10')}>
              <Camera className={cn('w-5 h-5', isDark ? 'text-warning' : 'text-warning')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[13px] font-bold', textColor)}>Upload your brand logo</p>
              <p className={cn('text-[12px] mt-1 opacity-70', textColor)}>
                Required before sending offers—creators respond faster when they recognize you.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => navigate('/brand-settings')}
                  className={cn('px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest', isDark ? 'bg-secondary/50 text-foreground hover:bg-secondary/15' : 'bg-card text-muted-foreground border border-warning')}
                >
                  Upload logo
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium Campaign Center Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.03, type: 'spring', damping: 20 }} 
        className={cn(
          'mb-6 rounded-[2.5rem] border overflow-hidden relative group', 
          isDark 
            ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-950/20 to-[#020617] shadow-[0_30px_60px_rgba(0,0,0,0.4)]' 
            : 'border-primary/60 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 shadow-[0_25px_55px_rgba(16,185,129,0.22)]'
        )}
      >
        <div className={cn('absolute inset-0 pointer-events-none opacity-20', isDark ? 'bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.3),transparent)]' : 'bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent)]')} />
        
        <div className="relative p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className={cn('text-[10px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-white/80')}>Active Investment</p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className={cn('text-[38px] font-black tracking-tighter leading-none', isDark ? 'text-white' : 'text-white')}>
                    ₹<CountUp end={Number(activeValue) || 0} duration={1.5} separator="," decimals={0} />
                  </span>
                  {newToday > 0 && (
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white backdrop-blur-md border border-white/20 animate-pulse')}>
                      +{newToday} Today
                    </span>
                  )}
                </div>
                <p className={cn('text-[13px] font-bold mt-3', isDark ? 'text-white/60' : 'text-white/90')}>
                  {activeDealsList.length} Collaboration{activeDealsList.length === 1 ? '' : 's'} running
                </p>
              </div>
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-2xl border', isDark ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/30')}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className={cn('p-4 rounded-[2rem] border backdrop-blur-md transition-all', isDark ? 'bg-white/5 border-white/10' : 'bg-white/15 border-white/20')}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/20 text-white')}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <p className={cn('text-[13px] font-black', isDark ? 'text-white' : 'text-white')}>
                    {attentionTotal > 0 ? `${attentionTotal} Actions Pending` : 'All caught up'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    if (needsActionTotal > 0) setActiveTab('collabs', 'action_required');
                    else openCreateOfferSheet();
                  }}
                  className={cn(
                    'px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl',
                    isDark 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400' 
                      : 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-emerald-900/10'
                  )}
                >
                  {needsActionTotal > 0 ? 'Review Now' : 'New Offer'}
                </button>
              </div>
              {attentionTotal > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
                  {pendingCounterCount > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white">
                      {pendingCounterCount} Pending Offers • 
                    </span>
                  )}
                  {contentPendingReview > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white">
                      {contentPendingReview} Review Items • 
                    </span>
                  )}
                  {contractsWaitingSignature > 0 && (
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-white">
                      {contractsWaitingSignature} Signature Pending
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>



      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-50', textColor)}>Suggested creators</p>
            <p className={cn('text-[12px] opacity-60 mt-1', textColor)}>Pick based on reliability — not views.</p>
          </div>
          <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('creators'); }} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
            View all
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {(isLoadingSuggestedCreators ? Array.from({ length: 3 }).map((_, i) => ({ id: `sk-${i}`, name: 'Creator' })) : suggestedCreators.slice(0, 6)).map((c: any) => (
             <motion.div 
               key={c.id} 
               whileTap={{ scale: 0.985 }}
               role="button"
               tabIndex={0}
               onClick={() => {
                 const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                 if (!handle) {
                   triggerHaptic(HapticPatterns.light);
                   setActiveTab('creators');
                   return;
                 }
                 triggerHaptic(HapticPatterns.light);
                 navigate(`/${handle}`);
               }}
               className={cn('min-w-[290px] p-5 rounded-[2.5rem] border cursor-pointer', cardBgColor, borderColor, isDark ? '' : 'shadow-[0_18px_45px_rgba(15,23,42,0.08)]')}
             >
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
                {getReliabilityLines(c).map((line: string) => (
                  <p key={line} className={cn('text-[12px] opacity-70', textColor)}>{line}</p>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {getSmartTags(c).map((t: string) => (
                  <span key={t} className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-background')}>
                    {t}
                  </span>
                ))}
                {getSmartTags(c).length === 0 && (
                  <span className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', isDark ? 'border-border text-foreground/60 bg-card' : 'border-border text-muted-foreground bg-background')}>
                    ✔ Verified profile
                  </span>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button type="button"
                  onClick={() => {
                    const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                    if (!handle) {
                      triggerHaptic(HapticPatterns.light);
                      setActiveTab('creators');
                      return;
                    }
                    triggerHaptic(HapticPatterns.light);
                    navigate(`/${handle}`);
                  }}
                  className={cn('flex-1 py-2.5 rounded-2xl border text-[12px] font-bold transition-all active:scale-[0.98]', isDark ? 'border-border bg-card hover:bg-secondary/50 text-foreground' : 'border-border bg-card hover:bg-background text-muted-foreground')}
                >
                  View profile
                </button>
                <button type="button"
                  onClick={() => {
                    const handle = String(c?.username || c?.handle || '').trim().replace(/^@+/, '');
                    if (!handle) {
                      triggerHaptic(HapticPatterns.light);
                      toast.error('Creator username missing', { description: 'Please try another creator.' });
                      return;
                    }
                    triggerHaptic(HapticPatterns.success);
                    navigate(`/${handle}?offer=true`);
                  }}
                  className={cn('flex-1 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-[0.98]', isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-foreground' : 'bg-gradient-to-br from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-foreground')}
                >
                  Send offer
                </button>
              </div>
             </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={cn('p-6 rounded-[2.5rem] border relative overflow-hidden mb-10', isDark ? 'bg-background border-border/5' : 'bg-card border-border shadow-sm')}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
          <Plus size={120} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/12 flex items-center justify-center">
            <Plus className={cn('w-5 h-5', isDark ? 'text-primary' : 'text-primary')} />
          </div>
          <div>
            <h3 className={cn('text-[15px] font-bold tracking-tight', textColor)}>Quick actions</h3>
            <p className={cn('text-[11px] opacity-40 uppercase font-black tracking-widest', textColor)}>Shortcuts</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button"
            onClick={() => {
              triggerHaptic(HapticPatterns.light);
              setActiveTab('creators');
            }}
            className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}
          >
            <User className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
            <span className={cn('text-[11px] font-bold', textColor)}>Find creators</span>
          </button>
          <button type="button"
            onClick={() => { triggerHaptic(HapticPatterns.success); openCreateOfferSheet(); }}
            className={cn(
              'flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]',
              isDark ? 'bg-gradient-to-br from-emerald-500 to-sky-500 border-primary/30 hover:from-emerald-400 hover:to-sky-400 text-foreground shadow-[0_10px_35px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-br from-emerald-600 to-sky-600 border-primary/40 hover:from-emerald-500 hover:to-sky-500 text-foreground shadow-lg'
            )}
          >
            <Send className="w-4 h-4 mb-2 opacity-90" />
            <span className="text-[11px] font-black uppercase tracking-widest">Send offer</span>
          </button>
          <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); setActiveTab('collabs'); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}>
            <Handshake className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
            <span className={cn('text-[11px] font-bold', textColor)}>Collabs</span>
          </button>
          <button type="button" onClick={() => { triggerHaptic(HapticPatterns.light); toast.info('Payments', { description: 'Invoices, GST, UPI payouts — coming soon.' }); }} className={cn('flex flex-col items-center justify-center py-4 rounded-[1.5rem] border transition-all active:scale-[0.97]', isDark ? 'bg-card border-border hover:bg-secondary/50' : 'bg-background border-border hover:bg-background shadow-sm')}>
            <CreditCard className={cn('w-4 h-4 mb-2', secondaryTextColor)} />
            <span className={cn('text-[11px] font-bold', textColor)}>Payments</span>
          </button>
        </div>
      </motion.div>
    </>
  );
});

const BrandCollabsTab = React.memo(({
  isDark,
  textColor,
  secondaryTextColor,
  borderColor,
  activeCollabTab,
  setActiveTab,
  pendingOffersList,
  activeDealsList,
  completedDealsList,
  visibleCollabItems,
  setSelectedOffer,
  handleBrandDealPrimaryAction,
  openCreateOfferSheet,
  resolveDealProductImageUrl
}: any) => {
  const needsActionDeals = activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction);
  const needsActionOffers = pendingOffersList;
  const needsActionTotal = needsActionDeals.length + needsActionOffers.length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={cn('text-[16px] font-bold tracking-tight', textColor)}>Collaborations</h2>
        <div className="flex items-center gap-3">
          {needsActionTotal > 0 && (
            <div className={cn('px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm', isDark ? 'bg-warning/10 text-warning border-warning/20' : 'bg-orange-50 text-orange-600 border-orange-200')}>
              {needsActionTotal} need your review
            </div>
          )}
          <button type="button" onClick={() => setActiveTab('dashboard')} className={cn('text-[12px] font-bold', isDark ? 'text-info' : 'text-info')}>
          Back
          </button>
        </div>
      </div>

      <div className={cn('mb-4 rounded-[22px] border p-1.5 flex gap-1.5 backdrop-blur-xl shadow-sm', isDark ? 'bg-secondary/[0.06] border-border/50' : 'bg-slate-100/80 border-slate-200/60')}>
        {[
          { key: 'action_required', label: 'Awaiting Response', count: pendingOffersList.length + activeDealsList.filter((d: any) => brandDealCardUi(d).needsAction).length },
          { key: 'active', label: 'Active', count: activeDealsList.length },
          { key: 'completed', label: 'Completed', count: completedDealsList.length },
        ].map((item) => {
          const isSelected = activeCollabTab === item.key;
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                triggerHaptic(HapticPatterns.light);
                setActiveTab('collabs', item.key as BrandCollabTab);
              }}
              className={cn(
                'flex-1 h-11 rounded-[18px] px-3 transition-all active:scale-[0.98] flex items-center justify-center gap-2',
                isSelected
                  ? isDark
                    ? 'bg-card text-foreground shadow-[0_10px_28px_rgba(255,255,255,0.06)]'
                    : 'bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.25)]'
                  : isDark
                    ? 'text-foreground/60 hover:bg-secondary/[0.05]'
                    : 'text-muted-foreground hover:bg-secondary/40'
              )}
            >
              <span className={cn('text-[11px] font-black uppercase tracking-widest', isSelected ? 'opacity-95' : 'opacity-70')}>{item.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-black tabular-nums transition-all duration-300',
                  isSelected
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-white/20 text-white')
                    : (isDark ? 'bg-white/5 text-foreground/40' : 'bg-black/5 text-muted-foreground/60')
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn('rounded-[28px] border overflow-hidden backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.12)]', borderColor, isDark ? 'bg-secondary/[0.04] shadow-black/20' : 'bg-card shadow-sm')}>
        <div className={cn('p-4 backdrop-blur-md', isDark ? 'border-b border-border bg-secondary/[0.03]' : 'border-b border-border/80 bg-secondary/45')}>
          <p className={cn('text-[12px] font-black uppercase tracking-widest opacity-50', textColor)}>
            {activeCollabTab === 'action_required' ? 'Awaiting Response' : activeCollabTab === 'active' ? 'Active Deals' : 'Completed Deals'}
          </p>
        </div>
        {visibleCollabItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className={cn('text-[12px] font-bold opacity-50', textColor)}>
              {activeCollabTab === 'action_required'
                ? 'All caught up! Send an offer to get started.'
                : activeCollabTab === 'active'
                  ? 'No active collabs — complete a deal first'
                  : 'No completed collabs yet — finish an active deal'}
            </p>
            {activeCollabTab === 'action_required' && (
              <Button type="button" onClick={() => openCreateOfferSheet()} className={cn('mt-4 rounded-2xl', isDark ? 'bg-primary hover:bg-primary text-foreground' : 'bg-primary hover:bg-primary text-foreground')}>
                <Send className="w-4 h-4 mr-2" /> Send new offer
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4 pb-24">
            {visibleCollabItems.slice(0, 50).map((item: any, idx: number) => {
              const itemKey = `collab-list-${item.id || idx}-${item.updated_at || ''}`;
              const isPendingItem = activeCollabTab === 'action_required';
              const due = isPendingItem ? offerExpiryLabel(item) : deadlineLabel(item);
              const amount = Number(item?.deal_amount || item?.exact_budget || item?.barter_value || item?.product_value || 0);
              const creatorName = firstNameish(item?.profiles, item?.creator_name || item?.creator_email);
              let creatorMeta = item?.profiles?.username || item?.creator_name || item?.creator_email || 'Creator';
              if (item?.profiles?.username && creatorMeta === item.profiles.username) creatorMeta = `@${creatorMeta}`;
              const creatorAvatar = item?.profiles?.avatar_url || item?.profiles?.profile_image_url || item?.profiles?.instagram_profile_photo || item?.creator_avatar_url || item?.creator_photo_url || '';
              
              if (isPendingItem && ['pending', 'countered', 'sent', 'offer_sent', 'submitted', 'action_required', 'action-required'].includes(normalizeStatus(item?.status))) {
                const sentIso = item?.created_at || item?.updated_at || null;
                const isCountered = normalizeStatus(item?.status) === 'countered';
                const sentHours = sentIso ? hoursSince(sentIso) : null;
                const isNoResponse = !isCountered && sentHours !== null && sentHours >= 24;
                
                const statusLine = isCountered 
                  ? 'Creator proposed changes — review and update the offer.' 
                  : 'You can follow up or modify the offer.';

                return (
                  <motion.div
                    key={itemKey}
                    whileTap={{ scale: 0.985 }}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedOffer(item)}
                    className={cn(
                      'w-full p-5 rounded-[2.5rem] border transition-all duration-500 backdrop-blur-2xl relative overflow-hidden group cursor-pointer',
                      borderColor,
                      isDark
                        ? 'bg-gradient-to-br from-secondary/[0.08] via-secondary/[0.04] to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:border-primary/20'
                        : 'bg-white shadow-[0_15px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative">
                          <Avatar className={cn('w-12 h-12 rounded-2xl border-2 shadow-xl shrink-0 transition-transform duration-500 group-hover:scale-105', isDark ? 'border-white/10 ring-4 ring-white/5' : 'border-white ring-4 ring-slate-100')}>
                            <AvatarImage 
                              src={safeImageSrc(item?.profiles?.instagram_profile_photo || creatorAvatar)} 
                              alt={creatorName} 
                              className="object-cover" 
                            />
                            <AvatarFallback className={cn('rounded-2xl font-black', isDark ? 'bg-secondary/20 text-foreground' : 'bg-slate-100 text-slate-400')}>
                              {creatorName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                         </div>
                        <div className="min-w-0">
                          <h4 className={cn('text-[17px] font-black tracking-tight truncate leading-tight', textColor)}>{creatorName}</h4>
                          <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 truncate mt-1', textColor)}>{creatorMeta}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-3">
                        <p className={cn('text-[22px] font-black tracking-tighter leading-none', isDark ? 'text-white' : 'text-slate-900')}>
                          {amount > 0 ? formatCompactINR(amount) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[12px] font-bold mb-4 relative z-10">
                      <div className={cn('min-w-0 truncate px-3 py-1.5 rounded-full border bg-white/5 border-white/5', secondaryTextColor)}>
                        {String(formatDeliverables(item) || item?.collab_type || 'Collaboration').replaceAll(',', ' • ')}
                      </div>
                      {due?.text && (
                        <div className={cn(
                          'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm',
                          due.tone === 'danger'
                            ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100')
                            : due.tone === 'warn'
                              ? (isDark ? 'text-warning' : 'text-warning')
                              : (isDark ? 'bg-white/5 text-white/40 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100')
                        )}>
                          <Clock className="w-3.5 h-3.5" strokeWidth={3} />
                          <span className="text-[10px] uppercase tracking-widest">{due.text}</span>
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      'flex items-center justify-between p-4 rounded-2xl border relative z-10 transition-colors',
                      isCountered || isNoResponse
                        ? (isDark ? 'bg-warning/10 border-warning/30' : 'bg-warning/5 border-warning/20')
                        : (isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100')
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isCountered || isNoResponse ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                        )}>
                          {isCountered ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        </div>
                        <p className={cn(
                          'text-[13px] font-black',
                          isCountered || isNoResponse
                            ? (isDark ? 'text-warning' : 'text-warning')
                            : (isDark ? 'text-white/80' : 'text-slate-700')
                        )}>
                          {statusLine}
                        </p>
                      </div>
                      <ChevronRight className={cn('w-4 h-4', secondaryTextColor)} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(HapticPatterns.light);
                        setSelectedOffer(item);
                      }}
                      className={cn(
                        'mt-4 h-12 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]',
                         isCountered ? 'bg-primary text-foreground shadow-lg shadow-primary/20' : 'bg-secondary/50 text-foreground border border-border/40'
                      )}
                    >
                      {isCountered ? 'Review Counter' : 'View Offer'}
                    </button>
                    {(isNoResponse) && (
                      <div className="mt-4 pt-4 border-t border-border/10 flex items-start justify-between gap-3 relative z-10">
                        <p className={cn('text-[11px] font-bold opacity-60 leading-relaxed', secondaryTextColor)}>
                          Tip: Follow up after 24h for faster replies.
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic(HapticPatterns.light);
                            toast.message('Send reminder', { description: 'Coming soon.' });
                          }}
                          className={cn('text-[11px] font-black uppercase tracking-widest shrink-0 px-3 py-1.5 rounded-lg border border-info/20 hover:bg-info/10 transition-colors', isDark ? 'text-info' : 'text-info')}
                        >
                          Reminder
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              }

              const ui = brandDealCardUi(item);

              return (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.985 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleBrandDealPrimaryAction(undefined, item, ui)}
                  className={cn(
                    'w-full p-5 rounded-[2.5rem] border transition-all duration-500 backdrop-blur-2xl relative overflow-hidden group cursor-pointer',
                    borderColor,
                    isDark
                      ? 'bg-gradient-to-br from-secondary/[0.08] via-secondary/[0.04] to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
                      : 'bg-gradient-to-br from-white/95 via-white/80 to-white/60 shadow-[0_20px_50px_rgba(15,23,42,0.08)]'
                  )}
                >
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative">
                        <Avatar className={cn('w-12 h-12 rounded-2xl border-2 shadow-xl shrink-0 transition-transform duration-500 group-hover:scale-105', isDark ? 'border-white/10 ring-4 ring-white/5' : 'border-white ring-4 ring-slate-100')}>
                          <AvatarImage 
                            src={safeImageSrc(item?.profiles?.instagram_profile_photo || item?.profiles?.avatar_url || item?.profiles?.profile_image_url || item?.creator_avatar_url || item?.creator_photo_url || '')} 
                            alt={creatorName} 
                            className="object-cover" 
                          />
                          <AvatarFallback className={cn('rounded-2xl font-black', isDark ? 'bg-secondary/20 text-foreground' : 'bg-slate-100 text-slate-400')}>
                            {creatorName.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0">
                        <h4 className={cn('text-[17px] font-black tracking-tight truncate leading-tight', textColor)}>{creatorName}</h4>
                        <p className={cn('text-[11px] font-black uppercase tracking-widest opacity-40 truncate mt-1', textColor)}>{creatorMeta}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <p className={cn('text-[22px] font-black tracking-tighter leading-none', isDark ? 'text-white' : 'text-slate-900')}>
                        {amount > 0 ? formatCompactINR(amount) : (isBarterLikeCollab(item) ? 'BARTER' : '—')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-[12px] font-bold mb-4 relative z-10">
                    <div className={cn('min-w-0 truncate px-3 py-1.5 rounded-full border bg-white/5 border-white/5', secondaryTextColor)}>
                      {String(formatDeliverables(item) || item?.collab_type || 'Collaboration').replaceAll(',', ' • ')}
                    </div>
                    {due?.text && (
                      <div className={cn(
                        'shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm',
                        due.tone === 'danger'
                          ? (isDark ? 'bg-rose-500/10 text-rose-200 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-100')
                          : due.tone === 'warn'
                            ? (isDark ? 'text-warning' : 'text-warning')
                            : (isDark ? 'bg-white/5 text-white/40 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100')
                      )}>
                        <Clock className="w-3.5 h-3.5" strokeWidth={3} />
                        <span className="text-[10px] uppercase tracking-widest">{due.text}</span>
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    'flex items-center justify-between p-4 rounded-[2rem] border relative z-10 transition-colors',
                    ui.needsAction
                      ? (isDark ? 'bg-warning/10 border-warning/30' : 'bg-warning/5 border-warning/20')
                      : (isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100')
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        ui.needsAction ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                      )}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <p className={cn(
                        'text-[13px] font-black',
                        ui.needsAction
                          ? (isDark ? 'text-warning' : 'text-warning')
                          : (isDark ? 'text-white/80' : 'text-slate-700')
                      )}>
                        {ui.statusLine}
                      </p>
                    </div>
                    <ChevronRight className={cn('w-4 h-4', secondaryTextColor)} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1.5 w-6 rounded-full',
                            i < ui.step
                              ? (isDark ? 'bg-primary/80' : 'bg-primary')
                              : (isDark ? 'bg-secondary/50' : 'bg-background')
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleBrandDealPrimaryAction(e, item, ui)}
                    disabled={Boolean(ui?.ctaDisabled)}
                    className={cn(
                      'mt-4 h-12 w-full rounded-2xl text-[13px] font-black transition active:scale-[0.98]',
                      dealPrimaryCtaButtonClass(ui?.ctaTone || (ui.needsAction ? 'action' : 'view')),
                      Boolean(ui?.ctaDisabled) && 'opacity-60 cursor-not-allowed active:scale-100'
                    )}
                  >
                    {ui.primaryActionLabel}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});

const BrandCreatorsTab = React.memo(({ isDark }: any) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Discovery Lab (The Swiping Interface) */}
      <div className="mb-10">
        <DiscoveryStack 
          isDark={isDark}
          triggerHaptic={(pattern) => {
            if (pattern === 'medium') triggerHaptic(HapticPatterns.medium);
            else triggerHaptic(HapticPatterns.light);
          }}
        />
      </div>
    </motion.div>
  );
});

const BrandProfileTab = React.memo(({ isDark, pendingOffersList, activeDealsList, onLogout }: any) => {
  const pendingNeedsAction = (pendingOffersList || []).filter((r: any) => normalizeStatus(r?.status) === 'countered').length;
  const activeNeedsAction = (activeDealsList || []).filter((d: any) => brandDealCardUi(d).needsAction).length;
  const needsActionTotal = pendingNeedsAction + activeNeedsAction;
  const contentPendingReview = (activeDealsList || []).filter((d: any) => {
    const s = effectiveDealStatus(d);
    return s === 'CONTENT_DELIVERED' || s === 'REVISION_DONE';
  }).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <BrandSettingsPanel 
        embedded 
        onLogout={() => { void onLogout?.(); }} 
        activeCount={activeDealsList?.length || 0}
        neededActionCount={needsActionTotal}
        reviewCount={contentPendingReview}
      />
    </motion.div>
  );
});

const BrandPaymentsTab = React.memo(({ isDark, textColor, secondaryTextColor, borderColor }: any) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className={cn('mb-5 p-5 rounded-[2.5rem] border overflow-hidden', borderColor, isDark ? 'bg-secondary/[0.04]' : 'bg-secondary/80 backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]')}>
        <h2 className={cn('text-[16px] font-bold tracking-tight mb-1', textColor)}>Payments</h2>
        <p className={cn('text-[13px] opacity-60', secondaryTextColor)}>Track your completed deal payouts below.</p>
      </div>
      <div className={cn('p-5 rounded-[2.5rem] border text-center', borderColor, isDark ? 'bg-card' : 'bg-secondary/80')}>
        <p className={cn('text-[13px] opacity-60', textColor)}>No completed payouts yet.</p>
        <p className={cn('text-[12px] mt-1 opacity-40', textColor)}>Payouts are processed after you mark a deal as complete.</p>
      </div>
    </motion.div>
  );
});
