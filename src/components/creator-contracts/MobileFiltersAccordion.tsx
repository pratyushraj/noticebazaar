"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, X, ChevronDown, Filter } from 'lucide-react';
import { BrandDeal } from '@/types';
import { DealStage } from './DealStatusBadge';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MobileFiltersAccordionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  brandFilter: string;
  onBrandFilterChange: (value: string) => void;
  statusFilter: DealStage | 'All';
  onStatusFilterChange: (value: DealStage | 'All') => void;
  platformFilter: string;
  onPlatformFilterChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (value: string) => void;
  allDeals: BrandDeal[];
  onClearFilters: () => void;
  className?: string;
}

const MobileFiltersAccordion: React.FC<MobileFiltersAccordionProps> = ({
  searchTerm,
  onSearchChange,
  brandFilter,
  onBrandFilterChange,
  statusFilter,
  onStatusFilterChange,
  platformFilter,
  onPlatformFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  allDeals,
  onClearFilters,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const uniqueBrands = Array.from(new Set(allDeals.map(d => d.brand_name).filter(Boolean))).sort();
  const uniquePlatforms = Array.from(new Set(allDeals.map(d => d.platform).filter(p => p))).sort();

  const hasActiveFilters = searchTerm || brandFilter !== 'All' || statusFilter !== 'All' || 
                          platformFilter !== 'All' || dateRangeFilter !== 'All';

  const statusOptions: { value: DealStage | 'All'; label: string }[] = [
    { value: 'All', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'payment_pending', label: 'Payment Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
  ];

  const dateRangeOptions: { value: string; label: string }[] = [
    { value: 'All', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due_soon', label: 'Due Soon' },
  ];

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Search Bar - h-[42px], rounded-[14px], 16px icon, placeholder 70% opacity */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-10 pr-3 bg-background text-foreground border-border/40 focus:border-primary/50 w-full h-[42px] rounded-[14px] text-sm placeholder:text-muted-foreground/70"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search brand deals"
        />
      </div>

      {/* Filters Section - Collapsed by Default - h-[42px] rounded-[14px], icon right aligned */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger 
          className="w-full flex items-center justify-between h-[42px] px-3 border border-border/40 rounded-[14px] hover:bg-accent/50 transition-colors"
          aria-label="Toggle filters"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                {[brandFilter !== 'All' ? 1 : 0, statusFilter !== 'All' ? 1 : 0, platformFilter !== 'All' ? 1 : 0, dateRangeFilter !== 'All' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3 px-3">
          {/* Brand Filter Pills - px-3 py-1.5 rounded-full border text-sm, gap-3 spacing */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1">Brand</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={brandFilter === 'All' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onBrandFilterChange('All')}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                    brandFilter === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                  )}
                >
                  All
                </Button>
                {uniqueBrands.map(brand => (
                  <Button
                    key={brand}
                    variant={brandFilter === brand ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onBrandFilterChange(brand)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                      brandFilter === brand ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                    )}
                  >
                    {brand}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Status Filter Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1">Status</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {statusOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onStatusFilterChange(option.value as DealStage | 'All')}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                      statusFilter === option.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Platform Filter Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1">Platform</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={platformFilter === 'All' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPlatformFilterChange('All')}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                    platformFilter === 'All' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                  )}
                >
                  All
                </Button>
                {uniquePlatforms.map(platform => (
                  <Button
                    key={platform}
                    variant={platformFilter === platform ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPlatformFilterChange(platform || 'All')}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                      platformFilter === platform ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                    )}
                  >
                    {platform}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Date Range Filter Pills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide px-1">Date Range</label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {dateRangeOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={dateRangeFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onDateRangeFilterChange(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap h-auto",
                      dateRangeFilter === option.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-transparent'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="w-full text-muted-foreground hover:text-foreground justify-start h-7 text-xs"
            >
              <X className="mr-1.5 h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileFiltersAccordion;
