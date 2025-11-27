"use client";

import { useState, useMemo } from 'react';
import { Wallet, TrendingUp, Download, Filter, Search, CheckCircle, Clock, XCircle, AlertCircle, CreditCard, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { toast } from 'sonner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';

const CreatorPaymentsAndRecovery = () => {
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch real brand deals data
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  const stats = {
    totalReceived: 285700,
    pending: 145000,
    thisMonth: 285700,
    nextPayout: 20000,
    payoutDate: "Dec 1, 2024"
  };

  const transactions = [
    {
      id: 1,
      title: "Fashion Nova Campaign",
      brand: "Fashion Nova",
      amount: 85000,
      type: "received",
      status: "completed",
      date: "Nov 22, 2024",
      method: "Bank Transfer",
      invoice: "INV-2024-1122",
      platform: "Instagram",
      tax: 15300
    },
    {
      id: 2,
      title: "YouTube Partner Revenue",
      brand: "YouTube",
      amount: 120000,
      type: "received",
      status: "completed",
      date: "Nov 15, 2024",
      method: "Direct Deposit",
      invoice: "INV-2024-1115",
      platform: "YouTube",
      tax: 21600
    },
    {
      id: 3,
      title: "TechGear Pro Sponsorship",
      brand: "TechGear",
      amount: 75000,
      type: "pending",
      status: "pending",
      date: "Expected: Nov 30",
      method: "Bank Transfer",
      invoice: "INV-2024-1130",
      platform: "YouTube",
      tax: 13500
    },
    {
      id: 4,
      title: "SkillShare Affiliate",
      brand: "SkillShare",
      amount: 45000,
      type: "pending",
      status: "processing",
      date: "Expected: Dec 5",
      method: "PayPal",
      invoice: "INV-2024-1205",
      platform: "YouTube",
      tax: 8100
    },
    {
      id: 5,
      title: "Coffee Brand Collaboration",
      brand: "BrewMasters",
      amount: 5700,
      type: "expense",
      status: "completed",
      date: "Nov 18, 2024",
      method: "Credit Card",
      invoice: "EXP-2024-1118",
      platform: "Production",
      tax: 0,
      category: "Equipment"
    },
    {
      id: 6,
      title: "Instagram Brand Deal",
      brand: "StyleHub",
      amount: 25000,
      type: "pending",
      status: "pending",
      date: "Expected: Dec 10",
      method: "Bank Transfer",
      invoice: "INV-2024-1210",
      platform: "Instagram",
      tax: 4500
    }
  ];

  type TransactionStatus = 'completed' | 'pending' | 'processing' | 'failed';
  
  const statusConfig: Record<TransactionStatus, { color: string; label: string; icon: typeof CheckCircle; textColor: string }> = {
    completed: { color: 'bg-green-500', label: 'Completed', icon: CheckCircle, textColor: 'text-green-400' },
    pending: { color: 'bg-yellow-500', label: 'Pending', icon: Clock, textColor: 'text-yellow-400' },
    processing: { color: 'bg-blue-500', label: 'Processing', icon: AlertCircle, textColor: 'text-blue-400' },
    failed: { color: 'bg-red-500', label: 'Failed', icon: XCircle, textColor: 'text-red-400' }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'received', label: 'Received' },
    { id: 'pending', label: 'Pending' },
    { id: 'expense', label: 'Expenses' }
  ];

  // Transform brand deals to transactions
  const allTransactions = useMemo(() => {
    const dealTransactions = brandDeals
      .filter(deal => deal.payment_received_date || deal.status === 'Payment Pending')
      .map(deal => ({
        id: deal.id,
        title: `${deal.brand_name} Campaign`,
        brand: deal.brand_name,
        amount: deal.deal_amount || 0,
        type: deal.payment_received_date ? 'received' : 'pending',
        status: deal.payment_received_date ? 'completed' : 'pending',
        date: deal.payment_received_date 
          ? new Date(deal.payment_received_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : deal.payment_expected_date 
            ? `Expected: ${new Date(deal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'TBD',
        method: 'Bank Transfer',
        invoice: `INV-${deal.id}`,
        platform: deal.platform || 'Multiple',
        tax: Math.round((deal.deal_amount || 0) * 0.18) // 18% GST estimate
      }));

    // Combine with demo expense transactions
    return [...dealTransactions, ...transactions.filter(t => t.type === 'expense')];
  }, [brandDeals]);

  const filteredTransactions = useMemo(() => {
    let filtered = activeFilter === 'all' 
      ? allTransactions 
      : allTransactions.filter(t => t.type === activeFilter);
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.invoice.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allTransactions, activeFilter, searchQuery]);

  const totalReceived = useMemo(() => 
    allTransactions
      .filter(t => t.type === 'received' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    [allTransactions]
  );

  const totalPending = useMemo(() => 
    allTransactions
      .filter(t => t.type === 'pending' || t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0),
    [allTransactions]
  );

  return (
    <ContextualTipsProvider currentView="payments">
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Payments</h1>
          <p className="text-purple-200">Track your income & expenses</p>
        </div>
        <button 
          onClick={() => {
            toast.info('Export report functionality coming soon!');
          }}
          className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/10 transition-all"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-6 md:p-8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-6 h-6 text-purple-300" />
          <span className="text-sm text-purple-200">This Month</span>
        </div>
        
        <div className="mb-4">
          <div className="text-4xl font-bold mb-1">₹{(totalReceived / 1000).toFixed(1)}K</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12% from last month
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <div className="text-purple-200 text-xs mb-1">Pending</div>
            <div className="text-[20px] md:text-[24px] font-semibold">₹{(totalPending / 1000).toFixed(0)}K</div>
          </div>
          <div>
            <div className="text-purple-200 text-[13px] mb-1">Next Payout</div>
            <div className="text-[20px] md:text-[24px] font-semibold">₹{(stats.nextPayout / 1000).toFixed(0)}K</div>
            <div className="text-[13px] text-purple-300">{stats.payoutDate}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button 
          onClick={() => toast.info('Request payment functionality coming soon!')}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-4 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-95"
        >
          <div className="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <ArrowDownRight className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-xs font-medium">Request Payment</div>
        </button>
        
        <button 
          onClick={() => toast.info('Add expense functionality coming soon!')}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-4 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-95"
        >
          <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-xs font-medium">Add Expense</div>
        </button>
        
        <button 
          onClick={() => {
            toast.info('Export report functionality coming soon!');
          }}
          className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-4 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:bg-white/[0.12] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-95"
        >
          <div className="bg-purple-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <Download className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xs font-medium">Export Report</div>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center px-4 py-3">
          <Search className="w-4 h-4 text-purple-300 mr-2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..." 
            className="bg-transparent text-white placeholder-purple-300 outline-none w-full text-sm"
          />
        </div>
        <button className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-3 border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-white/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-200 active:scale-95">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* iOS Segmented Control */}
      <div className="mb-6">
        <SegmentedControl
          options={filters.map(f => ({ id: f.id, label: f.label }))}
          value={activeFilter}
          onChange={setActiveFilter}
          className="w-full"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Recent Transactions</h2>
          <button className="text-sm text-purple-300 hover:text-white transition-colors">View All</button>
        </div>

        {filteredTransactions.map(transaction => {
          const StatusIcon = statusConfig[transaction.status as TransactionStatus].icon;
          
          return (
            <div
              key={transaction.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    transaction.type === 'received' ? 'bg-green-500/20' :
                    transaction.type === 'pending' ? 'bg-yellow-500/20' :
                    'bg-red-500/20'
                  }`}>
                    {transaction.type === 'expense' ? (
                      <ArrowUpRight className={`w-6 h-6 text-red-400`} />
                    ) : (
                      <ArrowDownRight className={`w-6 h-6 ${
                        transaction.type === 'received' ? 'text-green-400' : 'text-yellow-400'
                      }`} />
                    )}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{transaction.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-purple-200 mb-2">
                      <span>{transaction.brand}</span>
                      <span>•</span>
                      <span>{transaction.platform}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${statusConfig[transaction.status as TransactionStatus].textColor}`} />
                      <span className={`text-xs ${statusConfig[transaction.status as TransactionStatus].textColor}`}>
                        {statusConfig[transaction.status as TransactionStatus].label}
                      </span>
                      <span className="text-xs text-purple-300">• {transaction.date}</span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right ml-4">
                  <div className={`text-xl font-bold mb-1 ${
                    transaction.type === 'expense' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {transaction.type === 'expense' ? '-' : '+'}₹{(transaction.amount / 1000).toFixed(1)}K
                  </div>
                  <button className="text-purple-300 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-purple-200">
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    <span>{transaction.method}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Invoice: {transaction.invoice}</span>
                  </div>
                </div>
                {transaction.tax > 0 && (
                  <div className="text-xs text-purple-300">
                    Tax: ₹{(transaction.tax / 1000).toFixed(1)}K
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
          <p className="text-purple-200 mb-4">Try adjusting your filters</p>
        </div>
      )}
    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorPaymentsAndRecovery;
