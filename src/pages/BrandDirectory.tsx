"use client";

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilteredNoMatchesEmptyState, SearchNoResultsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Star,
  Bookmark,
  DollarSign,
  Clock,
  AlertTriangle,
  Filter,
  X,
  TrendingUp,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBrands } from '@/lib/hooks/useBrands';
import { useToggleBrandBookmark } from '@/lib/hooks/useBrandBookmarks';
import { useTrackBrandView } from '@/lib/hooks/useBrandInteractions';
import { Brand } from '@/types';
import { useEffect, useRef } from 'react';

const BrandDirectory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  // Fetch brands from database
  const { data: brands = [], isLoading } = useBrands({
    industry: industryFilter !== 'all' ? industryFilter : undefined,
    minRating: ratingFilter !== 'all' ? parseFloat(ratingFilter) : undefined,
    verifiedOnly: false,
    bookmarkedOnly: bookmarkedOnly,
    searchTerm: searchTerm || undefined,
  });

  const toggleBookmarkMutation = useToggleBrandBookmark();
  const trackBrandView = useTrackBrandView();
  const viewedBrands = useRef<Set<string>>(new Set());

  // Track brand views for analytics
  useEffect(() => {
    if (!isLoading && brands.length > 0) {
      brands.forEach((brand) => {
        if (!viewedBrands.current.has(brand.id)) {
          viewedBrands.current.add(brand.id);
          trackBrandView(brand.id);
        }
      });
    }
  }, [brands, isLoading, trackBrandView]);

  // Apply client-side filters that aren't handled by the hook
  const filteredBrands = useMemo(() => {
    let filtered = [...brands];

    // Payment filter (not handled by hook)
    if (paymentFilter === 'reliable') {
      filtered = filtered.filter(
        brand => (brand.late_payment_reports || 0) === 0 && (brand.avg_payment_time_days || 0) <= 35
      );
    } else if (paymentFilter === 'warning') {
      filtered = filtered.filter(
        brand => (brand.late_payment_reports || 0) > 0 || (brand.avg_payment_time_days || 0) > 45
      );
    }

    return filtered;
  }, [brands, paymentFilter]);

  const industries = useMemo(() => {
    const unique = new Set(brands.map(b => b.industry));
    return Array.from(unique).sort();
  }, [brands]);

  const handleToggleBookmark = async (brandId: string) => {
    try {
      await toggleBookmarkMutation.mutateAsync(brandId);
    } catch (error) {
      // Error handling is done by the hook
    }
  };

  const getPaymentStatus = (brand: Brand) => {
    const lateReports = brand.late_payment_reports || 0;
    const avgPaymentTime = brand.avg_payment_time_days || 0;
    if (lateReports > 2 || avgPaymentTime > 60) return 'poor';
    if (lateReports > 0 || avgPaymentTime > 45) return 'warning';
    return 'good';
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Search className="w-7 h-7 text-blue-500" />
          Brand Directory
        </h1>
        <p className="text-sm text-muted-foreground">
          Discover brands looking for creators like you
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search brands, industries, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border/40"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-auto min-w-[140px] h-9">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-auto min-w-[120px] h-9">
              <Star className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
              <SelectItem value="4.0">4.0+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-auto min-w-[140px] h-9">
              <DollarSign className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="reliable">Reliable Payers</SelectItem>
              <SelectItem value="warning">Payment Warnings</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={bookmarkedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
            className="h-9"
          >
            <Bookmark className={cn("w-4 h-4 mr-2", bookmarkedOnly && "fill-current")} />
            Bookmarked
          </Button>

          {(industryFilter !== 'all' || ratingFilter !== 'all' || paymentFilter !== 'all' || bookmarkedOnly || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIndustryFilter('all');
                setRatingFilter('all');
                setPaymentFilter('all');
                setBookmarkedOnly(false);
                setSearchTerm('');
              }}
              className="h-9"
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} found
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Brand Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <AnimatePresence>
            {filteredBrands.map((brand, index) => {
              const paymentStatus = getPaymentStatus(brand);
              const isBookmarked = brand.is_bookmarked || false;

            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "bg-gradient-to-br from-gray-900/50 to-gray-900/30 border rounded-xl p-5 hover:border-gray-700 transition-all backdrop-blur-sm",
                  paymentStatus === 'poor' && "border-red-500/30",
                  paymentStatus === 'warning' && "border-yellow-500/30",
                  paymentStatus === 'good' && "border-green-500/30"
                )}>
                  <CardContent className="p-0">
                    {/* Brand Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Brand Logo/Avatar */}
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {brand.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-foreground truncate">
                              {brand.name}
                            </h3>
                            {brand.verified && (
                              <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {brand.industry}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleBookmark(brand.id)}
                        disabled={toggleBookmarkMutation.isPending}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        <Bookmark className={cn(
                          "w-5 h-5 transition-colors",
                          isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
                        )} />
                      </button>
                    </div>

                    {/* Rating */}
                    {(brand.rating || 0) > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < Math.floor(brand.rating || 0)
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-600"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {brand.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({brand.review_count || 0} reviews)
                        </span>
                      </div>
                    )}

                    {/* Budget and Payment Info */}
                    <div className="space-y-2 mb-4">
                      {(brand.budget_min || brand.budget_max) && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-300">
                            Budget: {brand.budget_min ? `₹${(brand.budget_min / 1000).toFixed(0)}K` : 'N/A'}
                            {brand.budget_min && brand.budget_max ? ' - ' : ''}
                            {brand.budget_max ? `₹${(brand.budget_max / 1000).toFixed(0)}K` : ''} per campaign
                          </span>
                        </div>
                      )}
                      {brand.avg_payment_time_days && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-300">
                            Avg Payment Time: {brand.avg_payment_time_days} days
                          </span>
                        </div>
                      )}
                      {(brand.late_payment_reports || 0) > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-400">
                            {brand.late_payment_reports} creator{(brand.late_payment_reports || 0) !== 1 ? 's' : ''} reported late payments (60+ days)
                          </p>
                        </div>
                      )}
                      {paymentStatus === 'good' && (brand.late_payment_reports || 0) === 0 && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-green-400">
                            Reliable payer - No late payment reports
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Active Opportunities */}
                    {(brand.active_opportunities_count || 0) > 0 && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-blue-400">
                            {brand.active_opportunities_count} Active Opportunity{(brand.active_opportunities_count || 0) !== 1 ? 'ies' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          New campaigns available now
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => navigate(`/brands/${brand.id}`)}
                      >
                        View Details
                      </Button>
                      {(brand.active_opportunities_count || 0) > 0 && (
                        <Button
                          variant="outline"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => navigate(`/brands/${brand.id}/opportunities`)}
                        >
                          Opportunities
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBrands.length === 0 && (
        <div className="py-8">
          {(() => {
            // Step 1: Check if search term exists
            if (searchTerm.trim().length > 0) {
              return (
                <SearchNoResultsEmptyState
                  searchTerm={searchTerm}
                  onClearFilters={() => {
                    setIndustryFilter('all');
                    setRatingFilter('all');
                    setPaymentFilter('all');
                    setBookmarkedOnly(false);
                    setSearchTerm('');
                  }}
                />
              );
            }

            // Step 2: Check if filters are ACTUALLY active (not default values)
            const noFiltersActive =
              industryFilter === 'all' &&
              ratingFilter === 'all' &&
              paymentFilter === 'all' &&
              bookmarkedOnly === false;

            // Step 3: If no filters AND no brands in database → show "No Brands Available Yet"
            if (noFiltersActive && brands.length === 0) {
              return (
                <EmptyState
                  type="no-data"
                  title="No Brands Available Yet"
                  description="Brands will appear here after running the sync script. Run 'npm run sync-brands' to fetch real opportunities from influencer.in and Collabstr."
                  variant="default"
                  primaryAction={{
                    label: "Refresh",
                    onClick: () => {
                      queryClient.invalidateQueries({ queryKey: ['brands'] });
                    },
                    icon: RefreshCw,
                  }}
                />
              );
            }

            // Step 4: If filters ARE active AND filteredBrands is empty → show "No Matches Found"
            if (!noFiltersActive) {
              return (
                <FilteredNoMatchesEmptyState
                  onClearFilters={() => {
                    setIndustryFilter('all');
                    setRatingFilter('all');
                    setPaymentFilter('all');
                    setBookmarkedOnly(false);
                    setSearchTerm('');
                  }}
                  filterCount={
                    (industryFilter !== 'all' ? 1 : 0) +
                    (ratingFilter !== 'all' ? 1 : 0) +
                    (paymentFilter !== 'all' ? 1 : 0) +
                    (bookmarkedOnly ? 1 : 0)
                  }
                />
              );
            }

            // Fallback (shouldn't reach here)
            return (
              <EmptyState
                type="no-data"
                title="No Brands Found"
                description="Try adjusting your filters or search terms."
                variant="default"
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default BrandDirectory;

