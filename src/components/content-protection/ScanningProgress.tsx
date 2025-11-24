"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScanningProgressProps {
  isScanning: boolean;
  progress?: number;
  currentPlatform?: string;
  matchesFound?: number;
  contentPreview?: string;
  onRetry?: () => void;
  error?: string | null;
}

const ScanningProgress: React.FC<ScanningProgressProps> = ({
  isScanning,
  progress = 0,
  currentPlatform,
  matchesFound = 0,
  contentPreview,
  onRetry,
  error,
}) => {
  if (!isScanning && !error) return null;

  // Show error state with retry button
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-card border-red-500/40">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-foreground">Scan Failed</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Retry Scan
              </button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="bg-card border-border/40">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <h3 className="text-lg font-semibold text-foreground">Scanning Content...</h3>
          </div>

          {/* Content Preview */}
          {contentPreview && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <img
                    src={contentPreview}
                    alt="Content preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {contentPreview}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Analyzing content...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
          </div>

          {/* Platform Status */}
          {currentPlatform && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Scanning {currentPlatform}...</span>
              </div>
            </div>
          )}

          {/* Matches Found */}
          {matchesFound > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-500">
                  {matchesFound} potential match{matchesFound !== 1 ? 'es' : ''} found so far
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanningProgress;

