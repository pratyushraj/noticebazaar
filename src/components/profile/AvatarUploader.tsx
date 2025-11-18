"use client";

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/avatar';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  firstName: string;
  lastName: string;
  onUploadSuccess: (url: string) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  currentAvatarUrl,
  firstName,
  lastName,
  onUploadSuccess,
}) => {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setIsDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !preview) return;

    const file = fileInputRef.current.files[0];
    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      const filePath = `${fileName}`;

      // Remove old avatar if exists
      const oldPath = currentAvatarUrl?.includes('/avatar.') 
        ? currentAvatarUrl.split('/').pop()?.split('?')[0]
        : null;
      if (oldPath) {
        await supabase.storage.from(CREATOR_ASSETS_BUCKET).remove([`${userId}/${oldPath}`]);
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .getPublicUrl(filePath);

      onUploadSuccess(publicUrl);
      setIsDialogOpen(false);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar', { description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-white/10">
            <AvatarImage src={preview || currentAvatarUrl || undefined} alt={`${firstName} ${lastName}`} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            size="icon"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <p className="text-xs text-white/60 text-center">Click camera icon to upload</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0F121A] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Crop & Preview Avatar</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {preview && (
              <Avatar className="h-32 w-32 border-4 border-white/20">
                <AvatarImage src={preview} alt="Preview" />
                <AvatarFallback className="bg-primary text-primary-foreground text-5xl">
                  {getInitials(firstName, lastName)}
                </AvatarFallback>
              </Avatar>
            )}
            <p className="text-sm text-white/70 text-center">
              This will be your profile picture. Make sure it looks good!
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setPreview(currentAvatarUrl || null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={isUploading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUploader;

