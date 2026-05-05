import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Handshake, 
  IndianRupee, 
  Users, 
  History, 
  Search, 
  Filter, 
  ShieldCheck,
  RefreshCcw,
  Clock
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { AdminFinanceView } from '@/components/admin/AdminFinanceView';
import { AdminDealsTable } from '@/components/admin/AdminDealsTable';
import { AdminUserDirectory } from '@/components/admin/AdminUserDirectory';

// --- Types ---
type AdminTab = 'overview' | 'deals' | 'finance' | 'users' | 'activity';

// --- Sub-Components ---

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color }: any) => (
  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
    <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-10 -mt-10 blur-3xl", color)} />
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", color.replace('bg-', 'bg-opacity-20 bg-'))}>
        <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
      <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

// --- Main Page ---

export default function AdminDashboard() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  // --- Queries ---
  const { data: metrics } = useQuery({
    queryKey: ['admin_metrics'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      return data.data;
    },
    enabled: !!session?.access_token,
    refetchInterval: REFRESH_INTERVAL,
  });

  const { data: deals } = useQuery({
    queryKey: ['admin_deals', searchTerm],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/deals?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!session?.access_token,
    refetchInterval: REFRESH_INTERVAL,
  });

  const { data: users } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!session?.access_token,
    refetchInterval: REFRESH_INTERVAL,
  });

  const { data: logs } = useQuery({
    queryKey: ['admin_logs'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!session?.access_token,
    refetchInterval: REFRESH_INTERVAL,
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin_analytics'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/analytics?days=30`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!session?.access_token,
    refetchInterval: REFRESH_INTERVAL,
  });

  // --- Mutations ---
  const forceApproveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/payouts/${id}/force-approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to force approve');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Deal forcefully approved!');
      queryClient.invalidateQueries({ queryKey: ['admin_deals'] });
      queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin_analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin_logs'] });
    },
  });

  const verifyKycMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to verify KYC');
      return res.json();
    },
    onSuccess: () => {
      toast.success('User KYC verified successfully');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_logs'] });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to suspend user');
      return res.json();
    },
    onSuccess: () => {
      toast.success('User account suspended');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      queryClient.invalidateQueries({ queryKey: ['admin_logs'] });
    },
  });

  // --- Render Sections ---

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Gross Transaction Value" 
          value={`₹${(metrics?.growth?.totalGTV || 0).toLocaleString()}`} 
          icon={IndianRupee} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Active Escrow" 
          value={`₹${(metrics?.escrow?.totalVolumeLocked || 0).toLocaleString()}`} 
          icon={ShieldCheck} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Signups" 
          value={metrics?.onboarding?.totalSignups || 0} 
          icon={Users} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Active Deals" 
          value={metrics?.growth?.activeDealsCount || 0} 
          icon={Handshake} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Approval Velocity" 
          value={`${Math.round(metrics?.escrow?.averageApprovalVelocityHours || 0)}h`} 
          icon={Clock} 
          color="bg-sky-500" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-10">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Revenue Growth</h3>
                <p className="text-xs text-slate-500 mt-1">Platform GTV trends over the last 30 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400">GTV (₹)</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorGtv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(str) => format(new Date(str), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gtv" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGtv)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Deal Velocity</h3>
                <p className="text-xs text-slate-500 mt-1">Daily deal volume and velocity across the last 30 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="text-xs text-slate-400">Deals</span>
                </div>
              </div>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(str) => format(new Date(str), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                    itemStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deals" 
                    stroke="#38bdf8" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDeals)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/5">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Avg. Approval</p>
              <p className="text-xl font-bold text-white">{Math.round(metrics?.escrow?.averageApprovalVelocityHours || 0)}h</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Ghosting Rate</p>
              <p className={cn("text-xl font-bold", (metrics?.escrow?.ghostingRate || 0) > 15 ? "text-amber-400" : "text-white")}>
                {Math.round(metrics?.escrow?.ghostingRate || 0)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Completion</p>
              <p className="text-xl font-bold text-white">{Math.round(metrics?.onboarding?.completionRate || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {logs?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex gap-4">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    {log.event.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')} • {log.user?.username || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setActiveTab('activity')}
            className="w-full mt-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
          >
            View Full Audit Trail
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020D0A] text-slate-200 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020D0A]/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight uppercase">Admin Command Center</h1>
              <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Network Status: Operational
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
               <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">
                 {session?.user?.email?.charAt(0).toUpperCase()}
               </div>
               <span className="text-xs font-bold text-slate-300">Admin Session</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pt-10">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/10 w-fit mb-10 overflow-x-auto max-w-full no-scrollbar">
          {(['overview', 'deals', 'finance', 'users', 'activity'] as AdminTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                activeTab === tab 
                  ? "bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] scale-105" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              {tab === 'overview' && <LayoutDashboard className="w-3.5 h-3.5" />}
              {tab === 'deals' && <Handshake className="w-3.5 h-3.5" />}
              {tab === 'finance' && <IndianRupee className="w-3.5 h-3.5" />}
              {tab === 'users' && <Users className="w-3.5 h-3.5" />}
              {tab === 'activity' && <History className="w-3.5 h-3.5" />}
              {tab === 'finance' ? 'Finance' : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="relative">
           {activeTab === 'overview' && renderOverview()}
           
           {activeTab === 'deals' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <Input 
                     placeholder="Search deals by ID, brand..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-11 bg-slate-900/50 border-white/10 text-white rounded-2xl h-12"
                   />
                 </div>
                 <div className="flex items-center gap-3">
                   <button className="p-3 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400">
                     <Filter className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => queryClient.invalidateQueries({ queryKey: ['admin_deals'] })}
                     className="p-3 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400"
                   >
                     <RefreshCcw className="w-5 h-5" />
                   </button>
                 </div>
               </div>
               <AdminDealsTable 
                 deals={deals} 
                 onForceApprove={(id) => forceApproveMutation.mutate(id)} 
               />
             </div>
           )}

           {activeTab === 'users' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <AdminUserDirectory 
                 users={users} 
                 onVerify={(id) => verifyKycMutation.mutate(id)}
                 onSuspend={(id) => suspendUserMutation.mutate(id)}
               />
             </div>
           )}

           {activeTab === 'activity' && (
             <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 border-b border-white/5">
                  <h3 className="text-xl font-bold text-white mb-1">Global Audit Trail</h3>
                  <p className="text-sm text-slate-500">Live stream of all significant deal events across the platform.</p>
                </div>
                <div className="divide-y divide-white/5">
                  {logs?.map((log: any) => (
                    <div key={log.id} className="p-6 hover:bg-white/[0.01] transition-colors flex items-start justify-between">
                      <div className="flex gap-6">
                        <div className="mt-1.5">
                          <div className={cn(
                            "w-3 h-3 rounded-full ring-4",
                            log.event.includes('PAYMENT') ? "bg-emerald-500 ring-emerald-500/10" :
                            log.event.includes('SIGNED') ? "bg-blue-500 ring-blue-500/10" :
                            log.event.includes('DISPUTE') ? "bg-red-500 ring-red-500/10" :
                            "bg-slate-500 ring-slate-500/10"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm font-black text-white uppercase tracking-wider">{log.event.replace(/_/g, ' ')}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {log.id.slice(-8)}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            User <span className="text-white font-bold">@{log.user?.username}</span> performed action on Deal 
                            <span className="text-blue-400 font-mono ml-2">#{log.deal_id.split('-')[0]}</span>
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                             <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 max-w-lg overflow-x-auto">
                               {JSON.stringify(log.metadata, null, 2)}
                             </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">
                          {format(new Date(log.created_at), 'h:mm:ss a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           )}

           {activeTab === 'finance' && <AdminFinanceView />}
        </div>
      </main>
    </div>
  );
}
