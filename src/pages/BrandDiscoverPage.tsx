import React, { useState, useEffect } from 'react';
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
  Food: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Tech: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Lifestyle: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Travel: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  Fitness: 'bg-green-500/20 text-green-300 border-green-500/30',
  Beauty: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Gaming: 'bg-red-500/20 text-red-300 border-red-500/30',
  Business: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

const BrandDiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: creators = [], isLoading, isFetching } = useCreators({
    search: searchQuery,
    category: category === 'all' ? undefined : category,
    limit: 30,
  });

  const handleSendOffer = (creator: CreatorProfile) => {
    window.location.href = `/collab/${creator.username}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-3 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Offers
        </button>
        <h1 className="text-2xl font-black text-white">Discover Creators</h1>
        <p className="text-sm text-white/60 mt-1">Find the right creators for your brand</p>
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
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
            <span className="text-white/40 text-sm">Finding creators...</span>
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-purple-400/50" />
            </div>
            <h3 className="text-[16px] font-semibold text-white/60 mb-1">No creators found</h3>
            <p className="text-[13px] text-white/30 max-w-xs mx-auto">
              {searchQuery
                ? `Try a different search term or browse all categories`
                : 'Check back soon — more creators are joining every week'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/30">
              {creators.length} creator{creators.length !== 1 ? 's' : ''} found
            </p>
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-400/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white/60" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-bold text-white truncate">{creator.name}</p>
                        <p className="text-[12px] text-purple-300">@{creator.username}</p>
                      </div>
                      <button
                        onClick={() => handleSendOffer(creator)}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        <Send className="w-3 h-3" />
                        Send Offer
                      </button>
                    </div>

                    {creator.bio && (
                      <p className="mt-1.5 text-[12px] text-white/40 line-clamp-2 leading-relaxed">{creator.bio}</p>
                    )}

                    {/* Platforms + Category */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {creator.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          CATEGORY_COLORS[creator.category] || 'bg-white/10 text-white/60 border-white/20'
                        }`}>
                          {creator.category}
                        </span>
                      )}
                      {creator.platforms.map((platform) => (
                        <span key={platform.name} className="flex items-center gap-1 text-[11px] text-white/40">
                          {platform.name === 'Instagram' && <Instagram className="w-3 h-3 text-pink-400" />}
                          {platform.name === 'YouTube' && <Youtube className="w-3 h-3 text-red-400" />}
                          {platform.name === 'Twitter' && <Twitter className="w-3 h-3 text-blue-400" />}
                          {platform.name === 'TikTok' && <span className="text-[10px]">TikTok</span>}
                          {platform.handle}
                          {platform.followers && (
                            <span className="text-white/25">· {(platform.followers / 1000).toFixed(0)}K</span>
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
