"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminPendingTasks } from '@/lib/hooks/useAdminPendingTasks';

interface AdminPendingTasksWidgetProps {
  enabled: boolean;
}

const AdminPendingTasksWidget = ({ enabled }: AdminPendingTasksWidgetProps) => {
  const { data: pendingTasks, isLoading, error } = useAdminPendingTasks(enabled);

  if (isLoading) {
    return (
      <Card className="bg-card shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">Loading pending tasks...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-destructive py-8">
          Error loading tasks: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Pending Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingTasks && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-3" />
                <span className="text-foreground">Pending Consultations:</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{pendingTasks.pendingConsultations}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-indigo-500 mr-3" />
                <span className="text-foreground">Total Documents:</span>
              </div>
              <span className="text-lg font-bold text-indigo-600">{pendingTasks.totalDocuments}</span>
            </div>
            {/* Add more pending tasks here */}
            <div className="pt-4">
              <Button variant="link" asChild className="p-0 text-primary hover:text-primary/80">
                <Link to="/admin-consultations">Manage Consultations</Link>
              </Button>
              <br />
              <Button variant="link" asChild className="p-0 mt-2 text-primary hover:text-primary/80">
                <Link to="/admin-documents">Manage Documents</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPendingTasksWidget;