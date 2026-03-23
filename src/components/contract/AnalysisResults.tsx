/**
 * AnalysisResults - Display contract analysis results
 * Extracted from ContractUploadFlow.tsx
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  TrendingUp,
  FileText,
  Clock,
  DollarSign
} from 'lucide-react';
import type { ContractAnalysisResult } from '@/lib/contract/types';
import { getRiskScoreInfo, getProtectionStatus } from '@/lib/contract/formatters';

export interface AnalysisResultsProps {
  result: ContractAnalysisResult;
  onViewIssues?: () => void;
  onViewSummary?: () => void;
  onNegotiate?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onViewIssues,
  onViewSummary,
  onNegotiate,
}) => {
  const riskInfo = getRiskScoreInfo(result.riskScore);
  const protectionStatus = getProtectionStatus(result.riskScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Risk Score Card */}
      <div className={`p-6 rounded-2xl border ${riskInfo.bgColor} ${riskInfo.borderColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${riskInfo.textColor}`} />
            <div>
              <h3 className="text-xl font-bold text-white">Risk Assessment</h3>
              <p className={`text-sm ${riskInfo.textColor}`}>{riskInfo.label}</p>
            </div>
          </div>
          <div className={`text-4xl font-bold ${riskInfo.textColor}`}>
            {result.riskScore}/100
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${riskInfo.progressBarColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${result.riskScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Issues Found"
          value={result.issues?.length || 0}
          color="text-red-400"
          bgColor="bg-red-500/10"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Protected Clauses"
          value={result.protectedClauses || 0}
          color="text-green-400"
          bgColor="bg-green-500/10"
        />
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Total Clauses"
          value={result.totalClauses || 0}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Protection Score"
          value={`${100 - result.riskScore}%`}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
      </div>

      {/* Key Terms Summary */}
      {result.keyTerms && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Key Terms</h4>
          <div className="grid grid-cols-2 gap-4">
            {result.keyTerms.compensation && (
              <KeyTermItem
                icon={<DollarSign className="w-4 h-4" />}
                label="Compensation"
                value={result.keyTerms.compensation}
              />
            )}
            {result.keyTerms.duration && (
              <KeyTermItem
                icon={<Clock className="w-4 h-4" />}
                label="Duration"
                value={result.keyTerms.duration}
              />
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        {onViewIssues && (
          <motion.button
            onClick={onViewIssues}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 min-w-[200px] bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            View Issues ({result.issues?.length || 0})
          </motion.button>
        )}
        {onViewSummary && (
          <motion.button
            onClick={onViewSummary}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 min-w-[200px] bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View Summary
          </motion.button>
        )}
        {onNegotiate && result.issues?.length > 0 && (
          <motion.button
            onClick={onNegotiate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-5 h-5" />
            Request Changes
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Helper Components
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}> = ({ icon, label, value, color, bgColor }) => (
  <div className={`p-4 rounded-xl ${bgColor} border border-white/10`}>
    <div className={`flex items-center gap-2 ${color} mb-2`}>
      {icon}
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const KeyTermItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
    <div className="text-purple-400">{icon}</div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  </div>
);

export default AnalysisResults;
