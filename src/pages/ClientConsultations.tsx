"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarDays, XCircle, Eye } from 'lucide-react'; // Added Eye icon
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useConsultations, useUpdateConsultationStatus } from '@/lib/hooks/useConsultations';
import { Consultation } from '@/types';
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
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import { usePagination } from '@/lib/hooks/usePagination';
import { Card, CardContent } from '@/components/ui/card'; // Import Card components
import { Link } from 'react-router-dom'; // Import Link

const ClientConsultations = () => {
  const { profile, loading: sessionLoading } = useSession();
  const pageSize = 10;

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined,
    pageSize: pageSize,
  });

  const { data: consultationsData, isLoading: isLoadingConsultations, error: consultationsError, refetch: refetchConsultations } = useConsultations({
    clientId: profile?.id,
    enabled: !!profile?.id,
    page: currentPage,
    pageSize: pageSize,
    joinProfile: false,
  });

  const consultations = consultationsData?.data || [];
  const totalCount = consultationsData?.count || 0;

  useEffect(() => {
    if (consultationsData) {
      setCurrentPage(currentPage);
    }
  }, [consultationsData, currentPage, setCurrentPage]);

  const updateStatusMutation = useUpdateConsultationStatus();
  const addActivityLogMutation = useAddActivityLog();

  useEffect(() => {
    if (consultationsError) {
      toast.error('Error fetching consultations', { description: consultationsError.message });
    }
  }, [consultationsError]);

  const getStatusBadgeVariant = (status: Consultation['status']) => {
    switch (status) {
      case 'Approved':
        return 'success';
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

  const handleCancelConsultation = async (consultationId: string) => {
    const consultationToCancel = consultations?.find(c => c.id === consultationId);
    if (!profile) {
      toast.error('User profile not found. Cannot cancel consultation.');
      return;
    }
    try {
      await updateStatusMutation.mutateAsync({ id: consultationId, status: 'Rejected' });
      toast.success('Consultation request cancelled successfully!');
      if (consultationToCancel) {
        await addActivityLogMutation.mutateAsync({
          description: `Cancelled consultation for ${new Date(consultationToCancel.preferred_date).toLocaleDateString()} at ${consultationToCancel.preferred_time}`,
          client_id: profile.id,
        });
      }
      refetchConsultations();
    } catch (error: any) {
      toast.error('Failed to cancel consultation', { description: error.message });
    }
  };

  if (sessionLoading || isLoadingConsultations) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading your consultations...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">📅 My Consultations</h1>

      <section className="bg-card p-6 rounded-lg shadow-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Your Consultation Requests</h2>
        {consultations && consultations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {consultations.map((consultation) => (
                <Card key={consultation.id} className="bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div className="flex-1 mb-3 sm:mb-0">
                    <p className="font-medium text-foreground text-lg">{new Date(consultation.preferred_date).toLocaleDateString()} at {consultation.preferred_time}</p>
                    <p className="text-sm text-muted-foreground">Topic: {consultation.topic || 'N/A'}</p>
                    <Badge variant={getStatusBadgeVariant(consultation.status)} className="mt-1">
                      {consultation.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Requested On: {new Date(consultation.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto justify-end">
                    <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground">
                      <Link to="/client-consultations">
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Link>
                    </Button>
                    {consultation.status === 'Pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id}>
                            {updateStatusMutation.isPending && updateStatusMutation.variables?.id === consultation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to cancel this consultation?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              This action cannot be undone. The consultation request for {new Date(consultation.preferred_date).toLocaleDateString()} at {consultation.preferred_time} will be marked as rejected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Keep</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelConsultation(consultation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Cancel Consultation
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </Card>
              ))}
            </div>
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
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No consultation requests found.</p>
          </Card>
        )}
      </section>
    </>
  );
};

export default ClientConsultations;