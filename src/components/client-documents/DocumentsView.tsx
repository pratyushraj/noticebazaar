"use client";

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, File, Star, Plus, MoreVertical, FileText, FileUp, FileWarning, FileArchive, FileCode, FileImage, FileAudio, FileVideo, FolderOpen, ArrowLeft, Search, Filter, ArrowDownWideNarrow, ArrowUpWideNarrow, Tag, Settings, Briefcase, Handshake, Wallet, Badge as BadgeIcon, Home, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDocuments, useUpdateDocument } from '@/lib/hooks/useDocuments';
import { usePagination } from '@/lib/hooks/usePagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Document, Category } from '@/types';
import BusinessIncorporationChecklist from './BusinessIncorporationChecklist'; // Import the new component
import IdentityDocumentsChecklist from './IdentityDocumentsChecklist'; // Import the new IdentityDocumentsChecklist

// Map system category names to Lucide React icons (re-declared here for self-containment)
const systemCategoryIcons: { [key: string]: React.ElementType } = {
  'Identity Documents': BadgeIcon,
  'Financial Records': Wallet,
  'Property Documents': Home,
  'Business & Incorporation': Briefcase,
  'Contracts & Agreements': Handshake,
};

interface DocumentsViewProps {
  profileId: string | undefined;
  currentView: { type: 'case'; id: string } | { type: 'category'; id: string } | { type: 'unlinked' };
  setCurrentView: (view: { type: 'overview' }) => void;
  currentFolderTitle: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: Document['status'] | 'All';
  setStatusFilter: (status: Document['status'] | 'All') => void;
  sortBy: 'uploaded_at' | 'name';
  setSortBy: (sort: 'uploaded_at' | 'name') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  currentPage: number;
  totalPages: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  setCurrentPage: (page: number) => void;
  refetchDocuments: () => void;
  businessIncCategory: Category | undefined; // New prop for Business & Incorporation category
  identityDocCategory: Category | undefined; // New prop for Identity Documents category
  onUploadChecklistDocument: (documentName: string, categoryId: string) => void; // New prop for checklist upload
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  profileId,
  currentView,
  setCurrentView,
  currentFolderTitle,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currentPage,
  totalPages,
  handlePreviousPage,
  handleNextPage,
  setCurrentPage,
  refetchDocuments,
  businessIncCategory,
  identityDocCategory, // Destructure new prop
  onUploadChecklistDocument,
}) => {
  const updateDocumentMutation = useUpdateDocument();

  const { data: documentsData, isLoading: isLoadingDocuments, error: documentsError } = useDocuments({
    clientId: profileId,
    enabled: !!profileId,
    page: currentPage,
    pageSize: 10, // Hardcoded pageSize for this view
    joinProfile: false,
    searchTerm: searchTerm,
    caseId: currentView.type === 'case' ? currentView.id : (currentView.type === 'unlinked' ? null : undefined),
    categoryId: currentView.type === 'category' ? currentView.id : (currentView.type === 'unlinked' ? null : undefined),
    statusFilter: statusFilter,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  const documents = documentsData?.data || [];

  useEffect(() => {
    if (documentsError) {
      toast.error('Error fetching documents', { description: documentsError.message });
    }
  }, [documentsError]);

  const handleToggleFavorite = async (documentId: string, currentStatus: boolean) => {
    try {
      await updateDocumentMutation.mutateAsync({ id: documentId, is_favorite: !currentStatus });
      toast.success(`Document ${!currentStatus ? 'added to' : 'removed from'} favorites!`);
      refetchDocuments(); // Refetch to update the list
    } catch (error: any) {
      toast.error('Failed to update favorite status', { description: error.message });
    }
  };

  const getDocumentIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6 text-purple-500" />;
      case 'zip':
      case 'rar':
        return <FileArchive className="h-6 w-6 text-gray-500" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="h-6 w-6 text-yellow-500" />;
      case 'mp4':
      case 'mov':
        return <FileVideo className="h-6 w-6 text-teal-500" />;
      case 'txt':
        return <FileText className="h-6 w-6 text-gray-400" />;
      case 'js':
      case 'ts':
      case 'json':
      case 'html':
      case 'css':
        return <FileCode className="h-6 w-6 text-indigo-500" />;
      default:
        return <File className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: Document['status']) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Awaiting Review':
        return 'secondary';
      case 'Action Required':
        return 'destructive';
      case 'Rejected':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const isBusinessIncCategoryView = currentView.type === 'category' && currentView.id === businessIncCategory?.id;
  const isIdentityDocCategoryView = currentView.type === 'category' && currentView.id === identityDocCategory?.id;

  return (
    <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => setCurrentView({ type: 'overview' })} className="text-primary hover:text-primary/80">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Folders
        </Button>
        <h2 className="text-xl font-semibold text-foreground">{currentFolderTitle}</h2>
        <div></div> {/* Placeholder for alignment */}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9 bg-input text-foreground border-border"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset pagination on search
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-shrink-0 text-primary border-border hover:bg-accent hover:text-foreground">
              <Filter className="h-4 w-4 mr-2" /> Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card text-foreground border-border">
            <DropdownMenuItem asChild onClick={() => { setStatusFilter('All'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">All Statuses</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild onClick={() => { setStatusFilter('Approved'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Approved</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => { setStatusFilter('Awaiting Review'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Awaiting Review</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => { setStatusFilter('Action Required'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Action Required</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => { setStatusFilter('Rejected'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Rejected</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-shrink-0 text-primary border-border hover:bg-accent hover:text-foreground">
              {sortBy === 'uploaded_at' ? 'Sort by Date' : 'Sort by Name'} {sortOrder === 'desc' ? <ArrowDownWideNarrow className="ml-2 h-4 w-4" /> : <ArrowUpWideNarrow className="ml-2 h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card text-foreground border-border">
            <DropdownMenuItem asChild onClick={() => { setSortBy('uploaded_at'); setSortOrder('desc'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Date Uploaded (Newest first)</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => { setSortBy('uploaded_at'); setSortOrder('asc'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Date Uploaded (Oldest first)</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild onClick={() => { setSortBy('name'); setSortOrder('asc'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Document Name (A-Z)</div>
            </DropdownMenuItem>
            <DropdownMenuItem asChild onClick={() => { setSortBy('name'); setSortOrder('desc'); setCurrentPage(1); }}>
              <div className="flex items-center w-full">Document Name (Z-A)</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoadingDocuments ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Loading documents...</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="bg-card p-4 rounded-lg shadow-sm border border-border flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-3 flex-shrink-0">
                    {getDocumentIcon(doc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-bold text-foreground text-lg break-words flex-1">{doc.name}</h3>
                      {doc.status && doc.status.toLowerCase().trim() !== 'approved' && ( // Conditionally render badge
                        <Badge variant={getStatusBadgeVariant(doc.status)} className="text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {doc.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {doc.cases?.title && `Case: ${doc.cases.title}`}
                      {doc.categories?.name && `Category: ${doc.categories.name}`}
                      {!doc.cases?.title && !doc.categories?.name && `Unlinked`}
                      {' • '}
                      Uploaded On: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card text-foreground border-border">
                        <DropdownMenuItem asChild className="hover:bg-accent hover:text-foreground">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <span className="flex items-center"> {/* Added wrapper span */}
                              <Eye className="h-4 w-4 mr-2" /> View
                            </span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="hover:bg-accent hover:text-foreground">
                          <a href={doc.url} download={doc.name} className="flex items-center">
                            <span className="flex items-center"> {/* Added wrapper span */}
                              <FileUp className="h-4 w-4 mr-2" /> Download
                            </span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem asChild onClick={() => handleToggleFavorite(doc.id, doc.is_favorite)} className="hover:bg-accent hover:text-foreground">
                          <div className="flex items-center w-full"> {/* Use div as single child */}
                            <span> {/* Added wrapper span */}
                              <Star className={`h-4 w-4 mr-2 ${doc.is_favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                              <span>{doc.is_favorite ? 'Unfavorite' : 'Favorite'}</span>
                            </span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
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
        ) : isBusinessIncCategoryView ? (
          <BusinessIncorporationChecklist
            uploadedDocuments={documents}
            isLoadingDocuments={isLoadingDocuments}
            onUploadDocument={onUploadChecklistDocument}
            businessIncCategory={businessIncCategory}
          />
        ) : isIdentityDocCategoryView ? ( // New conditional rendering for Identity Documents
          <IdentityDocumentsChecklist
            uploadedDocuments={documents}
            isLoadingDocuments={isLoadingDocuments}
            onUploadDocument={onUploadChecklistDocument}
            identityDocCategory={identityDocCategory}
          />
        ) : (
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No documents found in this {currentFolderTitle.toLowerCase()}.</p>
          </Card>
        )}
    </section>
  );
};

export default DocumentsView;