/**
 * ContractIssues - Display contract issues list
 * Extracted from ContractUploadFlow.tsx
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  Info,
  XCircle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import type { ContractIssue } from '@/lib/contract/types';

export interface ContractIssuesProps {
  issues: ContractIssue[];
  selectedIssues?: string[];
  onIssueSelect?: (issueId: string) => void;
  onIssueView?: (issue: ContractIssue) => void;
  showSelection?: boolean;
}

export const ContractIssues: React.FC<ContractIssuesProps> = ({
  issues,
  selectedIssues = [],
  onIssueSelect,
  onIssueView,
  showSelection = false,
}) => {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'High Risk',
        };
      case 'medium':
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'Medium Risk',
        };
      case 'low':
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          label: 'Low Risk',
        };
    }
  };

  const toggleExpand = (issueId: string) => {
    setExpandedIssue(prev => prev === issueId ? null : issueId);
  };

  if (!issues.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-green-500/10 border border-green-500/30 text-center"
      >
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Issues Found!</h3>
        <p className="text-gray-400">Your contract looks good. No major concerns detected.</p>
      </motion.div>
    );
  }

  // Group issues by severity
  const groupedIssues = issues.reduce((acc, issue) => {
    const severity = issue.severity || 'low';
    if (!acc[severity]) acc[severity] = [];
    acc[severity].push(issue);
    return acc;
  }, {} as Record<string, ContractIssue[]>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">
          Issues Found ({issues.length})
        </h3>
      </div>

      {Object.entries(groupedIssues).map(([severity, severityIssues]) => (
        <div key={severity} className="space-y-3">
          {severityIssues.map((issue, index) => {
            const config = getSeverityConfig(severity);
            const isExpanded = expandedIssue === issue.id;
            const isSelected = selectedIssues.includes(issue.id);

            return (
              <motion.div
                key={issue.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(issue.id || `issue-${index}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {showSelection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onIssueSelect?.(issue.id || `issue-${index}`);
                          }}
                          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-500 hover:border-purple-400'
                          }`}
                        >
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                      )}
                      <div className={`mt-0.5 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">
                          {issue.title}
                        </h4>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {issue.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-4">
                        {/* Full Description */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-400 mb-2">
                            Details
                          </h5>
                          <p className="text-white">{issue.description}</p>
                        </div>

                        {/* Location */}
                        {issue.location && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2">
                              Location in Contract
                            </h5>
                            <p className="text-gray-300 font-mono text-sm bg-black/20 p-2 rounded">
                              {issue.location}
                            </p>
                          </div>
                        )}

                        {/* Recommendation */}
                        {issue.recommendation && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-yellow-400" />
                              Recommendation
                            </h5>
                            <p className="text-green-300">{issue.recommendation}</p>
                          </div>
                        )}

                        {/* Action Button */}
                        {onIssueView && (
                          <button
                            onClick={() => onIssueView(issue)}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                          >
                            View in contract →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
};

export default ContractIssues;
