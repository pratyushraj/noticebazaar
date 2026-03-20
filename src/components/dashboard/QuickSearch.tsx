"use client";

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command, Briefcase, Wallet, FileText, Bell, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { SearchResult as GlobalSearchResult } from '@/lib/services/searchService';
import { getSearchSuggestions } from '@/lib/services/searchService';
import { getSearchHistory } from '@/lib/utils/searchHistory';
import { useSession } from '@/contexts/SessionContext';

interface QuickSearchProps {
  onClose?: () => void;
  onSelect?: (result: GlobalSearchResult) => void;
  isOpen?: boolean;
}

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

export function QuickSearch({ onClose, onSelect, isOpen: controlledOpen }: QuickSearchProps) {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Use global search hook
  const { results, searchHistory } = useGlobalSearch({
    query,
    enabled: isOpen && query.trim().length > 0,
    limit: 8, // Show top 8 results in quick search
  });

  // Get search suggestions
  const suggestions = query.trim().length > 0 
    ? getSearchSuggestions(query, searchHistory.map(h => h.query))
    : searchHistory.slice(0, 5).map(h => h.query);

  // Keyboard shortcut: Cmd/Ctrl + K (only if not controlled externally)
  useEffect(() => {
    if (controlledOpen !== undefined) return; // Don't handle keyboard if controlled externally
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setInternalOpen(true);
      }
      if (e.key === 'Escape' && internalOpen) {
        setInternalOpen(false);
        setQuery('');
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalOpen, onClose, controlledOpen]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleResultClick = (result: GlobalSearchResult) => {
    if (result.url) {
      navigate(result.url);
    }
    onSelect?.(result);
    setQuery('');
    if (controlledOpen === undefined) setInternalOpen(false);
    onClose?.();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleViewAll = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
    if (controlledOpen === undefined) setInternalOpen(false);
    onClose?.();
  };

  const shouldShow = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
        onClick={() => {
          if (controlledOpen === undefined) {
            setInternalOpen(false);
          }
          onClose?.();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="border-white/20 shadow-2xl">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="h-5 w-5 text-white/60 shrink-0" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search deals, payments, deadlines..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-white/40 focus:ring-0 focus-visible:ring-0 text-[15px]"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/60">
                    <Command className="h-3 w-3" />K
                  </kbd>
                  <button
                    onClick={() => {
                      if (controlledOpen === undefined) setInternalOpen(false);
                      onClose?.();
                    }}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                </div>
              </div>

              {results.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto">
                  {results.map((result) => {
                    const Icon = typeIcons[result.type] || Search;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-center gap-3 group"
                      >
                        <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                          <Icon className="h-4 w-4 text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[15px] font-semibold text-white">
                              {result.title}
                            </span>
                            <span className="text-[11px] text-white/40 px-1.5 py-0.5 rounded bg-white/5">
                              {typeLabels[result.type]}
                            </span>
                          </div>
                          {result.subtitle && (
                            <div className="text-[13px] text-white/60">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {query.trim().length > 0 && (
                    <button
                      onClick={handleViewAll}
                      className="w-full p-3 text-center text-[13px] text-white/60 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      View all results →
                    </button>
                  )}
                </div>
              )}

              {query.trim().length > 0 && results.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-white/60">No results found</p>
                  <p className="text-[13px] text-white/40 mt-1">
                    Try searching for deals, payments, contracts, or notifications
                  </p>
                </div>
              )}

              {query.trim().length === 0 && (
                <div className="p-6">
                  {suggestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[12px] text-white/40 mb-2 px-2">Recent Searches</p>
                      <div className="space-y-1">
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full p-2 text-left text-[13px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Clock className="h-3.5 w-3.5 text-white/40" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[12px] text-white/40 mb-3 px-2">Search for</p>
                    <div className="flex flex-wrap gap-2">
                      {['Deals', 'Payments', 'Contracts', 'Notifications'].map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-[12px] border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

