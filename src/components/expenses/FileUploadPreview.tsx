import React from 'react';
import { FileText, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FileUploadPreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({ 
  file, 
  onRemove,
  className 
}) => {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const fileUrl = URL.createObjectURL(file);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-white/10 border border-white/20 backdrop-blur-xl",
        className
      )}
    >
      {isImage ? (
        <img 
          src={fileUrl} 
          alt="Receipt preview" 
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : isPdf ? (
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-white/80" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <Image className="w-6 h-6 text-white/80" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate font-medium">{file.name}</p>
        <p className="text-xs text-white/60">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      
      <button
        onClick={onRemove}
        className={cn(
          "p-1.5 rounded-lg",
          "bg-white/10 hover:bg-white/20",
          "text-white/70 hover:text-white",
          "transition-colors duration-200",
          "flex-shrink-0"
        )}
        aria-label="Remove file"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

