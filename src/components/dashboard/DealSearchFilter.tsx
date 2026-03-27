"use client";

import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DealSearchFilterProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  isDark?: boolean;
  totalDeals?: number;
}

interface FilterState {
  status: 'all' | 'active' | 'pending' | 'completed' | 'overdue';
  sortBy: 'newest' | 'value-high' | 'value-low' | 'deadline';
}

const DealSearchFilter: React.FC<DealSearchFilterProps> = ({
  onSearch,
  onFilterChange,
  isDark = true,
  totalDeals = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'newest',
  });
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const statusOptions: Array<{ value: FilterState['status']; label: string; color: string }> = [
    { value: 'all', label: 'All Deals', color: 'bg-slate-500/20 text-slate-300' },
    { value: 'active', label: 'Active', color: 'bg-blue-500/20 text-blue-300' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-300' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-300' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-500/20 text-red-300' },
  ];

  const sortOptions: Array<{ value: FilterState['sortBy']; label: string }> = [
    { value: 'newest', label: 'Newest First' },
    { value: 'value-high', label: 'Highest Value' },
    { value: 'value-low', label: 'Lowest Value' },
    { value: 'deadline', label: 'Deadline Soon' },
  ];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleStatusChange = (status: FilterState['status']) => {
    const newFilters = { ...filters, status };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
    setShowFilterMenu(false);
  };

  const isFiltered = filters.status !== 'all' || filters.sortBy !== 'newest' || searchQuery.length > 0;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative flex items-center rounded-xl border transition-all duration-300',
          isDark
            ? 'bg-white/5 border-white/10 focus-within:border-white/20 focus-within:bg-white/10'
            : 'bg-white border-slate-200 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-blue-500/20'
        )}
      >
        <Search className={cn('absolute left-3 w-4 h-4', isDark ? 'text-white/40' : 'text-slate-400')} />
        <input
          type="text"
          placeholder="Search brands, status..."
          value={searchQuery}
          onChange={handleSearch}
          className={cn(
            'flex-1 py-2.5 px-10 bg-transparent outline-none text-sm placeholder-opacity-60',
            isDark ? 'text-white placeholder-white' : 'text-slate-900 placeholder-slate-500'
          )}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              onSearch?.('');
            }}
            className={cn('mr-2 p-1 rounded hover:bg-white/10 transition-colors', isDark ? 'text-white/60' : 'text-slate-400')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Quick Filter Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide"
      >
        {statusOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStatusChange(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all snap-start',
              filters.status === option.value
                ? `${option.color} shadow-lg ring-2 ring-offset-2 ${isDark ? 'ring-offset-slate-950' : 'ring-offset-white'}`
                : isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/15'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {option.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Sort Button & Summary */}
      <div className="flex items-center justify-between">
        <p className={cn('text-xs font-medium', isDark ? 'text-white/60' : 'text-slate-600')}>
          {totalDeals} deal{totalDeals !== 1 ? 's' : ''} {isFiltered && '(filtered)'}
        </p>

        <motion.div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              showFilterMenu
                ? isDark
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-700'
                : isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/15'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Sort</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', showFilterMenu && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute right-0 top-full mt-2 rounded-xl border shadow-lg backdrop-blur-sm z-10 min-w-[140px]',
                  isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white border-slate-200'
                )}
              >
                {sortOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={cn(
                      'w-full px-4 py-2.5 text-xs font-bold text-left transition-colors first:rounded-t-lg last:rounded-b-lg',
                      filters.sortBy === option.value
                        ? isDark
                          ? 'bg-blue-600/30 text-blue-300'
                          : 'bg-blue-50 text-blue-700'
                        : isDark
                        ? 'text-white/70 hover:bg-white/10'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default DealSearchFilter;
