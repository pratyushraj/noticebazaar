"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Briefcase, FileText, CalendarDays, MessageSquare, Activity, CreditCard, Search, UserPlus } from 'lucide-react'; // Added CreditCard icon
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useAdminDashboardData } from '@/lib/hooks/useAdminDashboardData'; // Import the new hook
import { useActivityLog } from '@/lib/hooks/useActivityLog'; // Import useActivityLog hook
import AdminPendingTasksWidget from '@/components/AdminPendingTasksWidget'; // Import new widget
import UpcomingConsultationsWidget from '@/components/UpcomingConsultationsWidget'; // Import new widget

const AdminDashboard = () => {
  const { session, loading, profile, isAdmin } = useSession();

  // Fetch dashboard data using the new hook
  const { data: dashboardData, isLoading: isLoadingData, error: dashboardError } = useAdminDashboardData(
    !loading && isAdmin // Only enable if session is not loading and user is admin
  );

  // Fetch recent activity log for the admin dashboard
  const { data: activityLogData, isLoading: isLoadingActivity, error: activityError } = useActivityLog({
    limit: 5, // Fetch only the 5 most recent activities
    enabled: !loading && isAdmin, // Only enable if session is not loading and user is admin
  });
  const activityLog = activityLogData?.data || [];

  useEffect(() => {
    if (dashboardError) {
      toast.error('Failed to load dashboard data', { description: dashboardError.message });
    }
  }, [dashboardError]);

  useEffect(() => {
    if (activityError) {
      toast.error('Error fetching activity log', { description: activityError.message });
    }
  }, [activityError]);

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
        <div className="flex flex-col gap-8"> {/* Main Flexbox container with 32px gap */}
          {/* Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Removed mb-8 */}
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.clientCount || 0}</div>
                <p className="text-xs text-muted-foreground">Registered clients</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                <Briefcase className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.caseCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active and closed cases</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.documentCount || 0}</div>
                <p className="text-xs text-muted-foreground">Uploaded client documents</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Consultations</CardTitle>
                <CalendarDays className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.consultationCount || 0}</div>
                <p className="text-xs text-muted-foreground">Pending and approved</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border"> {/* New Card for Subscriptions */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{dashboardData?.subscriptionCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active client subscriptions</p>
              </CardContent>
            </Card>
          </section>

          {/* New Widgets Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Removed mb-8 */}
            <AdminPendingTasksWidget enabled={!loading && isAdmin} />
            <UpcomingConsultationsWidget enabled={!loading && isAdmin} />
          </section>

          {/* Quick Actions / Navigation */}
          <section> {/* Removed mb-8 */}
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
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-consultations">
                  <CalendarDays className="mr-2 h-5 w-5" /> Manage Consultations
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-subscriptions"> {/* New Quick Action link */}
                  <CreditCard className="mr-2 h-5 w-5" /> Manage Subscriptions
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/messages">
                  <MessageSquare className="mr-2 h-5 w-5" /> View Messages
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-activity-log">
                  <Activity className="mr-2 h-5 w-5" /> View Activity Log
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-discovery">
                  <Search className="mr-2 h-5 w-5" /> Influencer Discovery
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers">
                  <UserPlus className="mr-2 h-5 w-5" /> Manage Influencers
                </Link>
              </Button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
              <Button variant="link" asChild>
                <Link to="/admin-activity-log" className="text-primary hover:text-primary/80">View All Activity</Link>
              </Button>
            </div>
            {isLoadingActivity ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg text-muted-foreground">Loading activity...</p>
              </div>
            ) : activityLog && activityLog.length > 0 ? (
              <ul className="space-y-3">
                {activityLog.map((activity) => (
                  <li key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm text-foreground">
                        {activity.profiles ? `${activity.profiles.first_name} ${activity.profiles.last_name}: ` : ''}
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No recent activity.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;