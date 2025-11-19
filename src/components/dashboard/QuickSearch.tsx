"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface QuickSearchProps {
  onClose?: () => void;
  onSelect?: (result: SearchResult) => void;
  isOpen?: boolean;
}

interface SearchResult {
  id: string;
  type: 'deal' | 'payment' | 'deadline' | 'contact';
  title: string;
  subtitle?: string;
  action?: () => void;
}

export function QuickSearch({ onClose, onSelect, isOpen: controlledOpen }: QuickSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

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

  // Mock search results - replace with actual search logic
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    // Mock search results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'deal' as const,
        title: 'Nike Deal',
        subtitle: '₹20,000 • Instagram',
        action: () => {
          // Navigate to deal
          if (controlledOpen === undefined) setInternalOpen(false);
          onClose?.();
          onSelect?.({
            id: '1',
            type: 'deal',
            title: 'Nike Deal',
          });
        },
      },
      {
        id: '2',
        type: 'payment' as const,
        title: 'Pending Payment: Ajio',
        subtitle: '₹14,500 • Due in 2 days',
        action: () => {
          if (controlledOpen === undefined) setInternalOpen(false);
          onClose?.();
        },
      },
    ].filter((result) =>
      result.title.toLowerCase().includes(query.toLowerCase())
    );

    setResults(mockResults);
  }, [query, onSelect]);

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
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        result.action?.();
                        setQuery('');
                        if (controlledOpen === undefined) setInternalOpen(false);
                        onClose?.();
                      }}
                      className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex items-center gap-3 group"
                    >
                      <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Search className="h-4 w-4 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-white mb-0.5">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-[13px] text-white/60">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.trim().length > 0 && results.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-white/60">No results found</p>
                  <p className="text-[13px] text-white/40 mt-1">
                    Try searching for deals, payments, or deadlines
                  </p>
                </div>
              )}

              {query.trim().length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[15px] text-white/60 mb-2">
                    Search across your dashboard
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Deals', 'Payments', 'Deadlines', 'Contacts'].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-[12px] border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
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

