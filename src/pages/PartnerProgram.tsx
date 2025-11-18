"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import {
  useReferralLink,
  usePartnerStats,
  usePartnerEarnings,
  usePartnerMilestones,
  usePartnerLeaderboard,
  useRefreshPartnerStats,
} from '@/lib/hooks/usePartnerProgram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  Copy,
  Check,
  QrCode,
  TrendingUp,
  Users,
  Award,
  Download,
  DollarSign,
  Calendar,
  Loader2,
  Trophy,
  FileText,
  HelpCircle,
  RefreshCw,
  MousePointerClick,
  UserPlus,
  CreditCard,
  Share2,
  Instagram,
  MessageCircle,
  Twitter,
  History,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatReferralLink, getNextTierRequirements, MILESTONE_REWARDS, getTierBenefits, type PartnerTier } from '@/lib/utils/partner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  usePartnerPerformance,
  usePartnerRank,
  useProjectedEarnings,
  useRewardHistory,
} from '@/lib/hooks/usePartnerProgram';

// Demo data for Partner Program (used when database tables don't exist)
const DEMO_DATA = {
  referralLink: {
    code: 'NB4F7X9D2KQ',
    url: 'https://noticebazaar.com/r/NB4F7X9D2KQ',
  },
  stats: {
    total_earnings: 8750,
    this_month_earnings: 2500,
    active_referrals: 17,
    tier: 'growth' as PartnerTier,
    total_referrals: 17,
    free_months_credit: 2,
    // New fields from test cases
    total_clicks: 420,
    total_signups: 32,
    total_paid_users: 17,
    current_month_earnings: 2500,
    partner_rank: 5,
    next_reward_referrals: 3,
    next_payout_date: null,
    updated_at: new Date().toISOString(),
  },
  performance: {
    total_clicks: 420,
    total_signups: 32,
    total_paid_users: 17,
  },
  rank: {
    rank: 5,
    totalPartners: 248,
  },
  earnings: {
    cash: 6750,
    vouchers: 2000, // ₹1,000 Amazon + ₹1,000 Croma
    freeMonths: 2,
  },
  milestones: [
    { milestone_name: '10_referrals', reward_value: 1000, reward_type: 'voucher' as const, achieved_at: new Date().toISOString(), brand: 'Amazon' },
    { milestone_name: '20_referrals', reward_value: 1000, reward_type: 'voucher' as const, achieved_at: new Date().toISOString(), brand: 'Croma' },
  ],
  leaderboard: [
    { name: '@viralTechGuru', referrals: 61, earnings: 28400, tier: 'pro' as PartnerTier, avatar: null },
    { name: '@stylebyRiya', referrals: 47, earnings: 22200, tier: 'pro' as PartnerTier, avatar: null },
    { name: '@foodloverSam', referrals: 35, earnings: 15950, tier: 'elite' as PartnerTier, avatar: null },
    { name: '@gamingwithsid', referrals: 23, earnings: 9100, tier: 'partner' as PartnerTier, avatar: null },
    { name: '@noticebazaar.legal', referrals: 17, earnings: 8750, tier: 'growth' as PartnerTier, avatar: null, isCurrentUser: true },
  ],
  nextTier: {
    tier: 'elite' as PartnerTier,
    requiredReferrals: 30,
    currentReferrals: 17,
    progress: 56.67, // 17/30 * 100
  },
  nextReward: {
    referralsNeeded: 3,
    rewardType: 'free_month' as const,
    rewardValue: 1,
    rewardDescription: '1 Free Month',
    progress: 85, // 17/(17+3) * 100
  },
  mediaKit: {
    iphoneMockups: 12,
    storyTemplates: 8,
    pngAssets: 6,
  },
  projectedEarnings: 4370, // Calculated from current_month_earnings
  rewardHistory: [
    { id: '1', reward_type: 'cash', amount: 1250, status: 'paid', description: 'Commission from referral subscription', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', reward_type: 'voucher', amount: 1000, status: 'unlocked', description: 'Amazon Gift Card - 10 referrals milestone', created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', reward_type: 'cash', amount: 500, status: 'paid', description: 'Commission from referral subscription', created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '4', reward_type: 'free_month', amount: 1, status: 'unlocked', description: 'Free month credit from referral', created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
  ],
};

const PartnerProgram: React.FC = () => {
  const { user, profile } = useSession();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [copyAnimation, setCopyAnimation] = useState(false);

  const {
    data: referralLink,
    isLoading: loadingLink,
    refetch: refetchLink,
  } = useReferralLink(user?.id);

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = usePartnerStats(user?.id);

  const {
    data: earnings,
    isLoading: loadingEarnings,
  } = usePartnerEarnings(user?.id, 20);

  const {
    data: milestones,
  } = usePartnerMilestones(user?.id);

  const {
    data: leaderboard,
    isLoading: loadingLeaderboard,
  } = usePartnerLeaderboard(10);

  const {
    data: performance,
    isLoading: loadingPerformance,
  } = usePartnerPerformance(user?.id);

  const {
    data: rankData,
  } = usePartnerRank(user?.id);

  const {
    data: projectedEarnings,
  } = useProjectedEarnings(user?.id);

  const {
    data: rewardHistory,
    isLoading: loadingRewardHistory,
  } = useRewardHistory(user?.id, 20);

  const refreshStatsMutation = useRefreshPartnerStats();

  const handleCopyLink = async () => {
    if (!displayReferralLink) return;
    const link = useDemoData ? DEMO_DATA.referralLink.url : formatReferralLink(displayReferralLink);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyAnimation(true);
      toast.success('Referral link copied!');
      setTimeout(() => {
        setCopied(false);
        setCopyAnimation(false);
      }, 1500);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleSocialShare = (platform: 'instagram' | 'whatsapp' | 'twitter') => {
    const link = useDemoData ? DEMO_DATA.referralLink.url : formatReferralLink(displayReferralLink || '');
    const caption = encodeURIComponent("I'm using NoticeBazaar to manage payments, contracts & legal tasks. Use my link to get a 1-month free trial!");
    
    let shareUrl = '';
    
    switch (platform) {
      case 'instagram':
        // Instagram Stories uses a custom URL scheme
        shareUrl = `https://www.instagram.com/create/story/?url=${encodeURIComponent(link)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${caption}%20${encodeURIComponent(link)}`;
        window.open(shareUrl, '_blank');
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${caption}&url=${encodeURIComponent(link)}`;
        window.open(shareUrl, '_blank');
        break;
    }
    
    toast.success(`Opening ${platform}...`);
  };

  const handleRefreshStats = async () => {
    if (!user?.id) return;
    try {
      await refreshStatsMutation.mutateAsync(user.id);
      refetchStats();
      refetchLink();
      toast.success('Stats refreshed!');
    } catch (error: any) {
      toast.error('Failed to refresh stats');
    }
  };

  // Use demo data if database tables don't exist or if explicitly enabled
  useEffect(() => {
    if (stats === null && referralLink === null && !loadingStats && !loadingLink) {
      setUseDemoData(true);
    } else {
      setUseDemoData(false);
    }
  }, [stats, referralLink, loadingStats, loadingLink]);

  // Use demo data or real data
  const displayStats = useDemoData ? DEMO_DATA.stats : stats;
  const displayReferralLink = useDemoData ? DEMO_DATA.referralLink.code : referralLink?.code;
  const displayLeaderboard = useDemoData ? DEMO_DATA.leaderboard : (leaderboard || []);
  const displayMilestones = useDemoData ? DEMO_DATA.milestones : (milestones || []);
  const displayPerformance = useDemoData ? DEMO_DATA.performance : performance;
  const displayRank = useDemoData ? DEMO_DATA.rank : rankData;
  const displayProjectedEarnings = useDemoData ? DEMO_DATA.projectedEarnings : (projectedEarnings ?? null);
  const displayRewardHistory = useDemoData ? DEMO_DATA.rewardHistory : (rewardHistory || []);

  const currentTier = (displayStats?.tier || 'starter') as PartnerTier;
  const nextTierInfo = useDemoData 
    ? { tier: DEMO_DATA.nextTier.tier, referralsNeeded: DEMO_DATA.nextTier.requiredReferrals - DEMO_DATA.nextTier.currentReferrals }
    : (displayStats ? getNextTierRequirements(currentTier, displayStats.active_referrals) : null);

  const thisMonthEarnings = useDemoData 
    ? DEMO_DATA.stats.this_month_earnings
    : (earnings || [])
        .filter(e => {
          const earningDate = new Date(e.created_at);
          const now = new Date();
          return earningDate.getMonth() === now.getMonth() && earningDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, e) => sum + e.net_amount, 0);

  const totalCashEarnings = useDemoData
    ? DEMO_DATA.earnings.cash
    : (earnings || [])
        .filter(e => e.type === 'cash')
        .reduce((sum, e) => sum + e.net_amount, 0);

  const totalVoucherEarnings = useDemoData
    ? DEMO_DATA.earnings.vouchers
    : (earnings || [])
        .filter(e => e.type === 'voucher')
        .reduce((sum, e) => sum + e.amount, 0);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/creator-dashboard')}
          className="text-white/70 hover:text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40">
            <Gift className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Partner Program</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            NoticeBazaar Partner Program
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Earn commissions, unlock rewards, and grow with us. Share NoticeBazaar and get rewarded for every subscription.
          </p>
        </div>

        {/* Your Rank Widget */}
        {displayRank && (
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 shadow-[0_0_10px_-3px_rgba(59,130,246,0.3)]">
              <Trophy className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">
                Your Rank: #{displayRank.rank || 'N/A'} out of {displayRank.totalPartners || 0} partners
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/60">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ₹{(displayStats?.total_earnings || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-white/40 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/60">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ₹{thisMonthEarnings.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-white/40 mt-1">Current month</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/60">Active Referrals</CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {displayStats?.active_referrals || 0}
              </div>
              <p className="text-xs text-white/40 mt-1">Subscribed users</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/60">Tier</CardTitle>
                <Award className="h-4 w-4 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge
                className={cn(
                  'text-xs font-semibold uppercase transition-transform hover:scale-103',
                  (currentTier === 'starter') && 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                  ((currentTier === 'partner' || currentTier === 'growth')) && 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 shadow-[0_0_8px_-2px_rgba(34,197,94,0.3)]',
                  (currentTier === 'elite') && 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_10px_-3px_rgba(168,85,247,0.4)]',
                  (currentTier === 'pro') && 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30 shadow-[0_0_10px_-3px_rgba(234,179,8,0.4)]'
                )}
              >
                {((currentTier === 'partner' || currentTier === 'growth')) ? 'Growth Partner' : currentTier}
              </Badge>
              <p className="text-xs text-white/40 mt-1">
                {nextTierInfo ? `${nextTierInfo.referralsNeeded} to ${nextTierInfo.tier}` : 'Max tier reached'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projected Monthly Earnings Widget */}
        {(displayProjectedEarnings !== null && displayProjectedEarnings !== undefined) && (
          <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 border-green-500/20 shadow-[0_0_20px_-4px_rgba(34,197,94,0.2)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  Projected Monthly Earnings
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ₹{(displayProjectedEarnings || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-white/60 mt-1">Based on current month's performance</p>
            </CardContent>
          </Card>
        )}

        {/* Referral Link, Performance & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referral Link Card */}
          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingLink && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !displayReferralLink ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/80 mb-2">
                    Partner Program tables not found.
                  </p>
                  <p className="text-xs text-white/60">
                    Please run the database migrations to enable the Partner Program.
                  </p>
                </div>
              ) : displayReferralLink ? (
                <>
                  <div className="bg-[#0F121A] rounded-lg p-4 border border-white/10 relative">
                    <p className="text-xs text-white/40 mb-2">Share this link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-white/80 break-all">
                        {useDemoData ? DEMO_DATA.referralLink.url : formatReferralLink(displayReferralLink)}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyLink}
                        className={cn(
                          "flex-shrink-0 relative transition-all duration-300",
                          copyAnimation && "scale-110 bg-green-500/20 border-green-500/50 shadow-[0_0_15px_-3px_rgba(34,197,94,0.5)]"
                        )}
                      >
                        {copyAnimation ? (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-400 animate-in fade-in zoom-in duration-300" />
                            <span className="text-xs text-green-400 font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
                              Copied!
                            </span>
                          </div>
                        ) : copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {copyAnimation && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-300 pointer-events-none">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 shadow-lg">
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-xs font-semibold text-green-300">Copied!</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowQR(!showQR)}
                      variant="outline"
                      className="flex-1"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {showQR ? 'Hide' : 'Show'} QR Code
                    </Button>
                    <Button
                      onClick={handleRefreshStats}
                      variant="outline"
                      disabled={refreshStatsMutation.isPending}
                      className="flex-1"
                    >
                      <RefreshCw className={cn('h-4 w-4 mr-2', refreshStatsMutation.isPending && 'animate-spin')} />
                      Refresh
                    </Button>
                  </div>
                  {showQR && (
                    <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                      {/* QR Code placeholder - would use a QR library in production */}
                      <div className="text-xs text-gray-500">
                        QR Code: {useDemoData ? DEMO_DATA.referralLink.url : formatReferralLink(displayReferralLink)}
                        {/* In production, use: <QRCodeSVG value={...} /> */}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-white/60">Failed to load referral link</p>
              )}
            </CardContent>
          </Card>

          {/* Referral Performance Metrics */}
          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Referral Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPerformance && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !displayPerformance && !useDemoData ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/80">Performance metrics not available</p>
                </div>
              ) : displayPerformance ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20 text-center">
                    <MousePointerClick className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {(displayPerformance.total_clicks || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-white/60 mt-1">Clicks</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20 text-center">
                    <UserPlus className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {(displayPerformance.total_signups || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-white/60 mt-1">Signups</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20 text-center">
                    <CreditCard className="h-5 w-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {(displayPerformance.total_paid_users || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-white/60 mt-1">Paid Users</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Progress to Next Tier */}
          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                Progress to Next Tier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStats && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !displayStats && !useDemoData ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/80 mb-2">
                    Partner stats not available.
                  </p>
                  <p className="text-xs text-white/60">
                    Run database migrations to enable partner tracking.
                  </p>
                </div>
              ) : nextTierInfo ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Current: {((currentTier === 'partner' || currentTier === 'growth')) ? 'Growth Partner' : currentTier}</span>
                      <span className="text-white/60">Next: {nextTierInfo.tier === 'elite' ? 'Elite Partner' : nextTierInfo.tier}</span>
                    </div>
                    <Progress
                      value={
                        useDemoData 
                          ? DEMO_DATA.nextTier.progress
                          : displayStats?.active_referrals
                            ? ((displayStats.active_referrals / (displayStats.active_referrals + nextTierInfo.referralsNeeded)) * 100)
                            : 0
                      }
                      className="h-2"
                    />
                    <p className="text-xs text-white/40">
                      {useDemoData 
                        ? `${DEMO_DATA.nextTier.requiredReferrals - DEMO_DATA.nextTier.currentReferrals} more referrals needed (${DEMO_DATA.nextTier.currentReferrals}/${DEMO_DATA.nextTier.requiredReferrals})`
                        : `${nextTierInfo.referralsNeeded} more ${nextTierInfo.referralsNeeded === 1 ? 'referral' : 'referrals'} needed`}
                    </p>
                  </div>
                  <div className="bg-[#0F121A] rounded-lg p-4 border border-white/10">
                    <p className="text-xs text-white/60 mb-2">Next tier benefits:</p>
                    <ul className="space-y-1 text-xs text-white/80">
                      {getTierBenefits(nextTierInfo.tier).slice(0, 3).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <p className="text-white font-semibold">You've reached the highest tier!</p>
                  <p className="text-white/60 text-sm mt-1">Pro Partner - 30% commission</p>
                </div>
              )}
              {(displayStats && 'next_payout_date' in displayStats && displayStats.next_payout_date) && (
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-white/80">Next payout:</span>
                    <span className="text-white font-semibold">
                      {new Date(displayStats.next_payout_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Reward Block */}
          <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/20 shadow-[0_0_20px_-4px_rgba(168,85,247,0.2)] shadow-inner">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Next Reward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStats && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !displayStats && !useDemoData ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/80">Reward info not available</p>
                </div>
              ) : (() => {
                const nextRewardReferrals = useDemoData 
                  ? DEMO_DATA.nextReward.referralsNeeded
                  : (displayStats?.next_reward_referrals || 0);
                
                const currentReferrals = displayStats?.active_referrals || 0;
                const progressValue = nextRewardReferrals > 0
                  ? (currentReferrals / (currentReferrals + nextRewardReferrals)) * 100
                  : 0;

                // Determine next reward based on tier
                let rewardDescription = '';
                let rewardValue = 0;
                
                if (useDemoData) {
                  rewardDescription = DEMO_DATA.nextReward.rewardDescription;
                  rewardValue = DEMO_DATA.nextReward.rewardValue;
                } else {
                  if (currentTier === 'starter') {
                    rewardDescription = '₹1,000 Amazon voucher';
                    rewardValue = 1000;
                  } else if (currentTier === 'partner' || currentTier === 'growth') {
                    rewardDescription = '1 Free Month';
                    rewardValue = 1;
                  } else if (currentTier === 'elite') {
                    rewardDescription = '₹2,000 Amazon voucher';
                    rewardValue = 2000;
                  } else {
                    rewardDescription = 'Maximum rewards unlocked';
                    rewardValue = 0;
                  }
                }

                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Referrals needed:</span>
                        <span className="text-white font-semibold">{nextRewardReferrals}</span>
                      </div>
                      <Progress
                        value={useDemoData ? DEMO_DATA.nextReward.progress : progressValue}
                        className="h-2"
                      />
                      <p className="text-xs text-white/50">
                        {currentReferrals} / {currentReferrals + nextRewardReferrals} referrals
                      </p>
                    </div>
                    <div className="bg-[#0F121A]/50 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center gap-3">
                        <Gift className="h-8 w-8 text-purple-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-white">{rewardDescription}</p>
                          {rewardValue > 0 && (
                            <p className="text-xs text-white/60 mt-0.5">
                              {rewardValue >= 1000 ? `₹${rewardValue.toLocaleString('en-IN')}` : `${rewardValue} month credit`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Earned Rewards */}
        <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-400" />
                Earned Rewards
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRewardHistory(true)}
                className="border-white/20 text-white/80 hover:bg-white/5"
              >
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-medium text-white/70">Cash Commissions</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{totalCashEarnings.toLocaleString('en-IN')}</p>
                <p className="text-xs text-white/50 mt-1">Total paid commissions</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-purple-400" />
                  <span className="text-sm font-medium text-white/70">Voucher Rewards</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{totalVoucherEarnings.toLocaleString('en-IN')}</p>
                <p className="text-xs text-white/50 mt-1">Total vouchers earned</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span className="text-sm font-medium text-white/70">Free Months</span>
                </div>
                <p className="text-2xl font-bold text-white">{useDemoData ? DEMO_DATA.stats.free_months_credit : (displayStats?.free_months_credit || 0)}</p>
                <p className="text-xs text-white/50 mt-1">Free months credit {useDemoData && '(earned from 10+ and 15+ referral milestones)'}</p>
              </div>
            </div>

            {loadingEarnings && !useDemoData && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {useDemoData && displayMilestones && displayMilestones.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Voucher Rewards Earned</h3>
                <div className="space-y-2">
                  {displayMilestones.map((milestone, idx) => (
                    <div key={idx} className="bg-[#0F121A] rounded-lg p-3 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {(milestone as any).brand === 'Amazon' && `Amazon Gift Card – ₹${milestone.reward_value.toLocaleString('en-IN')}`}
                          {(milestone as any).brand === 'Croma' && `Croma Voucher – ₹${milestone.reward_value.toLocaleString('en-IN')}`}
                          {milestone.milestone_name === '5_referrals' && 'Amazon Gift Card – ₹500'}
                          {milestone.milestone_name === '10_referrals' && !(milestone as any).brand && 'Amazon Gift Card – ₹1,000'}
                          {milestone.milestone_name === '20_referrals' && !(milestone as any).brand && 'Myntra Voucher – ₹2,000'}
                          {milestone.milestone_name === '40_referrals' && 'Flipkart Voucher – ₹5,000'}
                          {milestone.milestone_name === '50_referrals' && !(milestone as any).brand && 'Croma Voucher – ₹2,000'}
                          {milestone.milestone_name === '100_referrals' && 'Flipkart Voucher – ₹5,000'}
                        </p>
                        <p className="text-xs text-white/60 mt-0.5">
                          Milestone: {milestone.milestone_name.replace('_', ' ')}
                        </p>
                      </div>
                      <Gift className="h-5 w-5 text-purple-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            {milestones && milestones.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Achieved Milestones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {milestones.map((milestone) => {
                    const rewardInfo = MILESTONE_REWARDS.find(m => m.milestone === milestone.milestone_name);
                    return (
                      <div
                        key={milestone.id}
                        className="bg-[#0F121A] rounded-lg p-3 border border-green-500/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <span className="text-xs font-semibold text-white">
                            {rewardInfo?.voucherBrand || 'Voucher'}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-white">₹{milestone.reward_value.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-white/40">{rewardInfo?.milestone.replace('_', ' ')}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {!loadingLeaderboard && (
          <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Top Partners Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : displayLeaderboard && displayLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {displayLeaderboard.map((item: any, idx: number) => {
                  const profileData = useDemoData ? null : item.profiles;
                  const isCurrentUser = useDemoData ? item.isCurrentUser : item.user_id === user.id;
                  const displayName = useDemoData ? item.name : (profileData
                    ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Anonymous'
                    : 'Anonymous');
                  const displayEarnings = useDemoData ? item.earnings : item.total_earnings;
                  const displayReferrals = useDemoData ? item.referrals : item.active_referrals;
                  const displayTier = useDemoData ? item.tier : item.tier;
                  
                  return (
                    <div
                      key={useDemoData ? idx : item.user_id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border',
                        isCurrentUser
                          ? 'bg-primary/20 border-primary/40'
                          : 'bg-[#0F121A] border-white/10'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex items-center justify-center w-8 h-8 rounded-full text-primary font-bold',
                          idx === 0 && 'bg-yellow-500/20 text-yellow-400', // Gold for 1st
                          idx === 1 && 'bg-gray-400/20 text-gray-300', // Silver for 2nd
                          idx === 2 && 'bg-orange-500/20 text-orange-400', // Bronze for 3rd
                          idx > 2 && 'bg-primary/20'
                        )}>
                          {idx === 0 && '🥇'}
                          {idx === 1 && '🥈'}
                          {idx === 2 && '🥉'}
                          {idx > 2 && idx + 1}
                        </div>
                        {!useDemoData && (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profileData?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {profileData
                                ? getInitials(profileData.first_name || '', profileData.last_name || '')
                                : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {displayName}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-primary">(YOU)</span>
                            )}
                          </p>
                          <Badge
                            className={cn(
                              'text-xs mt-1',
                              displayTier === 'starter' && 'bg-gray-500/20 text-gray-300',
                              displayTier === 'partner' && 'bg-blue-500/20 text-blue-300',
                              displayTier === 'elite' && 'bg-purple-500/20 text-purple-300',
                              displayTier === 'pro' && 'bg-yellow-500/20 text-yellow-300'
                            )}
                          >
                            {displayTier}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">₹{displayEarnings.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-white/40">{displayReferrals} referrals</p>
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-white/80">
                    No leaderboard data available. Run migrations to enable partner tracking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Media Kit */}
        <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-400" />
              Media Kit Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60 mb-4">
              Download ready-made assets to promote NoticeBazaar on your social media.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'iPhone Mockups', icon: FileText, count: DEMO_DATA.mediaKit.iphoneMockups },
                { name: 'Story Templates', icon: FileText, count: DEMO_DATA.mediaKit.storyTemplates },
                { name: 'PNG Assets', icon: Download, count: DEMO_DATA.mediaKit.pngAssets },
                { name: 'Ready-made Captions', icon: FileText, count: 6 },
              ].map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 bg-[#0F121A] border-white/10 hover:bg-[#0F121A]/80"
                  onClick={() => toast.info('Media kit download coming soon!')}
                >
                  <item.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm text-white">{item.name}</span>
                  <span className="text-xs text-white/60">{item.count} assets</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Share Buttons */}
        <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/60 mb-4">
              Share NoticeBazaar with your network and earn rewards for every subscription!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSocialShare('instagram')}
                className="h-auto flex-col gap-2 py-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50"
              >
                <Instagram className="h-6 w-6 text-purple-400" />
                <span className="text-sm font-semibold text-white">Share on Instagram Story</span>
                <span className="text-xs text-white/60">Perfect for visual content</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare('whatsapp')}
                className="h-auto flex-col gap-2 py-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50"
              >
                <MessageCircle className="h-6 w-6 text-green-400" />
                <span className="text-sm font-semibold text-white">Share on WhatsApp</span>
                <span className="text-xs text-white/60">Send to groups & contacts</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialShare('twitter')}
                className="h-auto flex-col gap-2 py-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50"
              >
                <Twitter className="h-6 w-6 text-blue-400" />
                <span className="text-sm font-semibold text-white">Share on X (Twitter)</span>
                <span className="text-xs text-white/60">Reach your followers</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-[#0A0F1C] border-white/10 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] shadow-inner">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-400" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                q: 'How do payouts work?',
                a: 'Commissions are calculated when your referrals subscribe to a paid plan. Payouts are processed monthly on the 1st of each month for the previous month\'s earnings.',
              },
              {
                q: 'What are the TDS rules?',
                a: 'According to Section 194-O, TDS of 5% applies if your yearly earnings exceed ₹15,000. Earnings below this threshold are paid without TDS deduction.',
              },
              {
                q: 'What are the tier benefits?',
                a: 'Starter: 0% commission. Partner: 20% commission. Elite (10+ referrals): 25% commission + 12 months Elite Plan. Pro (100+ referrals): 30% commission + Lifetime Premium + Wall of Fame listing.',
              },
              {
                q: 'How do voucher rewards work?',
                a: 'Vouchers are automatically awarded when you reach milestone referral counts: 5 referrals = ₹500 voucher, 10 referrals = ₹1,000 voucher, 20 referrals = ₹2,000 voucher, 40 referrals = ₹5,000 voucher.',
              },
              {
                q: 'What are free month credits?',
                a: 'For each successful referral (user who subscribes), you earn 1 free month credit. These credits can be applied to your own subscription to extend your plan.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#0F121A] rounded-lg p-4 border border-white/10 shadow-inner">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-white/70">{faq.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reward History Modal */}
        <Dialog open={showRewardHistory} onOpenChange={setShowRewardHistory}>
          <DialogContent className="sm:max-w-[600px] bg-[#0A0F1C] border-white/20 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" />
                Reward History
              </DialogTitle>
              <DialogDescription className="text-white/60">
                View all your rewards and their status
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {loadingRewardHistory && !useDemoData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : displayRewardHistory && displayRewardHistory.length > 0 ? (
                displayRewardHistory.map((reward: any) => {
                  const rewardType = reward.reward_type || reward.type;
                  const rewardAmount = reward.amount || 0;
                  const rewardStatus = reward.status || 'unlocked';
                  const rewardDate = new Date(reward.created_at || reward.achieved_at);
                  
                  return (
                    <div
                      key={reward.id}
                      className="bg-[#0F121A] rounded-lg p-4 border border-white/10 shadow-inner"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            rewardType === 'cash' && 'bg-green-500/20 border border-green-500/30',
                            rewardType === 'voucher' && 'bg-purple-500/20 border border-purple-500/30',
                            rewardType === 'free_month' && 'bg-blue-500/20 border border-blue-500/30',
                          )}>
                            {rewardType === 'cash' && <DollarSign className="h-5 w-5 text-green-400" />}
                            {rewardType === 'voucher' && <Gift className="h-5 w-5 text-purple-400" />}
                            {rewardType === 'free_month' && <Calendar className="h-5 w-5 text-blue-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">
                                {rewardType === 'cash' && `₹${rewardAmount.toLocaleString('en-IN')} Commission`}
                                {rewardType === 'voucher' && `₹${rewardAmount.toLocaleString('en-IN')} Voucher`}
                                {rewardType === 'free_month' && `${rewardAmount} Free Month${rewardAmount > 1 ? 's' : ''}`}
                              </p>
                              <Badge
                                className={cn(
                                  'text-xs',
                                  rewardStatus === 'paid' && 'bg-green-500/20 text-green-300 border-green-500/30',
                                  rewardStatus === 'unlocked' && 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                  rewardStatus === 'locked' && 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                                )}
                              >
                                {rewardStatus === 'paid' && '✓ Paid'}
                                {rewardStatus === 'unlocked' && 'Unlocked'}
                                {rewardStatus === 'locked' && 'Locked'}
                              </Badge>
                            </div>
                            <p className="text-sm text-white/60 truncate">
                              {reward.description || reward.milestone_name?.replace('_', ' ') || 'Reward'}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {rewardDate.toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8 text-center">
                  <History className="h-12 w-12 text-blue-400 mx-auto mb-4 opacity-50" />
                  <p className="text-white/80 font-semibold mb-1">No rewards yet</p>
                  <p className="text-sm text-white/60">
                    Start referring to earn your first reward!
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartnerProgram;

