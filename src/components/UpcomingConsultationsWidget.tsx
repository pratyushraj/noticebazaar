"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUpcomingConsultations } from '@/lib/hooks/useUpcomingConsultations';
import { Badge } from '@/components/ui/badge';
import { Consultation } from '@/types';

interface UpcomingConsultationsWidgetProps {
  enabled: boolean;
}

const UpcomingConsultationsWidget = ({ enabled }: UpcomingConsultationsWidgetProps) => {
  const { data: consultations, isLoading, error } = useUpcomingConsultations({ enabled, limit: 5 });

  const getStatusBadgeVariant = (status: Consultation['status']) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Upcoming Consultations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">Loading upcoming consultations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Upcoming Consultations</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-destructive py-8">
          Error loading consultations: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Upcoming Consultations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {consultations && consultations.length > 0 ? (
          <ul className="space-y-3">
            {consultations.map((consultation) => (
              <li key={consultation.id} className="flex items-center justify-between p-2 border-b last:border-b-0 border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {consultation.profiles?.first_name} {consultation.profiles?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(consultation.preferred_date).toLocaleDateString()} at {consultation.preferred_time}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Topic: {consultation.topic || 'N/A'}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(consultation.status)}>
                  {consultation.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No upcoming consultations.</p>
        )}
        <div className="pt-2 text-center">
          <Button variant="link" asChild className="p-0 text-primary hover:text-primary/80">
            <Link to="/admin-consultations">View All Consultations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingConsultationsWidget;