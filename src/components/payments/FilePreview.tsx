import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FilePreviewProps {
  fileURL: string;
  fileName: string;
  onRemove: () => void;
  onPreview?: () => void;
  className?: string;
}

export const FilePreview = ({
  fileURL,
  fileName,
  onRemove,
  onPreview,
  className,
}: FilePreviewProps) => {
  const [imageError, setImageError] = useState(false);
  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(fileName);
  const isPDF = /\.pdf$/i.test(fileName);

  const handleClick = () => {
    if (onPreview) {
      onPreview();
    } else {
      window.open(fileURL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-secondary/50 rounded-xl backdrop-blur-xl border border-border hover:bg-secondary/15 transition-all cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {isImage && !imageError ? (
        <img
          src={fileURL}
          alt={fileName}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
          {isPDF ? (
            <FileText className="w-5 h-5 text-foreground/60" />
          ) : (
            <ImageIcon className="w-5 h-5 text-foreground/60" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground/80 truncate">{fileName}</div>
      </div>
      <button type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1.5 rounded-lg hover:bg-secondary/20 transition-colors flex-shrink-0"
        aria-label="Remove file"
      >
        <X className="w-4 h-4 text-foreground/60" />
      </button>
    </div>
  );
};

