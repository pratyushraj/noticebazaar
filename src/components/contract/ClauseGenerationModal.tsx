import React from 'react';
import { X, AlertTriangle, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractIssue } from '@/lib/types/contract-analysis';

interface ClauseGenerationModalProps {
  issue: ContractIssue | null;
  generatedClause: string | null;
  onClose: () => void;
}

export const ClauseGenerationModal: React.FC<ClauseGenerationModalProps> = ({
  issue,
  generatedClause,
  onClose,
}) => {
  if (!issue || !generatedClause) return null;

  const handleCopy = async () => {
    try {
      const isSecureContext =
        typeof window !== 'undefined' &&
        (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');

      if (navigator.clipboard && isSecureContext) {
        await navigator.clipboard.writeText(generatedClause);
        toast.success('Clause copied to clipboard!');
      } else {
        toast.info('Please copy the clause manually');
      }
    } catch (error: any) {
      console.warn('[ClauseGenerationModal] Copy failed:', error);
      toast.info('Unable to copy automatically. Please copy the clause manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-secondary/50 backdrop-blur-md rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Auto-Generated Safe Clause</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Original Risky Clause */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h4 className="font-semibold text-destructive">Original Risky Clause</h4>
            </div>
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <p className="text-sm text-secondary">{issue.clause || issue.description}</p>
            </div>
          </div>

          {/* Safer Replacement */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold text-green-400">Safer Replacement Clause</h4>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-sm text-secondary whitespace-pre-line">{generatedClause}</p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-secondary hover:bg-secondary text-foreground px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Copy Safe Clause
          </button>
        </div>
      </div>
    </div>
  );
};
