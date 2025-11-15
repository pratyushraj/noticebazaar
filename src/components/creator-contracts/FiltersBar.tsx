"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar } from 'lucide-react';
import { BrandDeal } from '@/types';
import { DealStage } from './DealStatusBadge';
import { cn } from '@/lib/utils';

interface FiltersBarProps {
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

const FiltersBar: React.FC<FiltersBarProps> = ({
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
  const uniqueBrands = Array.from(new Set(allDeals.map(d => d.brand_name).filter(Boolean))).sort();
  const uniquePlatforms = Array.from(new Set(allDeals.map(d => d.platform).filter(p => p))).sort();

  const hasActiveFilters = searchTerm || brandFilter !== 'All' || statusFilter !== 'All' || 
                          platformFilter !== 'All' || dateRangeFilter !== 'All';

  return (
    <div className={cn("space-y-4 hidden md:block", className)}>
      {/* Search Bar - Desktop only */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by brand, deliverables, or amount..."
          className="pl-9 bg-background text-foreground border-border/40 focus:border-primary/50 h-10"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search brand deals"
        />
      </div>

      {/* Horizontal Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Brand Filter */}
        <Select value={brandFilter} onValueChange={onBrandFilterChange}>
          <SelectTrigger className="w-[160px] bg-background text-foreground border-border/40 h-9">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Brands</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as DealStage | 'All')}>
          <SelectTrigger className="w-[160px] bg-background text-foreground border-border/40 h-9">
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

        {/* Platform Filter */}
        <Select value={platformFilter} onValueChange={onPlatformFilterChange}>
          <SelectTrigger className="w-[160px] bg-background text-foreground border-border/40 h-9">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Platforms</SelectItem>
            {uniquePlatforms.map(platform => (
              <SelectItem key={platform} value={platform}>{platform}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={dateRangeFilter} onValueChange={onDateRangeFilterChange}>
          <SelectTrigger className="w-[180px] bg-background text-foreground border-border/40 h-9">
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

        {/* Clear Filters Button - Right Aligned */}
        {hasActiveFilters && (
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground h-9"
            >
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltersBar;
