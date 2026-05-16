import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calculator, 
  Target, 
  Users, 
  IndianRupee, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ROICalculator = () => {
  // Inputs
  const [followers, setFollowers] = useState<string>('100000');
  const [avgViews, setAvgViews] = useState<string>('50000');
  const [costPerPost, setCostPerPost] = useState<string>('25000');
  const [conversionRate, setConversionRate] = useState<number>(1.5);
  const [avgOrderValue, setAvgOrderValue] = useState<string>('1200');

  // Calculations
  const views = Number(avgViews) || 0;
  const cost = Number(costPerPost) || 0;
  const aov = Number(avgOrderValue) || 0;
  
  const estimatedConversions = Math.floor(views * (conversionRate / 100));
  const estimatedRevenue = estimatedConversions * aov;
  const roi = cost > 0 ? ((estimatedRevenue - cost) / cost) * 100 : 0;
  const cpv = views > 0 ? (cost / views).toFixed(2) : '0';
  const cac = estimatedConversions > 0 ? (cost / estimatedConversions).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-[#020D0A] text-white pt-24 pb-20 px-6">
      <SEOHead
        title="Influencer ROI Calculator | Creator Armour"
        description="Calculate the ROI, CAC, and CPV of your creator campaigns in seconds. Stop guessing and start auditing your influencer marketing performance."
        keywords={['influencer roi calculator', 'creator marketing roi', 'cac calculator', 'cpv calculator India', 'influencer marketing metrics']}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1">
            Free Campaign Auditing Tool
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight italic uppercase">
            Influencer <span className="text-emerald-500">ROI</span> Calculator
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Stop making decisions based on follower counts. Auditing your campaign performance 
            is the first step toward scaling your D2C brand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
              <CardContent className="p-8 space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Average Views per Reel/Video
                  </label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={avgViews} 
                      onChange={(e) => setAvgViews(e.target.value)}
                      className="bg-black/40 border-slate-700 h-14 pl-12 text-xl font-bold"
                    />
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Cost per Collaboration (₹)
                  </label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={costPerPost} 
                      onChange={(e) => setCostPerPost(e.target.value)}
                      className="bg-black/40 border-slate-700 h-14 pl-12 text-xl font-bold"
                    />
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      Expected Conversion Rate (%)
                    </label>
                    <span className="text-emerald-400 font-bold">{conversionRate}%</span>
                  </div>
                  <Slider 
                    value={[conversionRate]} 
                    onValueChange={(v) => setConversionRate(v[0])}
                    max={5}
                    step={0.1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    <span>Conservative (0.5%)</span>
                    <span>Aggressive (5.0%)</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    Average Order Value (₹)
                  </label>
                  <Input 
                    type="number" 
                    value={avgOrderValue} 
                    onChange={(e) => setAvgOrderValue(e.target.value)}
                    className="bg-black/40 border-slate-700 h-14 text-xl font-bold"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
              <Info className="h-6 w-6 text-emerald-500 shrink-0" />
              <p className="text-sm text-slate-400">
                <span className="text-emerald-400 font-bold">Pro Tip:</span> Elite Verified creators typically see 
                <span className="text-white"> 40% higher conversion rates </span> 
                due to deeper audience trust and audited reach.
              </p>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7">
            <Card className="bg-black border-2 border-emerald-500/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              
              <CardContent className="p-8 md:p-12 relative z-10">
                <div className="flex items-center gap-2 mb-10">
                  <Calculator className="h-6 w-6 text-emerald-500" />
                  <h2 className="text-2xl font-black uppercase tracking-tight italic">Campaign Forecast</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Est. Total Revenue</p>
                    <p className="text-5xl font-black text-white italic">₹{estimatedRevenue.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Expected ROI</p>
                    <p className={`text-5xl font-black italic ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {roi.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 py-8 border-y border-slate-800">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost Per View</p>
                    <p className="text-xl font-bold text-white italic">₹{cpv}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. CAC</p>
                    <p className="text-xl font-bold text-white italic">₹{cac}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Orders</p>
                    <p className="text-xl font-bold text-white italic">{estimatedConversions}</p>
                  </div>
                </div>

                <div className="mt-12 space-y-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-slate-300 font-medium italic">Performance-driven metrics based on market benchmarks.</p>
                  </div>
                  
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black h-16 rounded-2xl text-lg uppercase italic tracking-wider flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                    Audit Your Full Campaign
                    <ArrowRight className="h-6 w-6" />
                  </Button>
                  
                  <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Want to hire verified talent? <span className="text-emerald-500 hover:underline cursor-pointer">Explore the directory</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Alert */}
            <div className="mt-8 flex items-start gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
              <div>
                <p className="text-sm text-slate-300 font-bold mb-1 italic">The Risk of Unverified Data</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Working with creators whose views are not audited via API can lead to a -150% ROI shift 
                  due to inflated metrics. Always request a <strong>Creator Armour Audit</strong> before 
                  finalizing any high-value contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
