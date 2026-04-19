/**
 * Shared deal formatting utilities.
 *
 * Extracted from MobileDashboardDemo.tsx and BrandMobileDashboard.tsx to ensure
 * creator and brand dashboards display identical labels and formatting.
 */

import type { BrandDeal } from '@/types';

// ─── Currency ────────────────────────────────────────────────────────────────

export const formatCompactINR = (n: number | string | null | undefined): string => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return `₹${safe.toLocaleString('en-IN')}`;
};

export const formatCompactCount = (n: number | string | null | undefined): string => {
  const num = Number(n);
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString('en-IN');
};

// ─── Followers ───────────────────────────────────────────────────────────────

export const formatFollowers = (n: number | string | null | undefined): string | null => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  if (num >= 1_00_00_000) return `${(num / 1_00_00_000).toFixed(1)}Cr`.replace('.0', '') + ' followers';
  if (num >= 1_00_000) return `${(num / 1_00_000).toFixed(1)}L`.replace('.0', '') + ' followers';
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`.replace('.0', '') + ' followers';
  return `${num} followers`;
};

export const formatFollowersShort = (count: number | null | undefined): string => {
  if (!count || count <= 0) return '—';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(count);
};

// ─── Deliverables ────────────────────────────────────────────────────────────

const uniqStrings = (parts: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const clean = String(p || '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
};

export const formatDeliverables = (row: BrandDeal | null | undefined): string => {
  const d = (row as any)?.deliverables;
  if (!d) return '';
  if (typeof d === 'string') {
    const parts = uniqStrings(
      d.split(/[,•\n]+/g)
        .map((x: string) => x.trim())
        .filter(Boolean),
    );
    if (parts.length <= 1) return d.trim();
    return parts.slice(0, 3).join(' • ');
  }
  if (Array.isArray(d)) {
    const parts = uniqStrings(
      d.map((x: any) => {
        if (!x) return null;
        if (typeof x === 'string') return x.trim();
        const label = x?.type || x?.name || x?.deliverable;
        const qty = x?.qty || x?.count || x?.quantity;
        if (label && qty) return `${qty} ${label}`;
        if (label) return String(label);
        return null;
      }).filter(Boolean) as string[],
    );
    return parts.slice(0, 3).join(' • ');
  }
  try {
    const asJson = JSON.stringify(d);
    return asJson.length > 5 ? asJson : '';
  } catch {
    return '';
  }
};

// ─── Budget ──────────────────────────────────────────────────────────────────

export const formatBudget = (row: BrandDeal | null | undefined): string => {
  const deal = row as any;
  const exact = Number(deal?.exact_budget);
  if (Number.isFinite(exact) && exact > 0) return formatCompactINR(exact);
  const dealAmount = Number(deal?.deal_amount);
  if (Number.isFinite(dealAmount) && dealAmount > 0) return formatCompactINR(dealAmount);
  const range = String(deal?.budget_range || '').trim();
  if (range) return range;
  const barter = Number(deal?.barter_value);
  if (Number.isFinite(barter) && barter > 0) return `${formatCompactINR(barter)} barter`;
  return '';
};

// ─── Time helpers ────────────────────────────────────────────────────────────

export const timeSince = (iso: string | Date | null | undefined): string => {
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

export const hoursSince = (iso: string | Date | null | undefined): number | null => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const hrs = diffMs / (1000 * 60 * 60);
  if (!Number.isFinite(hrs) || hrs < 0) return null;
  return hrs;
};

export const formatLastUpdated = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Deadline / expiry labels ────────────────────────────────────────────────

export type UrgencyTone = 'danger' | 'warn' | 'neutral';

export interface UrgencyLabel {
  text: string;
  tone: UrgencyTone;
}

export const deadlineLabel = (row: BrandDeal | null | undefined): UrgencyLabel | null => {
  const raw = (row as any)?.due_date || (row as any)?.deadline;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: 'Overdue', tone: 'danger' };
  if (diffDays === 0) return { text: 'Due today', tone: 'danger' };
  const dayText = diffDays === 1 ? 'day' : 'days';
  if (diffDays <= 2) return { text: `Due in ${diffDays} ${dayText}`, tone: 'danger' };
  if (diffDays <= 7) return { text: `Due in ${diffDays} ${dayText}`, tone: 'warn' };
  return { text: `Due in ${diffDays} ${dayText}`, tone: 'neutral' };
};

export const offerExpiryLabel = (row: BrandDeal | null | undefined): UrgencyLabel | null => {
  const deal = row as any;
  const raw = deal?.offer_expires_at || deal?.expires_at || null;
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diffDays < 0) return { text: 'Offer expired', tone: 'danger' };
  if (diffDays === 0) return { text: 'Expires today', tone: 'danger' };
  if (diffDays <= 2) return { text: `Expires in ${diffDays}d`, tone: 'danger' };
  if (diffDays <= 7) return { text: `Expires in ${diffDays}d`, tone: 'warn' };
  return { text: `Expires in ${diffDays}d`, tone: 'neutral' };
};

// ─── Status labels (human-readable) ──────────────────────────────────────────

/**
 * Maps a canonical status code to the same human label for both creator and brand.
 * Use `getCanonicalDealStatus()` from `primaryCta.ts` to derive the status first.
 */
export const dealStageLabel = (canonicalStatus: string): string => {
  switch (canonicalStatus) {
    case 'DISPUTED': return 'Issue raised';
    case 'CONTRACT_READY': return 'Contract ready';
    case 'SENT': return 'Awaiting signature';
    case 'FULLY_EXECUTED': return 'Contract signed';
    case 'CONTENT_MAKING': return 'Creator working';
    case 'CONTENT_DELIVERED': return 'Content ready for review';
    case 'REVISION_REQUESTED': return 'Revision requested';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default: return 'In progress';
  }
};

// ─── Logo URL normalization ──────────────────────────────────────────────────

/** Well-known brand name → clearbit logo fallback. */
const KNOWN_BRAND_LOGOS: Record<string, string> = {
  zepto: 'https://logo.clearbit.com/zeptonow.com',
  nike: 'https://logo.clearbit.com/nike.com',
  mamaearth: 'https://logo.clearbit.com/mamaearth.in',
  boat: 'https://logo.clearbit.com/boat-lifestyle.com',
  ajio: 'https://logo.clearbit.com/ajio.com',
  levi: 'https://logo.clearbit.com/levi.com',
  lenskart: 'https://logo.clearbit.com/lenskart.com',
  apple: 'https://logo.clearbit.com/apple.com',
  nykaa: 'https://logo.clearbit.com/nykaa.com',
  sugar: 'https://logo.clearbit.com/sugarcosmetics.com',
  flipkart: 'https://logo.clearbit.com/flipkart.com',
  myntra: 'https://logo.clearbit.com/myntra.com',
  meesho: 'https://logo.clearbit.com/meesho.com',
  amazon: 'https://logo.clearbit.com/amazon.in',
  puma: 'https://logo.clearbit.com/puma.com',
  adidas: 'https://logo.clearbit.com/adidas.com',
};

export const normalizeLogoUrl = (value?: string, brandName?: string): string => {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') {
    if (brandName) {
      const bn = brandName.toLowerCase();
      for (const [key, url] of Object.entries(KNOWN_BRAND_LOGOS)) {
        if (bn.includes(key)) return url;
      }
    }
    return '';
  }
  if (/^(data:|blob:)/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) return `https://${raw}`;
  return raw;
};

/**
 * Resolves the best possible logo URL from a deal object.
 * Looks at multiple fields and falls back to clearbit for known brands.
 */
export const resolveBrandLogoUrl = (deal: any): string => {
  const candidates = [
    deal?.brand_logo_url,
    deal?.brand_logo,
    deal?.logo_url,
    deal?.brand?.logo_url,
    deal?.brand?.logo,
  ];
  for (const c of candidates) {
    const url = normalizeLogoUrl(c);
    if (url) return url;
  }
  // Fallback by brand name
  return normalizeLogoUrl(undefined, deal?.brand_name);
};
