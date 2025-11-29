"use client";

import { useState, useMemo } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Lock, Upload, AlertCircle, Calendar, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { NoContractsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { useNavigate } from 'react-router-dom';

const CreatorContentProtection = () => {
  const [activeTab, setActiveTab] = useState('contracts');
  const { profile } = useSession();
  const navigate = useNavigate();
  
  const { data: brandDeals = [], isLoading } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Transform brand deals into contracts format
  const contracts = useMemo(() => {
    if (!brandDeals || brandDeals.length === 0) return [];
    
    return brandDeals
      .filter(deal => deal.contract_file_url) // Only show deals with contracts
      .map(deal => {
        const uploadedDate = deal.created_at ? new Date(deal.created_at) : new Date();
        const expiryDate = deal.due_date ? new Date(deal.due_date) : null;
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        
        // Determine risk level based on status and expiry
        let risk: 'low' | 'medium' | 'high' = 'low';
        let status: 'active' | 'pending_review' | 'needs_attention' = 'active';
        let issues = 0;
        
        if (deal.status === 'Payment Pending' && deal.payment_expected_date) {
          const paymentDue = new Date(deal.payment_expected_date);
          const daysUntilPayment = Math.ceil((paymentDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilPayment < 0) {
            risk = 'high';
            status = 'needs_attention';
            issues++;
          } else if (daysUntilPayment <= 7) {
            risk = 'medium';
            status = 'pending_review';
          }
        }
        
        if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
          if (daysUntilExpiry <= 7) {
            risk = 'high';
            status = 'needs_attention';
            issues++;
          } else if (daysUntilExpiry <= 30) {
            risk = risk === 'high' ? 'high' : 'medium';
            if (status === 'active') status = 'pending_review';
          }
        }
        
        // Mock clause status (in real app, this would come from AI analysis)
        const clauses = {
          payment: deal.status === 'Completed' ? 'verified' : (risk === 'high' ? 'issue' : 'verified'),
          termination: 'verified',
          ip_rights: 'verified',
          exclusivity: 'warning'
        };
        
        // Count issues in clauses
        if (clauses.payment === 'issue') issues++;
        if (clauses.exclusivity === 'warning') issues++;
        
        return {
          id: deal.id,
          title: `${deal.brand_name} ${deal.platform || 'Partnership'} Agreement`,
          brand: deal.brand_name,
          status,
          risk,
          uploaded: uploadedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          expiry: expiryDate ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          value: deal.deal_amount || 0,
          reviewed: !!deal.contract_file_url,
          issues,
          clauses,
          dealId: deal.id,
        };
      });
  }, [brandDeals]);

  // Calculate protection score from contracts
  const protectionScore = useMemo(() => {
    if (contracts.length === 0) return 0;
    
    const totalContracts = contracts.length;
    const reviewedContracts = contracts.filter(c => c.reviewed).length;
    const lowRiskContracts = contracts.filter(c => c.risk === 'low').length;
    const contractsWithNoIssues = contracts.filter(c => c.issues === 0).length;
    
    // Score calculation: 40% reviewed, 30% low risk, 30% no issues
    const reviewedScore = (reviewedContracts / totalContracts) * 40;
    const riskScore = (lowRiskContracts / totalContracts) * 30;
    const issuesScore = (contractsWithNoIssues / totalContracts) * 30;
    
    return Math.round(reviewedScore + riskScore + issuesScore);
  }, [contracts]);

  // Generate alerts from contracts
  const alerts = useMemo(() => {
    const alertList: Array<{
      id: string;
      type: 'urgent' | 'warning' | 'info';
      title: string;
      description: string;
      action: string;
      time: string;
    }> = [];
    
    contracts.forEach(contract => {
      const expiryDate = contract.expiry !== 'N/A' ? new Date(contract.expiry) : null;
      if (expiryDate) {
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
          alertList.push({
            id: `expiry-${contract.id}`,
            type: 'urgent',
            title: 'Contract Expiring Soon',
            description: `${contract.brand} agreement expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`,
            action: 'Review & Renew',
            time: daysUntilExpiry === 1 ? 'Today' : `${daysUntilExpiry} days left`,
          });
        }
      }
      
      if (contract.issues > 0) {
        alertList.push({
          id: `issues-${contract.id}`,
          type: 'warning',
          title: 'Contract Needs Review',
          description: `${contract.brand} contract has ${contract.issues} ${contract.issues === 1 ? 'issue' : 'issues'} that need attention`,
          action: 'Get Legal Review',
          time: 'Needs attention',
        });
      }
    });
    
    // Add info alert if no contracts
    if (contracts.length === 0) {
      alertList.push({
        id: 'no-contracts',
        type: 'info',
        title: 'Upload Your First Contract',
        description: 'Upload contracts to get AI-powered protection and risk analysis',
        action: 'Upload Now',
        time: 'Get started',
      });
    }
    
    return alertList;
  }, [contracts]);

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

  type RiskLevel = 'low' | 'medium' | 'high';
  type ContractStatus = 'active' | 'pending_review' | 'needs_attention';
  type AlertType = 'urgent' | 'warning' | 'info';

  const riskConfig: Record<RiskLevel, { color: string; label: string; textColor: string; bgColor: string }> = {
    low: { color: 'bg-green-500', label: 'Low Risk', textColor: 'text-green-400', bgColor: 'bg-green-500/20' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    high: { color: 'bg-red-500', label: 'High Risk', textColor: 'text-red-400', bgColor: 'bg-red-500/20' }
  };

  const statusConfig: Record<ContractStatus, { icon: typeof CheckCircle; label: string; color: string }> = {
    active: { icon: CheckCircle, label: 'Active', color: 'text-green-400' },
    pending_review: { icon: Clock, label: 'Pending Review', color: 'text-yellow-400' },
    needs_attention: { icon: AlertCircle, label: 'Needs Attention', color: 'text-red-400' }
  };

  const alertConfig: Record<AlertType, { icon: typeof AlertTriangle; bgColor: string; iconColor: string; borderColor: string }> = {
    urgent: { icon: AlertTriangle, bgColor: 'bg-red-500/20', iconColor: 'text-red-400', borderColor: 'border-red-500/30' },
    warning: { icon: AlertCircle, bgColor: 'bg-yellow-500/20', iconColor: 'text-yellow-400', borderColor: 'border-yellow-500/30' },
    info: { icon: Zap, bgColor: 'bg-blue-500/20', iconColor: 'text-blue-400', borderColor: 'border-blue-500/30' }
  };

  return (
    <ContextualTipsProvider currentView="protection">
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Protection</h1>
        <p className="text-purple-200">Safeguard your deals & rights</p>
      </div>

      {/* Protection Score Card */}
      <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-6 md:p-8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-6">
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

        <div className="text-[15px] text-purple-200 leading-relaxed">
          {contracts.length === 0 ? (
            <span>Upload your first contract to get a protection score and AI-powered analysis.</span>
          ) : protectionScore >= 80 ? (
            <span className="text-green-400 font-semibold">Great job!</span>
          ) : protectionScore >= 60 ? (
            <span>Your contracts are mostly protected. Review pending items to improve your score.</span>
          ) : (
            <span>Upload contracts and review issues to improve your protection score.</span>
          )}
          {contracts.length > 0 && contracts.filter(c => c.issues > 0 || c.status === 'pending_review').length > 0 && (
            <span> Review {contracts.filter(c => c.issues > 0 || c.status === 'pending_review').length} pending {contracts.filter(c => c.issues > 0 || c.status === 'pending_review').length === 1 ? 'item' : 'items'} to reach 100.</span>
          )}
        </div>
      </div>

      {/* iOS Segmented Control */}
      <div className="mb-6">
        <SegmentedControl
          options={[
            { id: 'contracts', label: 'Contracts', count: contracts.length },
            { id: 'alerts', label: 'Alerts', count: alerts.length },
            { id: 'features', label: 'Features' },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'contracts' | 'alerts' | 'features')}
          className="w-full"
        />
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-purple-200">Loading contracts...</div>
          ) : contracts.length === 0 ? (
            <NoContractsEmptyState
              onUpload={() => navigate('/contract-upload')}
            />
          ) : (
            contracts.map(contract => {
            const StatusIcon = statusConfig[contract.status as ContractStatus].icon;
            
            return (
              <div
                key={contract.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-all cursor-pointer"
              >
                {/* Contract Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${riskConfig[contract.risk as RiskLevel].bgColor}`}>
                      <FileText className={`w-6 h-6 ${riskConfig[contract.risk as RiskLevel].textColor}`} />
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
                  <div className={`flex items-center gap-1 text-xs ${statusConfig[contract.status as ContractStatus].color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span>{statusConfig[contract.status as ContractStatus].label}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium ${riskConfig[contract.risk as RiskLevel].bgColor} ${riskConfig[contract.risk as RiskLevel].textColor}`}>
                    {riskConfig[contract.risk as RiskLevel].label}
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
          }))}

          {/* Upload New Contract */}
          {contracts.length > 0 && (
            <button 
              onClick={() => navigate('/contract-upload')}
              className="w-full bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-6 md:p-8 border-2 border-dashed border-white/25 hover:bg-white/[0.12] hover:border-white/35 transition-all duration-200 active:scale-95 shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            >
              <Upload className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <div className="text-sm font-medium mb-1">Upload New Contract</div>
              <div className="text-xs text-purple-300">Get instant AI-powered review</div>
            </button>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-purple-200">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-8 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-purple-200">No alerts at the moment. Your contracts are in good shape.</p>
            </div>
          ) : (
            alerts.map(alert => {
            const alertType = alert.type as AlertType;
            const AlertIcon = alertConfig[alertType].icon;
            
            return (
              <div
                key={alert.id}
                className={`bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[24px] p-5 md:p-6 border ${alertConfig[alert.type as AlertType].borderColor} shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.12] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-200 cursor-pointer active:scale-95`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alertConfig[alert.type as AlertType].bgColor}`}>
                    <AlertIcon className={`w-5 h-5 ${alertConfig[alert.type as AlertType].iconColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <span className="text-xs text-purple-300 whitespace-nowrap ml-2">{alert.time}</span>
                    </div>
                    
                    <p className="text-sm text-purple-200 mb-3">{alert.description}</p>
                    
                    <button className={`text-sm font-medium ${alertConfig[alertType].iconColor} hover:underline`}>
                      {alert.action} →
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
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
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[24px] md:rounded-[28px] p-6 md:p-8 border border-purple-400/40 shadow-[0_8px_32px_rgba(168,85,247,0.4)]">
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
            
            <button className="w-full bg-white text-purple-700 font-semibold py-3.5 rounded-[20px] md:rounded-[24px] hover:bg-purple-50 transition-all duration-200 active:scale-95 shadow-[0_4px_16px_rgba(255,255,255,0.2)]">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}
    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorContentProtection;
