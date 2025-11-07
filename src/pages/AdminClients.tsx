"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, User as UserIcon, Trash2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Profile } from '@/types';
import { useProfiles, useUpdateProfile, useDeleteProfile } from '@/lib/hooks/useProfiles';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar'; // Import DEFAULT_AVATAR_URL
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminClients = () => {
  const { session, loading: sessionLoading, isAdmin, profile: adminProfile } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Profile | null>(null);
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by clientsData.count
    pageSize: pageSize,
  });

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState<'client' | 'admin'>('client');

  // Fetch clients using the new hook for the dropdown
  const { data: clientsData, isLoading: isLoadingClients, error: clientsError, refetch: refetchClients } = useProfiles({
    role: 'client', // Filter by role 'client'
    enabled: !!adminProfile && isAdmin, // Only fetch if admin profile is loaded and user is admin
    page: currentPage,
    pageSize: pageSize,
  });

  const clients = clientsData?.data || [];
  const totalCount = clientsData?.count || 0;

  // Update totalPages in pagination hook when clientsData is available
  useEffect(() => {
    if (clientsData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [clientsData, currentPage, setCurrentPage]);

  // Mutation for updating profile
  const updateProfileMutation = useUpdateProfile();
  const deleteProfileMutation = useDeleteProfile(); // Initialize the new hook
  const addActivityLogMutation = useAddActivityLog(); // Initialize the new hook

  useEffect(() => {
    if (clientsError) {
      toast.error('Error fetching client profiles', { description: clientsError.message });
    }
  }, [clientsError]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setAvatarUrl('');
    setRole('client'); // Default role for new client, though this page only edits existing ones
    setCurrentClient(null);
  };

  const handleOpenDialog = (clientToEdit?: Profile) => {
    if (clientToEdit) {
      setCurrentClient(clientToEdit);
      setFirstName(clientToEdit.first_name || '');
      setLastName(clientToEdit.last_name || '');
      setAvatarUrl(clientToEdit.avatar_url || '');
      setRole(clientToEdit.role);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }

    if (!currentClient?.id) {
      toast.error('Client profile not found. Cannot update.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: currentClient.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUrl.trim() || null,
        role: role, // Pass the role to the mutation
      });
      toast.success('Client profile updated successfully!');
      await addActivityLogMutation.mutateAsync({ // Use the new hook
        description: `Updated profile for client: ${firstName.trim()} ${lastName.trim()} (Role: ${role})`,
        client_id: currentClient.id,
      });
      refetchClients(); // Refetch clients to update the list
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Failed to update client profile', { description: error.message });
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    try {
      await deleteProfileMutation.mutateAsync(clientId);
      toast.success(`Client ${clientName} deleted successfully!`);
      await addActivityLogMutation.mutateAsync({ // Use the new hook
        description: `Deleted client profile: ${clientName}`,
        client_id: clientId, // Log with client_id even if it's being deleted
      });
      refetchClients(); // Refetch clients to update the list
    } catch (error: any) {
      toast.error('Failed to delete client profile', { description: error.message });
    }
  };

  const isSubmitting = updateProfileMutation.isPending;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Manage Client Profiles</h1>
      </div>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Profiles</h2>
        {isLoadingClients ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading client profiles...</p>
          </div>
        ) : clients && clients.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Avatar</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.avatar_url || DEFAULT_AVATAR_URL} alt={`${client.first_name} ${client.last_name}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(client.first_name, client.last_name)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{client.first_name} {client.last_name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.role}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(client)} disabled={isSubmitting} className="text-primary border-border hover:bg-accent hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteProfileMutation.isPending && deleteProfileMutation.variables === client.id}>
                            {deleteProfileMutation.isPending && deleteProfileMutation.variables === client.id ? (
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
                              This action cannot be undone. This will permanently delete the client profile
                              "{client.first_name} {client.last_name}" and all associated data (cases, documents, consultations, messages, subscriptions, activity log entries).
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-foreground border-border hover:bg-accent">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClient(client.id, `${client.first_name} ${client.last_name}`)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                disabled={currentPage === 1 || isLoadingClients}
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
                disabled={currentPage === totalPages || isLoadingClients}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">No client profiles found.</p>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="admin-client-dialog-title"
          aria-describedby="admin-client-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="admin-client-dialog-title">{currentClient ? 'Edit Client Profile' : 'Add New Client'}</DialogTitle>
            <DialogDescription id="admin-client-dialog-description" className="text-muted-foreground">
              {currentClient ? 'Update the personal and role details for this client.' : 'Fill in the details to add a new client profile.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right text-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right text-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="avatarUrl" className="text-right text-foreground">
                Avatar URL (Optional)
              </Label>
              <Input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Enter URL for your profile picture"
                className="bg-input text-foreground border-border"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right text-foreground">
                Role
              </Label>
              <Select onValueChange={(value: 'client' | 'admin') => setRole(value)} value={role} disabled={isSubmitting}>
                <SelectTrigger id="role" className="col-span-3 bg-input text-foreground border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="text-foreground border-border hover:bg-accent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !currentClient} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminClients;