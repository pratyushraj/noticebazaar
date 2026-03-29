"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Award,
    TrendingUp,
    Zap,
    Clock,
    Users,
    CheckCircle,
    BarChart3,
    Info,
    Calendar,
    Target,
    Activity,
    Lock,
    ExternalLink,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';

const StatCard = ({ label, value, icon: Icon, subValue, trend }: any) => (
    <div className="p-6 rounded-2xl bg-[#111114] border border-white/[0.05] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={80} />
        </div>
        <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Icon size={20} />
            </div>
            {trend && (
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {trend}
                </div>
            )}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
    </div>
);

const TrustLevelIndicator = ({ score }: { score: number }) => {
    let level = "Bronze";
    let color = "text-orange-400";
    let bg = "bg-orange-500/10";
    let border = "border-orange-500/20";

    if (score >= 90) {
        level = "Diamond";
        color = "text-cyan-400";
        bg = "bg-cyan-500/10";
        border = "border-cyan-500/20";
    } else if (score >= 75) {
        level = "Platinum";
        color = "text-slate-200";
        bg = "bg-slate-200/10";
        border = "border-slate-200/20";
    } else if (score >= 50) {
        level = "Gold";
        color = "text-yellow-400";
        bg = "bg-yellow-500/10";
        border = "border-yellow-500/20";
    }

    return (
        <div className={cn("px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2", bg, border, color)}>
            <Shield size={14} />
            {level} Tier Partner
        </div>
    );
};

const CreatorReputationDashboard = () => {
    const { profile } = useSession();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [performance, setPerformance] = useState<any>(null);
    const [trustScore, setTrustScore] = useState(0);

    useEffect(() => {
        const fetchReputationData = async () => {
            try {
                const apiBaseUrl = getApiBaseUrl();
                const session = await supabase.auth.getSession();
                const response = await fetch(`${apiBaseUrl}/api/creators/reputation-stats`, {
                    headers: {
                        'Authorization': `Bearer ${session.data.session?.access_token}`
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setStats(result.stats);
                    setPerformance(result.performance);

                    // Simple heuristic for trust score (0-100)
                    const completionWeight = (result.stats.completion_rate || 98) * 0.4;
                    const dealsWeight = Math.min((result.stats.completed_deals || 0) * 5, 30);
                    const brandsWeight = Math.min((result.stats.brands_count || 0) * 3, 30);
                    setTrustScore(Math.round(completionWeight + dealsWeight + brandsWeight));
                }
            } catch (error) {
                console.error('Reputation fetch error:', error);
                toast.error('Failed to load reputation data');
            } finally {
                setLoading(false);
            }
        };

        if (profile) fetchReputationData();
    }, [profile]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Quantifying Reputation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-200 pb-20">
            {/* Header Section */}
            <header className="px-6 pt-12 pb-8 border-b border-white/[0.05] bg-gradient-to-b from-purple-500/5 to-transparent">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-widest border border-purple-500/20">
                                TRUST_PROTOCOL_ACTIVE
                            </span>
                            <TrustLevelIndicator score={trustScore} />
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Creator Reputation</h1>
                        <p className="text-slate-400 text-sm max-w-lg">
                            An immutable ledger of your collaboration history, performance reliability, and brand trust metrics.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col items-center min-w-[120px]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact Score</span>
                            <span className="text-2xl font-bold text-white">{(performance?.engagement_rate || 0).toFixed(2)}%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 flex flex-col items-center min-w-[120px] shadow-lg shadow-purple-500/5">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Trust Score</span>
                            <span className="text-2xl font-bold text-white">{trustScore}/100</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
                {/* Core Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Brand Partners"
                        value={stats?.brands_count || 0}
                        icon={Users}
                        subValue="Verified collaborations"
                        trend="+2 this month"
                    />
                    <StatCard
                        label="Deals Completed"
                        value={stats?.completed_deals || 0}
                        icon={CheckCircle}
                        subValue={`${stats?.total_deals || 0} total deals initiated`}
                    />
                    <StatCard
                        label="Completion Rate"
                        value={`${stats?.completion_rate || 98}%`}
                        icon={Target}
                        subValue="Reliability benchmark"
                        trend="Top 5%"
                    />
                    <StatCard
                        label="Avg. Response"
                        value={stats?.avg_response_hours ? `${stats.avg_response_hours}h` : '3h'}
                        icon={Clock}
                        subValue="Negotiation speed"
                    />
                </div>

                {/* Performance & Distribution Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Distribution Card */}
                    <div className="lg:col-span-2 p-8 rounded-3xl bg-[#111114] border border-white/[0.05] relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-white">Performance Footprint</h3>
                                <p className="text-xs text-slate-500 mt-1">Aggregate metrics from recent campaigns</p>
                            </div>
                            <BarChart3 className="text-slate-600" />
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Reel Views (Median)', value: performance?.median_reel_views?.toLocaleString() || '0', icon: Zap },
                                { label: 'Total Engagement', value: ((performance?.avg_likes || 0) + (performance?.avg_comments || 0)).toLocaleString() || '0', icon: TrendingUp },
                                { label: 'Saves & Shares', value: ((performance?.avg_saves || 0) + (performance?.avg_shares || 0)).toLocaleString() || '0', icon: Award }
                            ].map((p, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                                            <p.icon size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300">{p.label}</span>
                                    </div>
                                    <span className="text-base font-bold text-white font-mono">{p.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/[0.05] flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar size={12} />
                                Last verified: {performance?.captured_at ? new Date(performance.captured_at).toLocaleDateString() : 'Never'}
                            </div>
                            <button type="button" className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 hover:text-purple-300">
                                Request Fresh Audit
                                <ExternalLink size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Trust Card */}
                    <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 flex flex-col">
                        <div className="mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white">Creator Armour Verified</h3>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                Your reputation is backed by on-chain logs and brand-verified performance data. Higher reputation unlocking lower escrow fees and priority deal matching.
                            </p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Track</span>
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Next Tier: 75%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${trustScore}%` }}
                                        className="h-full bg-purple-500"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-center italic">
                                "Trust is the currency of the next-gen creator economy."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Audit History / Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <Search size={20} className="text-slate-500" />
                            Integrity Ledger
                        </h3>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                            <Info size={14} className="text-slate-500" />
                            <span className="text-xs text-slate-400">All data is timestamped by Creator Armour Protocol</span>
                        </div>
                    </div>

                    <div className="bg-[#111114] border border-white/[0.05] rounded-3xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.05]">
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Type</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stakeholder</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Integrity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { type: 'Campaign Completion', brand: 'Premium Brands Co', date: 'Oct 12, 2024', status: 'Verified' },
                                    { type: 'Instagram Sync', brand: 'System Audit', date: 'Oct 08, 2024', status: 'Synced' },
                                    { type: 'Payment Released', brand: 'Growth Kit Inc', date: 'Oct 01, 2024', status: 'Secured' },
                                    { type: 'Agreement Signed', brand: 'Beauty Line', date: 'Sep 24, 2024', status: 'Legal' }
                                ].map((item, idx) => (
                                    <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-medium text-white">{item.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-sm text-slate-400">{item.brand}</td>
                                        <td className="px-8 py-4 text-xs font-mono text-slate-500 uppercase">{item.date}</td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/20">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer className="mt-20 py-12 border-t border-white/[0.05] bg-[#0D0D0F]">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                        <span>© 2025 Creator Armour</span>
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <a href="#" className="hover:text-white transition-colors">Reputation Framework</a>
                        <a href="#" className="hover:text-white transition-colors">Compliance</a>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Lock size={12} />
                        End-to-end encrypted protocol
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CreatorReputationDashboard;
