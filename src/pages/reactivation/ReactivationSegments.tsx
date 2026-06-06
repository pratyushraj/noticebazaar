import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  Users,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Zap,
  IndianRupee,
  Brain,
  Activity,
  ChevronRight,
  Target,
  Star,
  ShieldAlert,
  Dumbbell,
  Scissors,
  Utensils,
  Stethoscope,
  Waves,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
type IndustryKey = 'dental' | 'salon' | 'gym' | 'skinclinic' | 'restaurant';

interface SegmentStat {
  label: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  customerCount: number;
  stats: SegmentStat[];
  risk: RiskLevel;
  suggestedCampaign: string;
  potentialRevenue?: string;
  icon: React.ReactNode;
}

interface Industry {
  key: IndustryKey;
  label: string;
  icon: React.ReactNode;
  segments: Segment[];
  summaryRisk: number;
  summaryRevenue: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const INDUSTRIES: Industry[] = [
  {
    key: 'dental',
    label: 'Dental',
    icon: <Stethoscope className="w-4 h-4" />,
    summaryRisk: 313,
    summaryRevenue: '₹24.6L',
    segments: [
      {
        id: 'dental-1',
        name: 'No Visit 6+ Months',
        customerCount: 143,
        risk: 'HIGH',
        suggestedCampaign: 'We Miss You — Free Consultation',
        potentialRevenue: '₹5.8L',
        icon: <Clock className="w-5 h-5" />,
        stats: [
          { label: 'Avg days since visit', value: '247 days' },
          { label: 'Top service', value: 'Teeth Cleaning' },
          { label: 'Potential revenue', value: '₹5.8L' },
        ],
      },
      {
        id: 'dental-2',
        name: 'Teeth Cleaning Patients',
        customerCount: 89,
        risk: 'MEDIUM',
        suggestedCampaign: 'Cleaning Reminder Offer',
        potentialRevenue: '₹5.5L',
        icon: <Star className="w-5 h-5" />,
        stats: [
          { label: 'Due for cleaning', value: '67 customers' },
          { label: 'Avg spend', value: '₹6,200' },
          { label: 'Potential revenue', value: '₹5.5L' },
        ],
      },
      {
        id: 'dental-3',
        name: 'Whitening Patients',
        customerCount: 34,
        risk: 'LOW',
        suggestedCampaign: 'Touch-Up Special Offer',
        potentialRevenue: '₹6.3L',
        icon: <Sparkles className="w-5 h-5" />,
        stats: [
          { label: 'Last whitening', value: '4+ months ago' },
          { label: 'Avg spend', value: '₹18,500' },
          { label: 'Potential revenue', value: '₹6.3L' },
        ],
      },
      {
        id: 'dental-4',
        name: 'Implant Leads (Not Converted)',
        customerCount: 28,
        risk: 'HIGH',
        suggestedCampaign: 'Implant Finance Offer',
        potentialRevenue: '₹8.4L',
        icon: <Target className="w-5 h-5" />,
        stats: [
          { label: 'Status', value: 'Inquired, not booked' },
          { label: 'Potential value', value: '₹8.4L total' },
          { label: 'Avg deal size', value: '₹30,000' },
        ],
      },
      {
        id: 'dental-5',
        name: 'Missed Appointments',
        customerCount: 19,
        risk: 'MEDIUM',
        suggestedCampaign: 'We Saved Your Spot Campaign',
        potentialRevenue: '₹95K',
        icon: <AlertTriangle className="w-5 h-5" />,
        stats: [
          { label: 'No-show window', value: 'Last 30 days' },
          { label: 'Est. revenue lost', value: '₹95,000' },
          { label: 'Rescue window', value: '7 days ideal' },
        ],
      },
    ],
  },
  {
    key: 'salon',
    label: 'Salon',
    icon: <Scissors className="w-4 h-4" />,
    summaryRisk: 162,
    summaryRevenue: '₹11.2L',
    segments: [
      {
        id: 'salon-1',
        name: 'No Visit 90 Days',
        customerCount: 67,
        risk: 'HIGH',
        suggestedCampaign: 'Come Back — 20% Off Any Service',
        potentialRevenue: '₹4.7L',
        icon: <Clock className="w-5 h-5" />,
        stats: [
          { label: 'Avg days inactive', value: '112 days' },
          { label: 'Avg spend/visit', value: '₹2,200' },
          { label: 'Potential revenue', value: '₹4.7L' },
        ],
      },
      {
        id: 'salon-2',
        name: 'Hair Treatment Clients',
        customerCount: 45,
        risk: 'MEDIUM',
        suggestedCampaign: 'Keratin Refresh Offer',
        potentialRevenue: '₹3.2L',
        icon: <Waves className="w-5 h-5" />,
        stats: [
          { label: 'Last treatment', value: '3+ months ago' },
          { label: 'Avg spend', value: '₹7,100' },
          { label: 'Potential revenue', value: '₹3.2L' },
        ],
      },
      {
        id: 'salon-3',
        name: 'Bridal Season Leads',
        customerCount: 12,
        risk: 'HIGH',
        suggestedCampaign: 'Your Wedding Look — Book Now',
        potentialRevenue: '₹1.8L',
        icon: <Star className="w-5 h-5" />,
        stats: [
          { label: 'Event window', value: 'Next 60-90 days' },
          { label: 'Avg bridal pkg', value: '₹15,000' },
          { label: 'Potential revenue', value: '₹1.8L' },
        ],
      },
      {
        id: 'salon-4',
        name: 'Coloring Regulars',
        customerCount: 38,
        risk: 'LOW',
        suggestedCampaign: 'Root Touch-Up Reminder',
        potentialRevenue: '₹1.5L',
        icon: <Activity className="w-5 h-5" />,
        stats: [
          { label: 'Last color service', value: '6+ weeks ago' },
          { label: 'Avg spend', value: '₹3,800' },
          { label: 'Potential revenue', value: '₹1.5L' },
        ],
      },
    ],
  },
  {
    key: 'gym',
    label: 'Gym',
    icon: <Dumbbell className="w-4 h-4" />,
    summaryRisk: 140,
    summaryRevenue: '₹8.9L',
    segments: [
      {
        id: 'gym-1',
        name: 'Membership Expired',
        customerCount: 52,
        risk: 'HIGH',
        suggestedCampaign: 'Renew Now — ₹500 Off First Month',
        potentialRevenue: '₹3.1L',
        icon: <AlertTriangle className="w-5 h-5" />,
        stats: [
          { label: 'Avg lapse', value: '23 days ago' },
          { label: 'Avg membership', value: '₹1,800/month' },
          { label: 'Potential revenue', value: '₹3.1L' },
        ],
      },
      {
        id: 'gym-2',
        name: 'Trial Members',
        customerCount: 29,
        risk: 'HIGH',
        suggestedCampaign: 'Your 7-Day Trial Ends Soon!',
        potentialRevenue: '₹1.7L',
        icon: <Zap className="w-5 h-5" />,
        stats: [
          { label: 'Trial status', value: 'Day 3–7 of trial' },
          { label: 'Convert rate avg', value: '38% industry' },
          { label: 'Potential revenue', value: '₹1.7L' },
        ],
      },
      {
        id: 'gym-3',
        name: 'Inactive Members',
        customerCount: 41,
        risk: 'MEDIUM',
        suggestedCampaign: 'We See You Slipping — Free PT Session',
        potentialRevenue: '₹2.5L',
        icon: <Activity className="w-5 h-5" />,
        stats: [
          { label: 'Visits/week', value: 'Less than 2x / 30 days' },
          { label: 'Avg tenure', value: '7 months' },
          { label: 'Potential revenue', value: '₹2.5L' },
        ],
      },
      {
        id: 'gym-4',
        name: 'Lapsed Premium Members',
        customerCount: 18,
        risk: 'MEDIUM',
        suggestedCampaign: 'Welcome Back — Premium Perks Extended',
        potentialRevenue: '₹1.6L',
        icon: <Star className="w-5 h-5" />,
        stats: [
          { label: 'Tier', value: 'Premium / Annual' },
          { label: 'Avg plan value', value: '₹9,000/yr' },
          { label: 'Potential revenue', value: '₹1.6L' },
        ],
      },
    ],
  },
  {
    key: 'skinclinic',
    label: 'Skin Clinic',
    icon: <ShieldAlert className="w-4 h-4" />,
    summaryRisk: 75,
    summaryRevenue: '₹9.4L',
    segments: [
      {
        id: 'skin-1',
        name: 'No Visit 3 Months',
        customerCount: 38,
        risk: 'HIGH',
        suggestedCampaign: 'Your Skin Needs Attention — Book Now',
        potentialRevenue: '₹4.2L',
        icon: <Clock className="w-5 h-5" />,
        stats: [
          { label: 'Avg inactive period', value: '94 days' },
          { label: 'Avg spend/session', value: '₹4,500' },
          { label: 'Potential revenue', value: '₹4.2L' },
        ],
      },
      {
        id: 'skin-2',
        name: 'Laser Session Patients',
        customerCount: 22,
        risk: 'MEDIUM',
        suggestedCampaign: 'Next Laser Session Reminder',
        potentialRevenue: '₹3.3L',
        icon: <Zap className="w-5 h-5" />,
        stats: [
          { label: 'Sessions completed', value: '3 of 6 avg' },
          { label: 'Avg session cost', value: '₹7,500' },
          { label: 'Potential revenue', value: '₹3.3L' },
        ],
      },
      {
        id: 'skin-3',
        name: 'Chemical Peel Clients',
        customerCount: 15,
        risk: 'LOW',
        suggestedCampaign: 'Seasonal Peel Package Offer',
        potentialRevenue: '₹1.9L',
        icon: <Sparkles className="w-5 h-5" />,
        stats: [
          { label: 'Last peel', value: '5+ weeks ago' },
          { label: 'Avg spend', value: '₹5,800' },
          { label: 'Potential revenue', value: '₹1.9L' },
        ],
      },
    ],
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    icon: <Utensils className="w-4 h-4" />,
    summaryRisk: 165,
    summaryRevenue: '₹6.2L',
    segments: [
      {
        id: 'rest-1',
        name: 'No Order 30 Days',
        customerCount: 124,
        risk: 'HIGH',
        suggestedCampaign: 'We Miss You — 15% Off Your Next Order',
        potentialRevenue: '₹3.7L',
        icon: <Clock className="w-5 h-5" />,
        stats: [
          { label: 'Avg order gap', value: '43 days' },
          { label: 'Avg order value', value: '₹680' },
          { label: 'Potential revenue', value: '₹3.7L' },
        ],
      },
      {
        id: 'rest-2',
        name: 'Birthday Month Guests',
        customerCount: 8,
        risk: 'LOW',
        suggestedCampaign: 'Happy Birthday! Free Dessert on Us',
        potentialRevenue: '₹32K',
        icon: <Star className="w-5 h-5" />,
        stats: [
          { label: 'Birthday window', value: 'This month' },
          { label: 'Avg spend on bday', value: '₹1,800' },
          { label: 'Potential revenue', value: '₹32,000' },
        ],
      },
      {
        id: 'rest-3',
        name: 'High Spenders',
        customerCount: 33,
        risk: 'MEDIUM',
        suggestedCampaign: 'VIP Table — Exclusive Tasting Menu',
        potentialRevenue: '₹2.5L',
        icon: <TrendingUp className="w-5 h-5" />,
        stats: [
          { label: 'Avg spend/visit', value: '₹520+' },
          { label: 'Last visit', value: '45+ days ago' },
          { label: 'Potential revenue', value: '₹2.5L' },
        ],
      },
    ],
  },
];

// ─── Risk Config ─────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; badgeCls: string; glowCls: string; iconCls: string; borderCls: string }
> = {
  HIGH: {
    label: 'HIGH RISK',
    badgeCls: 'bg-red-500/15 text-red-400 border border-red-500/30',
    glowCls: 'shadow-red-500/20',
    iconCls: 'text-red-400 bg-red-500/10',
    borderCls: 'border-red-500/20 hover:border-red-500/50',
  },
  MEDIUM: {
    label: 'MEDIUM RISK',
    badgeCls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    glowCls: 'shadow-amber-500/20',
    iconCls: 'text-amber-400 bg-amber-500/10',
    borderCls: 'border-amber-500/20 hover:border-indigo-500/60',
  },
  LOW: {
    label: 'LOW RISK',
    badgeCls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    glowCls: 'shadow-emerald-500/20',
    iconCls: 'text-emerald-400 bg-emerald-500/10',
    borderCls: 'border-emerald-500/20 hover:border-indigo-500/60',
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SegmentCardProps {
  segment: Segment;
  index: number;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment, index }) => {
  const risk = RISK_CONFIG[segment.risk];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.38, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`
        group relative flex flex-col
        bg-white/[0.03] backdrop-blur-xl
        border ${risk.borderCls}
        rounded-2xl p-5 gap-4
        transition-all duration-300 ease-out
        hover:-translate-y-1.5 hover:shadow-2xl ${risk.glowCls}
        cursor-default
      `}
    >
      {/* Subtle top gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-60 ${
          segment.risk === 'HIGH'
            ? 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
            : segment.risk === 'MEDIUM'
            ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
            : 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
        }`}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`flex-shrink-0 p-2.5 rounded-xl ${risk.iconCls}`}>
            {segment.icon}
          </span>
          <h3 className="text-sm font-bold text-white leading-snug">{segment.name}</h3>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${risk.badgeCls}`}>
          {risk.label}
        </span>
      </div>

      {/* Big Number */}
      <div className="flex items-end gap-2">
        <span className="text-5xl font-black text-white leading-none tabular-nums">
          <CountUp end={segment.customerCount} duration={1.4} delay={index * 0.07} />
        </span>
        <div className="pb-1.5">
          <div className="flex items-center gap-1 text-white/40">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">customers</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-1.5">
        {segment.stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-medium">{stat.label}</span>
            <span className="text-[11px] text-white/80 font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Campaign suggestion */}
      <div className="flex items-start gap-2">
        <Brain className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/50 leading-relaxed">
          <span className="text-white/30">Suggested: </span>
          <span className="text-indigo-300 font-semibold italic">"{segment.suggestedCampaign}"</span>
        </p>
      </div>

      {/* CTA */}
      <button className="
        w-full mt-auto py-2.5 px-4 rounded-xl
        bg-indigo-600 hover:bg-indigo-500
        text-white text-xs font-bold tracking-wide
        flex items-center justify-center gap-2
        transition-all duration-200
        group-hover:shadow-lg group-hover:shadow-indigo-500/25
      ">
        Run Campaign
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ReactivationSegments: React.FC = () => {
  const [activeIndustry, setActiveIndustry] = useState<IndustryKey>('dental');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tabKey, setTabKey] = useState(0); // force exit animation on tab change

  const currentIndustry = INDUSTRIES.find((i) => i.key === activeIndustry)!;

  // Summary totals
  const totalSegments = INDUSTRIES.reduce((sum, i) => sum + i.segments.length, 0);
  const totalAtRisk = INDUSTRIES.reduce((sum, i) => sum + i.summaryRisk, 0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1800);
  }, []);

  const handleTabChange = (key: IndustryKey) => {
    setTabKey((k) => k + 1);
    setActiveIndustry(key);
  };

  // AI banner copy based on active industry
  const aiBannerText =
    activeIndustry === 'dental'
      ? {
          stat: '143 high-risk patients with no visit in 6+ months',
          revenue: '₹5.8L',
        }
      : activeIndustry === 'salon'
      ? { stat: '67 clients with no visit in 90+ days', revenue: '₹4.7L' }
      : activeIndustry === 'gym'
      ? { stat: '52 expired memberships going cold fast', revenue: '₹3.1L' }
      : activeIndustry === 'skinclinic'
      ? { stat: '38 patients overdue for their next session', revenue: '₹4.2L' }
      : { stat: '124 customers with no order in 30+ days', revenue: '₹3.7L' };

  return (
    <div className="min-h-screen bg-[#080C14] text-white pb-24 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-violet-600/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
          <div>
            {/* Pill label */}
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-black tracking-widest uppercase text-indigo-300">
                AI Segmentation Engine
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
              Smart Segments
            </h1>
            <p className="mt-1.5 text-sm text-white/40 font-medium">
              AI-powered customer groups ready to target
            </p>
          </div>

          {/* Controls: Industry dropdown + Refresh */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Industry selector */}
            <div className="relative">
              <select
                value={activeIndustry}
                onChange={(e) => handleTabChange(e.target.value as IndustryKey)}
                className="
                  appearance-none pl-4 pr-9 py-2.5 rounded-xl
                  bg-white/5 border border-white/10
                  text-sm font-semibold text-white
                  focus:outline-none focus:border-indigo-500/60
                  hover:bg-white/8 transition-colors cursor-pointer
                "
              >
                <option value="dental">Dental Clinic</option>
                <option value="salon">Salon</option>
                <option value="gym">Gym</option>
                <option value="skinclinic">Skin Clinic</option>
                <option value="restaurant">Restaurant</option>
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="
                inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-indigo-600 hover:bg-indigo-500
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white text-sm font-bold tracking-wide
                transition-all duration-200
                shadow-lg shadow-indigo-500/20
              "
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh Segments
            </button>
          </div>
        </div>

        {/* ── Summary Bar ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            grid grid-cols-3 divide-x divide-white/8
            bg-white/[0.03] border border-white/8 rounded-2xl
            backdrop-blur-xl mb-7 overflow-hidden
          "
        >
          {[
            {
              icon: <Activity className="w-4 h-4 text-indigo-400" />,
              label: 'Total Segments',
              value: totalSegments,
              suffix: '',
              prefix: '',
              color: 'text-indigo-300',
            },
            {
              icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
              label: 'Customers at Risk',
              value: totalAtRisk + currentIndustry.segments.length,
              suffix: '',
              prefix: '',
              color: 'text-amber-300',
            },
            {
              icon: <IndianRupee className="w-4 h-4 text-emerald-400" />,
              label: 'Potential Revenue',
              value: null,
              rawValue: '₹24.6L',
              color: 'text-emerald-300',
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-4 px-3 gap-1">
              <div className="flex items-center gap-1.5 text-white/40">
                {item.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              <span className={`text-2xl font-black ${item.color} tabular-nums`}>
                {item.value !== null ? (
                  <CountUp end={item.value as number} duration={1.6} />
                ) : (
                  item.rawValue
                )}
              </span>
            </div>
          ))}
        </motion.div>

        {/* ── Industry Tabs ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-1 scrollbar-hide">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.key}
              onClick={() => handleTabChange(ind.key)}
              className={`
                flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200
                ${
                  activeIndustry === ind.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/[0.04] text-white/50 border border-white/8 hover:bg-white/8 hover:text-white/80'
                }
              `}
            >
              {ind.icon}
              {ind.label}
              <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 ${
                activeIndustry === ind.key
                  ? 'bg-white/20 text-white'
                  : 'bg-white/8 text-white/40'
              }`}>
                {ind.segments.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── AI Insight Banner ─────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`banner-${activeIndustry}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="
              relative flex flex-col sm:flex-row sm:items-center justify-between gap-4
              mb-8 p-5 rounded-2xl overflow-hidden
              bg-gradient-to-r from-indigo-600/15 via-violet-600/10 to-indigo-600/8
              border border-indigo-500/25
              backdrop-blur-xl
            "
          >
            {/* Animated glow accent */}
            <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-indigo-400 via-violet-500 to-indigo-600" />

            <div className="flex items-start gap-3 pl-2">
              <div className="flex-shrink-0 text-2xl leading-none">🤖</div>
              <div>
                <p className="text-sm font-bold text-white leading-snug mb-0.5">
                  AI Detected:{' '}
                  <span className="text-indigo-300">{aiBannerText.stat}.</span>
                </p>
                <p className="text-xs text-white/50">
                  Running a reactivation campaign now could recover up to{' '}
                  <span className="text-emerald-400 font-bold">{aiBannerText.revenue}</span>{' '}
                  in revenue.
                </p>
              </div>
            </div>

            <button className="
              flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-indigo-600 hover:bg-indigo-500
              text-white text-xs font-black tracking-wide uppercase
              transition-all duration-200 shadow-lg shadow-indigo-500/30
              hover:shadow-indigo-500/50
            ">
              <Sparkles className="w-3.5 h-3.5" />
              Generate Campaign Now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* ── Segment Cards Grid ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`grid-${activeIndustry}-${tabKey}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {currentIndustry.segments.map((segment, index) => (
              <SegmentCard key={segment.id} segment={segment} index={index} />
            ))}

            {/* Segment count footer card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.38, delay: currentIndustry.segments.length * 0.07 }}
              className="
                md:col-span-2
                flex flex-col sm:flex-row items-center justify-between gap-4
                bg-white/[0.02] border border-white/6 rounded-2xl p-5
              "
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {currentIndustry.segments.length} segments · {currentIndustry.summaryRisk} customers at risk
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Potential recovery: <span className="text-emerald-400 font-bold">{currentIndustry.summaryRevenue}</span> across all {currentIndustry.label} segments
                  </p>
                </div>
              </div>
              <button className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-white/5 hover:bg-white/10 border border-white/10
                text-white/70 hover:text-white text-xs font-bold tracking-wide
                transition-all duration-200
              ">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Run All Campaigns
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReactivationSegments;
