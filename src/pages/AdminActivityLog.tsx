"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Activity } from 'lucide-react';
import { Activity as ActivityLogEntry } from '@/types'; // Import Activity from centralized types
import { useActivityLog } from '@/lib/hooks/useActivityLog'; // Import the new hook
import { Button } from '@/components/ui/button'; // Import Button for pagination
import { usePagination } from '@/lib/hooks/usePagination'; // Import usePagination

const AdminActivityLog = () => {
  const { session, loading, isAdmin, profile } = useSession();
  const pageSize = 10;

  // Initialize pagination hook
  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined, // Will be updated by activityLogData.count
    pageSize: pageSize,
  });

  // Fetch activity log using the new hook with pagination
  const { data: activityLogData, isLoading: isLoadingActivity, error: activityError } = useActivityLog({
    enabled: !!profile && isAdmin, // Only fetch if admin profile is loaded and user is admin
    page: currentPage,
    pageSize: pageSize,
  });

  const activityLog = activityLogData?.data || [];
  const totalCount = activityLogData?.count || 0;

  // Update totalPages in pagination hook when activityLogData is available
  useEffect(() => {
    if (activityLogData) {
      setCurrentPage(currentPage); // Re-set current page to trigger totalPages recalculation if needed
    }
  }, [activityLogData, currentPage, setCurrentPage]);

  useEffect(() => {
    if (activityError) {
      toast.error('Error fetching activity log', { description: activityError.message });
    }
  }, [activityError]);

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">Client Activity Log</h1>

      <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Recent Activity</h2>
        {isLoadingActivity ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-3 text-lg text-primary">Loading activity log...</p>
          </div>
        ) : activityLog && activityLog.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Client</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLog.map((entry) => (
                  <TableRow key={entry.id} className="border-border">
                    <TableCell className="text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-foreground">
                      {entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{entry.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
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
          <p className="text-muted-foreground">No activity log entries found.</p>
        )}
      </section>
    </>
  );
};

export default AdminActivityLog;