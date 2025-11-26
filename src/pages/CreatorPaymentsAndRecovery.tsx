"use client";

import React, { useState } from 'react';
import { Wallet, TrendingUp, Download, Filter, Search, CheckCircle, Clock, XCircle, AlertCircle, Calendar, CreditCard, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';

const CreatorPaymentsAndRecovery = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('november');

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

  const statusConfig = {
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

  const filteredTransactions = activeFilter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === activeFilter);

  const totalReceived = transactions
    .filter(t => t.type === 'received' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPending = transactions
    .filter(t => t.type === 'pending' || t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Payments</h1>
          <p className="text-purple-200">Track your income & expenses</p>
        </div>
        <button className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/10 transition-all">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-6">
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
            <div className="text-xl font-semibold">₹{(totalPending / 1000).toFixed(0)}K</div>
          </div>
          <div>
            <div className="text-purple-200 text-xs mb-1">Next Payout</div>
            <div className="text-xl font-semibold">₹{(stats.nextPayout / 1000).toFixed(0)}K</div>
            <div className="text-xs text-purple-300">{stats.payoutDate}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-all">
          <div className="bg-green-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <ArrowDownRight className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-xs font-medium">Request Payment</div>
        </button>
        
        <button className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-all">
          <div className="bg-blue-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-xs font-medium">Add Expense</div>
        </button>
        
        <button className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10 transition-all">
          <div className="bg-purple-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto">
            <Download className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xs font-medium">Export Report</div>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center px-4 py-2.5">
          <Search className="w-4 h-4 text-purple-300 mr-2" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="bg-transparent text-white placeholder-purple-300 outline-none w-full text-sm"
          />
        </div>
        <button className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-xl p-2.5 border border-white/10 transition-all">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Recent Transactions</h2>
          <button className="text-sm text-purple-300 hover:text-white transition-colors">View All</button>
        </div>

        {filteredTransactions.map(transaction => {
          const StatusIcon = statusConfig[transaction.status].icon;
          
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
                      <StatusIcon className={`w-4 h-4 ${statusConfig[transaction.status].textColor}`} />
                      <span className={`text-xs ${statusConfig[transaction.status].textColor}`}>
                        {statusConfig[transaction.status].label}
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
  );
};

export default CreatorPaymentsAndRecovery;
