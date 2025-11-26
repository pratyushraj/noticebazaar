"use client";

import React, { useState } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Lock, Eye, Download, Upload, AlertCircle, Calendar, User, TrendingUp, Zap, ChevronRight, MoreVertical } from 'lucide-react';

const CreatorContentProtection = () => {
  const [activeTab, setActiveTab] = useState('contracts');

  const protectionScore = 85;

  const contracts = [
    {
      id: 1,
      title: "TechGear Pro Sponsorship Agreement",
      brand: "TechGear",
      status: "active",
      risk: "low",
      uploaded: "Nov 20, 2024",
      expiry: "Dec 31, 2024",
      value: 150000,
      reviewed: true,
      issues: 0,
      clauses: {
        payment: "verified",
        termination: "verified",
        ip_rights: "verified",
        exclusivity: "warning"
      }
    },
    {
      id: 2,
      title: "Fashion Nova Brand Partnership",
      brand: "Fashion Nova",
      status: "pending_review",
      risk: "medium",
      uploaded: "Nov 24, 2024",
      expiry: "Jan 31, 2025",
      value: 85000,
      reviewed: false,
      issues: 2,
      clauses: {
        payment: "verified",
        termination: "issue",
        ip_rights: "warning",
        exclusivity: "verified"
      }
    },
    {
      id: 3,
      title: "SkillShare Affiliate Agreement",
      brand: "SkillShare",
      status: "needs_attention",
      risk: "high",
      uploaded: "Nov 22, 2024",
      expiry: "Nov 30, 2024",
      value: 45000,
      reviewed: true,
      issues: 3,
      clauses: {
        payment: "issue",
        termination: "issue",
        ip_rights: "verified",
        exclusivity: "warning"
      }
    }
  ];

  const alerts = [
    {
      id: 1,
      type: "urgent",
      title: "Contract Expiring Soon",
      description: "SkillShare agreement expires in 6 days",
      action: "Review & Renew",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: "warning",
      title: "Payment Terms Need Review",
      description: "Fashion Nova contract has unclear payment schedule",
      action: "Get Legal Review",
      time: "1 day ago"
    },
    {
      id: 3,
      type: "info",
      title: "IP Rights Protection Available",
      description: "Upgrade to protect your content rights across all deals",
      action: "Learn More",
      time: "3 days ago"
    }
  ];

  const protectionFeatures = [
    {
      id: 1,
      icon: FileText,
      title: "Contract Review",
      description: "AI-powered analysis of terms",
      status: "active"
    },
    {
      id: 2,
      icon: Lock,
      title: "IP Rights Protection",
      description: "Safeguard your content ownership",
      status: "active"
    },
    {
      id: 3,
      icon: AlertTriangle,
      title: "Risk Monitoring",
      description: "Real-time alerts for issues",
      status: "active"
    },
    {
      id: 4,
      icon: TrendingUp,
      title: "Payment Protection",
      description: "Ensure you get paid on time",
      status: "premium"
    }
  ];

  const riskConfig = {
    low: { color: 'bg-green-500', label: 'Low Risk', textColor: 'text-green-400', bgColor: 'bg-green-500/20' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    high: { color: 'bg-red-500', label: 'High Risk', textColor: 'text-red-400', bgColor: 'bg-red-500/20' }
  };

  const statusConfig = {
    active: { icon: CheckCircle, label: 'Active', color: 'text-green-400' },
    pending_review: { icon: Clock, label: 'Pending Review', color: 'text-yellow-400' },
    needs_attention: { icon: AlertCircle, label: 'Needs Attention', color: 'text-red-400' }
  };

  const alertConfig = {
    urgent: { icon: AlertTriangle, bgColor: 'bg-red-500/20', iconColor: 'text-red-400', borderColor: 'border-red-500/30' },
    warning: { icon: AlertCircle, bgColor: 'bg-yellow-500/20', iconColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
    info: { icon: Zap, bgColor: 'bg-blue-500/20', iconColor: 'text-blue-400', borderColor: 'border-blue-500/30' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Protection</h1>
        <p className="text-purple-200">Safeguard your deals & rights</p>
      </div>

      {/* Protection Score Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="font-semibold">Protection Score</span>
          </div>
          <button className="text-sm text-purple-300 hover:text-white transition-colors">
            How it works?
          </button>
        </div>

        <div className="flex items-end gap-4 mb-4">
          <div className="text-5xl font-bold text-green-400">{protectionScore}</div>
          <div className="text-sm text-purple-200 mb-2">out of 100</div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-3 mb-3">
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all"
            style={{ width: `${protectionScore}%` }}
          />
        </div>

        <div className="text-sm text-purple-200">
          <span className="text-green-400 font-medium">Great job!</span> Your contracts are well-protected. Review 2 pending items to reach 100.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'contracts'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-purple-200 hover:bg-white/15'
          }`}
        >
          Contracts ({contracts.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'alerts'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-purple-200 hover:bg-white/15'
          }`}
        >
          Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === 'features'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white/10 text-purple-200 hover:bg-white/15'
          }`}
        >
          Features
        </button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-3">
          {contracts.map(contract => {
            const StatusIcon = statusConfig[contract.status].icon;
            
            return (
              <div
                key={contract.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
              >
                {/* Contract Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${riskConfig[contract.risk].bgColor}`}>
                      <FileText className={`w-6 h-6 ${riskConfig[contract.risk].textColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 leading-tight">{contract.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-purple-200">
                        <span>{contract.brand}</span>
                        <span>•</span>
                        <span>₹{(contract.value / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-purple-300 flex-shrink-0 ml-2" />
                </div>

                {/* Status and Risk Badges */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1 text-xs ${statusConfig[contract.status].color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig[contract.status].label}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${riskConfig[contract.risk].bgColor} ${riskConfig[contract.risk].textColor}`}>
                    {riskConfig[contract.risk].label}
                  </div>
                  {contract.issues > 0 && (
                    <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium">
                      {contract.issues} {contract.issues === 1 ? 'Issue' : 'Issues'}
                    </div>
                  )}
                </div>

                {/* Key Clauses Check */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {Object.entries(contract.clauses).map(([key, status]) => (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {status === 'verified' ? (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      ) : status === 'warning' ? (
                        <AlertCircle className="w-3 h-3 text-yellow-400" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                      <span className="text-purple-200 capitalize">{key.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>

                {/* Contract Info */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-purple-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Expires: {contract.expiry}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Uploaded: {contract.uploaded}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Upload New Contract */}
          <button className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-6 border-2 border-dashed border-white/20 hover:bg-white/15 transition-all">
            <Upload className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <div className="text-sm font-medium mb-1">Upload New Contract</div>
            <div className="text-xs text-purple-300">Get instant AI-powered review</div>
          </button>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map(alert => {
            const AlertIcon = alertConfig[alert.type].icon;
            
            return (
              <div
                key={alert.id}
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 border ${alertConfig[alert.type].borderColor} hover:bg-white/15 transition-all cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alertConfig[alert.type].bgColor}`}>
                    <AlertIcon className={`w-5 h-5 ${alertConfig[alert.type].iconColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <span className="text-xs text-purple-300 whitespace-nowrap ml-2">{alert.time}</span>
                    </div>
                    
                    <p className="text-sm text-purple-200 mb-3">{alert.description}</p>
                    
                    <button className={`text-sm font-medium ${alertConfig[alert.type].iconColor} hover:underline`}>
                      {alert.action} →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          {protectionFeatures.map(feature => {
            const FeatureIcon = feature.icon;
            
            return (
              <div
                key={feature.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <FeatureIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{feature.title}</h3>
                      {feature.status === 'active' ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">Premium</span>
                      )}
                    </div>
                    <p className="text-sm text-purple-200">{feature.description}</p>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-purple-300" />
                </div>
              </div>
            );
          })}

          {/* Upgrade Card */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 border border-purple-400/30">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h3 className="font-bold text-lg mb-1">Premium Protection</h3>
                <p className="text-sm text-purple-100">Get advanced features and priority legal support</p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-4 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>24/7 Legal advisor access</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>Payment guarantee protection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>Unlimited contract reviews</span>
              </li>
            </ul>
            
            <button className="w-full bg-white text-purple-700 font-semibold py-3 rounded-xl hover:bg-purple-50 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorContentProtection;
