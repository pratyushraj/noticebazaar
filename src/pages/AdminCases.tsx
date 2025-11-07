"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription, // Import DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { Case, Profile } from '@/types';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { useCases, useAddCase, useUpdateCase, useDeleteCase } from '@/lib/hooks/useCases';
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminCases = () => {
  const { session, loading: sessionLoading, isAdmin, profile: adminProfile } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by casesData.count
    pageSize: pageSize,
  });

  // Form state
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [deadline, setDeadline] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  // Fetch clients using the new hook for the dropdown
  const { data: clientsData, isLoading: isLoadingClients, error: clientsError } = useProfiles({
    role: 'client', // Filter by role 'client'
    enabled: !!adminProfile && isAdmin,
    disablePagination: true, // Fetch all clients
  });
  const clients = clientsData?.data || [];


  // Fetch cases using the new hook with pagination
  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useCases({
    enabled: !!adminProfile && isAdmin,
    page: currentPage,
    pageSize: pageSize,
  });

  const cases = casesData?.data || [];
  const totalCount = casesData?.count || 0;

  // Update totalPages in pagination hook when casesData is available
  useEffect(() => {
    if (casesData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [casesData, currentPage, setCurrentPage]);

  // Mutations for adding, updating, and deleting cases
  const addCaseMutation = useAddCase();
  const updateCaseMutation = useUpdateCase();
  const deleteCaseMutation = useDeleteCase();
  const addActivityLogMutation = useAddActivityLog(); // Initialize the new hook

  useEffect(() => {
    if (clientsError) {
      toast.error('Error fetching clients for case form', { description: clientsError.message });
    }
  }, [clientsError]);

  useEffect(() => {
    if (casesError) {
      toast.error('Error fetching cases', { description: casesError.message });
    }
  }, [casesError]);

  const resetForm = () => {
    setTitle('');
    setStatus('In Progress');
    setDeadline('');
    setSelectedClient('');
    setCurrentCase(null);
  };

  const handleOpenDialog = (caseToEdit?: Case) => {
    if (caseToEdit) {
      setCurrentCase(caseToEdit);
      setTitle(caseToEdit.title);
      setStatus(caseToEdit.status);
      setDeadline(caseToEdit.deadline ? caseToEdit.deadline.split('T')[0] : '');
      setSelectedClient(caseToEdit.client_id);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !selectedClient) {
      toast.error('Title and Client are required.');
      return;
    }

    const caseData = {
      title: title.trim(),
      status,
      deadline: deadline || null,
      client_id: selectedClient,
    };

    try {
      if (currentCase) {
        // Update case
        await updateCaseMutation.mutateAsync({ id: currentCase.id, ...caseData });
        toast.success('Case updated successfully!');
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Updated case: "${title.trim()}" for client ${clientsData?.data?.find(c => c.id === selectedClient)?.first_name || ''} ${clientsData?.data?.find(c => c.id === selectedClient)?.last_name || ''}`,
          client_id: selectedClient,
        });
      } else {
        // Add new case
        await addCaseMutation.mutateAsync(caseData);
        toast.success('Case added successfully!');
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Added new case: "${title.trim()}" for client ${clientsData?.data?.find(c => c.id === selectedClient)?.first_name || ''} ${clientsData?.data?.find(c => c.id === selectedClient)?.last_name || ''}`,
          client_id: selectedClient,
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(currentCase ? 'Failed to update case' : 'Failed to add case', { description: error.message });
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    const caseToDelete = cases?.find(c => c.id === caseId);
    try {
      await deleteCaseMutation.mutateAsync(caseId);
      toast.success('Case deleted successfully!');
      if (caseToDelete) {
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Deleted case: "${caseToDelete.title}" for client ${caseToDelete.profiles?.first_name || ''} ${caseToDelete.profiles?.last_name || ''}`,
          client_id: caseToDelete.client_id,
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete case', { description: error.message });
    }
  };

  const isSubmitting = addCaseMutation.isPending || updateCaseMutation.isPending;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manage Client Cases</h1>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Case
        </Button>
      </div>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Cases</h2>
        {isLoadingCases ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading cases...</p>
          </div>
        ) : cases && cases.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Title</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Deadline</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((_case) => (
                  <TableRow key={_case.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{_case.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {_case.profiles ? `${_case.profiles.first_name} ${_case.profiles.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        _case.status === 'Completed' ? 'default' :
                        _case.status === 'In Progress' ? 'secondary' : 'outline'
                      }>
                        {_case.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{_case.deadline ? new Date(_case.deadline).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(_case)} disabled={isSubmitting} className="text-primary border-border hover:bg-accent hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteCaseMutation.isPending && deleteCaseMutation.variables === _case.id}>
                            {deleteCaseMutation.isPending && deleteCaseMutation.variables === _case.id ? (
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
                              This action cannot be undone. This will permanently delete the case
                              "{_case.title}" and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCase(_case.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                disabled={currentPage === 1 || isLoadingCases}
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
                disabled={currentPage === totalPages || isLoadingCases}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No cases found.</p>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="admin-case-dialog-title"
          aria-describedby="admin-case-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="admin-case-dialog-title">{currentCase ? 'Edit Case' : 'Add New Case'}</DialogTitle>
            <DialogDescription id="admin-case-dialog-description" className="text-muted-foreground">
              {currentCase ? 'Update the details of this case.' : 'Fill in the details to add a new case for a client.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right text-foreground">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right text-foreground">
                Client
              </Label>
              <Select onValueChange={setSelectedClient} value={selectedClient} disabled={isSubmitting || isLoadingClients}>
                <SelectTrigger id="client" className="col-span-3 bg-input text-foreground border-border">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {isLoadingClients ? (
                    <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                  ) : (
                    clientsData?.data?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right text-foreground">
                Status
              </Label>
              <Select onValueChange={setStatus} value={status} disabled={isSubmitting}>
                <SelectTrigger id="status" className="col-span-3 bg-input text-foreground border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Awaiting Review">Awaiting Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right text-foreground">
                Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-foreground border-border hover:bg-accent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingClients || !selectedClient || !title.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  currentCase ? 'Save Changes' : 'Add Case'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCases;