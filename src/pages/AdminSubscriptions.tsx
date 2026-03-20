"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Trash2, PlusCircle } from 'lucide-react';
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
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import { Subscription, Profile } from '@/types';
import { useAdminSubscriptions, useUpdateSubscription, useDeleteSubscription, useAddSubscription } from '@/lib/hooks/useSubscriptions'; // Updated import
import { useProfiles } from '@/lib/hooks/useProfiles'; // To get client names for new subscriptions
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminSubscriptions = () => {
  const { session, loading: sessionLoading, isAdmin, profile: adminProfile } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by subscriptionsData.count
    pageSize: pageSize,
  });

  // Form state
  const [planName, setPlanName] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedClient, setSelectedClient] = useState(''); // For adding new subscriptions

  // Fetch all subscriptions using the new hook with pagination
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions, error: subscriptionsError } = useAdminSubscriptions({ // Updated hook
    enabled: !!adminProfile && isAdmin,
    page: currentPage,
    pageSize: pageSize,
  });

  const subscriptions = subscriptionsData?.data || [];
  const totalCount = subscriptionsData?.count || 0;

  // Update totalPages in pagination hook when subscriptionsData is available
  useEffect(() => {
    if (subscriptionsData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [subscriptionsData, currentPage, setCurrentPage]);

  // Fetch client profiles for adding new subscriptions
  const { data: clientProfilesData, isLoading: isLoadingClientProfiles, error: clientProfilesError } = useProfiles({
    role: 'client', // Filter by role 'client'
    enabled: !!adminProfile && isAdmin && isDialogOpen && !currentSubscription, // Only fetch when adding a new subscription
    disablePagination: true, // Fetch all clients
  });
  const clientProfiles = clientProfilesData?.data || [];

  // Mutations for adding, updating and deleting subscriptions
  const addSubscriptionMutation = useAddSubscription();
  const updateSubscriptionMutation = useUpdateSubscription();
  const deleteSubscriptionMutation = useDeleteSubscription();
  const addActivityLogMutation = useAddActivityLog();

  useEffect(() => {
    if (subscriptionsError) {
      toast.error('Error fetching subscriptions', { description: subscriptionsError.message });
    }
  }, [subscriptionsError]);

  useEffect(() => {
    if (clientProfilesError) {
      toast.error('Error fetching client profiles for new subscription', { description: clientProfilesError.message });
    }
  }, [clientProfilesError]);

  const resetForm = () => {
    setPlanName('');
    setNextBillingDate('');
    setStatus('active');
    setSelectedClient('');
    setCurrentSubscription(null);
  };

  const handleOpenDialog = (subscriptionToEdit?: Subscription) => {
    if (subscriptionToEdit) {
      setCurrentSubscription(subscriptionToEdit);
      setPlanName(subscriptionToEdit.plan_name);
      setNextBillingDate(subscriptionToEdit.next_billing_date.split('T')[0]);
      setStatus(subscriptionToEdit.status);
      setSelectedClient(subscriptionToEdit.client_id); // Pre-fill client for editing
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName.trim() || !nextBillingDate || !status || (!currentSubscription && !selectedClient)) {
      toast.error('All fields are required.');
      return;
    }

    const subscriptionData = {
      plan_name: planName.trim(),
      next_billing_date: nextBillingDate,
      status: status,
      client_id: currentSubscription?.client_id || selectedClient,
    };

    try {
      if (currentSubscription) {
        // Update subscription
        await updateSubscriptionMutation.mutateAsync({ id: currentSubscription.id, client_id: currentSubscription.client_id, ...subscriptionData });
        toast.success('Subscription updated successfully!');
        await addActivityLogMutation.mutateAsync({
          description: `Updated subscription for client ${currentSubscription.profiles?.first_name || ''} ${currentSubscription.profiles?.last_name || ''} to plan "${planName.trim()}"`,
          client_id: currentSubscription.client_id,
        });
      } else {
        // Add new subscription
        await addSubscriptionMutation.mutateAsync(subscriptionData);
        toast.success('Subscription added successfully!');
        await addActivityLogMutation.mutateAsync({
          description: `Added new subscription for client ${clientProfilesData?.data?.find(c => c.id === selectedClient)?.first_name || ''} ${clientProfilesData?.data?.find(c => c.id === selectedClient)?.last_name || ''} with plan "${planName.trim()}"`,
          client_id: selectedClient,
        });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(currentSubscription ? 'Failed to update subscription' : 'Failed to add subscription', { description: error.message });
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string, clientId: string) => {
    const subscriptionToDelete = subscriptions?.find(sub => sub.id === subscriptionId);
    try {
      await deleteSubscriptionMutation.mutateAsync({ id: subscriptionId, client_id: clientId });
      toast.success('Subscription deleted successfully!');
      if (subscriptionToDelete) {
        await addActivityLogMutation.mutateAsync({
          description: `Deleted subscription for client ${subscriptionToDelete.profiles?.first_name || ''} ${subscriptionToDelete.profiles?.last_name || ''} (Plan: ${subscriptionToDelete.plan_name})`,
          client_id: subscriptionToDelete.client_id,
        });
      }
    } catch (error: any) {
      toast.error('Failed to delete subscription', { description: error.message });
    }
  };

  const isSubmitting = addSubscriptionMutation.isPending || updateSubscriptionMutation.isPending;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manage Client Subscriptions</h1>
        <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Subscription
        </Button>
      </div>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Subscriptions</h2>
        {isLoadingSubscriptions ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading subscriptions...</p>
          </div>
        ) : subscriptions && subscriptions.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Plan Name</TableHead>
                  <TableHead className="text-muted-foreground">Next Billing Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {sub.profiles ? `${sub.profiles.first_name} ${sub.profiles.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sub.plan_name}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(sub.next_billing_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(sub)} disabled={isSubmitting} className="text-primary border-border hover:bg-accent hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteSubscriptionMutation.isPending && deleteSubscriptionMutation.variables?.id === sub.id}>
                            {deleteSubscriptionMutation.isPending && deleteSubscriptionMutation.variables?.id === sub.id ? (
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
                              This action cannot be undone. This will permanently delete the subscription
                              for "{sub.profiles ? `${sub.profiles.first_name} ${sub.profiles.last_name}` : 'N/A'}" (Plan: {sub.plan_name}).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubscription(sub.id, sub.client_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                disabled={currentPage === 1 || isLoadingSubscriptions}
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
                disabled={currentPage === totalPages || isLoadingSubscriptions}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No subscriptions found.</p>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="admin-subscription-dialog-title"
          aria-describedby="admin-subscription-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="admin-subscription-dialog-title">{currentSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
            <DialogDescription id="admin-subscription-dialog-description" className="text-muted-foreground">
              {currentSubscription ? 'Update the details of this client subscription.' : 'Fill in the details to add a new subscription for a client.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {!currentSubscription && ( // Only show client select when adding new subscription
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right text-foreground">
                  Client
                </Label>
                <Select onValueChange={setSelectedClient} value={selectedClient} disabled={isSubmitting || isLoadingClientProfiles}>
                  <SelectTrigger id="client" className="col-span-3 bg-input text-foreground border-border">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    {isLoadingClientProfiles ? (
                      <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                    ) : (
                      clientProfilesData?.data?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="planName" className="text-right text-foreground">
                Plan Name
              </Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextBillingDate" className="text-right text-foreground">
                Next Billing Date
              </Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-foreground border-border hover:bg-accent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || (!currentSubscription && !selectedClient) || !planName.trim() || !nextBillingDate} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  currentSubscription ? 'Save Changes' : 'Add Subscription'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSubscriptions;