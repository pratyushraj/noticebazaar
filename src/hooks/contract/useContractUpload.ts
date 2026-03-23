/**
 * useContractUpload - Hook for managing contract file upload state
 * Extracted from ContractUploadFlow.tsx
 */

import { useState, useCallback, useRef } from 'react';
import { validateContractFile } from '@/lib/contract/validators';
import { uploadFile } from '@/lib/services/fileService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

export interface UploadedFile {
  file: File | null;
  preview: string | null;
  uploadProgress: number;
  uploadError: string | null;
  uploadedUrl: string | null;
}

export interface UseContractUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export interface UseContractUploadReturn {
  // State
  file: File | null;
  preview: string | null;
  uploadProgress: number;
  isUploading: boolean;
  uploadError: string | null;
  uploadedUrl: string | null;
  
  // Actions
  selectFile: (file: File) => Promise<boolean>;
  removeFile: () => void;
  upload: (userId: string) => Promise<string | null>;
  reset: () => void;
  
  // Refs
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useContractUpload(options: UseContractUploadOptions = {}): UseContractUploadReturn {
  const {
    maxSizeMB = 10,
    onUploadComplete,
    onUploadError,
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFile = useCallback(async (selectedFile: File): Promise<boolean> => {
    // Validate file
    const validation = validateContractFile(
      { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type },
      maxSizeMB
    );

    if (!validation.isValid) {
      setUploadError(validation.message);
      toast.error(validation.message);
      return false;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploadProgress(0);
    setUploadedUrl(null);
    triggerHaptic(HapticPatterns.light);

    // Generate preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    return true;
  }, [maxSizeMB]);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedUrl(null);
    triggerHaptic(HapticPatterns.light);
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const upload = useCallback(async (userId: string): Promise<string | null> => {
    if (!file) {
      setUploadError('No file selected');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    triggerHaptic(HapticPatterns.medium);

    try {
      // Upload to storage
      const { url, error } = await uploadFile(file, 'contracts', userId, (progress) => {
        setUploadProgress(progress);
      });

      if (error) {
        throw new Error(error);
      }

      if (!url) {
        throw new Error('Failed to get upload URL');
      }

      setUploadedUrl(url);
      setUploadProgress(100);
      triggerHaptic(HapticPatterns.success);
      
      toast.success('Contract uploaded successfully');
      onUploadComplete?.(url);
      
      return url;
    } catch (error: any) {
      const errorMessage = error?.message || 'Upload failed';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
      triggerHaptic(HapticPatterns.error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [file, onUploadComplete, onUploadError]);

  const reset = useCallback(() => {
    removeFile();
  }, [removeFile]);

  return {
    file,
    preview,
    uploadProgress,
    isUploading,
    uploadError,
    uploadedUrl,
    selectFile,
    removeFile,
    upload,
    reset,
    inputRef,
  };
}
