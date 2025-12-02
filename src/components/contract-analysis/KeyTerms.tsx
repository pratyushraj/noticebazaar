"use client";

import React from 'react';
import { FileText, IndianRupee, Calendar, Package, CreditCard, AlertCircle } from 'lucide-react';
import { KeyTerms as KeyTermsType } from '@/types/contractAnalysis';
import { motion } from 'framer-motion';

interface KeyTermsProps {
  keyTerms: KeyTermsType;
}

export const KeyTerms: React.FC<KeyTermsProps> = ({ keyTerms }) => {
  const terms = [
    {
      label: 'Deal Value',
      value: keyTerms.dealValue,
      icon: IndianRupee,
      iconColor: 'text-green-400',
    },
    {
      label: 'Duration',
      value: keyTerms.duration,
      icon: Calendar,
      iconColor: 'text-blue-400',
    },
    {
      label: 'Deliverables',
      value: keyTerms.deliverables,
      icon: Package,
      iconColor: 'text-purple-400',
    },
    {
      label: 'Payment Terms',
      value: keyTerms.paymentTerms,
      icon: CreditCard,
      iconColor: 'text-yellow-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] rounded-[20px] p-5 border border-[rgba(255,255,255,0.15)] shadow-[0_8px_40px_rgba(0,0,0,0.25)]"
    >
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
        <FileText className="w-5 h-5" />
        Key Terms
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {terms.map((term, index) => {
          const Icon = term.icon;
          const isNull = term.value === null;
          
          return (
            <motion.div
              key={term.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
              className="p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="text-xs text-white/60 mb-2">{term.label}</div>
              <div className="font-semibold flex items-center gap-2 text-white">
                {isNull ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/50">Not Mentioned</span>
                  </>
                ) : (
                  <>
                    <Icon className={`w-4 h-4 ${term.iconColor}`} />
                    <span>{term.value}</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

