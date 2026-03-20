"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
import { usePagination } from '@/lib/hooks/usePagination';
import { getActivityIcon } from '@/lib/utils/activity-icons';
import { Card, CardContent } from '@/components/ui/card'; // Import Card components

const ClientActivityLog = () => {
  const { profile, loading: sessionLoading } = useSession();
  const pageSize = 10;

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined,
    pageSize: pageSize,
  });

  const { data: activityLogData, isLoading: isLoadingActivity, error: activityError } = useActivityLog({
    clientId: profile?.id,
    enabled: !!profile?.id,
    page: currentPage,
    pageSize: pageSize,
    joinProfile: false,
  });

  const activityLog = activityLogData?.data || [];
  const totalCount = activityLogData?.count || 0;

  useEffect(() => {
    if (activityLogData) {
      setCurrentPage(currentPage);
    }
  }, [activityLogData, currentPage, setCurrentPage]);

  useEffect(() => {
    if (activityError) {
      toast.error('Error fetching activity log', { description: activityError.message });
    }
  }, [activityError]);

  if (sessionLoading || isLoadingActivity) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading your activity log...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">⚡ My Activity Log</h1>

      <section className="bg-card p-6 rounded-lg shadow-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Your Recent Activity</h2>
        {activityLog && activityLog.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3">
              {activityLog.map((entry) => (
                <Card key={entry.id} className="bg-card p-3 rounded-lg shadow-sm border border-border flex flex-col sm:flex-row sm:items-center sm:justify-between"> {/* Added flex-col/sm:flex-row */}
                  <div className="flex items-center flex-1 min-w-0 mb-2 sm:mb-0"> {/* Combined icon and description, made flex-1 */}
                    <div className="flex-shrink-0 mr-3">
                      {getActivityIcon(entry.description)}
                    </div>
                    <p className="text-sm text-foreground flex-1"> {/* Ensured description can grow */}
                      {entry.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-right flex-shrink-0">
                    {new Date(entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Card>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoadingActivity}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoadingActivity}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No activity log entries found.</p>
          </Card>
        )}
      </section>
    </>
  );
};

export default ClientActivityLog;