"use client";

import React from 'react';
import CreatorOnboardingWizard from '@/components/creator-onboarding/CreatorOnboardingWizard';
import { useSession } from '@/contexts/SessionContext';
import { Loader2 } from 'lucide-react';

const CreatorOnboarding = () => {
  const { loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen bg-background">
      <CreatorOnboardingWizard />
    </div>
  );
};

export default CreatorOnboarding;