import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Eye } from 'lucide-react'; // Changed Download to Eye
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog'; // Import the new hook
import { Document, Profile } from '@/types';
import { useDocuments, useDeleteDocument } from '@/lib/hooks/useDocuments';
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminDocuments = () => {
  const { session, loading, profile, isAdmin } = useSession();
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by documentsData.count
    pageSize: pageSize,
  });

  // Fetch documents using the new hook with pagination
  const { data: documentsData, isLoading: isLoadingDocuments, error: documentsError } = useDocuments({
    enabled: !!profile && isAdmin,
    page: currentPage,
    pageSize: pageSize,
  });

  const documents = documentsData?.data || [];
  const totalCount = documentsData?.count || 0;

  // Update totalPages in pagination hook when documentsData is available
  useEffect(() => {
    if (documentsData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [documentsData, currentPage, setCurrentPage]);

  // Mutation for deleting documents
  const deleteDocumentMutation = useDeleteDocument();
  const addActivityLogMutation = useAddActivityLog(); // Initialize the new hook

  useEffect(() => {
    if (documentsError) {
      toast.error('Error fetching documents', { description: documentsError.message });
    }
  }, [documentsError]);

  const handleDeleteDocument = async (documentId: string, documentUrl: string) => {
    const documentToDelete = documents?.find(doc => doc.id === documentId);
    try {
      await deleteDocumentMutation.mutateAsync({ id: documentId, url: documentUrl });
      toast.success('Document deleted successfully!');
      if (documentToDelete) {
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Deleted document: "${documentToDelete.name}" for client ${documentToDelete.profiles?.first_name || ''} ${documentToDelete.profiles?.last_name || ''}`,
          client_id: documentToDelete.client_id, // Log with client_id if available
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete document', { description: error.message });
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">Manage Client Documents</h1>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Uploaded Documents</h2>
        {isLoadingDocuments ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading documents...</p>
          </div>
        ) : documents && documents.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Document Name</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Uploaded On</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{doc.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.profiles ? `${doc.profiles.first_name} ${doc.profiles.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" /> View Document
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteDocumentMutation.isPending && deleteDocumentMutation.variables?.id === doc.id}>
                            {deleteDocumentMutation.isPending && deleteDocumentMutation.variables?.id === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              This action cannot be undone. This will permanently delete the document
                              "{doc.name}" from the storage and database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDocument(doc.id, doc.url)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoadingDocuments}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoadingDocuments}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No documents found.</p>
        )}
      </section>
    </>
  );
};

export default AdminDocuments;