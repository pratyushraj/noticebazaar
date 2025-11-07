import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog'; // Import the new hook
import { useAddDocument } from '@/lib/hooks/useDocuments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCases } from '@/lib/hooks/useCases'; // Import useCases to get client's cases
import { useCategories } from '@/lib/hooks/useCategories'; // Import useCategories
import { Document } from '@/types'; // Import Document type for status

interface DocumentUploadFormProps {
  onUploadSuccess: () => void;
  onClose: () => void;
  initialCaseId?: string | null; // New prop for pre-selecting a case
  initialCategoryId?: string | null; // New prop for pre-selecting a category
  initialDocumentName?: string; // New prop for pre-filling document name
}

const DocumentUploadForm = ({ onUploadSuccess, onClose, initialCaseId = null, initialCategoryId = null, initialDocumentName }: DocumentUploadFormProps) => {
  const { user, profile } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>(initialDocumentName || '');
  const [selectedCase, setSelectedCase] = useState<string | null>(initialCaseId); // State for selected case
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryId); // State for selected category
  const [documentStatus, setDocumentStatus] = useState<Document['status']>('Awaiting Review'); // Default to Awaiting Review for checklist items

  // Initialize the useAddDocument hook
  const addDocumentMutation = useAddDocument();
  const addActivityLogMutation = useAddActivityLog(); // Initialize the new hook

  // Update documentName and selectedCategory/Case when initial props change
  useEffect(() => {
    setDocumentName(initialDocumentName || '');
    setSelectedCase(initialCaseId);
    setSelectedCategory(initialCategoryId);
    // If an initialDocumentName is provided, default status to 'Awaiting Review'
    // Otherwise, keep the default 'Approved' for general uploads.
    setDocumentStatus(initialDocumentName ? 'Awaiting Review' : 'Approved');
  }, [initialDocumentName, initialCaseId, initialCategoryId]);

  // Fetch client's cases for the dropdown
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useCases({
    clientId: profile?.id,
    enabled: !!profile?.id,
    disablePagination: true, // Fetch all cases
    joinProfile: false,
  });
  const cases = casesData?.data || [];

  // Fetch client's categories for the dropdown
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useCategories({
    clientId: profile?.id,
    enabled: !!profile?.id,
    includeSystemCategories: true, // Include system categories
    disablePagination: true, // Fetch all categories
  });
  const categories = categoriesData?.data || [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // Only pre-fill name from file if initialDocumentName is not provided
      if (!initialDocumentName) {
        setDocumentName(event.target.files[0].name.split('.').slice(0, -1).join('.'));
      }
    } else {
      setSelectedFile(null);
      if (!initialDocumentName) { // Only clear if not pre-filled
        setDocumentName('');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !profile) {
      toast.error('Please select a file and ensure you are logged in.');
      return;
    }

    if (!documentName.trim()) {
      toast.error('Please provide a name for the document.');
      return;
    }

    // Ensure at least one of case or category is selected, or neither for unlinked
    if (selectedCase && selectedCategory) {
      toast.error('A document can only be associated with either a case OR a category, not both.');
      return;
    }

    try {
      await addDocumentMutation.mutateAsync({
        file: selectedFile,
        documentName: documentName.trim(),
        userId: user.id,
        profileId: profile.id,
        caseId: selectedCase, // Pass selected case ID
        categoryId: selectedCategory, // Pass selected category ID
        status: documentStatus, // Pass selected status
      });
      toast.success('Document uploaded successfully!');
      
      let activityDescription = `You uploaded a new document: "${documentName.trim()}"`;
      if (selectedCase) {
        activityDescription += ` to case "${cases.find(c => c.id === selectedCase)?.title}"`;
      } else if (selectedCategory) {
        activityDescription += ` to category "${categories.find(cat => cat.id === selectedCategory)?.name}"`;
      }

      await addActivityLogMutation.mutateAsync({ // Use the new hook
        description: activityDescription,
        client_id: profile.id,
      });
      setSelectedFile(null);
      setDocumentName(initialDocumentName || ''); // Reset to initial or empty
      setSelectedCase(initialCaseId); // Reset to initial case or null
      setSelectedCategory(initialCategoryId); // Reset to initial category or null
      setDocumentStatus(initialDocumentName ? 'Awaiting Review' : 'Approved'); // Reset status
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Upload failed', { description: error.message });
    }
  };

  const isSubmitting = addDocumentMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="documentName">Document Name</Label>
        <Input
          id="documentName"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          disabled={isSubmitting || !!initialDocumentName} // Disable if initial name is provided
        />
      </div>
      <div>
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          onChange={handleFileChange}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="case">Associate with Case (Optional)</Label>
        <Select
          onValueChange={(value) => {
            setSelectedCase(value === 'null' ? null : value);
            if (value !== 'null') setSelectedCategory(null); // Clear category if case is selected
          }}
          value={selectedCase || 'null'}
          disabled={isSubmitting || isLoadingCases || !!selectedCategory || !!initialCaseId} // Disable if category is selected or initialCaseId is set
        >
          <SelectTrigger id="case">
            <SelectValue placeholder="Select a case" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">No Case</SelectItem>
            {isLoadingCases ? (
              <SelectItem value="loading" disabled>Loading cases...</SelectItem>
            ) : (
              cases.map((_case) => (
                <SelectItem key={_case.id} value={_case.id}>
                  {_case.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="category">Associate with Category (Optional)</Label>
        <Select
          onValueChange={(value) => {
            setSelectedCategory(value === 'null' ? null : value);
            if (value !== 'null') setSelectedCase(null); // Clear case if category is selected
          }}
          value={selectedCategory || 'null'}
          disabled={isSubmitting || isLoadingCategories || !!selectedCase || !!initialCategoryId} // Disable if case is selected or initialCategoryId is set
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">No Category</SelectItem>
            {isLoadingCategories ? (
              <SelectItem value="loading" disabled>Loading categories...</SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Document Status</Label>
        <Select onValueChange={(value: Document['status']) => setDocumentStatus(value)} value={documentStatus} disabled={isSubmitting || !!initialDocumentName}> {/* Disable if initial name is provided */}
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Awaiting Review">Awaiting Review</SelectItem>
            <SelectItem value="Action Required">Action Required</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={!selectedFile || !documentName.trim() || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            'Upload Document'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default DocumentUploadForm;