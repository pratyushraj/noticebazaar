"use client";

import { useState, useMemo } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Lock, Upload, AlertCircle, Calendar, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { useSession } from '@/contexts/SessionContext';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { NoContractsEmptyState } from '@/components/empty-states/PreconfiguredEmptyStates';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { animations, spacing, typography, iconSizes, scroll, gradients, buttons, glass, shadows, radius, vision, motion as motionTokens, colors, zIndex } from '@/lib/design-system';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { BaseCard } from '@/components/ui/card-variants';

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
      .filter(deal => deal.contract_file_url)
      .map(deal => {
        const uploadedDate = deal.created_at ? new Date(deal.created_at) : new Date();
        const expiryDate = deal.due_date ? new Date(deal.due_date) : null;
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
        
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
        
        const clauses = {
          payment: deal.status === 'Completed' ? 'verified' : (risk === 'high' ? 'issue' : 'verified'),
          termination: 'verified',
          ip_rights: 'verified',
          exclusivity: 'warning'
        };
        
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

  const protectionScore = useMemo(() => {
    if (contracts.length === 0) return 0;
    
    const totalContracts = contracts.length;
    const reviewedContracts = contracts.filter(c => c.reviewed).length;
    const lowRiskContracts = contracts.filter(c => c.risk === 'low').length;
    const contractsWithNoIssues = contracts.filter(c => c.issues === 0).length;
    
    const reviewedScore = (reviewedContracts / totalContracts) * 40;
    const riskScore = (lowRiskContracts / totalContracts) * 30;
    const issuesScore = (contractsWithNoIssues / totalContracts) * 30;
    
    return Math.round(reviewedScore + riskScore + issuesScore);
  }, [contracts]);

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

  const tabVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 }
  };

  // Haptic feedback helper

  return (
    <ContextualTipsProvider currentView="protection">
      <div className={`h-[100dvh] ${gradients.page} text-white overflow-hidden flex flex-col relative`}>
        {/* Vignette overlay */}
        {/* replaced-by-ultra-polish - Using vision overlay instead of hardcoded gradient */}
        <div className={cn("absolute inset-0 pointer-events-none", vision.glare.soft, "opacity-50")} />
        {/* Scrollable content */}
        <div className={`flex-1 ${scroll.container} min-h-0 relative z-10`}>
          <div className={`${spacing.page} pb-24`}>
            {/* Header - Improved spacing */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-6 pb-4"
            >
              <h1 className={typography.h1 + " mb-2"}>Protection</h1>
              <p className={typography.bodySmall}>Safeguard your deals & rights</p>
            </motion.div>

            {/* Protection Score Card - iOS Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <BaseCard variant="secondary" className={cn(spacing.cardPadding.secondary, "mb-4 relative overflow-hidden")}>
                {/* Vision Pro depth elevation */}
                <div className={vision.depth.elevation} />
                
                {/* Spotlight gradient */}
                <div className={cn(vision.spotlight.base, "opacity-30")} />
                
                {/* Glare effect */}
                <div className={vision.glare.soft} />
                
                <div className={cn("relative z-10 flex items-center justify-between", spacing.compact)}>
                  <div className={cn("flex items-center gap-2.5")}>
                    <Shield className={cn(iconSizes.md, "text-green-400")} />
                    <span className={cn(typography.bodySmall, "font-semibold")}>Protection Score</span>
                  </div>
                  <motion.button 
                    className={cn(buttons.tertiary, typography.bodySmall)}
                    whileTap={animations.microTap}
                  >
                    How it works?
                  </motion.button>
                </div>

                <div className={cn("relative z-10 flex items-baseline gap-3", spacing.compact)}>
                  <div className={cn(typography.amount, "text-green-400 leading-none")}>{protectionScore}</div>
                  <div className={cn(typography.bodySmall, "text-white/70 pb-1")}>out of 100</div>
                </div>

                <div className={cn("relative z-10 w-full", colors.bg.secondary, radius.full, "h-2 mb-4")}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${protectionScore}%` }}
                    transition={motionTokens.spring.gentle}
                    className={cn(
                      "bg-gradient-to-r from-green-500 to-green-400 h-2",
                      radius.full
                    )}
                  />
                </div>

                <p className={cn("relative z-10", typography.bodySmall, "leading-relaxed", spacing.compact)}>
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
              </p>

              {/* Why is your score low? - Compact */}
              {protectionScore < 80 && contracts.length > 0 && (
                <div className="relative z-10 mt-4 pt-4 border-t border-white/10">
                  <h3 className={cn(typography.caption, "font-semibold mb-3 flex items-center gap-2")}>
                    <AlertCircle className={cn(iconSizes.sm, "text-yellow-400")} />
                    Why is your score low?
                  </h3>
                  <div className={spacing.compact}>
                    {contracts.filter(c => c.issues > 0).length > 0 && (
                      <div className={`flex items-start gap-2 ${typography.caption}`}>
                        <span className="text-red-400 mt-0.5">❗</span>
                        <span>{contracts.filter(c => c.issues > 0).length} contract{contracts.filter(c => c.issues > 0).length === 1 ? ' has' : 's have'} unresolved issues</span>
                      </div>
                    )}
                    {contracts.filter(c => !c.reviewed).length > 0 && (
                      <div className={`flex items-start gap-2 ${typography.caption}`}>
                        <span className="text-yellow-400 mt-0.5">⚠️</span>
                        <span>{contracts.filter(c => !c.reviewed).length} contract{contracts.filter(c => !c.reviewed).length === 1 ? ' needs' : 's need'} review</span>
                      </div>
                    )}
                    {contracts.filter(c => c.risk === 'high').length > 0 && (
                      <div className={`flex items-start gap-2 ${typography.caption}`}>
                        <span className="text-red-400 mt-0.5">⚠️</span>
                        <span>{contracts.filter(c => c.risk === 'high').length} contract{contracts.filter(c => c.risk === 'high').length === 1 ? ' has' : 's have'} high risk terms</span>
        </div>
      )}
                    {contracts.filter(c => c.clauses.exclusivity === 'warning' || c.clauses.exclusivity === 'issue').length > 0 && (
                      <div className={`flex items-start gap-2 ${typography.caption}`}>
                        <span className="text-yellow-400 mt-0.5">⚠️</span>
                        <span>Contract{contracts.filter(c => c.clauses.exclusivity === 'warning' || c.clauses.exclusivity === 'issue').length === 1 ? ' has' : 's have'} exclusivity risk</span>
        </div>
      )}
                  </div>
        </div>
      )}
              </BaseCard>
            </motion.div>

            {/* Sticky Tabs */}
            <motion.div 
              initial={motionTokens.fade.in.initial}
              animate={motionTokens.fade.in.animate}
              transition={motionTokens.fade.in.transition}
              className={cn(
                "sticky top-0",
                zIndex.sticky,
                glass.appleStrong,
                "pb-2 -mx-4 px-4 md:-mx-6 md:px-6 pt-2 mb-4"
              )}
            >
              {/* Spotlight */}
              <div className={cn(vision.spotlight.base, "opacity-20")} />
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
            </motion.div>

            {/* Tab Content with smooth transitions */}
            <AnimatePresence mode="wait">
              {/* Contracts Tab */}
              {activeTab === 'contracts' && (
                <motion.div
                  key="contracts"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {isLoading ? (
                    <div className="text-center py-12 text-white/60">Loading contracts...</div>
                  ) : contracts.length === 0 ? (
                    <div className="py-6">
                      <NoContractsEmptyState
                        onUpload={() => navigate('/contract-upload')}
                        variant="compact"
                      />
          </div>
        ) : (
                    <>
                      {contracts.map((contract, index) => {
                        const StatusIcon = statusConfig[contract.status as ContractStatus].icon;
                        
                        return (
                          <motion.div
                            key={contract.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <BaseCard 
                              variant="tertiary" 
                              className={`${animations.cardHover} ${animations.cardPress} cursor-pointer`}
                              onClick={() => {
                                triggerHaptic(HapticPatterns.light);
                                if (contract.dealId) {
                                  navigate(`/contract-protection/${contract.dealId}`);
                                } else {
                                  navigate('/contract-analyzer');
                                }
                              }}
                            >
                            {/* Contract Header */}
                            <div className="relative z-10 flex items-start justify-between mb-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${riskConfig[contract.risk as RiskLevel].bgColor}`}>
                                  <FileText className={`${iconSizes.md} ${riskConfig[contract.risk as RiskLevel].textColor}`} />
            </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h3 className={`${typography.h4} mb-1 leading-tight`}>{contract.title}</h3>
                                  <div className={`flex items-center gap-1.5 ${typography.caption}`}>
                                    <span>{contract.brand}</span>
                                    <span>•</span>
                                    <span>₹{(contract.value / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
                              
                              <ChevronRight className={`${iconSizes.md} text-white/40 flex-shrink-0 ml-2`} />
                            </div>

                            {/* Status and Risk Badges */}
                            <div className="relative z-10 flex items-center gap-2 mb-3 flex-wrap">
                              <div className={`flex items-center gap-1.5 ${typography.caption} ${statusConfig[contract.status as ContractStatus].color}`}>
                                <StatusIcon className={iconSizes.xs} />
                                <span>{statusConfig[contract.status as ContractStatus].label}</span>
                              </div>
                              <div className={`px-2 py-0.5 rounded-lg ${typography.caption} font-medium ${riskConfig[contract.risk as RiskLevel].bgColor} ${riskConfig[contract.risk as RiskLevel].textColor}`}>
                                {riskConfig[contract.risk as RiskLevel].label}
                              </div>
                              {contract.issues > 0 && (
                                <div className={`px-2 py-0.5 bg-red-500/20 text-red-400 rounded-lg ${typography.caption} font-medium`}>
                                  {contract.issues} {contract.issues === 1 ? 'Issue' : 'Issues'}
          </div>
        )}
                            </div>

                            {/* Key Clauses Check */}
                            <div className="relative z-10 grid grid-cols-2 gap-2 mb-3">
                              {Object.entries(contract.clauses).map(([key, status]) => (
                                <div key={key} className={`flex items-center gap-2 ${typography.caption}`}>
                                  {status === 'verified' ? (
                                    <CheckCircle className={`${iconSizes.xs} text-green-400 flex-shrink-0`} />
                                  ) : status === 'warning' ? (
                                    <AlertCircle className={`${iconSizes.xs} text-yellow-400 flex-shrink-0`} />
                                  ) : (
                                    <AlertTriangle className={`${iconSizes.xs} text-red-400 flex-shrink-0`} />
                                  )}
                                  <span className="text-white/70 capitalize">{key.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>

                            {/* Contract Info */}
                            <div className={`relative z-10 flex items-center justify-between pt-3 border-t border-white/10 ${typography.caption}`}>
                              <div className="flex items-center gap-1.5">
                                <Calendar className={iconSizes.xs} />
                                <span>Expires: {contract.expiry}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Upload className={iconSizes.xs} />
                                <span>Uploaded: {contract.uploaded}</span>
                              </div>
                            </div>
                            </BaseCard>
                          </motion.div>
                        );
                      })}

                      {/* Upload New Contract */}
                      <motion.button 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: contracts.length * 0.05 }}
                        onClick={() => {
                          triggerHaptic(HapticPatterns.medium);
                          navigate('/contract-upload');
                        }}
                      >
                        <BaseCard 
                          variant="tertiary" 
                          className="p-6 border-2 border-dashed border-white/15 cursor-pointer active:scale-[0.97] transition-all duration-150"
                          onClick={() => {
                            triggerHaptic(HapticPatterns.medium);
                            navigate('/contract-upload');
                          }}
                        >
                        <div className="relative z-10">
                          <Upload className={`${iconSizes.lg} text-white/60 mx-auto mb-2`} />
                          <div className={`${typography.bodySmall} font-medium mb-1`}>Upload New Contract</div>
                          <div className={typography.caption}>Get instant AI-powered review</div>
                        </div>
                        </BaseCard>
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {isLoading ? (
                    <div className="text-center py-12 text-white/60">Loading alerts...</div>
                  ) : alerts.length === 0 ? (
                    <BaseCard variant="secondary" className="p-8 text-center">
                      <div className="relative z-10">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className={`${typography.h3} mb-2`}>All Clear!</h3>
                        <p className="text-sm text-white/70">No alerts at the moment. Your contracts are in good shape.</p>
            </div>
                    </BaseCard>
                  ) : (
                    alerts.map((alert, index) => {
                      const alertType = alert.type as AlertType;
                      const AlertIcon = alertConfig[alertType].icon;

                  return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <BaseCard 
                            variant="tertiary" 
                            className={`${animations.cardHover} ${animations.cardPress} cursor-pointer`}
                            onClick={() => triggerHaptic(HapticPatterns.light)}
                          >
                          <div className="relative z-10 flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alertConfig[alert.type as AlertType].bgColor}`}>
                              <AlertIcon className={`${iconSizes.md} ${alertConfig[alert.type as AlertType].iconColor}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className={`${typography.h4} text-white/90`}>{alert.title}</h3>
                                <span className={`${typography.caption} whitespace-nowrap ml-2`}>{alert.time}</span>
                              </div>
                              
                              <p className={`${typography.bodySmall} mb-3 leading-relaxed`}>{alert.description}</p>
                              
                              <button className={`${typography.bodySmall} font-medium ${alertConfig[alertType].iconColor} hover:underline`}>
                                {alert.action} →
                              </button>
                            </div>
                          </div>
                          </BaseCard>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <motion.div
                  key="features"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="space-y-3"
                >
                  {protectionFeatures.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    
                    return (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <BaseCard 
                          variant="tertiary" 
                          className={`${animations.cardHover} ${animations.cardPress} cursor-pointer`}
                          onClick={() => triggerHaptic(HapticPatterns.light)}
                        >
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <FeatureIcon className={`${iconSizes.md} text-purple-400`} />
            </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`${typography.h4} text-white/90`}>{feature.title}</h3>
                              {feature.status === 'active' ? (
                                <span className={`px-2 py-0.5 bg-green-500/20 text-green-400 ${typography.caption} rounded-full font-medium`}>Active</span>
                              ) : (
                                <span className={`px-2 py-0.5 bg-yellow-500/20 text-yellow-400 ${typography.caption} rounded-full font-medium`}>Premium</span>
                              )}
            </div>
                            <p className={typography.caption}>{feature.description}</p>
            </div>
                          
                          <ChevronRight className={`${iconSizes.md} text-white/40 flex-shrink-0`} />
                        </div>
                        </BaseCard>
                      </motion.div>
                    );
                  })}

                  {/* Upgrade Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: protectionFeatures.length * 0.05 }}
                    className={cn(
                      "relative overflow-hidden",
                      glass.appleStrong,
                      radius.lg,
                      spacing.cardPadding.primary,
                      shadows.vision,
                      "border-purple-400/30"
                    )}
                  >
                    {/* Vision Pro depth elevation */}
                    <div className={vision.depth.elevation} />
                    
                    {/* Spotlight gradient */}
                    <div className={cn(vision.spotlight.base, "opacity-40")} />
                    
                    {/* Glare effect */}
                    <div className={vision.glare.soft} />
                    
                    <div className={cn("relative z-10 flex items-start gap-3", spacing.compact)}>
                      <Shield className={cn(iconSizes.lg, "text-white")} />
                      <div>
                        <h3 className={cn(typography.h4, "mb-1")}>Premium Protection</h3>
                        <p className={cn(typography.bodySmall, "text-white/70")}>Get advanced features and priority legal support</p>
                      </div>
                    </div>
                    
                    <ul className={cn("relative z-10", spacing.compact, "mb-4", typography.bodySmall)}>
                      <li className={cn("flex items-center gap-2", colors.text.secondary)}>
                        <CheckCircle className={cn(iconSizes.sm, "text-green-400 flex-shrink-0")} />
                        <span>24/7 Legal advisor access</span>
                      </li>
                      <li className={cn("flex items-center gap-2", colors.text.secondary)}>
                        <CheckCircle className={cn(iconSizes.sm, "text-green-400 flex-shrink-0")} />
                        <span>Payment guarantee protection</span>
                      </li>
                      <li className={cn("flex items-center gap-2", colors.text.secondary)}>
                        <CheckCircle className={cn(iconSizes.sm, "text-green-400 flex-shrink-0")} />
                        <span>Unlimited contract reviews</span>
                      </li>
                    </ul>
                    
                    <motion.button 
                      onClick={() => {
                        triggerHaptic(HapticPatterns.medium);
                        // Navigate to premium upgrade
                      }}
                      whileTap={animations.microTap}
                      whileHover={window.innerWidth > 768 ? animations.microHover : undefined}
                      className={cn(
                        "relative z-10 w-full",
                        colors.bg.secondary,
                        "hover:bg-white/15 text-white",
                        typography.bodySmall,
                        "font-semibold",
                        spacing.cardPadding.secondary,
                        radius.md,
                        "border border-white/20"
                      )}
                    >
                      Upgrade to Premium
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom gradient fade */}
          <div className="sticky bottom-0 h-20 bg-gradient-to-t from-purple-900 to-transparent pointer-events-none -mt-20" />
        </div>
    </div>
    </ContextualTipsProvider>
  );
};

export default CreatorContentProtection;
