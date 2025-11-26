import { useState } from 'react';
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, TrendingUp, IndianRupee, Calendar, Clock, Shield, ChevronDown, ChevronUp, Info, Award, Download, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ClauseStatus = 'verified' | 'warning' | 'issue';

interface Clause {
  status: ClauseStatus;
  text: string;
  rating: number;
  pros: string[];
  cons: string[];
}

interface Contract {
  name: string;
  brand: string;
  uploaded: string;
  score: number;
  risk: 'low' | 'medium' | 'high';
  keyTerms: {
    value: number;
    duration: string;
    deliverables: string;
    paymentSchedule: string;
    exclusivityDays: number;
    ipRights: string;
    liability: string;
  };
  clauses: {
    payment: Clause;
    termination: Clause;
    ip: Clause;
    exclusivity: Clause;
    liability: Clause;
  };
}

interface ExpandedSections {
  overview: boolean;
  payment: boolean;
  termination: boolean;
  ip: boolean;
  exclusivity: boolean;
  liability: boolean;
}

const ContractComparison = () => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    overview: true,
    payment: false,
    termination: false,
    ip: false,
    exclusivity: false,
    liability: false
  });

  const contractA: Contract = {
    name: "TechGear Pro Sponsorship",
    brand: "TechGear",
    uploaded: "Nov 20, 2024",
    score: 85,
    risk: "low",
    keyTerms: {
      value: 150000,
      duration: "3 months",
      deliverables: "3 videos",
      paymentSchedule: "Milestone-based",
      exclusivityDays: 60,
      ipRights: "Creator retains",
      liability: "Capped at deal value"
    },
    clauses: {
      payment: {
        status: "verified",
        text: "Payment shall be made in three installments: 33% upon signing, 33% upon first video delivery, and 34% upon campaign completion.",
        rating: 5,
        pros: ["Clear milestones", "Balanced schedule", "Advance payment"],
        cons: []
      },
      termination: {
        status: "verified",
        text: "Either party may terminate with 30 days written notice. No penalty for termination.",
        rating: 5,
        pros: ["Fair notice period", "No penalties", "Equal rights"],
        cons: []
      },
      ip: {
        status: "verified",
        text: "Creator retains all intellectual property rights. Brand receives non-exclusive license for campaign duration.",
        rating: 5,
        pros: ["Creator keeps IP", "Limited license", "Clear duration"],
        cons: []
      },
      exclusivity: {
        status: "warning",
        text: "Creator agrees not to promote competing products for 60 days after each video publication.",
        rating: 3,
        pros: ["Time-limited"],
        cons: ["60 days is long", "Affects other deals"]
      },
      liability: {
        status: "verified",
        text: "Liability capped at total contract value. No liability for consequential damages.",
        rating: 4,
        pros: ["Reasonable cap", "Standard terms"],
        cons: ["Could be higher cap"]
      }
    }
  };

  const contractB: Contract = {
    name: "Fashion Nova Campaign",
    brand: "Fashion Nova",
    uploaded: "Nov 22, 2024",
    score: 65,
    risk: "medium",
    keyTerms: {
      value: 85000,
      duration: "2 months",
      deliverables: "4 posts",
      paymentSchedule: "Net 60",
      exclusivityDays: 90,
      ipRights: "Shared ownership",
      liability: "Unlimited"
    },
    clauses: {
      payment: {
        status: "warning",
        text: "Payment to be made within 60 days of invoice submission. No advance payment.",
        rating: 2,
        pros: ["Clear timeline"],
        cons: ["No advance", "60-day wait", "Cash flow issues"]
      },
      termination: {
        status: "issue",
        text: "Brand may terminate at any time. Creator must give 60 days notice and pay 30% penalty.",
        rating: 1,
        pros: [],
        cons: ["Unfair to creator", "Penalty clause", "One-sided"]
      },
      ip: {
        status: "issue",
        text: "All content becomes joint property. Brand may use indefinitely without additional payment.",
        rating: 1,
        pros: [],
        cons: ["Loss of IP rights", "Perpetual usage", "No residuals"]
      },
      exclusivity: {
        status: "issue",
        text: "Creator cannot work with any fashion, beauty, or lifestyle brands for 90 days.",
        rating: 1,
        pros: [],
        cons: ["Too broad", "90 days too long", "Blocks opportunities"]
      },
      liability: {
        status: "issue",
        text: "Creator liable for all claims without limit. Brand has full indemnification.",
        rating: 1,
        pros: [],
        cons: ["Unlimited liability", "One-sided risk", "Dangerous"]
      }
    }
  };

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status: ClauseStatus) => {
    if (status === 'verified') return { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle };
    if (status === 'warning') return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertTriangle };
    return { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle };
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
    ));
  };

  interface ComparisonRowProps {
    label: string;
    valueA: string;
    valueB: string;
    icon: typeof IndianRupee;
    highlight?: boolean;
  }

  const ComparisonRow = ({ label, valueA, valueB, icon: Icon, highlight = false }: ComparisonRowProps) => {
    const isDifferent = valueA !== valueB;
    
    return (
      <div className={`grid grid-cols-3 gap-2 p-3 rounded-lg ${highlight ? 'bg-purple-500/10' : 'bg-white/5'}`}>
        <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </div>
        <div className={`text-sm text-center font-medium ${isDifferent && highlight ? 'text-green-400' : 'text-white'}`}>
          {valueA}
        </div>
        <div className={`text-sm text-center font-medium ${isDifferent && highlight ? 'text-red-400' : 'text-white'}`}>
          {valueB}
        </div>
      </div>
    );
  };

  interface ClauseComparisonProps {
    title: string;
    section: keyof ExpandedSections;
    clauseA: Clause;
    clauseB: Clause;
  }

  const ClauseComparison = ({ title, section, clauseA, clauseB }: ClauseComparisonProps) => {
    const isExpanded = expandedSections[section];
    const StatusIconA = getStatusColor(clauseA.status).icon;
    const StatusIconB = getStatusColor(clauseB.status).icon;

    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => toggleSection(section)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clauseA.status).bg} ${getStatusColor(clauseA.status).text}`}>
                A: {clauseA.status}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clauseB.status).bg} ${getStatusColor(clauseB.status).text}`}>
                B: {clauseB.status}
              </span>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {isExpanded && (
          <div className="p-4 pt-0 space-y-4">
            {/* Rating Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-xs text-purple-300 mb-1">Contract A Rating</div>
                <div className="flex items-center gap-1">
                  {getRatingStars(clauseA.rating)}
                  <span className="text-sm ml-2">{clauseA.rating}/5</span>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <div className="text-xs text-purple-300 mb-1">Contract B Rating</div>
                <div className="flex items-center gap-1">
                  {getRatingStars(clauseB.rating)}
                  <span className="text-sm ml-2">{clauseB.rating}/5</span>
                </div>
              </div>
            </div>

            {/* Side-by-side clause text */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <StatusIconA className={`w-4 h-4 ${getStatusColor(clauseA.status).text}`} />
                  <div className="text-xs font-semibold text-purple-300">Contract A</div>
                </div>
                <p className="text-sm text-purple-200 leading-relaxed mb-3">{clauseA.text}</p>
                
                {clauseA.pros.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-green-400 mb-1">✓ Pros</div>
                    <ul className="space-y-1">
                      {clauseA.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-green-400">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clauseA.cons.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-400 mb-1">✗ Cons</div>
                    <ul className="space-y-1">
                      {clauseA.cons.map((con, i) => (
                        <li key={i} className="text-xs text-red-400">• {con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <StatusIconB className={`w-4 h-4 ${getStatusColor(clauseB.status).text}`} />
                  <div className="text-xs font-semibold text-purple-300">Contract B</div>
                </div>
                <p className="text-sm text-purple-200 leading-relaxed mb-3">{clauseB.text}</p>
                
                {clauseB.pros.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-green-400 mb-1">✓ Pros</div>
                    <ul className="space-y-1">
                      {clauseB.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-green-400">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {clauseB.cons.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-400 mb-1">✗ Cons</div>
                    <ul className="space-y-1">
                      {clauseB.cons.map((con, i) => (
                        <li key={i} className="text-xs text-red-400">• {con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleDownloadReport = () => {
    // TODO: Implement PDF generation
    alert('Download report functionality coming soon!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Contract Comparison',
        text: `Comparing ${contractA.brand} vs ${contractB.brand} contracts`,
        url: window.location.href
      }).catch(() => {
        // User cancelled or error
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleChooseContract = () => {
    // TODO: Navigate to contract detail or accept contract
    navigate('/creator-contracts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/creator-dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Compare Contracts</div>
          
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-4 pb-24">
        {/* Winner Banner */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-5 border border-green-400/30 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-xl font-bold">Recommended Contract</h2>
              <p className="text-sm text-green-300">Contract A is significantly better</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span>20 points higher score</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Better protection</span>
            </div>
            <div className="flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-green-400" />
              <span>Fairer terms</span>
            </div>
          </div>
        </div>

        {/* Score Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-5 border border-green-400/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-green-300 mb-1">Contract A</div>
                <div className="font-semibold">{contractA.brand}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-1">{contractA.score}</div>
            <div className="text-xs text-green-300">Low Risk</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-5 border border-yellow-400/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-yellow-300 mb-1">Contract B</div>
                <div className="font-semibold">{contractB.brand}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-1">{contractB.score}</div>
            <div className="text-xs text-yellow-300">Medium Risk</div>
          </div>
        </div>

        {/* Quick Comparison Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 mb-6">
          <h3 className="font-semibold text-lg mb-4">Key Terms Comparison</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 p-2 text-sm font-medium text-purple-300">
              <div>Term</div>
              <div className="text-center">Contract A</div>
              <div className="text-center">Contract B</div>
            </div>
            
            <ComparisonRow 
              label="Deal Value" 
              valueA={`₹${(contractA.keyTerms.value / 1000).toFixed(0)}K`}
              valueB={`₹${(contractB.keyTerms.value / 1000).toFixed(0)}K`}
              icon={IndianRupee}
              highlight={true}
            />
            
            <ComparisonRow 
              label="Duration" 
              valueA={contractA.keyTerms.duration}
              valueB={contractB.keyTerms.duration}
              icon={Calendar}
            />
            
            <ComparisonRow 
              label="Deliverables" 
              valueA={contractA.keyTerms.deliverables}
              valueB={contractB.keyTerms.deliverables}
              icon={FileText}
            />
            
            <ComparisonRow 
              label="Payment" 
              valueA={contractA.keyTerms.paymentSchedule}
              valueB={contractB.keyTerms.paymentSchedule}
              icon={Clock}
              highlight={true}
            />
            
            <ComparisonRow 
              label="Exclusivity" 
              valueA={`${contractA.keyTerms.exclusivityDays} days`}
              valueB={`${contractB.keyTerms.exclusivityDays} days`}
              icon={Shield}
              highlight={true}
            />
            
            <ComparisonRow 
              label="IP Rights" 
              valueA={contractA.keyTerms.ipRights}
              valueB={contractB.keyTerms.ipRights}
              icon={Shield}
              highlight={true}
            />
          </div>
        </div>

        {/* Detailed Clause Comparison */}
        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-lg">Detailed Clause Analysis</h3>
          
          <ClauseComparison 
            title="Payment Terms"
            section="payment"
            clauseA={contractA.clauses.payment}
            clauseB={contractB.clauses.payment}
          />
          
          <ClauseComparison 
            title="Termination Rights"
            section="termination"
            clauseA={contractA.clauses.termination}
            clauseB={contractB.clauses.termination}
          />
          
          <ClauseComparison 
            title="IP Ownership"
            section="ip"
            clauseA={contractA.clauses.ip}
            clauseB={contractB.clauses.ip}
          />
          
          <ClauseComparison 
            title="Exclusivity"
            section="exclusivity"
            clauseA={contractA.clauses.exclusivity}
            clauseB={contractB.clauses.exclusivity}
          />
          
          <ClauseComparison 
            title="Liability"
            section="liability"
            clauseA={contractA.clauses.liability}
            clauseB={contractB.clauses.liability}
          />
        </div>

        {/* AI Recommendation */}
        <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 border border-purple-400/30 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Info className="w-6 h-6 text-purple-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">AI Recommendation</h3>
              <p className="text-sm text-purple-200 leading-relaxed mb-3">
                <strong className="text-white">Choose Contract A (TechGear).</strong> It offers better payment terms, fairer termination rights, and you retain IP ownership. While the exclusivity period is slightly long, it's negotiable and not a deal-breaker.
              </p>
              <p className="text-sm text-purple-200 leading-relaxed">
                <strong className="text-red-400">Avoid Contract B (Fashion Nova)</strong> without significant revisions. The unlimited liability, loss of IP rights, and one-sided termination clause create substantial risk.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <div className="text-sm font-medium mb-2">Suggested Actions:</div>
            <ol className="space-y-2 text-sm text-purple-200">
              <li className="flex gap-2">
                <span className="text-purple-400">1.</span>
                <span>Proceed with Contract A after negotiating exclusivity to 30 days</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">2.</span>
                <span>Request Contract B revisions on IP rights, liability, and termination</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">3.</span>
                <span>Consult with legal advisor before signing either contract</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleDownloadReport}
            className="bg-white/10 hover:bg-white/15 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
          <button 
            onClick={handleChooseContract}
            className="bg-green-600 hover:bg-green-700 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Choose Contract A
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractComparison;

