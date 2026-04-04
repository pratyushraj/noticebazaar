import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorSearch from '@/components/brand-dashboard/CreatorSearch';
import type { CreatorProfile } from '@/lib/hooks/useCreators';
import { Send, ArrowLeft, CheckCircle2 } from 'lucide-react';

const BrandNewDealPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);

  const handleSendOffer = () => {
    if (!selectedCreator) return;
    // Navigate to creator's public collab page where the brand fills out the offer form
    window.location.href = `/collab/${selectedCreator.username}`;
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/brand-dashboard')}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-black text-white">Send New Offer</h1>
        <p className="text-sm text-white/60 mt-1">Find creators and send them collaboration offers</p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Creator Search */}
        <div>
          <h2 className="text-[15px] font-semibold text-white/80 mb-3">Step 1 — Find a Creator</h2>
          <CreatorSearch
            onSelect={setSelectedCreator}
            selectedCreator={selectedCreator}
            onClear={() => setSelectedCreator(null)}
          />
        </div>

        {/* Selected Creator Summary */}
        {selectedCreator && (
          <div className="bg-gradient-to-br from-purple-700/30 via-purple-800/20 to-purple-900/10 border border-purple-400/15 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[17px] font-bold text-white">{selectedCreator.name}</h3>
                <p className="text-[13px] text-purple-300">@{selectedCreator.username}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            </div>

            {selectedCreator.bio && (
              <p className="text-[13px] text-white/50 mb-3 line-clamp-2">{selectedCreator.bio}</p>
            )}

            {selectedCreator.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCreator.platforms.map((p) => (
                  <span key={p.name} className="text-[11px] bg-white/10 px-2 py-1 rounded-lg text-white/60">
                    {p.name}
                    {p.followers && ` · ${(p.followers / 1000).toFixed(0)}K`}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={handleSendOffer}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all text-[15px]"
            >
              <Send className="w-4 h-4" />
              Send Offer to @{selectedCreator.username}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!selectedCreator && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-purple-400/50" />
            </div>
            <h3 className="text-[16px] font-semibold text-white/60 mb-1">Search for a creator above</h3>
            <p className="text-[13px] text-white/30 max-w-xs mx-auto">
              Enter their Instagram handle or name to find them and send a collaboration offer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandNewDealPage;
