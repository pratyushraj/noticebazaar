"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, FileText, Link2, Users, TrendingUp, Briefcase, ArrowUpRight, Calendar, LogOut, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminDashboardData } from '@/lib/hooks/useAdminDashboardData';
import { useSignOut } from '@/lib/hooks/useAuth';

const AdminDashboard = () => {
  const { session, loading, profile, isAdmin } = useSession();
  const signOutMutation = useSignOut();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Convert date strings to Date objects for the hook
  const dateRange = startDate || endDate ? {
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  } : undefined;

  // Fetch dashboard analytics
  const { data: dashboardData, isLoading: isLoadingData, error: dashboardError } = useAdminDashboardData(
    !loading && isAdmin,
    dateRange
  );

  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load dashboard data', { description: dashboardError.message });
    }
  }, [dashboardError]);

  // Set default to last 30 days
  useEffect(() => {
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date();
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, []);

  const handleResetDates = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    if (!dashboardData) {
      toast.error('No data to export');
      return;
    }

    const csvRows = [
      ['Metric', 'Value'],
      ['Total Users', dashboardData.totalUsersCount.toString()],
      ['New Accounts', dashboardData.newAccountsCount.toString()],
      ['Contracts Made', dashboardData.contractsMadeCount.toString()],
      ['Links Generated', dashboardData.linksGeneratedCount.toString()],
      ['Referral Links', dashboardData.referralLinksCount.toString()],
      ['Total Deals', dashboardData.totalDealsCount.toString()],
      ['Active Deals', dashboardData.activeDealsCount.toString()],
      [''],
      ['Date Range', `${startDate || 'N/A'} to ${endDate || 'N/A'}`],
      ['Exported At', new Date().toISOString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `admin-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dashboard data exported to CSV');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Admin Dashboard, {profile?.first_name || 'Admin'}!
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await signOutMutation.mutateAsync();
            } catch (error: any) {
              console.error('Logout failed', error);
            }
          }}
          disabled={signOutMutation.isPending}
          className="flex items-center gap-2"
        >
          {signOutMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </>
          )}
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            <Button
              variant="outline"
              onClick={handleResetDates}
              className="whitespace-nowrap"
            >
              Reset to 30 Days
            </Button>
            </div>
        </CardContent>
      </Card>

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
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.totalUsersCount || 0}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Accounts</CardTitle>
                <UserPlus className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.newAccountsCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {startDate && endDate 
                    ? `Created ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                    : 'Created in selected date range'}
                </p>
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