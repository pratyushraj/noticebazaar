/**
 * Shared BrandIcon component.
 *
 * Renders a brand's logo image with a premium fallback to a gradient initial.
 * Used by both Creator and Brand dashboards to ensure consistent brand visuals.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { normalizeLogoUrl } from '@/lib/deals/format';
import { Dumbbell, Shirt, Target } from 'lucide-react';

interface BrandIconProps {
  /** Primary logo URL (may be null/undefined). */
  logo?: string;
  /** Category hint for fallback icon. */
  category?: string;
  /** Brand name — used for initial fallback + clearbit lookup. */
  name?: string;
  /** Whether the UI is in dark mode. */
  isDark?: boolean;
  /** Optional className for the outer container. */
  className?: string;
}

const BRAND_COLORS: Record<string, string> = {
  boat: 'bg-gradient-to-br from-violet-600 to-indigo-700',
  lenskart: 'bg-gradient-to-br from-emerald-600 to-teal-700',
  nykaa: 'bg-gradient-to-br from-pink-600 to-rose-700',
  mamaearth: 'bg-gradient-to-br from-teal-600 to-cyan-700',
  zepto: 'bg-gradient-to-br from-purple-600 to-indigo-700',
  nike: 'bg-black',
  ajio: 'bg-gradient-to-br from-orange-500 to-amber-600',
  sugar: 'bg-gradient-to-br from-pink-500 to-rose-600',
};

const getLetterColor = (char: string): string => {
  if (char >= 'A' && char <= 'E') return 'bg-gradient-to-br from-violet-500 to-purple-600';
  if (char >= 'F' && char <= 'J') return 'bg-gradient-to-br from-blue-500 to-blue-600';
  if (char >= 'K' && char <= 'O') return 'bg-gradient-to-br from-emerald-500 to-teal-600';
  if (char >= 'P' && char <= 'T') return 'bg-gradient-to-br from-orange-500 to-amber-600';
  if (char >= 'U' && char <= 'Z') return 'bg-gradient-to-br from-pink-500 to-rose-600';
  return 'bg-gradient-to-br from-slate-500 to-slate-600';
};

const Fallback: React.FC<{ category?: string; name?: string }> = ({ category, name }) => {
  const catLower = category?.toLowerCase() || '';

  if (name) {
    const char = name.trim().charAt(0).toUpperCase();
    const nameLower = name.toLowerCase();

    // Specific brand colors
    let color = 'bg-background';
    for (const [key, cls] of Object.entries(BRAND_COLORS)) {
      if (nameLower.includes(key)) {
        color = cls;
        break;
      }
    }
    if (color === 'bg-background') {
      color = getLetterColor(char);
    }

    return (
      <div className={cn('w-full h-full flex items-center justify-center text-white font-bold text-lg shadow-inner transition-colors duration-500 rounded-inherit', color)}>
        {char || '?'}
      </div>
    );
  }

  if (catLower.includes('fit') || catLower.includes('gym') || catLower.includes('sport')) {
    return <Dumbbell className="w-5 h-5 text-muted-foreground" />;
  }
  if (catLower.includes('cloth') || catLower.includes('fash') || catLower.includes('beauty') || catLower.includes('skin')) {
    return <Shirt className="w-5 h-5 text-muted-foreground" />;
  }
  return <Target className="w-5 h-5 text-muted-foreground" />;
};

/**
 * Renders brand logo with smart fallback.
 *
 * 1. If `logo` is provided → render `<img>` with fallback underneath.
 * 2. If no logo but `name` is recognized → use clearbit.
 * 3. Final fallback → gradient initial letter.
 */
const BrandIcon: React.FC<BrandIconProps> = ({
  logo,
  category,
  name,
  isDark = false,
  className,
}) => {
  const safeLogo = normalizeLogoUrl(logo, name);
  const proxiedLogo =
    safeLogo && (safeLogo.includes('fbcdn.net') || safeLogo.includes('instagram.com'))
      ? `https://wsrv.nl/?url=${encodeURIComponent(safeLogo)}`
      : safeLogo;

  if (safeLogo) {
    return (
      <div className={cn('relative w-full h-full flex items-center justify-center p-1 overflow-hidden rounded-xl', className)}>
        {isDark && <div className="absolute inset-0 bg-white/5 z-0" />}
        <img
          alt=""
          src={proxiedLogo}
          className="w-full h-full object-contain relative z-10"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 z-0">
          <Fallback category={category} name={name} />
        </div>
      </div>
    );
  }

  return <Fallback category={category} name={name} />;
};

export default BrandIcon;
export { BrandIcon, Fallback as BrandIconFallback };
