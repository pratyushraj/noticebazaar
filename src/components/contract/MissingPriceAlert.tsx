import React, { useEffect } from 'react';
import { AlertTriangle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface MissingPriceAlertProps {
  onAskBrand: () => void;
}

export const MissingPriceAlert: React.FC<MissingPriceAlertProps> = ({ onAskBrand }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      const alertElement = document.getElementById('deal-breaker-alert');
      if (alertElement) {
        alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      id="deal-breaker-alert"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-destructive/20 border-2 border-destructive/50 rounded-xl p-5 md:p-6 relative overflow-hidden"
    >
      {/* Pulse animation */}
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 bg-destructive/10 rounded-xl"
      />
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg md:text-xl text-destructive mb-2">
              🔴 DEAL BREAKER ALERT: Payment amount is missing
            </h4>
            <p className="text-sm text-destructive/80 leading-relaxed">
              This contract does not specify the payment amount. This is a critical issue that must be addressed before proceeding.
            </p>
          </div>
        </div>
        <motion.button
          onClick={onAskBrand}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-destructive hover:bg-destructive text-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Ask Brand to Add Price
        </motion.button>
      </div>
    </motion.div>
  );
};
