"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { TaxFiling } from '@/types';
import { useUpdateTaxFiling } from '@/lib/hooks/useTaxFilings';
import { useSession } from '@/contexts/SessionContext';

interface FilingUploadFormProps {
  filing: TaxFiling;
  onUploadSuccess: () => void;
  onClose: () => void;
}

const FilingUploadForm: React.FC<FilingUploadFormProps> = ({ filing, onUploadSuccess, onClose }) => {
  const { profile } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const updateFilingMutation = useUpdateTaxFiling();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a document to upload.');
      return;
    }
    if (!profile?.id) {
      toast.error('User profile not found.');
      return;
    }

    try {
      await updateFilingMutation.mutateAsync({
        id: filing.id,
        creator_id: profile.id,
        status: 'Filed',
        filed_date: new Date().toISOString().split('T')[0],
        filing_document_file: selectedFile,
      });
      
      toast.success(`Filing for ${filing.filing_type.toUpperCase().replace(/_/g, ' ')} marked as filed!`);
      onUploadSuccess();
      onClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = updateFilingMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-secondary rounded-lg border border-border">
        <p className="text-sm font-medium text-foreground">Filing: {filing.filing_type.toUpperCase().replace(/_/g, ' ')}</p>
        <p className="text-xs text-muted-foreground">Due Date: {new Date(filing.due_date).toLocaleDateString()}</p>
      </div>
      
      <div>
        <Label htmlFor="filingDocument">Upload Document (PDF/Image) *</Label>
        <Input
          id="filingDocument"
          type="file"
          onChange={handleFileChange}
          disabled={isSubmitting}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <p className="text-xs text-muted-foreground mt-1">Accepted formats: PDF, JPG, JPEG, PNG.</p>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedFile || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading & Filing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" /> Upload & Mark Filed
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default FilingUploadForm;