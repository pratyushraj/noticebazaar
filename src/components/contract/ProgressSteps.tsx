import React from 'react';
import { Upload, FileText, Sparkles, Loader, CheckCircle, Loader2 } from 'lucide-react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface ProgressStepsProps {
  step: string;
  fileName: string;
  fileSize: string;
  uploadProgress: number;
  scanProgress: number;
  isAutoRetrying: boolean;
  retryDelay: number;
  retryAttempt: number;
  MAX_AUTO_RETRIES: number;
  analyzedItems: Set<string>;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  step,
  fileName,
  fileSize,
  uploadProgress,
  scanProgress,
  isAutoRetrying,
  retryDelay,
  retryAttempt,
  MAX_AUTO_RETRIES,
  analyzedItems,
}) => {
  return (
    <>
      {/* Uploading Step */}
      {step === 'uploading' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center w-full max-w-md">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6 relative">
              <Upload className="w-12 h-12 text-purple-400" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Uploading Contract...</h2>
            <p className="text-purple-300 mb-6">{fileName}</p>

            {/* Enhanced Progress Bar */}
            <div className="w-full max-w-xs mx-auto mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-purple-300 font-medium">{uploadProgress}%</span>
                <span className="text-purple-300">{fileSize}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 text-left">
                <div className={`w-2 h-2 rounded-full transition-all ${uploadProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Uploading file...</div>
                  <div className="text-xs text-purple-300">
                    {uploadProgress > 0 ? `Transferred ${(uploadProgress / 100 * parseFloat(fileSize)).toFixed(2)} MB` : 'Preparing upload...'}
                  </div>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Loader className="w-4 h-4 animate-spin text-purple-400" />
                )}
                {uploadProgress === 100 && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Step */}
      {step === 'scanning' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center w-full max-w-md">
            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 relative">
              <FileText className="w-12 h-12 text-blue-400" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Scanning Document...</h2>
            <p className="text-purple-300 mb-6">Reading contract clauses</p>

            {/* Enhanced Progress Bar */}
            <div className="w-full max-w-xs mx-auto mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-purple-300 font-medium">{scanProgress}%</span>
                <span className="text-purple-300">12 pages</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${scanProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 text-left">
                <div className={`w-2 h-2 rounded-full transition-all ${scanProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Extracting text from PDF...</div>
                  <div className="text-xs text-purple-300">
                    {scanProgress > 0 ? `Processed ${Math.round(scanProgress / 100 * 12)} of 12 pages` : 'Initializing scanner...'}
                  </div>
                </div>
                {scanProgress > 0 && scanProgress < 100 && (
                  <Loader className="w-4 h-4 animate-spin text-blue-400" />
                )}
                {scanProgress === 100 && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center min-h-[60vh] py-8" style={{ willChange: 'contents' }}>
          <div className="text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 relative animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-2">
              {isAutoRetrying ? 'Service Starting Up...' : 'AI Analyzing Contract...'}
            </h2>
            <p className="text-purple-300/70 mb-8">
              {isAutoRetrying ? (
                <span>
                  Retrying in {retryDelay}s (Attempt {retryAttempt}/{MAX_AUTO_RETRIES})
                </span>
              ) : (
                'Checking for potential issues'
              )}
            </p>

            {/* Auto-retry indicator */}
            {isAutoRetrying && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-medium text-yellow-300">
                      Waiting for analysis service to start...
                    </div>
                    <div className="text-xs text-yellow-400/70 mt-1">
                      This usually takes 30-50 seconds. We'll retry automatically.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm max-w-xs mx-auto">
              {['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 bg-white/5 rounded-lg" style={{ transform: 'translateZ(0)' }}>
                  <span className="text-purple-200/70">{item}</span>
                  {analyzedItems.has(item) ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Loaders for Results Preview */}
          <div className="w-full max-w-4xl mx-auto space-y-8 mt-8">
            <SkeletonLoader variant="score" />
            <SkeletonLoader variant="issues" />
            <SkeletonLoader variant="keyTerms" />
          </div>
        </div>
      )}
    </>
  );
};
