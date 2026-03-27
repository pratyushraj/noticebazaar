"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Tag, FileUp, XCircle, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger, // Import DialogTrigger
} from '@/components/ui/dialog';
import DocumentUploadForm from '@/components/forms/DocumentUploadForm';
import ConsultationBookingForm from '@/components/forms/ConsultationBookingForm';
import { useCases } from '@/lib/hooks/useCases';
import { useCategories, useDeleteCategory } from '@/lib/hooks/useCategories';
import { Case, Category, Document } from '@/types';
import { usePagination } from '@/lib/hooks/usePagination';

// Import the new sub-components
import DocumentsView from '@/components/client-documents/DocumentsView';
import OverviewView from '@/components/client-documents/OverviewView';
import CategoryManagementForm from '@/components/forms/CategoryManagementForm';

type DocumentView = { type: 'case'; id: string } | { type: 'category'; id: string } | { type: 'unlinked' } | { type: 'overview' };

const ClientDocuments: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const pageSize = 10;
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryForm] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentView, setCurrentView] = useState<DocumentView>({ type: 'overview' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Document['status'] | 'All'>('All');
  const [sortBy, setSortBy] = useState<'uploaded_at' | 'name'>('uploaded_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [uploadFormInitialDocName, setUploadFormInitialDocName] = useState<string | undefined>(undefined);

  // Fetch cases for the folder view (only when in overview)
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useCases({
    clientId: profile?.id,
    enabled: !!profile?.id && currentView.type === 'overview',
    disablePagination: true,
    joinProfile: false,
  });
  const cases = casesData?.data || [];

  // Fetch categories for the folder view (only when in overview or to find Business & Incorporation ID)
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError, refetch: refetchCategories } = useCategories({
    clientId: profile?.id,
    enabled: !!profile?.id, // Always enabled to find system categories
    includeSystemCategories: true,
    disablePagination: true,
  });
  const categories = categoriesData?.data || [];

  // Find the 'Business & Incorporation' category
  const businessIncCategory = useMemo(() => {
    return categories.find(cat => cat.name === 'Business & Incorporation' && cat.is_system_category);
  }, [categories]);

  // Find the 'Identity Documents' category
  const identityDocCategory = useMemo(() => {
    return categories.find(cat => cat.name === 'Identity Documents' && cat.is_system_category);
  }, [categories]);

  // Pagination for documents (used by DocumentsView)
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by DocumentsView's useDocuments hook
    pageSize: pageSize,
  });

  // Refetch function for documents (passed to DocumentsView and upload form)
  const refetchDocuments = useCallback(() => {
    // Invalidate the documents query to trigger refetch in DocumentsView
    // This will be handled by the DocumentsView component itself, but we need a placeholder here.
  }, []);

  const deleteCategoryMutation = useDeleteCategory();

  useEffect(() => {
    if (casesError) {
      toast.error('Error fetching cases', { description: casesError.message });
    }
  }, [casesError]);

  useEffect(() => {
    if (categoriesError) {
      toast.error('Error fetching categories', { description: categoriesError.message });
    }
  }, [categoriesError]);

  const handleOpenCategoryForm = (category?: Category) => {
    setEditingCategory(category || null);
    setIsCategoryForm(true);
    setIsQuickActionsOpen(false); // Close quick actions dialog if open
  };

  const handleCategorySaveSuccess = () => {
    refetchCategories();
    setIsCategoryForm(false);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!profile?.id) {
      toast.error('User profile not found. Cannot delete category.');
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync({ id: categoryId, client_id: profile.id });
      toast.success(`Category "${categoryName}" deleted successfully!`);
      refetchCategories();
      // Documents previously in this category will now be unlinked, so refetch documents
      // This refetch will be triggered by the DocumentsView component if it's active
    } catch (error: any) {
      toast.error('Failed to delete category', { description: error.message });
    }
  };

  const handleUploadFromChecklist = (documentName: string, categoryId: string) => {
    setUploadFormInitialDocName(documentName);
    setCurrentView({ type: 'category', id: categoryId }); // Ensure we are in the correct category view
    setIsUploadDialogOpen(true);
    setIsQuickActionsOpen(false);
  };

  const currentFolderTitle = useMemo(() => {
    if (currentView.type === 'case') {
      const caseItem = cases.find(c => c.id === currentView.id);
      return caseItem ? `Case: ${caseItem.title}` : "Unknown Case";
    } else if (currentView.type === 'category') {
      const categoryItem = categories.find(c => c.id === currentView.id);
      return categoryItem ? `Category: ${categoryItem.name}` : "Unknown Category";
    } else if (currentView.type === 'unlinked') {
      return "Unlinked Documents";
    }
    return "All Documents";
  }, [currentView, cases, categories]);

  if (sessionLoading || isLoadingCases || isLoadingCategories) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading your secure vault...</p>
      </div>
    );
  }

  return (
    <>
      <div className="client-documents-page">
        <h1 className="text-3xl font-bold text-foreground mb-6">Your Secure Vault</h1>

        {currentView.type !== 'overview' ? (
          <DocumentsView
            profileId={profile?.id}
            currentView={currentView as any} // Cast to any as type narrowing is complex here
            setCurrentView={setCurrentView}
            currentFolderTitle={currentFolderTitle}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            currentPage={currentPage}
            totalPages={totalPages}
            handlePreviousPage={handlePreviousPage}
            handleNextPage={handleNextPage}
            setCurrentPage={setCurrentPage}
            refetchDocuments={refetchDocuments}
            businessIncCategory={businessIncCategory} // Pass the category
            identityDocCategory={identityDocCategory} // Pass the new identity doc category
            onUploadChecklistDocument={handleUploadFromChecklist} // Pass the handler
          />
        ) : (
          <OverviewView
            cases={cases}
            isLoadingCases={isLoadingCases}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
            setCurrentView={setCurrentView}
            handleOpenCategoryForm={handleOpenCategoryForm}
            handleDeleteCategory={handleDeleteCategory}
            setIsUploadDialogOpen={setIsUploadDialogOpen}
            setIsQuickActionsOpen={setIsQuickActionsOpen}
          />
        )}
      </div>

      <Dialog open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
        {/* Floating Action Button for Quick Actions */}
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 md:bottom-8 md:right-8 p-4 rounded-full shadow-lg bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90 z-50"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="client-quick-actions-title"
          aria-describedby="client-quick-actions-description"
        >
          <DialogHeader>
            <DialogTitle id="client-quick-actions-title">Quick Actions</DialogTitle>
            <DialogDescription id="client-quick-actions-description" className="text-muted-foreground">
              Choose an action to perform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => { setIsUploadDialogOpen(true); setIsQuickActionsOpen(false); }}
            >
              <FileUp className="h-5 w-5 text-foreground mb-1" />
              <span className="text-sm">Upload a Document</span>
              <span className="text-xs text-muted-foreground mt-1">Securely share files with your advisor.</span>
            </Button>
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => { handleOpenCategoryForm(); setIsQuickActionsOpen(false); }}
            >
              <Tag className="h-5 w-5 text-primary-foreground mb-1" />
              <span className="text-sm">Create New Category</span>
              <span className="text-xs text-primary-foreground/80 mt-1">Organize your documents with custom categories.</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        {/* Document Upload Dialog (triggered from Quick Actions or Category Dropdown) */}
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="client-doc-upload-title"
          aria-describedby="client-doc-upload-description"
        >
          <DialogHeader>
            <DialogTitle id="client-doc-upload-title">Upload New Document</DialogTitle>
            <DialogDescription id="client-doc-upload-description" className="text-muted-foreground">
              Select a file from your device and give it a name to upload it securely.
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadForm
            onUploadSuccess={() => { refetchDocuments(); setIsUploadDialogOpen(false); setUploadFormInitialDocName(undefined); }}
            onClose={() => { setIsUploadDialogOpen(false); setUploadFormInitialDocName(undefined); }}
            initialCaseId={currentView.type === 'case' ? currentView.id : null}
            initialCategoryId={currentView.type === 'category' ? currentView.id : null}
            initialDocumentName={uploadFormInitialDocName} // Pass the initial document name
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryForm}>
        {/* Category Management Dialog (triggered from Quick Actions or Category Dropdown) */}
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="client-category-manage-title"
          aria-describedby="client-category-manage-description"
        >
          <DialogHeader>
            <DialogTitle id="client-category-manage-title">{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            <DialogDescription id="client-category-manage-description" className="text-muted-foreground">
              {editingCategory ? 'Update the name of your custom category.' : 'Give your new category a name to organize your documents.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryManagementForm
            initialCategory={editingCategory}
            onSaveSuccess={handleCategorySaveSuccess}
            onClose={() => setIsCategoryForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientDocuments;