import React from 'react';
import { XCircle, AlertTriangle, Upload, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorStepsProps {
  step: string;
  uploadError: string | null;
  reviewError: string | null;
  validationError: string | null;
  handleRetryUpload: () => void;
  handleRetryReview: () => void;
  setStep: (step: string) => void;
  setUploadError: (error: string | null) => void;
  setRetryCount: (count: number) => void;
  setUploadProgress: (progress: number) => void;
  setFileName: (name: string) => void;
  setFileSize: (size: string) => void;
  setReviewError: (error: string | null) => void;
  setScanProgress: (progress: number) => void;
  setValidationError: (error: string | null) => void;
  setUploadedFile: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ErrorSteps: React.FC<ErrorStepsProps> = ({
  step,
  uploadError,
  reviewError,
  validationError,
  handleRetryUpload,
  handleRetryReview,
  setStep,
  setUploadError,
  setRetryCount,
  setUploadProgress,
  setFileName,
  setFileSize,
  setReviewError,
  setScanProgress,
  setValidationError,
  setUploadedFile,
  fileInputRef,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Upload Error Step */}
      {step === 'upload-error' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Upload Failed</h2>
            <p className="text-white/70 mb-6">{uploadError || 'An error occurred during upload. Please try again.'}</p>

            <div className="flex flex-col gap-3">
              <button type="button"
                onClick={handleRetryUpload}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Try Again
              </button>
              <button type="button"
                onClick={() => {
                  setStep('upload');
                  setUploadError(null);
                  setRetryCount(0);
                  setUploadProgress(0);
                  setFileName('');
                  setFileSize('');
                }}
                className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Choose Different File
              </button>
              <button type="button"
                onClick={() => navigate('/creator-dashboard')}
                className="text-purple-300 hover:text-white text-sm transition-colors"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Error Step */}
      {step === 'review-error' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-400" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Review Failed</h2>
            <p className="text-white/70 mb-6">{reviewError || 'An error occurred during contract review. Please try again.'}</p>

            <div className="flex flex-col gap-3">
              <button type="button"
                onClick={handleRetryReview}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Retry Review
              </button>
              <button type="button"
                onClick={() => {
                  setStep('upload');
                  setReviewError(null);
                  setUploadProgress(0);
                  setScanProgress(0);
                  setFileName('');
                  setFileSize('');
                }}
                className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Upload New Contract
              </button>
              <button type="button"
                onClick={() => navigate('/creator-dashboard')}
                className="text-purple-300 hover:text-white text-sm transition-colors"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Step */}
      {step === 'validation-error' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-orange-400" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Invalid Document Type</h2>
            <p className="text-white/70 mb-6 whitespace-pre-line">{validationError || 'This document does not appear to be a brand deal contract.'}</p>

            <div className="flex flex-col gap-3">
              <button type="button"
                onClick={() => {
                  setStep('upload');
                  setValidationError(null);
                  setFileName('');
                  setFileSize('');
                  setUploadedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choose Different File
              </button>
              <button type="button"
                onClick={() => navigate('/creator-dashboard')}
                className="text-purple-300 hover:text-white text-sm transition-colors"
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
