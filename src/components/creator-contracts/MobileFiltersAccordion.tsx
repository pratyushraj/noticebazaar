"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, X, Calendar, ChevronDown } from 'lucide-react';
import { BrandDeal } from '@/types';
import { DealStage } from './DealStatusBadge';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Always Visible Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by brand, deliverables, or amount..."
          className="pl-9 bg-background text-foreground border-border/40 focus:border-primary/50 w-full h-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 border border-border/40 rounded-lg hover:bg-accent/50 transition-colors">
            <span className="text-sm font-medium text-foreground">Filter Options</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3 pb-4 px-1">
              {/* Brand Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</label>
                <Select value={brandFilter} onValueChange={onBrandFilterChange}>
                  <SelectTrigger className="w-full bg-background text-foreground border-border/40 h-9">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Brands</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as DealStage | 'All')}>
                  <SelectTrigger className="w-full bg-background text-foreground border-border/40 h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="payment_pending">Payment Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Platform</label>
                <Select value={platformFilter} onValueChange={onPlatformFilterChange}>
                  <SelectTrigger className="w-full bg-background text-foreground border-border/40 h-9">
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Platforms</SelectItem>
                    {uniquePlatforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Range</label>
                <Select value={dateRangeFilter} onValueChange={onDateRangeFilterChange}>
                  <SelectTrigger className="w-full bg-background text-foreground border-border/40 h-9">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="this_quarter">This Quarter</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due_soon">Due Soon (7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="w-full text-muted-foreground hover:text-foreground justify-start h-9"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileFiltersAccordion;
