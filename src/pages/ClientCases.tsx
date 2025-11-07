"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FolderOpen, Eye, Briefcase, FileText } from 'lucide-react'; // Added FileText icon
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useCases } from '@/lib/hooks/useCases';
import { usePagination } from '@/lib/hooks/usePagination';
import { Card, CardContent } from '@/components/ui/card'; // Import Card components
import { Link } from 'react-router-dom'; // Import Link
import { Case } from '@/types'; // Import Case type

const ClientCases = () => {
  const { profile, loading: sessionLoading } = useSession();
  const pageSize = 10;

  const { currentPage, totalPages, handlePreviousPage, handleNextPage, setCurrentPage } = usePagination({
    totalCount: undefined,
    pageSize: pageSize,
  });

  const { data: casesData, isLoading: isLoadingCases, error: casesError } = useCases({
    clientId: profile?.id,
    enabled: !!profile?.id,
    page: currentPage,
    pageSize: pageSize,
    joinProfile: false,
  });

  const rawCases = casesData?.data || [];
  const totalCount = casesData?.count || 0;

  useEffect(() => {
    if (casesData) {
      setCurrentPage(currentPage);
    }
  }, [casesData, currentPage, setCurrentPage]);

  useEffect(() => {
    if (casesError) {
      toast.error('Error fetching cases', { description: casesError.message });
    }
  }, [casesError]);

  // Custom sorting logic for UX prioritization
  const cases = useMemo(() => {
    const targetTitle = "Annual Corporate Board Filing";
    
    const statusPriority: { [key: string]: number } = {
      'Urgent - In Progress': 1,
      // Priority 2 is reserved for the specific title requested by the user
      'Awaiting Client Documents': 3, 
      'Pending Client Upload': 4,     
      'Awaiting Review': 5,
      'Drafting Stage (50% Complete)': 6,
      'In Progress': 7,
      'On Track': 7, // Added On Track
      'Filing Submitted (90% Complete)': 8,
      'Completed': 9,
      'On Hold': 10,
    };

    return [...rawCases].sort((a, b) => {
      // Determine the effective priority for case A
      let priorityA = statusPriority[a.status] || 11;
      if (a.title === targetTitle) {
        priorityA = 2; // Force target title to second place
      }

      // Determine the effective priority for case B
      let priorityB = statusPriority[b.status] || 11;
      if (b.title === targetTitle) {
        priorityB = 2; // Force target title to second place
      }

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Secondary sort by deadline (closer deadline first) only if priorities are equal
      const deadlineA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const deadlineB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return deadlineA - deadlineB;
    });
  }, [rawCases]);


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
      case 'Drafting Stage (50% Complete)':
      case 'Filing Submitted (90% Complete)':
      case 'On Track': // Added On Track
        return 'default'; // Blue
      case 'Awaiting Review':
      case 'Awaiting Client Documents':
      case 'Review Queued':
      case 'Awaiting Firm Assignment':
      case 'Pending Client Upload':
        return 'secondary'; // Darker grey
      case 'Urgent - In Progress':
        return 'accent'; // Use accent for amber/orange urgency
      default:
        return 'outline';
    }
  };

  const getCaseProgressBar = (status: string) => {
    let width = '0%';
    let bgColor = 'bg-gray-400';

    switch (status) {
      case 'Awaiting Review':
      case 'Awaiting Client Documents':
      case 'Review Queued':
      case 'Awaiting Firm Assignment':
      case 'Pending Client Upload':
        width = '10%'; // Minimal progress for waiting states
        bgColor = 'bg-gray-500';
        break;
      case 'Drafting Stage (50% Complete)':
        width = '50%';
        bgColor = 'bg-blue-500';
        break;
      case 'In Progress':
      case 'On Track':
        width = '60%';
        bgColor = 'bg-blue-500';
        break;
      case 'Urgent - In Progress':
        width = '75%';
        bgColor = 'bg-orange-500'; // Amber/Orange for urgency
        break;
      case 'Filing Submitted (90% Complete)':
        width = '90%';
        bgColor = 'bg-blue-500';
        break;
      case 'Completed':
        width = '100%';
        bgColor = 'bg-green-500';
        break;
      case 'On Hold':
        width = '25%';
        bgColor = 'bg-gray-500';
        break;
      default:
        break;
    }

    return (
      <div className="w-full bg-gray-700 rounded-full h-2.5"> {/* Adjusted for dark mode */}
        <div className={`${bgColor} h-2.5 rounded-full`} style={{ width }}></div>
      </div>
    );
  };

  if (sessionLoading || isLoadingCases) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading your cases...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">🏛️ My Cases</h1>

      <section className="bg-card p-6 rounded-lg shadow-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">All Your Cases</h2>
        {cases && cases.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {cases.map((_case) => (
                <Card key={_case.id} className="bg-card p-4 rounded-lg shadow-sm border border-border flex flex-col">
                  <div className="flex-1 mb-3">
                    {/* Title and Status: Stacked on mobile, side-by-side on larger screens */}
                    <div className="flex items-start flex-1 min-w-0 mb-2">
                      {/* Using FileText icon to match the screenshot's visual style */}
                      <FileText className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0 mt-1" /> 
                      <h3 className="font-medium text-foreground text-lg break-words flex-1">{_case.title}</h3>
                    </div>
                    
                    {/* Status Badge (Placed below title/icon block) */}
                    <Badge variant={getStatusBadgeVariant(_case.status)} className="flex-shrink-0 mt-1 mb-3">
                        {_case.status}
                    </Badge>

                    {/* Dates: Displayed in a single row, wrapping if necessary */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center">
                        Deadline: <span className="font-semibold ml-1">{_case.deadline ? new Date(_case.deadline).toLocaleDateString() : 'N/A'}</span>
                      </span>
                      <span className="flex items-center">
                        Created On: <span className="font-semibold ml-1">{new Date(_case.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      {getCaseProgressBar(_case.status)}
                    </div>
                  </div>
                  
                  {/* Action Button: Full width on mobile */}
                  <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground w-full mt-2">
                    <Link to={`/client-cases`}>
                      <Eye className="h-4 w-4 mr-1" /> View Case
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoadingCases}
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
                disabled={currentPage === totalPages || isLoadingCases}
                className="text-primary border-border hover:bg-accent hover:text-foreground"
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
            <p className="text-muted-foreground">No cases found.</p>
          </Card>
        )}
      </section>
    </>
  );
};

export default ClientCases;