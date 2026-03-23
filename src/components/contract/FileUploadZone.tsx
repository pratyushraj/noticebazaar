/**
 * FileUploadZone - Drag and drop file upload component
 * Extracted from ContractUploadFlow.tsx
 */

import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validateContractFile } from '@/lib/contract/validators';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

export interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadError?: string | null;
  uploadedFile?: File | null;
  preview?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'],
  maxSizeMB = 10,
  isUploading = false,
  uploadProgress = 0,
  uploadError = null,
  uploadedFile = null,
  preview = null,
  onRemove,
  disabled = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled || isUploading) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [disabled, isUploading]);

  const handleFileSelection = useCallback((file: File) => {
    const validation = validateContractFile(
      { name: file.name, size: file.size, type: file.type },
      maxSizeMB
    );

    if (!validation.isValid) {
      toast.error(validation.message);
      triggerHaptic(HapticPatterns.error);
      return;
    }

    triggerHaptic(HapticPatterns.light);
    onFileSelect(file);
  }, [maxSizeMB, onFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
    triggerHaptic(HapticPatterns.light);
  }, [onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 min-h-[200px] flex flex-col items-center justify-center
          ${isDragActive && !disabled
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-gray-600 hover:border-purple-500/50 hover:bg-white/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            </motion.div>
          ) : uploadedFile ? (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              {preview ? (
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                />
              ) : (
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-8 h-8 text-purple-400" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{uploadedFile.name}</span>
              </div>
              {onRemove && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </motion.div>
          ) : uploadError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <AlertCircle className="w-12 h-12 text-red-400" />
              <p className="text-red-400">{uploadError}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Try again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-white font-medium">
                  Drag and drop your contract here
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-gray-500 text-xs">
                Supported: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FileUploadZone;
