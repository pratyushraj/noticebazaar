"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import YourLegalAdvisorWidget from '@/components/YourLegalAdvisorWidget';
import YourCharteredAccountantWidget from '@/components/YourCharteredAccountantWidget';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface YourProfessionalTeamWidgetProps {
  onSendMessage: (receiverId: string, receiverName: string) => void;
}

const YourProfessionalTeamWidget = ({ onSendMessage }: YourProfessionalTeamWidgetProps) => {
  const { loading: sessionLoading, profile: currentProfile } = useSession();

  if (sessionLoading) {
    return (
      <Card className="bg-card shadow-lg rounded-xl border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Your Professional Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">Loading your team...</p>
        </CardContent>
      </Card>
    );
  }

  // Only render this widget for clients
  if (!currentProfile || currentProfile.role !== 'client') {
    return null;
  }

  return (
    <Card className="bg-card shadow-lg rounded-xl border border-border col-span-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Your Professional Team</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <YourLegalAdvisorWidget onSendMessage={onSendMessage} />
        <YourCharteredAccountantWidget onSendMessage={onSendMessage} />
      </CardContent>
    </Card>
  );
};

export default YourProfessionalTeamWidget;