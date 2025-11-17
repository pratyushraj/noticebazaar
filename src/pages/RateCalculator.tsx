"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Target,
  Info,
  Copy,
  Download,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';

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

const RateCalculator = () => {
  const navigate = useNavigate();
  const [followers, setFollowers] = useState(100000);
  const [engagementRate, setEngagementRate] = useState(5);
  const [platform, setPlatform] = useState('instagram');
  const [contentType, setContentType] = useState('post');
  const [exclusivity, setExclusivity] = useState(false);
  const [urgency, setUrgency] = useState(false);
  const [duration, setDuration] = useState(30);

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

    // Calculate total
    const totalRate = Math.round(
      (baseRate * platformMultiplier * followerMultiplier * engagementMultiplier) +
      exclusivityBonus +
      urgencyBonus
    );

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
  }, [followers, engagementRate, platform, contentType, exclusivity, urgency]);

  const handleCopyRate = () => {
    navigator.clipboard.writeText(`₹${rateBreakdown.totalRate.toLocaleString('en-IN')}`);
    toast.success('Rate copied to clipboard!');
  };

  const handleDownloadReport = () => {
    toast.info('Download feature coming soon!');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Header */}
      <div className="mb-6">
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
        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Your Metrics</CardTitle>
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

            {/* Engagement Rate */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Engagement Rate
              </Label>
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

            {/* Platform */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Platform
              </Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Content Type
              </Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          {/* Total Rate Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-700/40">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Recommended Rate</p>
                  <div className="text-5xl font-bold text-emerald-400 mb-4 tabular-nums">
                    ₹{rateBreakdown.totalRate.toLocaleString('en-IN')}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyRate}
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReport}
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Breakdown */}
          <Card className="bg-card border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Rate Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rateBreakdown.breakdown.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    {typeof item.value === 'number' && item.value < 10 ? (
                      <span className="text-sm font-semibold text-foreground">
                        {item.value.toFixed(1)}x
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        ₹{item.value.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Market Comparison */}
          <Card className="bg-card border-border/40">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Market Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Industry Average</p>
                  <p className="text-xs text-muted-foreground">Similar creators</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  ₹{Math.round(rateBreakdown.totalRate * 0.85).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">Top Tier</p>
                  <p className="text-xs text-muted-foreground">Top 10% creators</p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  ₹{Math.round(rateBreakdown.totalRate * 1.5).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-400">
                    Your rate is {rateBreakdown.totalRate >= rateBreakdown.totalRate * 0.85 ? 'above' : 'below'} industry average. 
                    Consider negotiating based on your unique value proposition.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RateCalculator;

