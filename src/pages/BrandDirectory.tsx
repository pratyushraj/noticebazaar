"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilteredNoMatchesEmptyState, SearchNoResultsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Star,
  Bookmark,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  Filter,
  X,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Brand {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  rating: number;
  reviewCount: number;
  budgetRange: { min: number; max: number };
  avgPaymentTime: number;
  latePaymentReports: number;
  isBookmarked: boolean;
  description: string;
  activeOpportunities: number;
  verified: boolean;
}

// Mock data - in real app, this would come from an API
const MOCK_BRANDS: Brand[] = [
  {
    id: '1',
    name: 'Nike',
    logo: undefined,
    industry: 'Sports & Fitness',
    rating: 4.5,
    reviewCount: 23,
    budgetRange: { min: 50000, max: 500000 },
    avgPaymentTime: 28,
    latePaymentReports: 0,
    isBookmarked: false,
    description: 'Global sports brand looking for fitness creators',
    activeOpportunities: 3,
    verified: true,
  },
  {
    id: '2',
    name: 'Adidas',
    logo: undefined,
    industry: 'Sports & Fitness',
    rating: 4.7,
    reviewCount: 45,
    budgetRange: { min: 100000, max: 1000000 },
    avgPaymentTime: 35,
    latePaymentReports: 1,
    isBookmarked: true,
    description: 'Seeking creators for product launch campaigns',
    activeOpportunities: 2,
    verified: true,
  },
  {
    id: '3',
    name: 'Mamaearth',
    logo: undefined,
    industry: 'Beauty & Skincare',
    rating: 4.2,
    reviewCount: 67,
    budgetRange: { min: 10000, max: 50000 },
    avgPaymentTime: 25,
    latePaymentReports: 0,
    isBookmarked: false,
    description: 'Natural beauty brand for skincare reviews',
    activeOpportunities: 5,
    verified: true,
  },
  {
    id: '4',
    name: 'BrandX',
    logo: undefined,
    industry: 'Fashion',
    rating: 3.1,
    reviewCount: 12,
    budgetRange: { min: 20000, max: 100000 },
    avgPaymentTime: 65,
    latePaymentReports: 3,
    isBookmarked: false,
    description: 'Fashion brand seeking style influencers',
    activeOpportunities: 1,
    verified: false,
  },
];

const BrandDirectory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [bookmarkedBrands, setBookmarkedBrands] = useState<Set<string>>(new Set());

  // Load bookmarks from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('brandBookmarks');
    if (saved) {
      try {
        setBookmarkedBrands(new Set(JSON.parse(saved)));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save bookmarks to localStorage
  const toggleBookmark = (brandId: string) => {
    setBookmarkedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      localStorage.setItem('brandBookmarks', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const filteredBrands = useMemo(() => {
    let filtered = [...MOCK_BRANDS];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchLower) ||
        brand.industry.toLowerCase().includes(searchLower) ||
        brand.description.toLowerCase().includes(searchLower)
      );
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(brand => brand.industry === industryFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(brand => brand.rating >= minRating);
    }

    // Payment filter
    if (paymentFilter === 'reliable') {
      filtered = filtered.filter(brand => brand.latePaymentReports === 0 && brand.avgPaymentTime <= 35);
    } else if (paymentFilter === 'warning') {
      filtered = filtered.filter(brand => brand.latePaymentReports > 0 || brand.avgPaymentTime > 45);
    }

    // Bookmarked filter
    if (bookmarkedOnly) {
      filtered = filtered.filter(brand => bookmarkedBrands.has(brand.id));
    }

    return filtered;
  }, [searchTerm, industryFilter, ratingFilter, paymentFilter, bookmarkedOnly, bookmarkedBrands]);

  const industries = useMemo(() => {
    const unique = new Set(MOCK_BRANDS.map(b => b.industry));
    return Array.from(unique);
  }, []);

  const getPaymentStatus = (brand: Brand) => {
    if (brand.latePaymentReports > 2 || brand.avgPaymentTime > 60) return 'poor';
    if (brand.latePaymentReports > 0 || brand.avgPaymentTime > 45) return 'warning';
    return 'good';
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'poor': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-green-500';
    }
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

      {/* Brand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <AnimatePresence>
          {filteredBrands.map((brand, index) => {
            const paymentStatus = getPaymentStatus(brand);
            const isBookmarked = bookmarkedBrands.has(brand.id);

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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {brand.name.charAt(0)}
                        </div>
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
                        onClick={() => toggleBookmark(brand.id)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Bookmark className={cn(
                          "w-5 h-5 transition-colors",
                          isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
                        )} />
                      </button>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < Math.floor(brand.rating)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-600"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {brand.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({brand.reviewCount} reviews)
                      </span>
                    </div>

                    {/* Budget and Payment Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">
                          Budget: ₹{(brand.budgetRange.min / 1000).toFixed(0)}K - ₹{(brand.budgetRange.max / 1000).toFixed(0)}K per campaign
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">
                          Avg Payment Time: {brand.avgPaymentTime} days
                        </span>
                      </div>
                      {brand.latePaymentReports > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-400">
                            {brand.latePaymentReports} creator{brand.latePaymentReports !== 1 ? 's' : ''} reported late payments (60+ days)
                          </p>
                        </div>
                      )}
                      {paymentStatus === 'good' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-green-400">
                            Reliable payer - No late payment reports
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Active Opportunities */}
                    {brand.activeOpportunities > 0 && (
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-blue-400">
                            {brand.activeOpportunities} Active Opportunity{brand.activeOpportunities !== 1 ? 'ies' : ''}
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
                      {brand.activeOpportunities > 0 && (
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

      {/* Empty State */}
      {filteredBrands.length === 0 && (
        <div className="py-8">
          {searchTerm ? (
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
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
};

export default BrandDirectory;

