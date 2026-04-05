import React from 'react';
import { CheckCircle, FileText, MessageSquare } from 'lucide-react';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/utils/analytics';

interface UploadStepProps {
  selectedOption: 'upload' | 'request_details' | null;
  setSelectedOption: (option: 'upload' | 'request_details' | null) => void;
  setDealType: (type: 'contract' | 'barter') => void;
  setShowUploadArea: (show: boolean) => void;
  recommendedOption: 'upload' | 'request_details' | null;
  setStep: (step: string) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({
  selectedOption,
  setSelectedOption,
  setDealType,
  setShowUploadArea,
  recommendedOption,
  setStep,
}) => {
  return (
    <>
      {/* Option Selection Cards */}
      <div className="space-y-4 mb-8">
        {/* Card A: Upload Contract */}
        <button type="button"
          onClick={() => {
            setSelectedOption('upload');
            setDealType('contract');
            setShowUploadArea(false);
            triggerHaptic(HapticPatterns.light);

            // Track analytics
            trackEvent('upload_flow_option_selected', {
              option: 'upload_contract',
              source: 'upload_contract_page',
            }).catch(() => {
              // Silently fail - don't block UI
            });
          }}
          className={cn(
            "w-full text-left p-5 rounded-2xl border-2 transition-all relative",
            "cursor-pointer group",
            selectedOption === 'upload'
              ? 'border-purple-400 bg-secondary/15 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/20'
              : recommendedOption === 'upload'
                ? 'border-purple-300/40 bg-secondary/8 hover:border-purple-300/60 hover:bg-secondary/12 shadow-md shadow-purple-500/10'
                : 'border-border bg-card hover:border-border hover:bg-secondary/50 opacity-75'
          )}
        >
          {/* Check Icon - Top Right (when selected) */}
          {selectedOption === 'upload' && (
            <div className="absolute top-3 right-3">
              <CheckCircle className="w-5 h-5 text-secondary" />
            </div>
          )}

          <div className="flex items-start gap-4 pr-8">
            {/* Radio Indicator - Secondary for accessibility */}
            <div className="flex-shrink-0 mt-1 opacity-60">
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                selectedOption === 'upload'
                  ? 'border-purple-400 bg-secondary/20'
                  : 'border-border bg-transparent'
              )}>
                {selectedOption === 'upload' && (
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-lg mb-1.5 flex items-center gap-2",
                selectedOption === 'upload' ? 'text-foreground' : recommendedOption === 'upload' ? 'text-foreground/95' : 'text-foreground/80'
              )}>
                <FileText className="w-5 h-5 flex-shrink-0" />
                Upload Contract
              </h3>
              <p className="text-sm text-foreground/60 mb-2">
                Upload an existing contract to analyze and protect it.
              </p>
              <p className="text-xs text-foreground/50 font-medium">
                PDF / DOC • Takes ~2 minutes • Lawyer-reviewed
              </p>
            </div>
          </div>
        </button>

        {/* Card B: Request Details from Brand */}
        <button type="button"
          onClick={() => {
            setSelectedOption('request_details');
            setDealType('contract');
            setShowUploadArea(false);
            triggerHaptic(HapticPatterns.light);

            // Track analytics
            trackEvent('upload_flow_option_selected', {
              option: 'request_details',
              source: 'upload_contract_page',
            }).catch(() => {
              // Silently fail - don't block UI
            });
          }}
          className={cn(
            "w-full text-left p-5 rounded-2xl border-2 transition-all relative",
            "cursor-pointer group",
            selectedOption === 'request_details'
              ? 'border-purple-400 bg-secondary/15 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/20'
              : recommendedOption === 'request_details'
                ? 'border-purple-300/40 bg-secondary/8 hover:border-purple-300/60 hover:bg-secondary/12 shadow-md shadow-purple-500/10'
                : 'border-border bg-card hover:border-border hover:bg-secondary/50 opacity-75'
          )}
        >
          {/* Recommendation Badge - Top Right (only when not selected) */}
          {recommendedOption === 'request_details' && selectedOption !== 'request_details' && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-info/20 backdrop-blur-sm opacity-75">
              <span className="text-[10px] font-medium text-info/90">Most creators choose this</span>
            </div>
          )}

          {/* Check Icon - Top Right (when selected) */}
          {selectedOption === 'request_details' && (
            <div className="absolute top-3 right-3">
              <CheckCircle className="w-5 h-5 text-secondary" />
            </div>
          )}

          <div className="flex items-start gap-4 pr-8">
            {/* Radio Indicator - Secondary for accessibility */}
            <div className="flex-shrink-0 mt-1 opacity-60">
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                selectedOption === 'request_details'
                  ? 'border-purple-400 bg-secondary/20'
                  : 'border-border bg-transparent'
              )}>
                {selectedOption === 'request_details' && (
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-lg mb-1.5 flex items-center gap-2",
                selectedOption === 'request_details' ? 'text-foreground' : recommendedOption === 'request_details' ? 'text-foreground/95' : 'text-foreground/80'
              )}>
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                Request Details from Brand
              </h3>
              <p className="text-sm text-foreground/60 mb-2">
                No contract yet? Brands can share paid or barter deal details in under 2 minutes.
              </p>
              <p className="text-xs text-foreground/50 font-medium">
                We send a secure link • No follow-ups needed
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Conditional Content Based on Selection */}

      {/* Sticky Bottom CTA */}
      <div
        className="fixed left-0 right-0 bg-gradient-to-t from-purple-900/95 via-purple-900/95 to-transparent backdrop-blur-lg border-t border-border px-4 md:px-6 lg:px-8 py-4 -mx-4 md:-mx-6 lg:-mx-8"
        style={{
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', // Account for bottom nav height + safe area
          zIndex: 10000, // Above bottom nav (z-9999)
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Helper Text */}
        <p className="text-xs text-foreground/50 text-center mb-2.5">
          You can change this later
        </p>

        <button type="button"
          onClick={() => {
            if (!selectedOption) return;

            if (selectedOption === 'upload') {
              setStep('select-file');
            } else if (selectedOption === 'request_details') {
              setStep('request-details');
            }
            triggerHaptic(HapticPatterns.medium);
          }}
          disabled={!selectedOption}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition-all",
            selectedOption
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/30 text-foreground"
              : "bg-secondary/50 border border-border text-foreground/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          Continue
        </button>
      </div>
    </>
  );
};
