"use client";

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Briefcase, Wallet, FileText, Bell, Clock, X, Filter } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { SearchResult } from '@/lib/services/searchService';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchNoResultsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';

const typeIcons = {
  deal: Briefcase,
  payment: Wallet,
  contract: FileText,
  notification: Bell,
  message: Bell,
  tax: Clock,
};

const typeLabels = {
  deal: 'Deal',
  payment: 'Payment',
  contract: 'Contract',
  notification: 'Notification',
  message: 'Message',
  tax: 'Tax',
};

const typeColors = {
  deal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  payment: 'bg-green-500/20 text-green-400 border-green-500/30',
  contract: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  notification: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  message: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  tax: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useSession();
  
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>('all');

  // Perform search
  const { results, groupedResults, stats } = useGlobalSearch({
    query,
    enabled: true,
    limit: 50,
  });

  // Update query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [searchParams, query]);

  // Update URL when query changes
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams({ q: newQuery });
  };

  // Filter results by type
  const filteredResults = selectedType === 'all' 
    ? results 
    : groupedResults[selectedType as keyof typeof groupedResults] || [];

  // Group results by type for display
  const displayGroups = selectedType === 'all'
    ? Object.entries(groupedResults).filter(([_, items]) => items.length > 0)
    : [[selectedType, filteredResults]];

  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      navigate(result.url);
    }
  };

  return (
    <div className="nb-screen-height bg-gradient-to-br from-[#0F121A] via-[#1A1D2E] to-[#0F121A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0F121A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <Input
                type="text"
                placeholder="Search deals, payments, contracts..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50 h-12"
                autoFocus
              />
            </div>
          </div>

          {/* Type Filter */}
          {query.trim().length > 0 && (
            <div className="mt-4">
              <SegmentedControl
                value={selectedType}
                onValueChange={setSelectedType}
                options={[
                  { value: 'all', label: `All (${stats.total})` },
                  { value: 'deal', label: `Deals (${stats.byType.deals})` },
                  { value: 'payment', label: `Payments (${stats.byType.payments})` },
                  { value: 'contract', label: `Contracts (${stats.byType.contracts})` },
                  { value: 'notification', label: `Notifications (${stats.byType.notifications})` },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {query.trim().length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-16 w-16 mx-auto mb-4 text-white/20" />
            <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
            <p className="text-white/60">
              Search across your deals, payments, contracts, and more
            </p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-20">
            <SearchNoResultsEmptyState searchTerm={query} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results by Type */}
            {displayGroups.map(([type, items]) => {
              if (!items || items.length === 0) return null;
              
              const Icon = typeIcons[type as keyof typeof typeIcons] || Search;
              const label = typeLabels[type as keyof typeof typeLabels] || type;
              const colorClass = typeColors[type as keyof typeof typeColors] || 'bg-white/10 text-white/60';

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className="h-5 w-5 text-white/60" />
                    <h3 className="text-lg font-semibold">{label}</h3>
                    <Badge variant="outline" className={cn("text-xs", colorClass)}>
                      {items.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((result) => {
                      const ResultIcon = typeIcons[result.type] || Search;
                      const resultColorClass = typeColors[result.type] || 'bg-white/10 text-white/60';

                      return (
                        <motion.div
                          key={`${result.type}-${result.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Card 
                            className="bg-white/[0.08] backdrop-blur-[40px] border-white/15 hover:bg-white/[0.12] transition-all cursor-pointer"
                            onClick={() => handleResultClick(result)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className={cn(
                                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                  resultColorClass
                                )}>
                                  <ResultIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-base font-semibold text-white">
                                      {result.title}
                                    </h4>
                                    <Badge variant="outline" className={cn("text-xs", resultColorClass)}>
                                      {typeLabels[result.type]}
                                    </Badge>
                                  </div>
                                  {result.subtitle && (
                                    <p className="text-sm text-white/60 mb-1">
                                      {result.subtitle}
                                    </p>
                                  )}
                                  {result.description && (
                                    <p className="text-sm text-white/40">
                                      {result.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

