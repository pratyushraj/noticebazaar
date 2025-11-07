"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Consultation, Profile } from '@/types';
import { useConsultations, useUpdateConsultationStatus, useDeleteConsultation } from '@/lib/hooks/useConsultations';
import { Label } from '@/components/ui/label';
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminConsultations = () => {
  const { session, loading, isAdmin, profile } = useSession();
  const [filterStatus, setFilterStatus] = useState<Consultation['status'] | 'All'>('All');
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by consultationsData.count
    pageSize: pageSize,
  });

  // Fetch consultations using the new hook with pagination
  const { data: consultationsData, isLoading: isLoadingConsultations, error: consultationsError } = useConsultations({
    status: filterStatus,
    enabled: !!profile && isAdmin,
    page: currentPage,
    pageSize: pageSize,
  });

  const consultations = consultationsData?.data || [];
  const totalCount = consultationsData?.count || 0;

  // Update totalPages in pagination hook when consultationsData is available
  useEffect(() => {
    if (consultationsData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [consultationsData, currentPage, setCurrentPage]);

  // Mutations for updating status and deleting
  const updateStatusMutation = useUpdateConsultationStatus();
  const deleteConsultationMutation = useDeleteConsultation();
  const addActivityLogMutation = useAddActivityLog(); // Initialize the new hook

  useEffect(() => {
    if (consultationsError) {
      toast.error('Error fetching consultations', { description: consultationsError.message });
    }
  }, [consultationsError]);

  const handleUpdateStatus = async (consultationId: string, newStatus: Consultation['status']) => {
    const consultationToUpdate = consultations?.find(c => c.id === consultationId);
    try {
      await updateStatusMutation.mutateAsync({ id: consultationId, status: newStatus });
      toast.success(`Consultation status updated to ${newStatus}!`);
      if (consultationToUpdate) {
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Updated consultation status to "${newStatus}" for client ${consultationToUpdate.profiles?.first_name || ''} ${consultationToUpdate.profiles?.last_name || ''}`,
          client_id: consultationToUpdate.client_id,
        });
      }
    } catch (error: any) {
      toast.error('Failed to update consultation status', { description: error.message });
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    const consultationToDelete = consultations?.find(c => c.id === consultationId);
    try {
      await deleteConsultationMutation.mutateAsync(consultationId);
      toast.success('Consultation deleted successfully!');
      if (consultationToDelete) {
        await addActivityLogMutation.mutateAsync({ // Use the new hook
          description: `Deleted consultation for client ${consultationToDelete.profiles?.first_name || ''} ${consultationToDelete.profiles?.last_name || ''}`,
          client_id: consultationToDelete.client_id,
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete consultation', { description: error.message });
    }
  };

  const getStatusBadgeVariant = (status: Consultation['status']) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      case 'Completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">Manage Client Consultations</h1>

      <div className="mb-6 flex items-center space-x-4">
        <Label htmlFor="status-filter" className="text-foreground">Filter by Status:</Label>
        <Select onValueChange={(value: Consultation['status'] | 'All') => {
          setFilterStatus(value);
          setCurrentPage(1); // Reset to first page on filter change
        }} value={filterStatus}>
          <SelectTrigger id="status-filter" className="w-[180px] bg-input text-foreground border-border">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Consultation Requests</h2>
        {isLoadingConsultations ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading consultations...</p>
          </div>
        ) : consultations && consultations.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Preferred Date</TableHead>
                  <TableHead className="text-muted-foreground">Preferred Time</TableHead>
                  <TableHead className="text-muted-foreground">Topic</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.map((consultation) => (
                  <TableRow key={consultation.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {consultation.profiles ? `${consultation.profiles.first_name} ${consultation.profiles.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(consultation.preferred_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">{consultation.preferred_time}</TableCell>
                    <TableCell className="text-muted-foreground">{consultation.topic || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(consultation.status)}>
                        {consultation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      {consultation.status === 'Pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(consultation.id, 'Approved')}
                            disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id}
                            className="text-primary border-border hover:bg-accent hover:text-foreground"
                          >
                            {updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUpdateStatus(consultation.id, 'Rejected')}
                            disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id}
                          >
                            {updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      {(consultation.status === 'Approved' || consultation.status === 'Rejected') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(consultation.id, 'Completed')}
                          disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id}
                          className="text-secondary-foreground border-border hover:bg-secondary/80"
                        >
                          {updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          <span className="ml-1">Complete</span>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={deleteConsultationMutation.isPending && deleteConsultationMutation.variables === consultation.id} className="text-destructive hover:bg-accent">
                            {deleteConsultationMutation.isPending && deleteConsultationMutation.variables === consultation.id ? (
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
                              This action cannot be undone. This will permanently delete this consultation request.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteConsultation(consultation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                disabled={currentPage === 1 || isLoadingConsultations}
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
                disabled={currentPage === totalPages || isLoadingConsultations}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No consultation requests found.</p>
        )}
      </section>
    </>
  );
};

export default AdminConsultations;