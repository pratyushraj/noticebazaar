"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Users, FileText, CalendarDays, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useCADashboardData } from '@/lib/hooks/useCADashboardData';
import { toast } from 'sonner';

const CADashboard = () => {
  const { profile, loading } = useSession();

  const { data: dashboardData, isLoading: isLoadingData, error: dashboardError } = useCADashboardData(
    !loading && profile?.role === 'chartered_accountant'
  );

  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load CA dashboard data', { description: dashboardError.message });
    }
  }, [dashboardError]);

  if (loading || isLoadingData) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading CA Dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        CA Dashboard, {profile?.first_name || 'Chartered Accountant'}!
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Clients Managed */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients Managed</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardData?.clientCount || 0}</div>
            <p className="text-xs text-muted-foreground">Clients under advisory</p>
          </CardContent>
        </Card>
        
        {/* Documents to Review */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents to Review</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardData?.documentsToReviewCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting your action</p>
          </CardContent>
        </Card>
        
        {/* Pending Consultations */}
        <Card className="bg-card shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Consultations</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{dashboardData?.pendingConsultationCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild className="flex flex-col items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
            <Link to="/admin-clients">
              <Users className="h-5 w-5 mb-2" /> Manage Clients
            </Link>
          </Button>
          <Button asChild className="flex flex-col items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
            <Link to="/admin-documents">
              <FileText className="h-5 w-5 mb-2" /> Review Documents
            </Link>
          </Button>
          <Button asChild className="flex flex-col items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
            <Link to="/admin-consultations">
              <CalendarDays className="h-5 w-5 mb-2" /> Manage Consultations
            </Link>
          </Button>
          <Button asChild className="flex flex-col items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
            <Link to="/messages">
              <MessageSquare className="h-5 w-5 mb-2" /> Communicate with Clients
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default CADashboard;