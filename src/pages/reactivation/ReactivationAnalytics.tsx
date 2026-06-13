import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Trophy,
  BarChart3,
  Calendar,
  Download,
  ChevronDown,
  X,
  Eye,
  IndianRupee,
  Users,
  CheckCheck,
  MessageSquare,
  Zap,
  Share2,
  ArrowRight,
  Clock,
  Package,
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type: 'Reactivation' | 'Festival' | 'Referral' | 'New Service';
  launched: string;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  appointments: number;
  revenue: number;
  costPerAppt: number;
  roi: number;
}

interface FunnelStage {
  label: string;
  count: number | string;
  pct: number | null;
  color: string;
  isRevenue?: boolean;
}

interface DrawerEvent {
  time: string;
  label: string;
  color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Teeth Cleaning Offer',
    type: 'Reactivation',
    launched: '3 Jun 2025',
    sent: 500,
    delivered: 487,
    read: 312,
    replied: 73,
    appointments: 18,
    revenue: 42000,
    costPerAppt: 233,
    roi: 18,
  },
  {
    id: 'c2',
    name: 'Diwali Smile Special',
    type: 'Festival',
    launched: '25 Oct 2024',
    sent: 380,
    delivered: 371,
    read: 290,
    replied: 61,
    appointments: 14,
    revenue: 36400,
    costPerAppt: 196,
    roi: 22,
  },
  {
    id: 'c3',
    name: 'Root Canal Recall',
    type: 'Reactivation',
    launched: '28 May 2025',
    sent: 320,
    delivered: 311,
    read: 198,
    replied: 42,
    appointments: 11,
    revenue: 28500,
    costPerAppt: 259,
    roi: 12,
  },
  {
    id: 'c4',
    name: 'Clear Aligner Consultations',
    type: 'Reactivation',
    launched: '15 May 2025',
    sent: 180,
    delivered: 175,
    read: 134,
    replied: 38,
    appointments: 9,
    revenue: 54000,
    costPerAppt: 267,
    roi: 30,
  },
  {
    id: 'c5',
    name: 'Smile Makeover Campaign',
    type: 'New Service',
    launched: '1 May 2025',
    sent: 240,
    delivered: 235,
    read: 187,
    replied: 44,
    appointments: 12,
    revenue: 31200,
    costPerAppt: 260,
    roi: 15,
  },
  {
    id: 'c6',
    name: 'Whitening Follow-Up',
    type: 'Reactivation',
    launched: '20 Apr 2025',
    sent: 95,
    delivered: 92,
    read: 78,
    replied: 29,
    appointments: 8,
    revenue: 41900,
    costPerAppt: 241,
    roi: 20,
  },
];

// Generate 30 days of revenue data (June 2025)
const generateChartData = () => {
  const revenues = [
    3200, 0, 5400, 2800, 7100, 4200, 0, 8900, 3600, 6700,
    5200, 0, 9400, 4100, 7800, 3900, 6100, 0, 11200, 4800,
    8300, 5700, 0, 9800, 4400, 7200, 6600, 3100, 8500, 5900,
  ];
  const appts = [
    1, 0, 2, 1, 3, 2, 0, 4, 1, 3,
    2, 0, 4, 2, 3, 1, 3, 0, 5, 2,
    4, 2, 0, 4, 2, 3, 3, 1, 4, 2,
  ];
  return revenues.map((rev, i) => ({
    date: `Jun ${i + 1}`,
    revenue: rev,
    appointments: appts[i],
    campaign:
      i === 2 ? 'Teeth Cleaning Offer'
      : i === 8 ? 'Root Canal Recall'
      : i === 18 ? 'Diwali Smile Special'
      : i === 25 ? 'Clear Aligner Consultations'
      : 'Daily Revenue',
  }));
};

const CHART_DATA = generateChartData();

const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom'] as const;
type DateRange = (typeof DATE_RANGES)[number];

const TYPE_COLORS: Record<Campaign['type'], { bg: string; text: string; border: string }> = {
  Reactivation: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
  },
  Festival: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-200',
  },
  Referral: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-200',
  },
  'New Service': {
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/30',
  },
};

// ─── Helper formatters ────────────────────────────────────────────────────────

const fmtRevenue = (v: number) => {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v}`;
};

const fmtRupee = (v: number) =>
  '₹' + v.toLocaleString('en-IN');

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rev = payload.find((p) => p.dataKey === 'revenue');
  const appt = payload.find((p) => p.dataKey === 'appointments');
  const campaign = (payload[0] as any)?.payload?.campaign;

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background: 'rgba(10,15,28,0.95)',
        border: '1px solid rgba(99,102,241,0.25)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: 180,
      }}
    >
      <p className="text-slate-500 text-[11px] font-medium tracking-wide mb-2">{label}</p>
      {rev && (
        <p className="text-emerald-700 font-bold text-base">
          {fmtRupee(rev.value)}
        </p>
      )}
      {appt && (
        <p className="text-indigo-600 text-[12px] mt-0.5">
          {appt.value} appointments
        </p>
      )}
      {campaign && campaign !== 'Daily Revenue' && (
        <p className="text-slate-400 text-[10px] mt-1.5 italic">{campaign}</p>
      )}
    </div>
  );
};

// ─── Funnel Visualization ─────────────────────────────────────────────────────

const FunnelChart: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  const stages: FunnelStage[] = [
    {
      label: 'Sent',
      count: campaign.sent,
      pct: 100,
      color: 'from-indigo-500 to-indigo-400',
    },
    {
      label: 'Delivered',
      count: campaign.delivered,
      pct: Math.round((campaign.delivered / campaign.sent) * 100),
      color: 'from-indigo-400 to-violet-400',
    },
    {
      label: 'Read',
      count: campaign.read,
      pct: Math.round((campaign.read / campaign.sent) * 100),
      color: 'from-violet-400 to-teal-400',
    },
    {
      label: 'Replied',
      count: campaign.replied,
      pct: Math.round((campaign.replied / campaign.sent) * 100),
      color: 'from-teal-400 to-emerald-400',
    },
    {
      label: 'Booked',
      count: campaign.appointments,
      pct: Math.round((campaign.appointments / campaign.sent) * 100),
      color: 'from-emerald-400 to-emerald-300',
    },
    {
      label: 'Revenue',
      count: fmtRupee(campaign.revenue),
      pct: null,
      color: 'from-emerald-300 to-green-200',
      isRevenue: true,
    },
  ];

  const maxWidth = 100;
  const widths = [100, 92, 72, 36, 18, 14];

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const dropoff =
          i > 0 && !stage.isRevenue && typeof stages[i - 1].count === 'number' && typeof stage.count === 'number'
            ? Math.round(
                (1 - (stage.count as number) / (stages[i - 1].count as number)) * 100
              )
            : null;

        return (
          <div key={stage.label}>
            {/* Drop-off indicator */}
            {dropoff !== null && i > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 + 0.4 }}
                className="flex items-center gap-2 mb-1 ml-2"
              >
                <div className="w-px h-3 bg-slate-100 ml-4" />
                <span className="text-[10px] text-red-400/70 font-medium">
                  ↓ {dropoff}% drop-off
                </span>
              </motion.div>
            )}

            {/* Funnel bar */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ originX: 0, width: `${widths[i]}%` }}
              className="relative"
            >
              <div
                className={`h-11 rounded-lg bg-gradient-to-r ${stage.color} flex items-center justify-between px-3 relative overflow-hidden`}
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
              >
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2.5s ease-in-out infinite',
                  }}
                />

                <span className="text-[12px] font-bold text-slate-800 relative z-10">
                  {stage.label}
                </span>
                <div className="flex items-center gap-2 relative z-10">
                  <span className="text-[13px] font-bold text-slate-800">
                    {typeof stage.count === 'number'
                      ? stage.count.toLocaleString('en-IN')
                      : stage.count}
                  </span>
                  {stage.pct !== null && (
                    <span className="text-[10px] text-slate-700 font-medium">
                      ({stage.pct}%)
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────

const DRAWER_EVENTS: DrawerEvent[] = [
  { time: '09:00 AM', label: 'Campaign launched — 500 messages queued', color: 'text-indigo-600' },
  { time: '09:01 AM', label: '487 messages delivered (WhatsApp ✓✓)', color: 'text-emerald-700' },
  { time: '09:15 AM', label: '94 reads in first 15 min (19% open rate)', color: 'text-blue-700' },
  { time: '10:30 AM', label: '312 total reads reached', color: 'text-indigo-600' },
  { time: '11:00 AM', label: 'First appointment booked — Rohit Sharma', color: 'text-emerald-300' },
  { time: '02:00 PM', label: '73 replies received', color: 'text-violet-400' },
  { time: '04:45 PM', label: '18 appointments confirmed', color: 'text-emerald-700' },
  { time: '06:00 PM', label: 'Campaign concluded — ₹42,000 attributed', color: 'text-amber-700' },
];

const CampaignDrawer: React.FC<{
  campaign: Campaign;
  onClose: () => void;
  onShare: () => void;
}> = ({ campaign, onClose, onShare }) => {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 36 }}
      className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col"
      style={{
        background: '#0A0F1C',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
      }}
    >
      {/* Drawer Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #e2e8f0' }}
      >
        <div>
          <h3 className="text-[15px] font-bold text-slate-800 leading-tight">
            {campaign.name}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Launched {campaign.launched}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100 text-slate-500 hover:text-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="flex-shrink-0 px-6 py-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Revenue', value: fmtRupee(campaign.revenue), color: 'text-emerald-700' },
          { label: 'Appointments', value: campaign.appointments, color: 'text-slate-800' },
          { label: `ROI`, value: `${campaign.roi}×`, color: 'text-amber-700' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl px-3 py-3 text-center"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className={`text-[18px] font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-slate-50" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Message Preview */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Message Sent
          </p>
          <div
            className="rounded-xl p-4 text-[13px] text-slate-700 leading-relaxed"
            style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.18)',
            }}
          >
            <p>
              Hi [Name] 👋 We miss you at{' '}
              <span className="text-indigo-600 font-semibold">SmileCare Dental</span>!
            </p>
            <p className="mt-2">
              It's been a while since your last visit. We have a special{' '}
              <span className="text-amber-300 font-semibold">teeth cleaning offer</span> for our
              valued patients this month — only ₹799 (usual ₹1,500).
            </p>
            <p className="mt-2">
              Book your slot today 👇{' '}
              <span className="text-indigo-600 underline underline-offset-2">
                smilecare.in/book
              </span>
            </p>
            <p className="mt-2 text-slate-500 text-[11px]">Reply STOP to opt out.</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Revenue Breakdown
          </p>
          <div className="space-y-2">
            {[
              { label: 'Gross Revenue', value: fmtRupee(campaign.revenue), highlight: true },
              { label: 'Campaign Cost', value: '₹4,200', highlight: false },
              {
                label: 'Cost per Appointment',
                value: fmtRupee(campaign.costPerAppt),
                highlight: false,
              },
              {
                label: 'Net Return',
                value: fmtRupee(campaign.revenue - 4200),
                highlight: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: '#f8fafc' }}
              >
                <span className="text-[12px] text-slate-500">{row.label}</span>
                <span
                  className={`text-[13px] font-semibold ${
                    row.highlight ? 'text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Delivery Timeline
          </p>
          <div className="relative space-y-0">
            {DRAWER_EVENTS.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="flex gap-3 relative pb-4"
              >
                {/* Timeline line */}
                {i < DRAWER_EVENTS.length - 1 && (
                  <div
                    className="absolute left-[13px] top-6 bottom-0 w-px"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  />
                )}
                {/* Dot */}
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white/[0.06] border border-slate-200 relative z-10">
                  <div className={`w-2 h-2 rounded-full ${ev.color.replace('text-', 'bg-')}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium ${ev.color} leading-snug`}>
                    {ev.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ev.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div
        className="flex-shrink-0 px-6 py-4 flex gap-3"
        style={{ borderTop: '1px solid #e2e8f0' }}
      >
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold text-slate-800 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}
        >
          <Share2 size={14} />
          Share Report
        </button>
        <button
          onClick={onClose}
          className="h-10 px-4 rounded-xl text-[13px] font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #e2e8f0' }}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[13px] font-semibold text-slate-800"
        style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
        }}
      >
        <Sparkles size={14} />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ReactivationAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('Last 30 days');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign>(CAMPAIGNS[0]);
  const [drawerCampaign, setDrawerCampaign] = useState<Campaign | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleShare = useCallback(() => {
    showToast('Report link copied to clipboard!');
  }, [showToast]);

  const handleExport = useCallback(() => {
    showToast('Exporting report as PDF…');
  }, [showToast]);

  // ── Summary card data ──
  const summaryCards = [
    {
      id: 'revenue',
      label: 'Total Revenue Recovered',
      value: 234000,
      prefix: '₹',
      separator: ',',
      suffix: '',
      formattedDisplay: null,
      color: 'emerald',
      icon: IndianRupee,
      hero: true,
      subLabel: '+18% vs last period',
    },
    {
      id: 'best',
      label: 'Best Campaign',
      value: null,
      staticValue: '₹42,000',
      color: 'amber',
      icon: Trophy,
      hero: false,
      subLabel: 'Teeth Cleaning Offer',
    },
    {
      id: 'avg',
      label: 'Avg Revenue per Campaign',
      value: 18500,
      prefix: '₹',
      separator: ',',
      suffix: '',
      color: 'blue',
      icon: BarChart3,
      hero: false,
      subLabel: 'Across 6 campaigns',
    },
    {
      id: 'appts',
      label: 'Total Appointments',
      value: 127,
      prefix: '',
      separator: ',',
      suffix: '',
      color: 'purple',
      icon: Calendar,
      hero: false,
      subLabel: 'Booked via campaigns',
    },
  ] as const;

  const colorMap = {
    emerald: {
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.2)',
      icon: 'text-emerald-700',
      iconBg: 'bg-emerald-500/15',
      value: 'text-emerald-700',
      badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25',
    },
    amber: {
      bg: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.2)',
      icon: 'text-amber-700',
      iconBg: 'bg-amber-500/15',
      value: 'text-amber-700',
      badge: 'bg-amber-500/15 text-amber-700 border-amber-500/25',
    },
    blue: {
      bg: 'rgba(59,130,246,0.08)',
      border: 'rgba(59,130,246,0.2)',
      icon: 'text-blue-700',
      iconBg: 'bg-blue-500/15',
      value: 'text-blue-700',
      badge: 'bg-blue-500/15 text-blue-700 border-blue-500/25',
    },
    purple: {
      bg: 'rgba(168,85,247,0.08)',
      border: 'rgba(168,85,247,0.2)',
      icon: 'text-purple-700',
      iconBg: 'bg-purple-500/15',
      value: 'text-purple-700',
      badge: 'bg-purple-500/15 text-purple-700 border-purple-500/25',
    },
  } as const;

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] as any } },
  };

  return (
    <>
      {/* Backdrop when drawer open */}
      <AnimatePresence>
        {drawerCampaign && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setDrawerCampaign(null)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {drawerCampaign && (
          <CampaignDrawer
            campaign={drawerCampaign}
            onClose={() => setDrawerCampaign(null)}
            onShare={handleShare}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toastMsg} visible={toastVisible} />

      <div className="max-w-[1400px] mx-auto space-y-7 pb-12">
        {/* ── PAGE HEADER ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
              Campaign Analytics
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              Track revenue recovered and campaign performance
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Date range picker */}
            <div className="relative">
              <button
                onClick={() => setDateRangeOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-700 hover:text-slate-800 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Calendar size={14} className="text-indigo-600" />
                {dateRange}
                <ChevronDown size={13} className={`transition-transform ${dateRangeOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dateRangeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden z-30"
                    style={{
                      background: '#0D1424',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    }}
                  >
                    {DATE_RANGES.map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setDateRange(r);
                          setDateRangeOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                          r === dateRange
                            ? 'text-indigo-600 bg-indigo-50 font-medium'
                            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-800 transition-all hover:opacity-90 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              <Download size={14} />
              Export Report
            </button>
          </div>
        </motion.div>

        {/* ── SECTION 1: REVENUE SUMMARY CARDS ──────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {summaryCards.map((card) => {
            const colors = colorMap[card.color];
            const Icon = card.icon;

            return (
              <motion.div
                key={card.id}
                variants={cardVariants}
                className={`relative rounded-2xl p-5 overflow-hidden ${
                  card.hero ? 'xl:col-span-1' : ''
                }`}
                style={{
                  background: card.hero
                    ? `linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)`
                    : `linear-gradient(135deg, ${colors.bg} 0%, rgba(255,255,255,0.9) 100%)`,
                  border: `1px solid ${colors.border}`,
                  boxShadow: card.hero
                    ? '0 0 40px rgba(16,185,129,0.08), 0 4px 24px rgba(99,102,241,0.05)'
                    : '0 4px 20px rgba(0,0,0,0.03)',
                }}
              >
                {/* Background glow for hero */}
                {card.hero && (
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
                      transform: 'translate(30%, -30%)',
                    }}
                  />
                )}

                <div className="relative z-10">
                  {/* Icon row */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.iconBg}`}
                    >
                      <Icon size={18} className={colors.icon} />
                    </div>
                    {card.hero && (
                      <span
                        className="text-[10px] font-bold tracking-widest px-2 py-1 rounded-full border"
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          borderColor: 'rgba(16,185,129,0.3)',
                          color: '#34D399',
                        }}
                      >
                        HERO
                      </span>
                    )}
                  </div>

                  {/* Value */}
                  <div className={`${card.hero ? 'text-4xl' : 'text-2xl'} font-bold ${colors.value} leading-none mb-1.5`}>
                    {card.value !== null && card.value !== undefined ? (
                      <CountUp
                        end={card.value}
                        duration={2.2}
                        separator=","
                        prefix={card.prefix}
                        suffix={card.suffix}
                        useEasing
                      />
                    ) : (
                      <span>{'staticValue' in card ? card.staticValue : ''}</span>
                    )}
                  </div>

                  {/* Label */}
                  <p className="text-[12px] text-slate-500 leading-snug">{card.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{card.subLabel}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── SECTION 2: REVENUE CHART ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl p-6"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Revenue Over Time</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">Daily revenue recovered + appointments booked</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span className="text-[11px] text-slate-500">Daily Revenue Recovered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-500">Appointments Booked</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtRevenue(v)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: 'rgba(16,185,129,0.6)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 8]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="url(#revenueGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="appointments"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── SECTION 3: CAMPAIGN TABLE ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          {/* Table header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid #e2e8f0' }}
          >
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Campaign Breakdown</h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {CAMPAIGNS.length} campaigns · Click a row to select funnel view
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-700"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <TrendingUp size={12} />
              All Profitable
            </div>
          </div>

          {/* Scrollable table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {[
                    'Campaign',
                    'Type',
                    'Launched',
                    'Sent',
                    'Delivered',
                    'Read',
                    'Replied',
                    'Appointments',
                    'Revenue',
                    'Cost/Appt',
                    'ROI',
                    '',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 tracking-wider uppercase whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAMPAIGNS.map((c, idx) => {
                  const isActive = activeCampaign.id === c.id;
                  const typeColors = TYPE_COLORS[c.type];

                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07, duration: 0.3 }}
                      onClick={() => setActiveCampaign(c)}
                      className={`cursor-pointer transition-all duration-150 group ${
                        isActive
                          ? 'bg-indigo-500/[0.08]'
                          : 'hover:bg-slate-50'
                      }`}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                      }}
                    >
                      {/* Campaign name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isActive ? 'bg-indigo-400' : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap">
                            {c.name}
                          </span>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-full border whitespace-nowrap ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}
                        >
                          {c.type}
                        </span>
                      </td>

                      {/* Launched */}
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-slate-500 whitespace-nowrap">{c.launched}</span>
                      </td>

                      {/* Sent */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-slate-600">{c.sent.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Delivered */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-slate-600">{c.delivered.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Read */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-slate-600">{c.read.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Replied */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-slate-600">{c.replied.toLocaleString('en-IN')}</span>
                      </td>

                      {/* Appointments */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-indigo-600 flex-shrink-0" />
                          <span className="text-[13px] text-slate-800 font-medium">{c.appointments}</span>
                        </div>
                      </td>

                      {/* Revenue — hero column */}
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] font-bold text-emerald-700 whitespace-nowrap">
                          {fmtRupee(c.revenue)}
                        </span>
                      </td>

                      {/* Cost per Appt */}
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] text-slate-500">₹{c.costPerAppt}</span>
                      </td>

                      {/* ROI badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-0.5 text-[12px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${
                            c.roi >= 20
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-200'
                              : 'bg-amber-500/15 text-amber-300 border-amber-200'
                          }`}
                        >
                          {c.roi}×
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerCampaign(c);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 hover:text-slate-800 transition-all hover:bg-indigo-50 opacity-0 group-hover:opacity-100"
                          style={{ border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          <Eye size={12} />
                          View
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── SECTION 4: CONVERSION FUNNEL ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-2xl p-6"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">
                Conversion Funnel
                <span className="text-slate-500 font-normal"> — </span>
                <span className="text-indigo-600">{activeCampaign.name}</span>
              </h2>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Click any campaign row above to update this funnel
              </p>
            </div>

            {/* Campaign selector pills */}
            <div className="flex items-center gap-2 flex-wrap justify-end max-w-md">
              {CAMPAIGNS.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCampaign(c)}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    activeCampaign.id === c.id
                      ? 'text-indigo-600 border-indigo-500/50'
                      : 'text-slate-400 hover:text-slate-700 border-slate-200 hover:border-slate-200'
                  }`}
                  style={{
                    background:
                      activeCampaign.id === c.id
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${
                      activeCampaign.id === c.id
                        ? 'rgba(99,102,241,0.4)'
                        : 'rgba(255,255,255,0.08)'
                    }`,
                  }}
                >
                  {c.name.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Funnel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCampaign.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <FunnelChart campaign={activeCampaign} />
            </motion.div>
          </AnimatePresence>

          {/* Stats footer */}
          <div className="mt-6 pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            {[
              {
                label: 'Delivery Rate',
                value: `${Math.round((activeCampaign.delivered / activeCampaign.sent) * 100)}%`,
                color: 'text-indigo-600',
              },
              {
                label: 'Read Rate',
                value: `${Math.round((activeCampaign.read / activeCampaign.sent) * 100)}%`,
                color: 'text-violet-400',
              },
              {
                label: 'Reply Rate',
                value: `${Math.round((activeCampaign.replied / activeCampaign.sent) * 100)}%`,
                color: 'text-teal-400',
              },
              {
                label: 'Booking Rate',
                value: `${Math.round((activeCampaign.appointments / activeCampaign.sent) * 100)}%`,
                color: 'text-emerald-700',
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-[20px] font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ReactivationAnalytics;
