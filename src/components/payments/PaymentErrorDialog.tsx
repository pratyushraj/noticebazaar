"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { XCircle, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error?: string;
  onRetry?: () => void;
  paymentId?: string;
}

/**
 * Payment error dialog component
 * - Shows payment failure details
 * - Provides retry and support options
 * - Handles different error types gracefully
 */
export const PaymentErrorDialog: React.FC<PaymentErrorDialogProps> = ({
  open,
  onOpenChange,
  error,
  onRetry,
  paymentId,
}) => {
  const getErrorMessage = () => {
    if (error) {
      // Handle common payment errors
      if (error.toLowerCase().includes('insufficient')) {
        return 'Insufficient funds. Please check your account balance or try a different payment method.';
      }
      if (error.toLowerCase().includes('expired')) {
        return 'Your card has expired. Please use a different payment method.';
      }
      if (error.toLowerCase().includes('declined') || error.toLowerCase().includes('rejected')) {
        return 'Your payment was declined. Please check your card details or try a different payment method.';
      }
      if (error.toLowerCase().includes('network') || error.toLowerCase().includes('timeout')) {
        return 'Network error occurred. Please check your connection and try again.';
      }
      return error;
    }
    return 'Your payment could not be processed. Please try again or contact support if the issue persists.';
  };

  const handleRetry = () => {
    onOpenChange(false);
    if (onRetry) {
      setTimeout(() => onRetry(), 300);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-red-500/30 text-white max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Payment Failed</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-purple-200 mt-4">
            {getErrorMessage()}
          </AlertDialogDescription>
          {paymentId && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-purple-300 mb-1">Payment ID:</p>
              <p className="text-sm font-mono text-white/80">{paymentId}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0 mt-6">
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className="bg-white/10 text-white hover:bg-white/20 border-none"
          >
            Close
          </AlertDialogAction>
          {onRetry && (
            <Button
              onClick={handleRetry}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Payment
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = `mailto:support@creatorarmour.com?subject=Payment Issue&body=Payment ID: ${paymentId || 'N/A'}\nError: ${error || 'Unknown error'}`;
            }}
            className="bg-white/10 text-white hover:bg-white/20 border-white/20"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentErrorDialog;

