"use client";

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, FileText, Upload, 
  Download, Eye, XCircle, Clock, AlertCircle, Zap, Scale, Lock,
  MessageCircle, RefreshCw, ExternalLink
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { useContractIssues, useResolveContractIssue } from '@/lib/hooks/useContractIssues';
import { useCreateLawyerRequest } from '@/lib/hooks/useLawyerRequests';
import { motion } from 'framer-motion';
import { cn, openContractFile } from '@/lib/utils';
import { toast } from 'sonner';

type RiskLevel = 'low' | 'medium' | 'high';
type ClauseStatus = 'good' | 'risky' | 'missing' | 'needs_clarification';
type ContractStatus = 'pending_review' | 'issues_found' | 'safe';

interface Clause {
  name: string;
  status: ClauseStatus;
  description?: string;
  risk?: string;
}

interface Issue {
  id: string;
  type: 'exclusivity' | 'payment' | 'termination' | 'ip_rights' | 'timeline' | 'deliverables';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string[];
  recommendation: string;
}

const ContractProtectionDetails = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { profile } = useSession();

  // Fetch brand deals to find the contract
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  // Find the contract/deal
  const contract = useMemo(() => {
    if (!contractId) return null;
    const deal = brandDeals.find(d => d.id === contractId);
    if (!deal) return null;

    // Calculate contract data similar to CreatorContentProtection
    const expiryDate = deal.due_date ? new Date(deal.due_date) : null;
    const paymentDue = deal.payment_expected_date ? new Date(deal.payment_expected_date) : null;
    
    let risk: RiskLevel = 'low';
    let status: ContractStatus = 'safe';
    let issues = 0;

    if (paymentDue) {
      const daysUntilPayment = Math.ceil((paymentDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilPayment < 0) {
        risk = 'high';
        status = 'issues_found';
        issues++;
      } else if (daysUntilPayment <= 7) {
        risk = 'medium';
        status = 'pending_review';
      }
    }

    if (expiryDate) {
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        risk = risk === 'high' ? 'high' : 'medium';
        if (status === 'safe') status = 'pending_review';
        issues++;
      } else if (daysUntilExpiry <= 30) {
        risk = risk === 'high' ? 'high' : 'medium';
        if (status === 'safe') status = 'pending_review';
      }
    }

    // Mock clauses data - in real app, this would come from AI analysis
    const clauses: Clause[] = [
      { name: 'Payment Terms', status: deal.payment_expected_date ? 'good' : 'missing', description: deal.payment_expected_date ? 'Payment schedule defined' : 'No payment schedule' },
      { name: 'IP Rights', status: 'risky', description: 'Unclear IP ownership terms' },
      { name: 'Content Rights / Licensing', status: 'needs_clarification', description: 'Usage rights need clarification' },
      { name: 'Termination', status: 'missing', description: 'No termination clause found' },
      { name: 'Confidentiality', status: 'good', description: 'Standard NDA terms present' },
      { name: 'Dispute Resolution', status: 'needs_clarification', description: 'Arbitration terms unclear' },
      { name: 'Exclusivity', status: 'risky', description: '6-month exclusivity may be restrictive' },
      { name: 'Timeline & Deliverables', status: deal.due_date ? 'good' : 'missing', description: deal.due_date ? 'Timeline defined' : 'No clear timeline' },
    ];

    // Mock issues - in real app, this would come from AI analysis
    const issuesList: Issue[] = [];
    
    if (clauses.find(c => c.name === 'Exclusivity' && c.status === 'risky')) {
      issuesList.push({
        id: 'exclusivity-1',
        type: 'exclusivity',
        severity: 'high',
        title: 'Exclusivity Issue',
        description: 'The brand has asked for 6-month exclusivity',
        impact: [
          'Monetization conflict possible',
          'Influencer can\'t work with competitor brands',
        ],
        recommendation: 'Negotiate 1-month window or remove exclusivity clause',
      });
    }

    if (clauses.find(c => c.name === 'Payment Terms' && c.status === 'missing')) {
      issuesList.push({
        id: 'payment-1',
        type: 'payment',
        severity: 'high',
        title: 'Missing Payment Clause',
        description: 'No clear payment schedule defined',
        impact: [
          'Missing "late fee" or "penalty" terms',
          'No payment timeline specified',
        ],
        recommendation: 'Add 50% upfront + 50% on delivery with 7-day payment terms',
      });
    }

    if (clauses.find(c => c.name === 'Termination' && c.status === 'missing')) {
      issuesList.push({
        id: 'termination-1',
        type: 'termination',
        severity: 'medium',
        title: 'Missing Termination Clause',
        description: 'No termination terms found in contract',
        impact: [
          'No exit strategy defined',
          'Risk of being locked into unfavorable terms',
        ],
        recommendation: 'Add termination clause with 7-day notice period',
      });
    }

    // Calculate protection score
    const totalClauses = clauses.length;
    const goodClauses = clauses.filter(c => c.status === 'good').length;
    const riskyClauses = clauses.filter(c => c.status === 'risky').length;
    const missingClauses = clauses.filter(c => c.status === 'missing').length;
    
    const protectionScore = Math.round(
      (goodClauses / totalClauses) * 60 + 
      ((totalClauses - riskyClauses - missingClauses) / totalClauses) * 40
    );

    return {
      id: deal.id,
      title: deal.brand_name || 'Contract',
      brand: deal.brand_name,
      risk,
      status,
      issues,
      clauses,
      issuesList,
      protectionScore,
      uploadedDate: deal.created_at ? new Date(deal.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown',
      contractFileUrl: deal.contract_file_url,
      contractType: 'Partnership', // Mock - would come from analysis
    };
  }, [contractId, brandDeals]);

  const [activeTab, setActiveTab] = useState<'issues' | 'clauses' | 'alerts' | 'recommendations'>('issues');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showLawyerRequestDialog, setShowLawyerRequestDialog] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Hooks for issue resolution and lawyer requests
  const resolveIssueMutation = useResolveContractIssue();
  const createLawyerRequestMutation = useCreateLawyerRequest();

  // Fetch existing issues for this contract
  const { data: existingIssues = [] } = useContractIssues({
    dealId: contractId,
    creatorId: profile?.id,
    enabled: !!contractId && !!profile?.id,
  });

  // Generate recommendations from issues - MUST be before early return
  const recommendations = useMemo(() => {
    if (!contract) return [];
    return contract.issuesList.map(issue => issue.recommendation);
  }, [contract?.issuesList]);

  // Config objects - can be before early return as they're not hooks
  const riskConfig: Record<RiskLevel, { color: string; label: string; bgColor: string; textColor: string }> = {
    low: { color: 'bg-green-500', label: 'Low Risk', bgColor: 'bg-green-500/20', textColor: 'text-green-400' },
    medium: { color: 'bg-yellow-500', label: 'Medium Risk', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400' },
    high: { color: 'bg-red-500', label: 'High Risk', bgColor: 'bg-red-500/20', textColor: 'text-red-400' },
  };

  const statusConfig: Record<ContractStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
    pending_review: { label: 'Pending Review', icon: Clock, color: 'text-yellow-400' },
    issues_found: { label: 'Issues Found', icon: AlertTriangle, color: 'text-red-400' },
    safe: { label: 'Safe', icon: CheckCircle, color: 'text-green-400' },
  };

  const clauseStatusConfig: Record<ClauseStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
    good: { label: 'Good', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
    risky: { label: 'Risky', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: AlertTriangle },
    missing: { label: 'Missing', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: XCircle },
    needs_clarification: { label: 'Needs Clarification', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: AlertCircle },
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Contract Not Found</h2>
          <p className="text-purple-200 mb-4">The contract you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/creator-protection')}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl transition-colors"
          >
            Back to Protection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-4 px-4 md:px-6 py-4">
          <button
            onClick={() => navigate('/creator-protection')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Contract Protection Details</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* 1. Contract Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.08] backdrop-blur-[40px] rounded-[24px] p-6 border border-white/15 shadow-lg"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">{contract.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${riskConfig[contract.risk].bgColor} ${riskConfig[contract.risk].textColor}`}>
                  {riskConfig[contract.risk].label}
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white flex items-center gap-2`}>
                  {(() => {
                    const StatusIcon = statusConfig[contract.status].icon;
                    return <StatusIcon className="w-4 h-4" />;
                  })()}
                  {statusConfig[contract.status].label}
                </div>
                <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300">
                  {contract.contractType}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <Clock className="w-4 h-4" />
            <span>Uploaded: {contract.uploadedDate}</span>
          </div>
        </motion.div>

        {/* 2. Protection Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.08] backdrop-blur-[40px] rounded-[24px] p-6 border border-white/15 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold">Protection Score</h3>
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div className="text-5xl font-bold text-green-400">{contract.protectionScore}</div>
            <div className="text-lg text-purple-200 mb-2">out of 100</div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${contract.protectionScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={cn(
                "h-3 rounded-full",
                contract.protectionScore >= 80 ? "bg-gradient-to-r from-green-500 to-green-400" :
                contract.protectionScore >= 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                "bg-gradient-to-r from-red-500 to-red-400"
              )}
            />
          </div>
          <p className="text-sm text-purple-200 mb-4">
            {contract.protectionScore >= 80 
              ? "Excellent! Your contract is well-protected."
              : contract.protectionScore >= 60
              ? "Your contract has some areas that need attention."
              : "Your contract has significant protection gaps that should be addressed."}
          </p>

          {/* Why is this score low? */}
          {contract.protectionScore < 80 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Why is this score low?
              </h4>
              <div className="space-y-2">
                {contract.clauses.filter(c => c.status === 'missing').map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-purple-200">
                    <span className="text-red-400">❗</span>
                    <span>Missing {clause.name.toLowerCase()}</span>
                  </div>
                ))}
                {contract.clauses.filter(c => c.status === 'risky').map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-purple-200">
                    <span className="text-yellow-400">⚠️</span>
                    <span>{clause.name} issue</span>
                  </div>
                ))}
                {contract.clauses.filter(c => c.status === 'needs_clarification').map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-purple-200">
                    <span className="text-blue-400">🕒</span>
                    <span>{clause.name} needs clarification</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* 3. Issue Categories Section - Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.08] backdrop-blur-[40px] rounded-[24px] border border-white/15 shadow-lg overflow-hidden"
        >
          <div className="flex border-b border-white/10">
            {[
              { id: 'issues' as const, label: 'Issues', count: contract.issuesList.length },
              { id: 'clauses' as const, label: 'Clauses', count: contract.clauses.length },
              { id: 'alerts' as const, label: 'Alerts', count: contract.issues },
              { id: 'recommendations' as const, label: 'Recommendations', count: recommendations.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 px-4 py-4 text-sm font-medium transition-all relative",
                  activeTab === tab.id
                    ? "text-white border-b-2 border-purple-400"
                    : "text-purple-300 hover:text-white"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-xs",
                    activeTab === tab.id
                      ? "bg-purple-500/30 text-white"
                      : "bg-white/10 text-purple-300"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 4. Issues List */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                {contract.issuesList.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-purple-200">No issues found! Your contract looks good.</p>
                  </div>
                ) : (
                  contract.issuesList.map((issue) => {
                    // Check if this issue is already resolved
                    const isResolved = existingIssues.some(
                      ei => ei.issue_type === issue.type && ei.status === 'resolved'
                    );

                    return (
                      <div
                        key={issue.id}
                        className={cn(
                          "bg-white/5 rounded-xl p-5 border border-white/10",
                          isResolved && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <AlertTriangle className={cn(
                            "w-5 h-5 flex-shrink-0 mt-0.5",
                            issue.severity === 'high' ? "text-red-400" :
                            issue.severity === 'medium' ? "text-yellow-400" :
                            "text-blue-400"
                          )} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-lg">{issue.title}</h4>
                              {isResolved && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-purple-200 mb-3">{issue.description}</p>
                            <div className="space-y-1 mb-3">
                              {issue.impact.map((impact, idx) => (
                                <div key={idx} className="text-xs text-purple-300 flex items-start gap-2">
                                  <span className="text-purple-400 mt-1">•</span>
                                  <span>{impact}</span>
                                </div>
                              ))}
                            </div>
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                              <p className="text-xs font-medium text-blue-300 mb-1">💡 Recommendation:</p>
                              <p className="text-sm text-blue-200">{issue.recommendation}</p>
                            </div>
                            {!isResolved && (
                              <button
                                onClick={() => {
                                  setSelectedIssueId(issue.id);
                                  setShowResolveDialog(true);
                                }}
                                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Mark as Resolved
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 5. Important Clauses */}
            {activeTab === 'clauses' && (
              <div className="space-y-3">
                {contract.clauses.map((clause, idx) => {
                  const StatusConfig = clauseStatusConfig[clause.status];
                  const StatusIcon = StatusConfig.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg ${StatusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className={`w-5 h-5 ${StatusConfig.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{clause.name}</h4>
                          <p className="text-sm text-purple-200">{clause.description || 'No description available'}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${StatusConfig.bgColor} ${StatusConfig.color}`}>
                        {StatusConfig.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alerts */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {contract.issues === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-purple-200">No alerts at the moment.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-300 mb-1">Contract Needs Attention</h4>
                        <p className="text-sm text-yellow-200">
                          This contract has {contract.issues} issue{contract.issues !== 1 ? 's' : ''} that require your review.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {activeTab === 'recommendations' && (
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-purple-200">No recommendations at this time.</p>
                  </div>
                ) : (
                  recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3"
                    >
                      <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-200 flex-1">{rec}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* 6. Uploaded Contract Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.08] backdrop-blur-[40px] rounded-[24px] p-6 border border-white/15 shadow-lg"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contract Files
          </h3>
          <div className="space-y-3">
            {contract.contractFileUrl ? (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="font-medium">Contract Document</p>
                    <p className="text-xs text-purple-300">Uploaded {contract.uploadedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await openContractFile(contract.contractFileUrl, (error) => {
                        toast.error('Failed to view contract', {
                          description: error,
                          duration: 6000,
                        });
                      });
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="View contract"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (contract.contractFileUrl) {
                        const link = document.createElement('a');
                        link.href = contract.contractFileUrl;
                        link.download = `${contract.title}-contract.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast.success('Downloading contract...');
                      }
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Download contract"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-purple-200">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contract file uploaded</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* 7. Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate('/contract-upload')}
            className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95"
          >
            <Upload className="w-5 h-5 text-purple-300" />
            <span className="font-medium">Re-upload Contract</span>
          </button>
          <button
            onClick={async () => {
              await openContractFile(contract.contractFileUrl, (error) => {
                toast.error('Failed to view contract', {
                  description: error,
                  duration: 6000,
                });
              });
            }}
            className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95"
          >
            <Eye className="w-5 h-5 text-purple-300" />
            <span className="font-medium">View Original File</span>
          </button>
          <button
            onClick={() => setShowLawyerRequestDialog(true)}
            disabled={createLawyerRequestMutation.isPending}
            className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scale className="w-5 h-5 text-purple-300" />
            <span className="font-medium">Request Lawyer Help</span>
          </button>
          <button
            onClick={() => {
              if (contract.issuesList.length > 0) {
                // Resolve all open issues for this contract
                const openIssues = contract.issuesList.filter(
                  issue => !existingIssues.some(ei => ei.issue_type === issue.type && ei.status === 'resolved')
                );
                
                if (openIssues.length === 0) {
                  toast.info('All issues are already resolved');
                  return;
                }

                setShowResolveDialog(true);
              } else {
                toast.info('No issues to resolve');
              }
            }}
            disabled={resolveIssueMutation.isPending}
            className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 rounded-xl p-4 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-medium">
              {resolveIssueMutation.isPending ? 'Resolving...' : 'Mark All Issues Resolved'}
            </span>
          </button>
        </motion.div>
      </div>

      {/* Resolve Issue Dialog */}
      {showResolveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-[24px] p-6 border border-white/15 shadow-2xl max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-2">Mark Issue as Resolved</h3>
            <p className="text-sm text-purple-200 mb-4">
              Are you sure you want to mark this issue as resolved? This will help track which protection issues have been addressed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResolveDialog(false);
                  setSelectedIssueId(null);
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedIssueId && contractId) {
                    try {
                      const issue = contract.issuesList.find(i => i.id === selectedIssueId);
                      if (issue) {
                        const existingIssue = existingIssues.find(
                          ei => ei.issue_type === issue.type && ei.deal_id === contractId
                        );

                        if (existingIssue) {
                          await resolveIssueMutation.mutateAsync({
                            issueId: existingIssue.id,
                            resolutionNotes: 'Resolved by user',
                          });
                        } else {
                          toast.success('Issue marked as resolved');
                        }
                      }
                    } catch (error) {
                      // Error already handled by mutation
                    }
                  } else {
                    toast.success('All issues marked as resolved');
                  }
                  setShowResolveDialog(false);
                  setSelectedIssueId(null);
                }}
                disabled={resolveIssueMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {resolveIssueMutation.isPending ? 'Resolving...' : 'Mark Resolved'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lawyer Request Dialog */}
      {showLawyerRequestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-[24px] p-6 border border-white/15 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-2">Request Lawyer Help</h3>
            <p className="text-sm text-purple-200 mb-4">
              Submit a request for legal assistance. Our team will review your contract and provide guidance.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const subject = formData.get('subject') as string;
                const description = formData.get('description') as string;
                const urgency = formData.get('urgency') as 'low' | 'medium' | 'high' | 'urgent';

                if (!subject || !description) {
                  toast.error('Please fill in all required fields');
                  return;
                }

                try {
                  await createLawyerRequestMutation.mutateAsync({
                    deal_id: contractId,
                    subject,
                    description,
                    urgency: urgency || 'medium',
                    category: 'contract_review',
                  });
                  setShowLawyerRequestDialog(false);
                } catch (error) {
                  // Error already handled by mutation
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-2">Subject *</label>
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder="e.g., Need help with exclusivity clause"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe your legal concern or question..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Urgency</label>
                <select
                  name="urgency"
                  defaultValue="medium"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLawyerRequestDialog(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLawyerRequestMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {createLawyerRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContractProtectionDetails;

