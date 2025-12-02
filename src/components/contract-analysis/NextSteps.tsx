"use client";

import React from 'react';
import { RiskLevel } from '@/types/contractAnalysis';
import { motion } from 'framer-motion';

interface NextStepsProps {
  riskLevel: RiskLevel;
  issuesCount: number;
}

export const NextSteps: React.FC<NextStepsProps> = ({ riskLevel }) => {
  const getNextSteps = () => {
    if (riskLevel === 'High') {
      return [
        { text: 'Do Not Sign Yet: This contract has critical issues that put you at financial and legal risk.', strong: true },
        { text: 'Schedule Legal Review: Consult with NoticeBazaar\'s legal advisor to discuss specific changes needed.' },
        { text: 'Request Revisions: Send the brand a list of required changes based on the issues identified above.' },
        { text: 'Use This Report: Share this analysis with the brand to justify your requested changes professionally.' },
        { text: 'Get Written Confirmation: Ensure all changes are made in writing before signing the final contract.' },
        { text: 'Re-Upload for Review: Once revised, upload the new contract to NoticeBazaar for verification.' },
      ];
    } else if (riskLevel === 'Medium') {
      return [
        { text: 'Review Carefully: This contract has some areas that need attention before signing.' },
        { text: 'Request Clarifications: Address the issues identified above with the brand.' },
        { text: 'Use This Report: Share this analysis with the brand to justify your requested changes professionally.' },
        { text: 'Get Written Confirmation: Ensure all changes are made in writing before signing the final contract.' },
        { text: 'Re-Upload for Review: Once revised, upload the new contract to NoticeBazaar for verification.' },
      ];
    } else {
      return [
        { text: 'Contract Looks Good: This contract has been reviewed and appears to be in good shape.' },
        { text: 'Final Review: Still recommended to have a legal professional review before signing.' },
        { text: 'Use This Report: Share this analysis with the brand if needed.' },
      ];
    }
  };

  const steps = getNextSteps();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="relative bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
    >
      <h3 className="font-semibold text-lg mb-4 text-white">🎯 Recommended Next Steps</h3>
      <ol className="space-y-3 list-decimal list-inside text-sm text-white/90">
        {steps.map((step, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
            className={step.strong ? 'font-semibold' : ''}
          >
            {step.text}
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
};

