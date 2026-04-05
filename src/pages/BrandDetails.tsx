"use client";

import { useParams, useNavigate } from 'react-router-dom';
import { useBrandById } from '@/lib/hooks/useBrands';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Clock, DollarSign, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/empty-states/EmptyState';
import { useState } from 'react';

const BrandDetails = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [showApplyNotice, setShowApplyNotice] = useState<string | null>(null);
  
  const { data: brand, isLoading: brandLoading, error: brandError } = useBrandById(brandId);
  const { data: opportunities = [], isLoading: oppsLoading, error: oppsError } = useOpportunities({
    brandId: brandId,
    status: 'open',
  });

  const isLoading = brandLoading || oppsLoading;

  if (isLoading) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground/60" />
      </div>
    );
  }

  // Error handling
  if (brandError || oppsError) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/brand-directory')}
          className="mb-4 text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>
        <EmptyState
          type="error"
          title="Failed to Load"
          description="Unable to fetch brand information. Please try again later."
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
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/brand-directory')}
          className="mb-4 text-foreground/80 hover:text-foreground"
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

  const activeOpportunities = opportunities.filter(
    opp => opp.status === 'open' && new Date(opp.deadline) >= new Date()
  );

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-foreground pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/brand-directory')}
          className="mb-6 text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Directory
        </Button>

        {/* Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-secondary/50 backdrop-blur-xl border-border rounded-2xl p-6">
            <CardContent className="p-0">
              <div className="flex items-start gap-4">
                {/* Brand Logo/Avatar */}
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-foreground font-bold text-2xl flex-shrink-0">
                    {brand.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-foreground">{brand.name}</h1>
                    {brand.verified && (
                      <Badge variant="default" className="bg-info/20 text-info border-info/30">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-foreground/70 mb-4">{brand.industry}</p>
                  
                  {brand.description && (
                    <p className="text-foreground/80 mb-4">{brand.description}</p>
                  )}

                  {/* Brand Stats */}
                  <div className="flex flex-wrap gap-4">
                    {(brand.rating || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-foreground font-semibold">{brand.rating?.toFixed(1)}</span>
                        <span className="text-foreground/60">({brand.review_count || 0} reviews)</span>
                      </div>
                    )}
                    
                    {brand.avg_payment_time_days && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-foreground/60" />
                        <span className="text-foreground/80">Avg Payment: {brand.avg_payment_time_days} days</span>
                      </div>
                    )}
                    
                    {(brand.budget_min || brand.budget_max) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                        <span className="text-foreground/80">
                          {brand.budget_min ? `₹${(brand.budget_min / 1000).toFixed(0)}K` : 'N/A'}
                          {brand.budget_min && brand.budget_max ? ' - ' : ''}
                          {brand.budget_max ? `₹${(brand.budget_max / 1000).toFixed(0)}K` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Opportunities Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Active Opportunities
            </h2>
            {activeOpportunities.length > 0 && (
              <Badge className="bg-info/20 text-info border-info/30">
                {activeOpportunities.length} Available
              </Badge>
            )}
          </div>

          {activeOpportunities.length === 0 ? (
            <Card className="bg-secondary/50 backdrop-blur-xl border-border rounded-2xl p-8">
              <EmptyState
                type="no-data"
                title="No Active Opportunities"
                description={`No active opportunities found for ${brand.name}. Check back later — new campaigns update daily.`}
                variant="compact"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOpportunities.slice(0, 4).map((opp, index) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-secondary/50 backdrop-blur-xl border-border rounded-xl p-5 hover:border-border transition-all">
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground flex-1">{opp.title}</h3>
                        {(() => {
                          // Try to detect source from apply_url or brand source
                          const source = opp.apply_url?.includes('influencer.in') ? 'influencer.in' :
                                        opp.apply_url?.includes('collabstr') ? 'collabstr' :
                                        (opp.brand as any)?.source || 'marketplace';
                          return (
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-secondary/50 border-border text-foreground/80 text-xs"
                            >
                              {source === 'influencer.in' ? 'influencer.in' :
                               source === 'collabstr' ? 'Collabstr' : 'Marketplace'}
                            </Badge>
                          );
                        })()}
                      </div>
                      
                      {opp.description ? (
                        <p className="text-foreground/70 text-sm mb-3 line-clamp-2">{opp.description}</p>
                      ) : (
                        <p className="text-foreground/50 text-sm mb-3 italic line-clamp-2">No description available</p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          <span className="text-foreground/80">
                            {opp.payout_min > 0 && opp.payout_max > 0 ? (
                              `₹${(opp.payout_min / 1000).toFixed(0)}K - ₹${(opp.payout_max / 1000).toFixed(0)}K`
                            ) : (
                              'Budget Not Provided'
                            )}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-foreground/60" />
                          <span className="text-foreground/70">
                            Deadline: {new Date(opp.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {opp.required_platforms && opp.required_platforms.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-foreground/60" />
                            <span className="text-foreground/70">
                              {opp.required_platforms.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/brands/${brandId}/opportunities`)}
                          className="flex-1 border-border text-foreground hover:bg-secondary/50"
                        >
                          View Full Details
                        </Button>
                        {opp.apply_url && (
                          <Button
                            size="sm"
                            onClick={() => setShowApplyNotice(opp.id)}
                            className="bg-info hover:bg-info text-foreground min-h-[44px]"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {activeOpportunities.length > 4 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => navigate(`/brands/${brandId}/opportunities`)}
                className="border-border text-foreground hover:bg-secondary/50"
              >
                View All {activeOpportunities.length} Opportunities
              </Button>
            </div>
          )}
        </motion.div>

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
                className="bg-secondary/50 backdrop-blur-xl border border-border rounded-2xl p-6 max-w-md w-full"
              >
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
                  External Application
                </h3>
                <p className="text-foreground/80 text-center mb-4">
                  You'll apply on the brand's original website. We don't collect or store your submission.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowApplyNotice(null)}
                    className="flex-1 border-border text-foreground hover:bg-secondary/50 min-h-[48px]"
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
                    className="flex-1 bg-info hover:bg-info text-foreground min-h-[48px]"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BrandDetails;
