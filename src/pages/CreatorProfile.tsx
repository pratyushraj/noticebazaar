"use client";

import React from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Card } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import CreatorProfileForm from '@/components/forms/CreatorProfileForm';

const CreatorProfile = () => {
  const { session, loading, profile, isCreator } = useSession();
  const addActivityLogMutation = useAddActivityLog();

  const handleSaveSuccess = async () => {
    if (profile) {
      await addActivityLogMutation.mutateAsync({
        description: `Creator updated profile information`,
        client_id: profile.id,
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

  if (!isCreator) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">Access denied. This page is only for creators.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>
        <p className="text-white/70">Your creator identity, social reach & verification details.</p>
      </div>

      {/* Profile Form */}
      <Card className="bg-[#0A0F1C] border-white/10 rounded-2xl shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)] p-6">
        <CreatorProfileForm initialProfile={profile} onSaveSuccess={handleSaveSuccess} />
      </Card>
    </div>
  );
};

export default CreatorProfile;

