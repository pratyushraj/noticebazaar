"use client";

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ContractIssue } from '@/types/contractAnalysis';
import { motion, AnimatePresence } from 'framer-motion';

interface IssuesListProps {
  issues: ContractIssue[];
}

export const IssuesList: React.FC<IssuesListProps> = ({ issues }) => {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return {
          bg: 'bg-[#FF5C8A]/20',
          border: 'border-[#FF5C8A]/30',
          text: 'text-[#FF5C8A]',
        };
      case 'Medium':
        return {
          bg: 'bg-[#FFAA2A]/20',
          border: 'border-[#FFAA2A]/30',
          text: 'text-[#FFAA2A]',
        };
      case 'Low':
        return {
          bg: 'bg-[#FFD95E]/20',
          border: 'border-[#FFD95E]/30',
          text: 'text-[#FFD95E]',
        };
      default:
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
        };
    }
  };

  // Auto-generate section numbers
  const generateSectionNumber = (index: number, category: string): string => {
    const categoryMap: Record<string, number> = {
      'Payment Terms': 3,
      'Deliverables': 2,
      'IP Rights': 5,
      'Tax': 3,
      'Exclusivity': 4,
      'Termination': 6,
      'Usage Rights': 4,
      'Liability': 8,
      'Confidentiality': 7,
      'Legal Terms': 9,
      'Miscellaneous': 10,
    };
    
    const baseSection = categoryMap[category] || 3;
    const subsection = (index % 3) + 1;
    return `Section ${baseSection}.${subsection}`;
  };

  if (issues.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)] text-center py-8"
      >
        <div className="text-4xl mb-2">🎉</div>
        <div className="text-white font-medium">No major issues found</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
    >
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        Issues Found ({issues.length})
      </h3>
      <div className="space-y-3">
        {issues.map((issue, index) => {
          const impactColors = getImpactColor(issue.impact);
          const sectionNumber = issue.section || generateSectionNumber(index, issue.category);
          const isExpanded = expandedIssues.has(issue.id);

          return (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 + index * 0.05 }}
              className={`p-4 rounded-xl border ${impactColors.bg} ${impactColors.border}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 ${impactColors.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold text-white">{issue.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${impactColors.bg} ${impactColors.text} ${impactColors.border}`}>
                      {issue.category}
                    </span>
                    <span className="text-xs text-white/50">{sectionNumber}</span>
                  </div>
                  <p className="text-sm text-white/80 mb-3 line-clamp-3">{issue.description}</p>
                  
                  <button
                    onClick={() => toggleExpanded(issue.id)}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80 transition-colors mb-2"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Hide Recommendation
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show Recommendation
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="text-xs text-white/60 mb-1">💡 Recommendation</div>
                        <div className="text-sm text-white/90">{issue.recommendation}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

