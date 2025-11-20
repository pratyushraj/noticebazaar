"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

interface ActiveCampaignsCardProps {
  activeCampaigns: number;
  deliverablesDue: number;
  brandDeals?: BrandDeal[];
  isLoading?: boolean;
  onAddCampaign?: () => void;
}

const ActiveCampaignsCard: React.FC<ActiveCampaignsCardProps> = ({
  activeCampaigns,
  deliverablesDue,
  brandDeals = [],
  isLoading = false,
  onAddCampaign,
}) => {
  const navigate = useNavigate();

  // Find campaign with upcoming deliverable
  const campaignWithDeliverable = React.useMemo(() => {
    return brandDeals.find(deal => 
      deal.status === 'Approved' && deal.payment_expected_date
    );
  }, [brandDeals]);

  const getBrandInitials = (brandName: string): string => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="secondary" interactive onClick={() => navigate('/creator-contracts')} className="group h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5 text-white/80" />
          </div>
          <CardTitle>Active Campaigns</CardTitle>
        </div>
      </CardHeader>

      {activeCampaigns === 0 ? (
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No Active Campaigns"
            description="Start a new campaign to grow your brand."
            ctaText="Start Campaign"
            onCtaClick={onAddCampaign}
          />
        </CardContent>
      ) : (
        <>
          <CardContent>
            <div className="text-2xl font-semibold text-white tracking-tight">{activeCampaigns} running</div>
            <div className="text-[13px] text-white/60 mt-1">
              {deliverablesDue} deliverable{deliverablesDue !== 1 ? 's' : ''} due
              {campaignWithDeliverable && (
                <span className="text-yellow-400"> in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>
              )}
            </div>

            {campaignWithDeliverable && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs text-white font-semibold">
                      {getBrandInitials(campaignWithDeliverable.brand_name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{campaignWithDeliverable.brand_name}</div>
                      <div className="text-xs text-yellow-400">
                        Due in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors shrink-0" />
                </div>
              </div>
            )}
          </CardContent>

          <div className="px-4 pb-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-sm text-blue-500 group-hover:text-blue-400 transition-colors cursor-pointer">
              <span className="whitespace-nowrap">Manage</span>
              <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default ActiveCampaignsCard;

