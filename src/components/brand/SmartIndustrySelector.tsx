import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IndustryOption = {
  label: string;
  icon: string;
  popular?: boolean;
};

export const BRAND_INDUSTRY_OPTIONS: IndustryOption[] = [
  { label: 'Fashion & Apparel', icon: '👕', popular: true },
  { label: 'Beauty & Cosmetics', icon: '💄', popular: true },
  { label: 'Food & Beverage', icon: '🍔', popular: true },
  { label: 'Health & Wellness', icon: '🧘' },
  { label: 'Technology & Software', icon: '💻' },
  { label: 'Travel & Tourism', icon: '✈️' },
  { label: 'Gaming & Esports', icon: '🎮' },
  { label: 'Home & Decor', icon: '🏠' },
  { label: 'Education', icon: '🎓' },
  { label: 'Finance', icon: '💰' },
  { label: 'Jewellery & Accessories', icon: '💍' },
  { label: 'Sports & Fitness', icon: '🏃' },
  { label: 'Entertainment & Media', icon: '🎬' },
  { label: 'D2C / E-commerce', icon: '🛍️' },
  { label: 'Automotive', icon: '🚗' },
];

type SmartIndustrySelectorProps = {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiSelect?: boolean;
  className?: string;
};

export function SmartIndustrySelector({
  value,
  onChange,
  placeholder = 'Select industry',
  multiSelect = false,
  className,
}: SmartIndustrySelectorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return BRAND_INDUSTRY_OPTIONS;
    return BRAND_INDUSTRY_OPTIONS.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [query]);

  const exactMatch = useMemo(
    () =>
      BRAND_INDUSTRY_OPTIONS.some(
        (option) => option.label.toLowerCase() === query.trim().toLowerCase()
      ),
    [query]
  );

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const updateValue = (next: string) => {
    if (multiSelect) {
      const nextValues = selectedValues.includes(next)
        ? selectedValues.filter((item) => item !== next)
        : [...selectedValues, next];
      onChange(nextValues);
      return;
    }
    onChange(next);
    setOpen(false);
  };

  const renderOption = (option: IndustryOption) => {
    const selected = selectedValues.includes(option.label);
    return (
      <button
        type="button"
        key={option.label}
        onClick={() => updateValue(option.label)}
        className={cn(
          'w-full rounded-2xl border px-4 py-3.5 text-left transition-all',
          'hover:-translate-y-[1px] hover:shadow-sm',
          selected
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 shadow-[0_8px_20px_rgba(16,185,129,0.10)]'
            : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:bg-emerald-50/50'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg leading-none">{option.icon}</span>
            <span className="text-[14px] font-semibold truncate">{option.label}</span>
          </div>
          {selected && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
        </div>
      </button>
    );
  };

  const selectedLabel = selectedValues.length === 0
    ? placeholder
    : multiSelect
      ? selectedValues.join(', ')
      : selectedValues[0];

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-left transition-all',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50',
          open ? 'border-emerald-400 shadow-[0_12px_30px_rgba(16,185,129,0.10)]' : 'border-slate-200',
          selectedValues.length === 0 ? 'text-slate-400' : 'text-slate-900'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[16px] font-semibold">{selectedLabel}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industry..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-[14px] font-medium text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white"
            />
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredOptions.map(renderOption)}

            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => updateValue(query.trim())}
                className="w-full rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3.5 text-left text-emerald-900 transition-all hover:shadow-sm"
              >
                <p className="text-[13px] font-black uppercase tracking-[0.1em]">Something else?</p>
                <p className="mt-1 text-[14px] font-semibold">Type your industry: {query.trim()}</p>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
