"use client";

import React, { useState } from 'react';
import { Briefcase, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, Calendar, FileText, ChevronRight } from 'lucide-react';

const CreatorContracts = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const deals = [
    {
      id: 1,
      title: "TechGear Pro Sponsorship",
      brand: "TechGear",
      value: 150000,
      status: "negotiation",
      progress: 60,
      deadline: "Dec 15, 2024",
      platform: "YouTube",
      type: "Sponsored Video",
      lastUpdate: "2 hours ago",
      nextStep: "Review contract terms"
    },
    {
      id: 2,
      title: "Fashion Nova Campaign",
      brand: "Fashion Nova",
      value: 85000,
      status: "active",
      progress: 100,
      deadline: "Jan 10, 2025",
      platform: "Instagram",
      type: "Brand Partnership",
      lastUpdate: "1 day ago",
      nextStep: "Create content"
    },
    {
      id: 3,
      title: "SkillShare Course Promo",
      brand: "SkillShare",
      value: 45000,
      status: "pending",
      progress: 30,
      deadline: "Nov 30, 2024",
      platform: "YouTube",
      type: "Affiliate Deal",
      lastUpdate: "3 days ago",
      nextStep: "Awaiting brand approval"
    },
    {
      id: 4,
      title: "Coffee Brand Collab",
      brand: "BrewMasters",
      value: 120000,
      status: "completed",
      progress: 100,
      deadline: "Nov 20, 2024",
      platform: "Instagram + YouTube",
      type: "Product Review",
      lastUpdate: "5 days ago",
      nextStep: "Payment processing"
    }
  ];

  const stats = {
    total: 12,
    active: 3,
    pending: 4,
    totalValue: 850000,
    thisMonth: 285000
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-500', label: 'Pending', icon: Clock },
    negotiation: { color: 'bg-blue-500', label: 'Negotiation', icon: TrendingUp },
    active: { color: 'bg-green-500', label: 'Active', icon: CheckCircle },
    completed: { color: 'bg-purple-500', label: 'Completed', icon: CheckCircle }
  };

  const filters = [
    { id: 'all', label: 'All Deals', count: 12 },
    { id: 'active', label: 'Active', count: 3 },
    { id: 'pending', label: 'Pending', count: 4 },
    { id: 'completed', label: 'Completed', count: 5 }
  ];

  const filteredDeals = activeFilter === 'all' 
    ? deals 
    : deals.filter(deal => deal.status === activeFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Brand Deals</h1>
        <p className="text-purple-200">Track and manage your partnerships</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-purple-300" />
            <span className="text-sm text-purple-200">Total Deals</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-green-400 mt-1">+3 this month</div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-300" />
            <span className="text-sm text-purple-200">Total Value</span>
          </div>
          <div className="text-2xl font-bold">₹{(stats.totalValue / 1000).toFixed(0)}K</div>
          <div className="text-xs text-purple-300 mt-1">Across all deals</div>
        </div>
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
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        {filteredDeals.map(deal => {
          const StatusIcon = statusConfig[deal.status].icon;
          
          return (
            <div
              key={deal.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
            >
              {/* Deal Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{deal.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <span>{deal.brand}</span>
                    <span>•</span>
                    <span>{deal.platform}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0 ml-2" />
              </div>

              {/* Deal Value */}
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm font-semibold">
                  ₹{(deal.value / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-purple-300">{deal.type}</div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
                  <span>Progress</span>
                  <span>{deal.progress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      deal.status === 'completed' ? 'bg-green-500' :
                      deal.status === 'active' ? 'bg-blue-500' :
                      deal.status === 'negotiation' ? 'bg-purple-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${deal.progress}%` }}
                  />
                </div>
              </div>

              {/* Status and Deadline */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{statusConfig[deal.status].label}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-200">
                  <Calendar className="w-3 h-3" />
                  <span>{deal.deadline}</span>
                </div>
              </div>

              {/* Next Step */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200">Next: </span>
                  <span className="text-white">{deal.nextStep}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State (shown when no deals match filter) */}
      {filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No deals found</h3>
          <p className="text-purple-200 mb-4">Try adjusting your filters</p>
        </div>
      )}

      {/* FAB - Add New Deal */}
      <button className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110 active:scale-95">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default CreatorContracts;
