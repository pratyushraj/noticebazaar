"use client";

import { useParams, useNavigate } from 'react-router-dom';
import { useBrandById } from '@/lib/hooks/useBrands';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Clock, DollarSign, ExternalLink, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { useState } from 'react';

const BrandOpportunities = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [showApplyNotice, setShowApplyNotice] = useState<string | null>(null);
  
  const { data: brand, isLoading: brandLoading, error: brandError } = useBrandById(brandId);
  const { data: opportunities = [], isLoading: oppsLoading, error: oppsError } = useOpportunities({
    brandId: brandId,
    status: 'open',
  });

  const isLoading = brandLoading || oppsLoading;

  // Filter out expired opportunities
  const activeOpportunities = opportunities
    .filter(opp => opp.status === 'open' && new Date(opp.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const handleApplyClick = (oppId: string) => {
    setShowApplyNotice(oppId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  // Error handling
  if (brandError || oppsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/brand-directory')}
          className="mb-4 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
        <EmptyState
          type="error"
          title="Failed to Load"
          description="Unable to fetch opportunities. Please try again later."
          primaryAction={{
            label: "Retry",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/brand-directory')}
          className="mb-4 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
        <EmptyState
          type="no-data"
          title="Brand Not Found"
          description="This brand doesn't exist or has been removed."
        />
      </div>
    );
  }

  // Get source badge info from opportunity
  const getSourceInfo = (opp: any) => {
    // Try to detect source from apply_url first, then brand source
    const source = opp.apply_url?.includes('influencer.in') ? 'influencer.in' :
                  opp.apply_url?.includes('collabstr') ? 'collabstr' :
                  (opp.brand as any)?.source || 'marketplace';
    
    switch (source) {
      case 'influencer.in':
        return { label: 'influencer.in', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'collabstr':
        return { label: 'Collabstr', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      default:
        return { label: 'Marketplace', color: 'bg-white/10 text-white/80 border-white/20' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/brands/${brandId}`)}
            className="mb-4 text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {brand.name}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {brand.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{brand.name} Opportunities</h1>
              <p className="text-white/60 text-sm">{brand.industry}</p>
            </div>
          </div>
        </div>

        {/* Apply Notice Modal */}
        <AnimatePresence>
          {showApplyNotice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowApplyNotice(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
              >
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2 text-center">
                  External Application
                </h3>
                <p className="text-white/80 text-center mb-4">
                  You'll apply on the brand's original website. We don't collect or store your submission.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplyNotice(null)}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 min-h-[48px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const opp = activeOpportunities.find(o => o.id === showApplyNotice);
                      if (opp?.apply_url) {
                        window.open(opp.apply_url, '_blank', 'noopener,noreferrer');
                      }
                      setShowApplyNotice(null);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white min-h-[48px]"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opportunities List */}
        {activeOpportunities.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-2xl p-8">
            <EmptyState
              type="no-data"
              title={`No Active Opportunities`}
              description={`No active opportunities found for ${brand.name}. Check back later — new campaigns update daily.`}
            />
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-white/60">
              {activeOpportunities.length} opportunity{activeOpportunities.length !== 1 ? 'ies' : ''} found
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {activeOpportunities.map((opp, index) => {
                  const sourceInfo = getSourceInfo(opp);
                  
                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-white/10 backdrop-blur-xl border-white/20 rounded-xl p-6 hover:border-white/30 transition-all">
                        <CardContent className="p-0">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-white">{opp.title}</h3>
                                <Badge className={cn('text-xs', sourceInfo.color)}>
                                  From {sourceInfo.label}
                                </Badge>
                              </div>
                              {opp.description ? (
                                <p className="text-white/70 text-sm mb-3">{opp.description}</p>
                              ) : (
                                <p className="text-white/50 text-sm mb-3 italic">No description available</p>
                              )}
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Budget */}
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-white/60 mb-0.5">Budget</p>
                                <p className="text-white font-semibold">
                                  {opp.payout_min > 0 && opp.payout_max > 0 ? (
                                    `₹${(opp.payout_min / 1000).toFixed(0)}K - ₹${(opp.payout_max / 1000).toFixed(0)}K`
                                  ) : (
                                    'Budget Not Provided'
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Deadline */}
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <Clock className="w-5 h-5 text-white/60 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-white/60 mb-0.5">Deadline</p>
                                <p className="text-white font-semibold">
                                  {new Date(opp.deadline).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Deliverable Type */}
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <TrendingUp className="w-5 h-5 text-white/60 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-white/60 mb-0.5">Deliverable</p>
                                <p className="text-white font-semibold capitalize">{opp.deliverable_type}</p>
                              </div>
                            </div>

                            {/* Platforms */}
                            {opp.required_platforms && opp.required_platforms.length > 0 && (
                              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                <Users className="w-5 h-5 text-white/60 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-white/60 mb-0.5">Platforms</p>
                                  <p className="text-white font-semibold">
                                    {opp.required_platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Info */}
                          {(opp.min_followers || opp.deliverables_description) && (
                            <div className="mb-4 p-3 bg-white/5 rounded-lg">
                              {opp.min_followers && (
                                <p className="text-sm text-white/70 mb-1">
                                  <span className="font-semibold">Min Followers:</span> {opp.min_followers.toLocaleString()}
                                </p>
                              )}
                              {opp.deliverables_description && (
                                <p className="text-sm text-white/70">
                                  <span className="font-semibold">Requirements:</span> {opp.deliverables_description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-3">
                            {opp.apply_url ? (
                              <Button
                                onClick={() => handleApplyClick(opp.id)}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white min-h-[48px] text-base"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Apply Now
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="flex-1 bg-white/10 text-white/50 cursor-not-allowed min-h-[48px]"
                              >
                                Apply URL Not Available
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
          </>
        )}
      </div>
    </div>
  );
};

export default BrandOpportunities;

