"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContractHighlighterProps {
  contractText: string;
  onAskAdvisor?: (clause: string) => void;
}

// Mock red-flag detection (in real app, use AI/ML)
const detectRedFlags = (text: string): Array<{ start: number; end: number; severity: 'high' | 'medium' | 'low'; reason: string }> => {
  const flags: Array<{ start: number; end: number; severity: 'high' | 'medium' | 'low'; reason: string }> = [];
  
  // High severity patterns
  const highPatterns = [
    { pattern: /exclusive.*forever|perpetual.*exclusive/gi, reason: 'Perpetual exclusivity clause' },
    { pattern: /no.*termination|cannot.*cancel/gi, reason: 'No termination clause' },
    { pattern: /work.*for.*hire|all.*rights.*assigned/gi, reason: 'Work-for-hire clause' },
  ];
  
  // Medium severity patterns
  const mediumPatterns = [
    { pattern: /payment.*60.*days|payment.*90.*days/gi, reason: 'Long payment terms' },
    { pattern: /no.*credit|no.*attribution/gi, reason: 'No credit clause' },
    { pattern: /unlimited.*revisions/gi, reason: 'Unlimited revisions' },
  ];
  
  // Low severity patterns
  const lowPatterns = [
    { pattern: /non.*compete/gi, reason: 'Non-compete clause' },
    { pattern: /confidentiality.*permanent/gi, reason: 'Permanent confidentiality' },
  ];
  
  [...highPatterns.map(p => ({ ...p, severity: 'high' as const })),
   ...mediumPatterns.map(p => ({ ...p, severity: 'medium' as const })),
   ...lowPatterns.map(p => ({ ...p, severity: 'low' as const }))].forEach(({ pattern, reason, severity }) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        flags.push({
          start: match.index,
          end: match.index + match[0].length,
          severity,
          reason,
        });
      }
    }
  });
  
  return flags;
};

export const ContractHighlighter: React.FC<ContractHighlighterProps> = ({ contractText, onAskAdvisor }) => {
  const [flags] = useState(() => detectRedFlags(contractText));
  const [selectedFlag, setSelectedFlag] = useState<typeof flags[0] | null>(null);

  const renderHighlightedText = () => {
    if (flags.length === 0) {
      return <p className="text-white/80">{contractText}</p>;
    }

    const parts: Array<{ text: string; isFlag: boolean; flag?: typeof flags[0] }> = [];
    let lastIndex = 0;

    flags
      .sort((a, b) => a.start - b.start)
      .forEach(flag => {
        if (flag.start > lastIndex) {
          parts.push({ text: contractText.slice(lastIndex, flag.start), isFlag: false });
        }
        parts.push({ text: contractText.slice(flag.start, flag.end), isFlag: true, flag });
        lastIndex = flag.end;
      });

    if (lastIndex < contractText.length) {
      parts.push({ text: contractText.slice(lastIndex), isFlag: false });
    }

    return (
      <div className="space-y-2">
        {parts.map((part, index) => (
          <span
            key={index}
            className={cn(
              part.isFlag && "underline decoration-2 cursor-pointer",
              part.isFlag && part.flag?.severity === 'high' && "decoration-red-500 bg-red-500/10",
              part.isFlag && part.flag?.severity === 'medium' && "decoration-yellow-500 bg-yellow-500/10",
              part.isFlag && part.flag?.severity === 'low' && "decoration-orange-500 bg-orange-500/10",
            )}
            onClick={() => part.isFlag && part.flag && setSelectedFlag(part.flag)}
          >
            {part.text}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/[0.06] backdrop-blur-[40px] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Contract Review</h3>
        </div>
        {flags.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">{flags.length} red flag{flags.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-xl p-4 mb-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        {renderHighlightedText()}
      </div>

      {selectedFlag && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-white mb-1">{selectedFlag.reason}</p>
              <p className="text-sm text-white/60">
                Severity: <span className={cn(
                  selectedFlag.severity === 'high' && "text-red-400",
                  selectedFlag.severity === 'medium' && "text-yellow-400",
                  selectedFlag.severity === 'low' && "text-orange-400"
                )}>{selectedFlag.severity.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => onAskAdvisor?.(selectedFlag.reason)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
            size="sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask Advisor About This
          </Button>
        </motion.div>
      )}

      {flags.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-white/80 font-medium">No red flags detected!</p>
          <p className="text-sm text-white/60 mt-1">Your contract looks clean.</p>
        </div>
      )}
    </div>
  );
};

export default ContractHighlighter;

