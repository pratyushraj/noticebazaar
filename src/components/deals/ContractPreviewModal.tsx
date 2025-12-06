import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile, getFilenameFromUrl, isPdfUrl, isMobileDevice } from '@/lib/utils/fileDownload';
import { getContractMetadata, formatFileSize, ContractMetadata } from '@/lib/utils/contractMetadata';
import { trackEvent } from '@/lib/utils/analytics';

interface ContractPreviewModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string;
  dealTitle?: string;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  open,
  onClose,
  fileUrl,
  fileName,
  dealTitle,
}) => {
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'doc' | 'unknown'>('unknown');
  const [imageZoom, setImageZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ContractMetadata | null>(null);

  useEffect(() => {
    if (open && fileUrl) {
      setIsLoading(true);
      setError(null);
      
      // Track analytics
      trackEvent('contract_preview_opened', { 
        dealTitle,
        fileUrl: fileUrl.substring(0, 50), // Truncate for privacy
      });
      
      // Fetch metadata
      getContractMetadata(fileUrl).then((meta) => {
        setMetadata(meta);
        if (meta) {
          // Detect file type from metadata
          if (meta.filetype === 'pdf') {
            setFileType('pdf');
          } else if (['png', 'jpg', 'jpeg'].includes(meta.filetype)) {
            setFileType('image');
          } else if (meta.filetype === 'docx') {
            setFileType('doc');
          } else {
            // Fallback to URL detection
            const url = fileUrl.toLowerCase();
            if (url.includes('.pdf') || isPdfUrl(fileUrl)) {
              setFileType('pdf');
            } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
              setFileType('image');
            } else if (url.match(/\.(doc|docx)$/)) {
              setFileType('doc');
            } else {
              setFileType('unknown');
            }
          }
        }
        setIsLoading(false);
      }).catch(() => {
        // Fallback detection
        const url = fileUrl.toLowerCase();
        if (url.includes('.pdf') || isPdfUrl(fileUrl)) {
          setFileType('pdf');
        } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          setFileType('image');
        } else if (url.match(/\.(doc|docx)$/)) {
          setFileType('doc');
        } else {
          setFileType('unknown');
        }
        setIsLoading(false);
      });
    }
  }, [open, fileUrl, dealTitle]);

  const handleDownload = async () => {
    if (!fileUrl) {
      toast.error('No file available to download');
      return;
    }

    try {
      const filename = fileName || getFilenameFromUrl(fileUrl);
      await downloadFile(fileUrl, filename);
      toast.success('File downloaded successfully!');
    } catch (error: any) {
      toast.error('Download failed', {
        description: error.message || 'Could not download the file.',
      });
    }
  };

  const handleShare = async () => {
    if (!fileUrl) {
      toast.error('No file available to share');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: fileName || 'Contract',
          text: dealTitle || 'Contract file',
          url: fileUrl,
        });
        toast.success('File shared!');
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to copy link
          await navigator.clipboard.writeText(fileUrl);
          toast.success('Link copied to clipboard!');
        }
      }
    } else {
      // Fallback to copy link
      await navigator.clipboard.writeText(fileUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleImageZoom = (delta: number) => {
    setImageZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  if (!fileUrl) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[90vw] md:max-w-4xl md:h-[85vh] md:rounded-3xl bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 md:border md:border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header - Compact on mobile, full on desktop */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-white/10 bg-purple-900/50 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                {fileType === 'pdf' && <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-300 flex-shrink-0" />}
                {fileType === 'image' && <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-purple-300 flex-shrink-0" />}
                {fileType === 'doc' && <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-300 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold truncate text-sm md:text-base">
                    {fileName || metadata?.filename || 'Contract Preview'}
                  </h3>
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs text-purple-300">
                    {metadata && (
                      <>
                        <span className="uppercase">{metadata.filetype}</span>
                        {metadata.size > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(metadata.size)}</span>
                          </>
                        )}
                        {metadata.uploaded_at && (
                          <>
                            <span>•</span>
                            <span className="hidden sm:inline">
                              Uploaded {new Date(metadata.uploaded_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {!metadata && dealTitle && (
                      <span className="truncate">{dealTitle}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2">
                {isMobileDevice() && (
                  <button
                    onClick={handleShare}
                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </button>
                )}
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all active:scale-95 flex items-center gap-1.5 md:gap-2 text-sm md:text-base"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-black/20 md:overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/60">Loading preview...</div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-white font-medium mb-2">Preview unavailable</p>
                  <p className="text-white/60 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl"
                  >
                    Download Instead
                  </button>
                </div>
              ) : fileType === 'pdf' ? (
                <div className="h-full w-full flex-1 overflow-hidden">
                  <iframe
                    src={fileUrl}
                    type="application/pdf"
                    className="w-full h-full border-0"
                    style={{ 
                      minHeight: isMobileDevice() ? 'calc(100vh - 70px)' : '100%',
                      height: '100%'
                    }}
                    onError={() => {
                      setError('Failed to load PDF. Please download the file instead.');
                    }}
                  />
                </div>
              ) : fileType === 'image' ? (
                <div className="h-full w-full overflow-auto p-4 flex items-center justify-center">
                  <div className="relative">
                    <img
                      src={fileUrl}
                      alt={fileName || 'Contract'}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      style={{ transform: `scale(${imageZoom})` }}
                      onError={() => {
                        setError('Failed to load image.');
                      }}
                    />
                    {/* Zoom Controls */}
                    <div className="fixed bottom-20 right-4 flex flex-col gap-2 bg-purple-900/90 backdrop-blur-xl rounded-xl p-2 border border-white/10">
                      <button
                        onClick={() => handleImageZoom(0.1)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleImageZoom(-0.1)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
                      >
                        −
                      </button>
                      <button
                        onClick={() => setImageZoom(1)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ) : fileType === 'doc' ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="w-16 h-16 text-purple-300 mb-4" />
                  <p className="text-white font-medium mb-2">No preview available</p>
                  <p className="text-white/60 text-sm mb-6">
                    Document files cannot be previewed in the browser.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all active:scale-95"
                  >
                    Download Document
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
                  <p className="text-white font-medium mb-2">Unsupported file type</p>
                  <p className="text-white/60 text-sm mb-4">
                    This file type cannot be previewed.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

