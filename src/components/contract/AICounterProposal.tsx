"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, AlertCircle, TrendingUp, Edit, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';

interface CounterProposalResponse {
  tone: string;
  risk_level: 'low' | 'medium' | 'high';
  approval_probability: string;
  message: string;
  key_changes: string[];
}

interface AICounterProposalProps {
  dealId?: string;
  dealValue?: number | string;
  issues: Array<{
    title: string;
    severity: 'high' | 'medium' | 'low' | 'warning';
    category: string;
    description: string;
    recommendation?: string;
  }>;
  missingClauses?: Array<{
    title: string;
    category: string;
    description: string;
  }>;
  brandResponseMessage?: string;
  previousNegotiationMessage?: string;
  brandName?: string;
  onProposalGenerated: (proposal: CounterProposalResponse) => void;
  onUseProposal: (message: string) => void;
  sessionToken?: string;
}

export function AICounterProposal({
  dealId,
  dealValue,
  issues,
  missingClauses = [],
  brandResponseMessage,
  previousNegotiationMessage,
  brandName,
  onProposalGenerated,
  onUseProposal,
  sessionToken
}: AICounterProposalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<CounterProposalResponse | null>(null);
  const [tonePreference, setTonePreference] = useState<'soft' | 'firm' | 'aggressive'>('firm');
  const [showProposal, setShowProposal] = useState(false);

  const generateCounterProposal = async (tone: 'soft' | 'firm' | 'aggressive' = tonePreference) => {
    if (!sessionToken) {
      toast.error('Please log in to generate counter-proposal');
      return;
    }

    if (!dealId) {
      toast.error('Deal ID is required');
      return;
    }

    setIsGenerating(true);
    triggerHaptic(HapticPatterns.light);

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(`${apiBaseUrl}/api/ai/counter-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          deal_id: dealId,
          deal_value: dealValue,
          issues: issues,
          missing_clauses: missingClauses,
          brand_response_message: brandResponseMessage,
          previous_negotiation_message: previousNegotiationMessage,
          brand_name: brandName,
          tone_preference: tone
        })
      });

      const data = await response.json();

      if (data.success && data.data) {
        setProposal(data.data);
        setTonePreference(tone);
        setShowProposal(true);
        onProposalGenerated(data.data);
        triggerHaptic(HapticPatterns.success);
        toast.success('Counter-proposal generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate counter-proposal');
      }
    } catch (error: any) {
      console.error('[AICounterProposal] Generation error:', error);
      toast.error(error.message || 'Failed to generate counter-proposal. Please try again.');
      triggerHaptic(HapticPatterns.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseProposal = () => {
    if (!proposal) return;
    onUseProposal(proposal.message);
    setShowProposal(false);
    triggerHaptic(HapticPatterns.medium);
    toast.success('Proposal loaded into editor');
  };

  const handleRegenerate = (newTone: 'soft' | 'firm' | 'aggressive') => {
    generateCounterProposal(newTone);
  };

  if (showProposal && proposal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI Generated Counter-Proposal</h3>
          </div>
          <button
            onClick={() => setShowProposal(false)}
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Key Changes */}
        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
          <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Key Changes
          </h4>
          <ul className="space-y-2">
            {proposal.key_changes.map((change, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/90">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats Badges */}
        <div className="flex gap-3 flex-wrap">
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold",
            proposal.risk_level === 'low' ? "bg-green-500/20 text-green-300 border border-green-500/30" :
              proposal.risk_level === 'medium' ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" :
                "bg-red-500/20 text-red-300 border border-red-500/30"
          )}>
            Risk: {proposal.risk_level.toUpperCase()}
          </div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Approval: {proposal.approval_probability}
          </div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Tone: {proposal.tone}
          </div>
        </div>

        {/* Generated Message Preview */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">Generated Message</h4>
          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {proposal.message}
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-white/50 italic text-center">
          This proposal is AI-generated. You can edit before sending.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleUseProposal}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Use This Proposal
          </motion.button>
          <motion.button
            onClick={() => {
              handleRegenerate('soft');
              // Track analytics
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'ai_counter_regenerated', {
                  deal_id: dealId,
                  tone: 'soft'
                });
              }
            }}
            disabled={isGenerating}
            whileHover={!isGenerating ? { scale: 1.02 } : {}}
            whileTap={!isGenerating ? { scale: 0.98 } : {}}
            className="px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-xl font-semibold transition-all border border-yellow-500/30 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Softer'
            )}
          </motion.button>
          <motion.button
            onClick={() => {
              handleRegenerate('aggressive');
              // Track analytics
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'ai_counter_regenerated', {
                  deal_id: dealId,
                  tone: 'aggressive'
                });
              }
            }}
            disabled={isGenerating}
            whileHover={!isGenerating ? { scale: 1.02 } : {}}
            whileTap={!isGenerating ? { scale: 0.98 } : {}}
            className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-semibold transition-all border border-red-500/30 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Stronger'
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={() => generateCounterProposal()}
      disabled={isGenerating}
      whileHover={!isGenerating ? { scale: 1.01 } : {}}
      whileTap={!isGenerating ? { scale: 0.99 } : {}}
      className={cn(
        "w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
        "text-white px-6 py-4 rounded-xl font-semibold transition-all",
        "flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating smart counter-proposal...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <div className="flex flex-col items-start flex-1">
            <span className="text-lg">✨ AI Suggest Counter-Proposal</span>
            <span className="text-sm text-purple-100/80 font-normal">Optimized for faster brand approval</span>
          </div>
        </>
      )}
    </motion.button>
  );
}

