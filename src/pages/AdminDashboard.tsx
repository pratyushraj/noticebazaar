"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, FileText, Link2, Users, TrendingUp, Briefcase, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminDashboardData } from '@/lib/hooks/useAdminDashboardData';

const AdminDashboard = () => {
  const { session, loading, profile, isAdmin } = useSession();

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading: isLoadingData, error: dashboardError } = useAdminDashboardData(
    !loading && isAdmin
  );

  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load dashboard data', { description: dashboardError.message });
    }
  }, [dashboardError]);

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Admin Dashboard, {profile?.first_name || 'Admin'}!
      </h1>

      {isLoadingData ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Loading dashboard data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Analytics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Accounts</CardTitle>
                <UserPlus className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.newAccountsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Created in last 30 days</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contracts Made</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.contractsMadeCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total contracts generated</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Links Generated</CardTitle>
                <Link2 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.linksGeneratedCount || 0}</div>
                <p className="text-xs text-muted-foreground">Deal & contract links</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Referral Links</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.referralLinksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Partner program links</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
                <Briefcase className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.totalDealsCount || 0}</div>
                <p className="text-xs text-muted-foreground">All brand deals</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dashboardData?.activeDealsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active & pending deals</p>
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-clients">
                  <Users className="mr-2 h-5 w-5" /> Manage Clients
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-cases">
                  <Briefcase className="mr-2 h-5 w-5" /> Manage Cases
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-documents">
                  <FileText className="mr-2 h-5 w-5" /> Manage Documents
                </Link>
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;