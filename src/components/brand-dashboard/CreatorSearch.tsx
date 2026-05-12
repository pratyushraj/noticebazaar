import React, { useState, useEffect, useRef } from 'react';
import { Search, Instagram, Youtube, X, Loader2, User } from 'lucide-react';
import { useCreators, type CreatorProfile } from '@/lib/hooks/useCreators';
import { decodeHtmlEntities } from '@/lib/utils/dom';

interface CreatorSearchProps {
  onSelect: (creator: CreatorProfile) => void;
  selectedCreator?: CreatorProfile | null;
  onClear?: () => void;
}

const CreatorSearch: React.FC<CreatorSearchProps> = ({ onSelect, selectedCreator, onClear }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: creators = [], isLoading, isFetching } = useCreators({
    search: debouncedQuery,
    limit: 10,
    enabled: debouncedQuery.trim().length > 0,
  });

  const showResults = debouncedQuery.trim().length > 0;
  const isSearching = isLoading || isFetching;

  const handleSelect = (creator: CreatorProfile) => {
    onSelect(creator);
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Instagram handle, name, or username..."
          className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-10 py-3 text-foreground placeholder-white/40 text-[15px] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 animate-spin" />
        )}
        {query && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary/50 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-foreground/40" />
          </button>
        )}
      </div>

      {/* Selected Creator Badge */}
      {selectedCreator && (
        <div className="mt-2 flex items-center gap-2 bg-secondary/20 border border-purple-400/30 rounded-xl px-3 py-2">
          <User className="w-4 h-4 text-secondary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-secondary font-medium truncate">
              {decodeHtmlEntities(selectedCreator.name)}
            </p>
            <p className="text-[11px] text-secondary/70 truncate">
              @{decodeHtmlEntities(selectedCreator.username)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-secondary/20 rounded-full flex-shrink-0"
          >
            <X className="w-3 h-3 text-secondary" />
          </button>
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && !selectedCreator && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#1a1d2e] border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden max-h-[70vh] flex flex-col">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
              <span className="ml-2 text-[13px] text-foreground/40">Searching creators...</span>
            </div>
          ) : creators.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[13px] text-foreground/40">No creators found for "{debouncedQuery}"</p>
              <p className="text-[12px] text-foreground/25 mt-1">Try a different Instagram handle or name</p>
            </div>
          ) : (
            <ul className="overflow-y-auto flex-1">
              {creators.map((creator) => (
                <li key={creator.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(creator)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-card transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-foreground/60" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-foreground font-medium truncate">{decodeHtmlEntities(creator.name)}</p>
                      <p className="text-[12px] text-foreground/40 truncate">
                        @{decodeHtmlEntities(creator.username)}
                        {creator.category && ` · ${creator.category}`}
                      </p>
                    </div>
                    {/* Platform icons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {creator.platforms.map((platform) => (
                        <div key={platform.name} className="flex items-center gap-0.5">
                          {platform.name === 'Instagram' && (
                            <Instagram className="w-3.5 h-3.5 text-pink-400" />
                          )}
                          {platform.name === 'YouTube' && (
                            <Youtube className="w-3.5 h-3.5 text-destructive" />
                          )}
                          {platform.followers && (
                            <span className="text-[10px] text-foreground/30">
                              {(platform.followers / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Hint when empty */}
      {!showResults && !selectedCreator && (
        <p className="mt-2 text-[12px] text-foreground/25 text-center">
          Enter an Instagram handle or name to find creators
        </p>
      )}
    </div>
  );
};

export default CreatorSearch;
