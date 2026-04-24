

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/services/fileService';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';

interface PortfolioUploaderProps {
  initialPortfolioLinks: string[];
}

const PortfolioUploader: React.FC<PortfolioUploaderProps> = ({ initialPortfolioLinks }) => {
  const { user, profile, refetchProfile } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(initialPortfolioLinks);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user?.id || !profile?.id || selectedFiles.length === 0) {
      toast.error('No files selected or user not logged in.');
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const uploadResult = await uploadFile(file, {
          category: 'document', // Using 'document' category for now, can be 'portfolio' if added
          userId: user.id,
          fileName: `portfolio-${file.name}`,
          folder: 'portfolio',
        });
        uploadedUrls.push(uploadResult.url);
      }

      const newPortfolioLinks = [...portfolioLinks, ...uploadedUrls];

      await updateProfileMutation.mutateAsync({
        id: profile.id,
        portfolio_links: newPortfolioLinks,
      } as any); // Cast to any to bypass type issues with partial profile update

      await refetchProfile?.();
      setPortfolioLinks(newPortfolioLinks);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Portfolio updated successfully!');
    } catch (error: any) {
      console.error('Failed to upload portfolio items:', error);
      toast.error(error?.message || 'Failed to upload portfolio items.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveExistingLink = async (linkToRemove: string) => {
    if (!profile?.id) return;

    const updatedLinks = portfolioLinks.filter((link) => link !== linkToRemove);

    try {
      await updateProfileMutation.mutateAsync({
        id: profile.id,
        portfolio_links: updatedLinks,
      } as any);

      await refetchProfile?.();
      setPortfolioLinks(updatedLinks);
      toast.success('Portfolio item removed.');
    } catch (error: any) {
      console.error('Failed to remove portfolio item:', error);
      toast.error(error?.message || 'Failed to remove portfolio item.');
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        Your Portfolio (Best Posts)
      </Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {portfolioLinks.map((link, index) => (
          <div key={index} className="relative group">
            <img src={link} alt={`Portfolio item ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveExistingLink(link)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {selectedFiles.map((file, index) => (
          <div key={`new-${index}`} className="relative group">
            <img src={URL.createObjectURL(file)} alt={`New portfolio item ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveFile(index)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div
          className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <PlusCircle className="h-8 w-8 text-slate-400" />
        </div>
      </div>
      {selectedFiles.length > 0 && (
        <Button onClick={handleUpload} disabled={isUploading} className="w-full">
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            'Upload Selected'
          )}
        </Button>
      )}
    </div>
  );
};

export default PortfolioUploader;
