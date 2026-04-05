import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorSearch from '@/components/brand-dashboard/CreatorSearch';
import type { CreatorProfile } from '@/lib/hooks/useCreators';
import { useCreators } from '@/lib/hooks/useCreators';
import BrandBottomNav from '@/components/brand-dashboard/BrandBottomNav';
import { Send, Search, Instagram, Youtube, Twitter, Loader2, User, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Fashion', label: 'Fashion' },
  { id: 'Food', label: 'Food' },
  { id: 'Tech', label: 'Tech' },
  { id: 'Lifestyle', label: 'Lifestyle' },
  { id: 'Travel', label: 'Travel' },
  { id: 'Fitness', label: 'Fitness' },
  { id: 'Beauty', label: 'Beauty' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Business', label: 'Business' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Fashion: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Food: 'bg-warning/20 text-warning border-warning/30',
  Tech: 'bg-info/20 text-info border-info/30',
  Lifestyle: 'bg-secondary/20 text-secondary border-purple-500/30',
  Travel: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  Fitness: 'bg-green-500/20 text-green-300 border-green-500/30',
  Beauty: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Gaming: 'bg-destructive/20 text-destructive border-destructive/30',
  Business: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

const SORT_OPTIONS = [
  { id: 'followers', label: 'Most Followers' },
  { id: 'followers_asc', label: 'Fewest Followers' },
  { id: 'name', label: 'Name A–Z' },
] as const;
type SortOption = typeof SORT_OPTIONS[number]['id'];

const getPrimaryFollowers = (creator: CreatorProfile) => {
  const instagram = creator.platforms?.find(p => p.name === 'Instagram');
  return instagram?.followers ?? 0;
};

const BrandDiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('followers');

  const { data: creators = [], isLoading, isFetching } = useCreators({
    search: searchQuery,
    category: category === 'all' ? undefined : category,
    limit: 30,
  });

  const sortedCreators = useMemo(() => {
    return [...creators].sort((a, b) => {
      if (sort === 'followers') {
        return getPrimaryFollowers(b) - getPrimaryFollowers(a);
      } else if (sort === 'followers_asc') {
        return getPrimaryFollowers(a) - getPrimaryFollowers(b);
      } else {
        return (a.username || '').localeCompare(b.username || '');
      }
    });
  }, [creators, sort]);

  const handleSendOffer = (creator: CreatorProfile) => {
    window.location.href = `/collab/${creator.username}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-foreground pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-3 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Offers
        </button>
        <h1 className="text-2xl font-black text-foreground">Discover Creators</h1>
        <p className="text-sm text-foreground/60 mt-1">Find the right creators for your brand</p>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* Search */}
        <CreatorSearch
          onSelect={setSelectedCreator}
          selectedCreator={selectedCreator}
          onClear={() => setSelectedCreator(null)}
        />

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                category === cat.id
                  ? 'bg-secondary text-foreground'
                  : 'bg-secondary/50 text-foreground/60 hover:bg-secondary/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/30">{creators.length} creator{creators.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-foreground/30">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-card border border-border text-foreground/60 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-400/50"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 text-foreground/40 animate-spin" />
            <span className="text-foreground/40 text-sm">Finding creators...</span>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-secondary/50" />
            </div>
            <h3 className="text-[16px] font-semibold text-foreground/60 mb-1">No creators found</h3>
            <p className="text-[13px] text-foreground/30 max-w-xs mx-auto">
              {searchQuery
                ? `Try a different search term or browse all categories`
                : 'Check back soon — more creators are joining every week'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-foreground/30">
              {creators.length} creator{creators.length !== 1 ? 's' : ''} found
            </p>
            {sortedCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-card border border-border rounded-2xl p-4 hover:border-purple-400/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-foreground/60" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-bold text-foreground truncate">{creator.name}</p>
                        <p className="text-[12px] text-secondary">@{creator.username}</p>
                      </div>
                      <button
                        onClick={() => handleSendOffer(creator)}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-secondary hover:bg-secondary text-foreground text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Send className="w-3 h-3" />
                        Send Offer
                      </button>
                    </div>

                    {creator.bio && (
                      <p className="mt-1.5 text-[12px] text-foreground/40 line-clamp-2 leading-relaxed">{creator.bio}</p>
                    )}

                    {/* Platforms + Category */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {creator.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[creator.category] || 'bg-secondary/50 text-foreground/60 border-border'
                        }`}>
                          {creator.category}
                        </span>
                      )}
                      {creator.platforms.map((platform) => (
                        <span key={platform.name} className="flex items-center gap-1 text-[11px] text-foreground/40">
                          {platform.name === 'Instagram' && <Instagram className="w-3 h-3 text-pink-400" />}
                          {platform.name === 'YouTube' && <Youtube className="w-3 h-3 text-destructive" />}
                          {platform.name === 'Twitter' && <Twitter className="w-3 h-3 text-info" />}
                          {platform.name === 'TikTok' && <span className="text-[10px]">TikTok</span>}
                          {platform.handle}
                          {platform.followers && (
                            <span className="text-foreground/25">· {(platform.followers / 1000).toFixed(0)}K</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BrandBottomNav />
    </div>
  );
};

export default BrandDiscoverPage;
