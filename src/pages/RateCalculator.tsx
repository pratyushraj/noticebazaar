"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calculator,
  TrendingUp,
  Target,
  Info,
  Copy,
  Download,
  X,
  Share2,
  MessageCircle,
  FileText,
  HelpCircle,
  Instagram,
  Tag,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RateBreakdown {
  baseRate: number;
  platformMultiplier: number;
  followerMultiplier: number;
  engagementMultiplier: number;
  exclusivityBonus: number;
  urgencyBonus: number;
  totalRate: number;
  breakdown: Array<{ label: string; value: number; description: string }>;
}

type Currency = 'INR' | 'USD' | 'AED' | 'GBP';
type RoundingPreference = 'exact' | 'clean' | 'nearest500';
type Category = 'entertainment' | 'finance' | 'beauty' | 'tech' | 'education';

const currencySymbols: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  AED: 'د.إ',
  GBP: '£',
};

const currencyRates: Record<Currency, number> = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
  GBP: 0.0095,
};

const categoryMultipliers: Record<Category, number> = {
  finance: 1.2,
  beauty: 1.1,
  tech: 1.15,
  education: 1.05,
  entertainment: 1.0,
};

const RateCalculator = () => {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState(100000);
  const [engagementRate, setEngagementRate] = useState(5);
  const [platform, setPlatform] = useState('instagram');
  const [contentType, setContentType] = useState('post');
  const [category, setCategory] = useState<Category>('entertainment');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [rounding, setRounding] = useState<RoundingPreference>('clean');
  const [exclusivity, setExclusivity] = useState(false);
  const [urgency, setUrgency] = useState(false);
  const [isRatePulsing, setIsRatePulsing] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);

  // Helper function to round rate based on preference
  const roundRate = (rate: number): number => {
    switch (rounding) {
      case 'exact':
        return Math.round(rate);
      case 'clean':
        return Math.round(rate / 1000) * 1000;
      case 'nearest500':
        return Math.round(rate / 500) * 500;
      default:
        return Math.round(rate);
    }
  };

  // Helper function to get tooltip explanation
  const getTooltipExplanation = (label: string): string => {
    if (label === 'Base Rate') {
      return 'Calculated using category-specific CPM benchmarks and content type base rates';
    }
    if (label === 'Platform Multiplier') {
      const platformNames: Record<string, string> = {
        instagram: 'Instagram',
        youtube: 'YouTube',
        tiktok: 'TikTok',
        facebook: 'Facebook',
        twitter: 'Twitter',
      };
      return `${platformNames[platform] || 'Platform'} platform multiplier based on average CPM rates`;
    }
    if (label === 'Engagement Multiplier') {
      const avgEngagement = 3.5;
      if (engagementRate > avgEngagement) {
        return `because ${engagementRate}% is above ${avgEngagement}% avg for this category`;
      } else {
        return `because ${engagementRate}% is below ${avgEngagement}% avg for this category`;
      }
    }
    if (label === 'Follower Multiplier') {
      return `based on ${(followers / 1000).toFixed(0)}K followers tier and logarithmic scaling`;
    }
    if (label === 'Category Multiplier') {
      const categoryNames: Record<Category, string> = {
        finance: 'Finance',
        beauty: 'Beauty',
        tech: 'Tech',
        education: 'Education',
        entertainment: 'Entertainment',
      };
      const multiplier = categoryMultipliers[category];
      return `${categoryNames[category]} category has a standard base CPM multiplier of ${multiplier.toFixed(1)}×.`;
    }
    return '';
  };

  // Generate AI summary sentence
  const getAISummary = (): string => {
    const categoryNames: Record<Category, string> = {
      finance: 'finance',
      beauty: 'beauty',
      tech: 'tech',
      education: 'education',
      entertainment: 'entertainment',
    };
    const platformNames: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      facebook: 'Facebook',
      twitter: 'Twitter',
    };
    const followerTier = followers >= 1000000 ? 'large' : followers >= 500000 ? 'mid-tier' : 'growing';
    const engagementQuality = engagementRate >= 5 ? 'strong' : engagementRate >= 3 ? 'solid' : 'developing';
    
    return `Based on your ${categoryNames[category]} niche, ${engagementQuality} engagement, and ${followerTier} follower base, your fair market rate is ${currencySymbols[currency]}${getDisplayRate().toLocaleString('en-IN')}.`;
  };

  // Pulse animation trigger with scale effect
  useEffect(() => {
    setIsRatePulsing(true);
    const timer = setTimeout(() => setIsRatePulsing(false), 250);
    return () => clearTimeout(timer);
  }, [followers, engagementRate, platform, contentType, category, exclusivity, urgency]);

  const rateBreakdown = useMemo((): RateBreakdown => {
    // Base rate calculation
    let baseRate = 0;
    
    // Base rate by content type
    const contentTypeRates: Record<string, number> = {
      post: 5000,
      reel: 8000,
      story: 2000,
      video: 15000,
      carousel: 6000,
    };
    baseRate = contentTypeRates[contentType] || 5000;

    // Platform multipliers
    const platformMultipliers: Record<string, number> = {
      instagram: 1.0,
      youtube: 1.5,
      tiktok: 0.8,
      facebook: 0.7,
      twitter: 0.6,
    };
    const platformMultiplier = platformMultipliers[platform] || 1.0;

    // Category multiplier
    const categoryMultiplier = categoryMultipliers[category] || 1.0;

    // Follower-based multiplier (logarithmic scale)
    let followerMultiplier = 1.0;
    if (followers >= 1000000) {
      followerMultiplier = 3.0;
    } else if (followers >= 500000) {
      followerMultiplier = 2.0;
    } else if (followers >= 100000) {
      followerMultiplier = 1.5;
    } else if (followers >= 50000) {
      followerMultiplier = 1.2;
    } else if (followers >= 10000) {
      followerMultiplier = 1.0;
    } else {
      followerMultiplier = 0.8;
    }

    // Engagement rate multiplier
    let engagementMultiplier = 1.0;
    if (engagementRate >= 8) {
      engagementMultiplier = 1.5;
    } else if (engagementRate >= 5) {
      engagementMultiplier = 1.2;
    } else if (engagementRate >= 3) {
      engagementMultiplier = 1.0;
    } else {
      engagementMultiplier = 0.8;
    }

    // Exclusivity bonus (20%)
    const exclusivityBonus = exclusivity ? baseRate * 0.2 : 0;

    // Urgency bonus (15%)
    const urgencyBonus = urgency ? baseRate * 0.15 : 0;

    // Calculate total (with category multiplier)
    const totalRateRaw = 
      (baseRate * platformMultiplier * followerMultiplier * engagementMultiplier * categoryMultiplier) +
      exclusivityBonus +
      urgencyBonus;

    const totalRate = roundRate(totalRateRaw);

    return {
      baseRate,
      platformMultiplier,
      followerMultiplier,
      engagementMultiplier,
      exclusivityBonus,
      urgencyBonus,
      totalRate,
      breakdown: [
        {
          label: 'Base Rate',
          value: baseRate,
          description: `Base rate for ${contentType}`,
        },
        {
          label: 'Platform Multiplier',
          value: platformMultiplier,
          description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} platform`,
        },
        {
          label: 'Category Multiplier',
          value: categoryMultiplier,
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} category`,
        },
        {
          label: 'Follower Multiplier',
          value: followerMultiplier,
          description: `${(followers / 1000).toFixed(0)}K followers`,
        },
        {
          label: 'Engagement Multiplier',
          value: engagementMultiplier,
          description: `${engagementRate}% engagement rate`,
        },
        ...(exclusivity ? [{
          label: 'Exclusivity Bonus',
          value: exclusivityBonus,
          description: '20% bonus for exclusivity',
        }] : []),
        ...(urgency ? [{
          label: 'Urgency Bonus',
          value: urgencyBonus,
          description: '15% bonus for urgent delivery',
        }] : []),
      ],
    };
  }, [followers, engagementRate, platform, contentType, category, exclusivity, urgency, rounding]);

  const getDisplayRate = (): number => {
    return Math.round(rateBreakdown.totalRate * currencyRates[currency]);
  };

  const handleCopyRate = () => {
    const rate = getDisplayRate();
    navigator.clipboard.writeText(`${currencySymbols[currency]}${rate.toLocaleString('en-IN')}`);
    toast.success('Rate copied to clipboard!');
  };

  const handleCopyBreakdown = () => {
    const breakdown = rateBreakdown.breakdown
      .map(item => `${item.label}: ${typeof item.value === 'number' && item.value < 10 ? `${item.value.toFixed(1)}x` : `${currencySymbols[currency]}${Math.round(item.value * currencyRates[currency]).toLocaleString('en-IN')}`}`)
      .join('\n');
    navigator.clipboard.writeText(`Rate Breakdown:\n${breakdown}\n\nTotal: ${currencySymbols[currency]}${getDisplayRate().toLocaleString('en-IN')}`);
    toast.success('Breakdown copied to clipboard!');
  };

  const handleDownloadReport = () => {
    toast.info('Download feature coming soon!');
  };

  const handleShareWhatsApp = () => {
    const rate = getDisplayRate();
    const message = `Check out my content rate: ${currencySymbols[currency]}${rate.toLocaleString('en-IN')}\n\nCalculated using NoticeBazaar Rate Calculator`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('Opening WhatsApp...');
  };

  const handleNativeShare = async () => {
    const rate = getDisplayRate();
    const shareData = {
      title: 'Recommended Rate',
      text: `My recommended rate is ${currencySymbols[currency]}${rate.toLocaleString('en-IN')}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback to sheet
      setShareSheetOpen(true);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Calculator className="w-7 h-7 text-emerald-500" />
              Rate Calculator
            </h1>
            <p className="text-sm text-muted-foreground">
              Calculate fair rates for your content based on your metrics
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 hover:bg-muted/50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/5 shadow-[inset_0_0_25px_rgba(255,255,255,0.02),0_6px_28px_rgba(0,0,0,0.4)]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/90 tracking-wide">Your Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Followers */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Followers
              </Label>
              <div className="space-y-2">
                <Slider
                  value={[followers]}
                  onValueChange={(value) => setFollowers(value[0])}
                  min={1000}
                  max={5000000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <Input
                    type="number"
                    value={followers}
                    onChange={(e) => setFollowers(Number(e.target.value))}
                    className="w-32"
                    min={1000}
                    max={5000000}
                  />
                  <span className="text-sm text-muted-foreground">
                    {(followers / 1000).toFixed(0)}K followers
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Engagement Rate */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium block">
                  Engagement Rate
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getTooltipExplanation('Engagement Multiplier')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[engagementRate]}
                  onValueChange={(value) => setEngagementRate(value[0])}
                  min={1}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <Input
                    type="number"
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(Number(e.target.value))}
                    className="w-32"
                    min={1}
                    max={10}
                    step={0.1}
                  />
                  <span className="text-sm text-muted-foreground">
                    {engagementRate}% engagement
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Platform */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Platform
              </Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="flex items-center gap-2">
                  {platform === 'instagram' && <Instagram className="w-4 h-4 shrink-0" />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4" />
                      <span>Instagram</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Content Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Content Type
              </Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      <span>Post</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Category */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium block">
                  Category
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getTooltipExplanation('Category Multiplier')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="flex items-center gap-2">
                  <Tag className="w-4 h-4 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span>Entertainment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Additional Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exclusivity"
                  checked={exclusivity}
                  onChange={(e) => setExclusivity(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="exclusivity" className="text-sm cursor-pointer">
                  Exclusivity (20% bonus)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgency"
                  checked={urgency}
                  onChange={(e) => setUrgency(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="urgency" className="text-sm cursor-pointer">
                  Urgent Delivery (15% bonus)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Divider above Recommended Rate */}
          <div className="h-px bg-white/10" />
          
          {/* Total Rate Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Dual-tone glow behind card with green pulse */}
            <motion.div
              animate={isRatePulsing ? { opacity: [0.10, 0.20, 0.10] } : { opacity: 0.10 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,171,0.10),transparent)] blur-2xl -z-10"
            />
            
            <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-white/5 relative overflow-hidden">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Recommended Rate</p>
                  <motion.div
                    animate={isRatePulsing ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="text-5xl font-bold text-emerald-400 mb-3 tabular-nums relative"
                  >
                    {/* Subtle glow behind the number */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,171,0.15),transparent)] blur-xl -z-10" />
                    {currencySymbols[currency]}{getDisplayRate().toLocaleString('en-IN')}
                  </motion.div>
                  
                  {/* AI Summary Sentence */}
                  <p className="text-xs text-muted-foreground mb-4 px-4 leading-relaxed">
                    {getAISummary()}
                  </p>
                  
                  {/* Currency & Rounding Selectors */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                      <SelectTrigger className="w-24 h-8 text-xs border-white/10 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="AED">AED (د.إ)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={rounding} onValueChange={(v) => setRounding(v as RoundingPreference)}>
                      <SelectTrigger className="w-32 h-8 text-xs border-white/10 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">Exact</SelectItem>
                        <SelectItem value="clean">Clean (1K)</SelectItem>
                        <SelectItem value="nearest500">Nearest 500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 justify-center mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyRate}
                      className="border-white/10 text-emerald-400 hover:bg-emerald-500/10 shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Sheet open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNativeShare}
                        className="border-white/10 text-emerald-400 hover:bg-emerald-500/10 shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <SheetTrigger asChild className="hidden" />
                      <SheetContent side="bottom" className="h-auto">
                        <SheetHeader>
                          <SheetTitle>Share Rate Calculation</SheetTitle>
                          <SheetDescription>
                            Choose how you'd like to share your rate calculation
                          </SheetDescription>
                        </SheetHeader>
                        <div className="grid grid-cols-1 gap-3 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleCopyRate();
                              setShareSheetOpen(false);
                            }}
                            className="w-full justify-start border-white/10"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Rate
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleCopyBreakdown();
                              setShareSheetOpen(false);
                            }}
                            className="w-full justify-start border-white/10"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Copy Breakdown
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleDownloadReport();
                              setShareSheetOpen(false);
                            }}
                            className="w-full justify-start border-white/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              handleShareWhatsApp();
                              setShareSheetOpen(false);
                            }}
                            className="w-full justify-start border-white/10"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Share to WhatsApp
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  
                  {/* Reset Calculator Link */}
                  <button
                    onClick={() => {
                      setFollowers(100000);
                      setEngagementRate(5);
                      setPlatform('instagram');
                      setContentType('post');
                      setCategory('entertainment');
                      setCurrency('INR');
                      setRounding('clean');
                      setExclusivity(false);
                      setUrgency(false);
                      toast.success('Calculator reset');
                    }}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset all metrics →
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Breakdown */}
          <Card className="bg-card border border-white/5">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white/90 tracking-wide flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Rate Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rateBreakdown.breakdown.map((item, index) => {
                const tooltipText = getTooltipExplanation(item.label);
                const shouldShowTooltip = ['Base Rate', 'Platform Multiplier', 'Follower Multiplier', 'Engagement Multiplier', 'Category Multiplier'].includes(item.label);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      {shouldShowTooltip && tooltipText && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tooltipText}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="text-right">
                      {typeof item.value === 'number' && item.value < 10 ? (
                        <span className="text-sm font-semibold text-foreground">
                          {item.value.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          {currencySymbols[currency]}{Math.round(item.value * currencyRates[currency]).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Market Comparison */}
          <Card className="bg-card border border-white/5 relative overflow-hidden shadow-[0_0_25px_rgba(139,92,246,0.15)]">
            {/* Purple glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent)] blur-2xl pointer-events-none" />
            
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white/90 tracking-wide flex items-center gap-2 relative z-10">
                <Target className="w-5 h-5 text-purple-500" />
                Market Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Industry Average</p>
                  <p className="text-xs text-muted-foreground">Similar creators</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {currencySymbols[currency]}{Math.round(getDisplayRate() * 0.85).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Top Tier</p>
                  <p className="text-xs text-muted-foreground">Top 10% creators</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {currencySymbols[currency]}{Math.round(getDisplayRate() * 1.5).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-400">
                    Your rate is {getDisplayRate() >= getDisplayRate() * 0.85 ? 'above' : 'below'} industry average. 
                    Consider negotiating based on your unique value proposition.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compare With Previous Calculations Link */}
          <div className="text-center pt-2">
            <button
              onClick={() => toast.info('Past calculations feature coming soon!')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              View Past Calculations →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCalculator;

