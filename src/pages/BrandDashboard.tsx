import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Bell, User, Plus, FileText, CheckCircle2,
    Clock, TrendingUp, LayoutDashboard, CreditCard, Shield,
    Settings, MoreHorizontal, ArrowRight, Activity, LogOut, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { StatCard, SectionCard } from '@/components/ui/card-variants';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const BrandDashboard = () => {
    const navigate = useNavigate();
    const { profile, user, session } = useSession();
    const [activeTab, setActiveTab] = useState('pipeline');
    const [filter, setFilter] = useState('all');
    const isDark = true;

    const brandName = profile?.first_name || profile?.business_name || 'Brand';
    const brandLogo = profile?.avatar_url || `https://ui-avatars.com/api/?name=${brandName}&background=0D8ABC&color=fff`;

    // Fetch collaboration requests sent by this brand
    const { data: requests, isLoading: isLoadingRequests } = useSupabaseQuery(
        ['brandRequests', user?.id],
        async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('collab_requests')
                .select(`
                    id, 
                    brand_name, 
                    brand_email, 
                    collab_type, 
                    status, 
                    created_at, 
                    budget_range, 
                    exact_budget, 
                    deliverables,
                    deadline,
                    creator_id,
                    profiles:creator_id (
                        username,
                        first_name,
                        last_name,
                        business_name,
                        avatar_url
                    )
                `)
                .eq('brand_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        { enabled: !!user?.id }
    );

    // Fetch active deals for this brand
    const { data: deals, isLoading: isLoadingDeals } = useSupabaseQuery(
        ['brandDeals', user?.id],
        async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('brand_deals')
                .select(`
                    id,
                    status,
                    total_value,
                    deal_type,
                    created_at,
                    deadline,
                    profiles:creator_id (
                        username,
                        first_name,
                        last_name,
                        business_name,
                        avatar_url
                    )
                `)
                .eq('brand_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        { enabled: !!user?.id }
    );

    const filteredRequests = useMemo(() => {
        if (!requests) return [];
        if (filter === 'all') return requests;
        return requests.filter(r => r.status.toLowerCase() === filter.toLowerCase());
    }, [requests, filter]);

    const stats = useMemo(() => {
        const totalSent = requests?.length || 0;
        const activeDeals = deals?.filter(d => d.status !== 'completed' && d.status !== 'cancelled').length || 0;
        const totalInvestment = deals?.reduce((acc, d) => acc + (Number(d.total_value) || 0), 0) || 0;
        const needsAction = requests?.filter(r => r.status === 'countered').length || 0;

        return {
            totalSent,
            activeDeals,
            totalInvestment,
            needsAction
        };
    }, [requests, deals]);

    const textColor = isDark ? 'text-white' : 'text-slate-900';
    const bgColor = isDark ? 'bg-black' : 'bg-slate-50';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className={cn("min-h-screen font-sans selection:bg-blue-500/30 overflow-x-hidden pb-20", bgColor, textColor)}>

            {/* Spotlight Background Effect */}
            {isDark && (
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className={cn(
                "h-20 border-b px-8 flex items-center justify-between sticky top-0 z-50 backdrop-blur-2xl transition-all duration-300",
                isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-slate-200"
            )}>
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className={cn("text-[16px] font-black tracking-tight font-outfit uppercase shrink-0", textColor)}>
                                {brandName}
                            </h1>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40 shrink-0", textColor)}>
                                Brand Console
                            </p>
                        </div>
                    </div>

                    <nav className="hidden lg:flex items-center gap-2">
                        {[
                            { id: 'pipeline', label: 'Offer Pipeline', icon: LayoutDashboard },
                            { id: 'creators', label: 'Collaborations', icon: User },
                            { id: 'analytics', label: 'Spending', icon: TrendingUp }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "px-4 py-2 text-[13px] font-bold rounded-[14px] transition-all flex items-center gap-2",
                                    activeTab === item.id
                                        ? (isDark ? "bg-white/10 text-white" : "bg-slate-900 text-white")
                                        : (isDark ? "text-white/50 hover:text-white hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100")
                                )}
                            >
                                <item.icon className="w-4 h-4 opacity-70" strokeWidth={2.5} />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}>
                        <Bell className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-[1px] mx-1 opacity-10 bg-current hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-primary/20">
                            <AvatarImage src={brandLogo} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{brandName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1440px] mx-auto px-6 sm:px-8 py-10">

                {/* Dashboard Stats Hero */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h2 className={cn("text-3xl sm:text-4xl font-black tracking-tight font-outfit mb-2", textColor)}>
                                Welcome back, {brandName.split(' ')[0]}
                            </h2>
                            <p className="text-white/50 font-medium">You have {stats.needsAction} creator offers requiring your feedback today.</p>
                        </div>
                        <Button
                            className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-xl shadow-blue-600/20"
                            onClick={() => navigate('/creators')}
                        >
                            <Search className="w-5 h-5 mr-3" strokeWidth={3} />
                            Find New Creators
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <StatCard
                            label="Total Sent"
                            value={stats.totalSent.toString()}
                            icon={<FileText className="w-5 h-5 text-blue-500" />}
                            subtitle="Sent to creators"
                            variant="tertiary"
                            className="p-6"
                        />
                        <StatCard
                            label="Needs Action"
                            value={stats.needsAction.toString()}
                            icon={<Activity className="w-5 h-5 text-orange-500" />}
                            subtitle="Countered offers"
                            variant="tertiary"
                            className="p-6"
                        />
                        <StatCard
                            label="Active Deals"
                            value={stats.activeDeals.toString()}
                            icon={<Shield className="w-5 h-5 text-emerald-500" />}
                            subtitle="Currently in progress"
                            variant="tertiary"
                            className="p-6"
                        />
                        <StatCard
                            label="Total Investment"
                            value={`₹${stats.totalInvestment.toLocaleString()}`}
                            icon={<CreditCard className="w-5 h-5 text-purple-500" />}
                            subtitle="Lifetime spent"
                            variant="tertiary"
                            className="p-6"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Pipeline */}
                    <div className="col-span-12 xl:col-span-9 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {[
                                    { id: 'all', label: 'All Requests' },
                                    { id: 'pending', label: 'Pending' },
                                    { id: 'countered', label: 'Countered' },
                                    { id: 'accepted', label: 'Accepted' },
                                    { id: 'declined', label: 'Declined' }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={cn(
                                            "px-6 py-2.5 rounded-2xl text-[13px] font-black border transition-all whitespace-nowrap uppercase tracking-widest",
                                            filter === f.id
                                                ? "bg-white text-black border-white"
                                                : "bg-white/5 text-white/60 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <SectionCard variant="tertiary" className="overflow-visible border-white/5 bg-white/[0.02]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Creator</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Deal Context</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Investment</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Status</th>
                                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {isLoadingRequests ? (
                                            Array(3).fill(0).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={5} className="px-8 py-8 h-20 bg-white/5 rounded-lg mb-2" />
                                                </tr>
                                            ))
                                        ) : filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                                        <FileText className="w-12 h-12" />
                                                        <p className="text-xl font-bold font-outfit uppercase tracking-widest">No requests found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredRequests.map((request) => {
                                            const creator = request.profiles as any;
                                            const creatorName = creator?.business_name || `${creator?.first_name || ''} ${creator?.last_name || ''}`.trim() || creator?.username || 'Creator';
                                            const creatorAvatar = creator?.avatar_url || `https://ui-avatars.com/api/?name=${creatorName}&background=indigo&color=fff`;

                                            return (
                                                <tr key={request.id} className="group hover:bg-white/[0.03] transition-all">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="h-12 w-12 rounded-2xl border border-white/10 ring-offset-black transition-transform group-hover:scale-105">
                                                                <AvatarImage src={creatorAvatar} />
                                                                <AvatarFallback>{creatorName.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="text-[16px] font-black font-outfit text-white">{creatorName}</div>
                                                                <div className="text-[12px] font-bold text-blue-500 uppercase tracking-widest">@{creator?.username}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-[14px] font-bold text-white uppercase tracking-tight">{request.collab_type}</div>
                                                        <div className="text-[11px] font-black text-white/40 uppercase tracking-widest mt-1">
                                                            Sent {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-[15px] font-black font-outfit text-white">
                                                            {request.exact_budget ? `₹${request.exact_budget.toLocaleString()}` : request.budget_range || 'Barter'}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mt-1">Escrow Eligible</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <Badge className={cn(
                                                            "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0",
                                                            request.status === 'pending' ? "bg-blue-500/10 text-blue-500" :
                                                                request.status === 'countered' ? "bg-orange-500/10 text-orange-500 animate-pulse border border-orange-500/30" :
                                                                    request.status === 'accepted' ? "bg-emerald-500/10 text-emerald-500" :
                                                                        "bg-white/10 text-white/40"
                                                        )}>
                                                            {request.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="rounded-xl h-9 px-5 bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-wider text-[11px]"
                                                            onClick={() => navigate(`/deal-details/${request.id}`)}
                                                        >
                                                            View Details
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>

                    {/* Right Hand Sidebar */}
                    <div className="col-span-12 xl:col-span-3 space-y-8">
                        {/* Summary Card */}
                        <SectionCard title="Performance" icon={<TrendingUp className="w-4 h-4" />} variant="tertiary" className="p-8 border-white/5 bg-white/[0.02]">
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-1">Protection Status</p>
                                    <p className="text-xl font-black font-outfit text-white flex items-center gap-2">
                                        Active <Shield className="w-5 h-5 text-emerald-500" />
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[13px] font-bold text-white/80">Creators you've worked with previously</p>
                                    <div className="flex -space-x-3 overflow-hidden">
                                        {[1, 2, 3, 4].map(idx => (
                                            <Avatar key={idx} className="h-10 w-10 border-4 border-black ring-0">
                                                <AvatarImage src={`https://i.pravatar.cc/150?img=${idx + 40}`} />
                                            </Avatar>
                                        ))}
                                        <div className="h-10 w-10 rounded-full bg-white/10 border-4 border-black flex items-center justify-center text-[10px] font-black text-white/60">
                                            +12
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border-white/5 h-12 rounded-xl font-bold uppercase tracking-widest text-[11px]">
                                    Manage Creators
                                </Button>
                            </div>
                        </SectionCard>

                        {/* Recent Activity Mini-Feed */}
                        <SectionCard
                            title="Recent Activity"
                            icon={<Activity className="w-4 h-4 text-blue-500" />}
                            variant="tertiary"
                            className="p-8 border-white/5 bg-white/[0.02]"
                        >
                            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                                {requests?.slice(0, 3).map((r, idx) => (
                                    <div key={idx} className="flex gap-4 relative z-10">
                                        <div className="w-[24px] h-[24px] rounded-full border-2 border-white/10 flex items-center justify-center bg-black">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold leading-tight text-white/90">
                                                Request to {(r.profiles as any)?.username || 'creator'} marked as <span className="text-blue-400 font-black">{r.status}</span>
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/30 mt-1">
                                                {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-6 text-white/30 hover:text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[10px]">
                                View Audit Log
                            </Button>
                        </SectionCard>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BrandDashboard;
