"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import ProfileForm from '@/components/forms/ProfileForm'; // Import the new ProfileForm

const AdminProfile = () => {
  const { session, loading, profile, isAdmin } = useSession();
  const addActivityLogMutation = useAddActivityLog();

  const handleSaveSuccess = async () => {
    if (profile) {
      await addActivityLogMutation.mutateAsync({
        description: `Admin updated own profile information`,
        client_id: null, // Admin activity, no specific client_id
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">Profile data not found. Please contact support.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">My Profile (Admin)</h1>

      <Card className="max-w-2xl mx-auto bg-card shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-6">Email: {session?.user?.email}</p>
          <ProfileForm initialProfile={profile} onSaveSuccess={handleSaveSuccess} isAdminView={true} />
        </CardContent>
      </Card>
    </>
  );
};

export default AdminProfile;