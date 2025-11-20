"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { BrandDeal } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PINK_THEME } from '@/constants/colors';

interface CampaignsOverviewCardProps {
  activeCampaigns: number;
  deliverablesDue: number;
  completed: number;
  completedChange: number;
  onTimeRate: number;
  brandDeals?: BrandDeal[];
  onAddCampaign?: () => void;
  isLoading?: boolean;
}

const CampaignsOverviewCard: React.FC<CampaignsOverviewCardProps> = ({
  activeCampaigns,
  deliverablesDue,
  completed,
  completedChange,
  onTimeRate,
  brandDeals = [],
  onAddCampaign,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const getBrandInitials = (brandName: string): string => {
    return brandName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const campaignWithDeliverable = useMemo(() => {
    const now = new Date();
    return brandDeals.find(deal =>
      (deal.status === 'Approved' || deal.status === 'Drafting') &&
      deal.payment_expected_date &&
      new Date(deal.payment_expected_date) > now
    );
  }, [brandDeals]);

  if (isLoading) {
    return (
      <Card variant="primary">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="bg-[#2A1F2E] border-[#4A3A4F] rounded-2xl shadow-lg hover:bg-[#3D2A3F] transition-all duration-300">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E879F9]/10 via-[#F472B6]/5 to-transparent pointer-events-none z-0 rounded-2xl"></div>
        
        <CardContent className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#E879F9] to-[#F472B6] border border-[#FF6B9D]/30 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-h3 font-semibold text-white tracking-tight">
              Campaigns
            </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/creator-contracts');
              }}
              className="text-body text-[#F472B6] hover:text-[#FF8FAB] hover:bg-[#F472B6]/10 transition-fast flex items-center gap-2 group focus-ring rounded-lg px-3 py-2"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Main Content - Rectangle Layout Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Active Campaigns Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-micro text-white/60">Active</span>
                <span className="text-3xl font-bold text-white number-large">{activeCampaigns} running</span>
              </div>
              {activeCampaigns > 0 && (
                <div className="text-body text-white/70">
                  {deliverablesDue} deliverable{deliverablesDue !== 1 ? 's' : ''} due
                  {campaignWithDeliverable && (
                    <span className="text-warning font-semibold ml-1">
                      in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  )}
                </div>
              )}
              {campaignWithDeliverable && (
                <div className="mt-3 p-4 bg-[#3D2A3F] rounded-xl border border-[#FFD89B]/40 backdrop-blur-sm card-interactive hover:bg-[#4A3A4F] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E879F9] to-[#F472B6] flex items-center justify-center text-small text-white font-semibold shadow-lg">
                        {getBrandInitials(campaignWithDeliverable.brand_name)}
                      </div>
                      <div>
                        <div className="text-body font-semibold text-white">{campaignWithDeliverable.brand_name}</div>
                        <div className="text-small text-[#FFD89B] font-medium mt-0.5">
                          Due in {Math.ceil((new Date(campaignWithDeliverable.payment_expected_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white/80 transition-colors shrink-0" />
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-white/10"></div>

            {/* Completed Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-micro text-white/60">Completed</span>
                <span className="text-3xl font-bold text-white number-large">{completed} this month</span>
              </div>
              {completedChange !== 0 && (
                <div className="flex items-center gap-2 text-body">
                  <div className={cn(
                    "flex items-center gap-1.5 font-semibold px-2 py-1 rounded-md",
                    completedChange > 0 ? "bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/40" : "bg-[#FFB3BA]/20 text-[#FF6B9D] border border-[#FF6B9D]/40"
                  )}>
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      completedChange < 0 && "rotate-180"
                    )} />
                    <span>{Math.abs(completedChange)} {completedChange > 0 ? 'more' : 'less'}</span>
                  </div>
                  <span className="text-white/60">than last month</span>
                </div>
              )}
              <div className="text-[13px] text-white/60">
                On-time delivery rate: <span className="font-semibold text-white">{onTimeRate}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CampaignsOverviewCard;

