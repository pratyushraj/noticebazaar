"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useCases } from '@/lib/hooks/useCases';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { cn } from '@/lib/utils'; // Import cn for conditional class merging

const DEMO_USER_EMAIL = 'mellowprints07@gmail.com';

const DualKPISnapshot = () => {
  const { user, profile, loading: sessionLoading } = useSession();
  const isDemoUser = user?.email === DEMO_USER_EMAIL;

  // FIX: Call all hooks unconditionally at top level (React Rules of Hooks)
  const { data: casesData, isLoading: isLoadingCases } = useCases({
    clientId: profile?.id,
    enabled: !isDemoUser && !!profile?.id, // Only fetch for non-demo users
    limit: 100, // Fetch all for counting
    joinProfile: false,
  });

  const { data: documentsAwaitingReviewData, isLoading: isLoadingDocuments } = useDocuments({
    clientId: profile?.id,
    statusFilter: 'Awaiting Review',
    enabled: !isDemoUser && !!profile?.id, // Only fetch for non-demo users
    limit: 100, // Fetch all for counting
    joinProfile: false,
  });

  const { data: pendingConsultationsData, isLoading: isLoadingConsultations } = useConsultations({
    clientId: profile?.id,
    status: 'Pending',
    enabled: !isDemoUser && !!profile?.id, // Only fetch for non-demo users
    limit: 100, // Fetch all for counting
    joinProfile: false,
  });

  // Calculate values based on demo vs real data
  let activeCasesCount = 0;
  let documentsAwaitingReviewCount = 0;
  let pendingConsultationsCount = 0;
  let nextGSTFilingDateStr = "2025-10-26"; // Default placeholder
  let tdsPaymentDueDateStr = "2025-11-08"; // Default placeholder

  if (isDemoUser) {
    // --- Mock Data for Demo User ---
    activeCasesCount = 3;
    documentsAwaitingReviewCount = 4;
    pendingConsultationsCount = 1;

    const today = new Date();
    
    // Next GST Filing: 7 days away (Urgent status)
    const sevenDaysAway = new Date(today);
    sevenDaysAway.setDate(today.getDate() + 7);
    nextGSTFilingDateStr = sevenDaysAway.toISOString().split('T')[0];

    // TDS Payment Due: 20 days away (Good status, but still upcoming)
    const twentyDaysAway = new Date(today);
    twentyDaysAway.setDate(today.getDate() + 20);
    tdsPaymentDueDateStr = twentyDaysAway.toISOString().split('T')[0];
  } else {
    // --- Real Data for Standard Users ---
    activeCasesCount = casesData?.data?.filter(c => c.status === 'In Progress' || c.status === 'Awaiting Review' || c.status === 'On Hold').length || 0;
    documentsAwaitingReviewCount = documentsAwaitingReviewData?.data?.length || 0;
    pendingConsultationsCount = pendingConsultationsData?.data?.length || 0;
    
    // Use hardcoded dates for non-demo users if real compliance data isn't available
    nextGSTFilingDateStr = "2025-10-26"; 
    tdsPaymentDueDateStr = "2025-11-08";
  }

  const isLoading = sessionLoading || (!isDemoUser && (isLoadingCases || isLoadingDocuments || isLoadingConsultations));


  const calculateUrgency = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day
    const deadline = new Date(dateString);
    deadline.setHours(0, 0, 0, 0); // Normalize deadline to start of day

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Overdue: Red/Destructive
      return { status: 'overdue', icon: AlertCircle, classes: 'bg-destructive/20 text-destructive border-destructive/30' };
    } else if (diffDays <= 7) {
      // Urgent: Orange/Yellow (Matching the image's brown/orange card)
      // Using custom colors to match the image's specific dark yellow/brown background
      return { status: 'urgent', icon: Clock, classes: 'bg-[#4A3B1A] text-yellow-400 border-[#4A3B1A]' };
    } else {
      // Good: Green (Matching the image's dark green card)
      // Using custom colors to match the image's specific dark green background
      return { status: 'good', icon: CheckCircle, classes: 'bg-[#1A4A3B] text-green-400 border-[#1A4A3B]' };
    }
  };

  const gstUrgency = calculateUrgency(nextGSTFilingDateStr);
  const tdsUrgency = calculateUrgency(tdsPaymentDueDateStr);

  const formatDate = (dateString: string, includeYear: boolean = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    if (includeYear) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <Card className="bg-card shadow-lg rounded-xl border border-border col-span-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Your Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">Loading your data snapshot...</p>
        </CardContent>
      </Card>
    );
  }

  // Component for a standard KPI card (Active Cases, Docs, Consultations)
  const KpiCard = ({ emoji, title, value, className = 'bg-card' }: { emoji: string, title: string, value: string | number, className?: string }) => (
    <div className={cn("flex flex-col items-start justify-start p-6 rounded-xl border border-border text-left h-full bg-secondary/50", className)}>
      {/* Emoji: Large, centered look */}
      <div className="mb-4 text-3xl">
        {emoji}
      </div>
      
      {/* Title */}
      <p className="text-sm text-muted-foreground">{title}</p>
      
      {/* Value */}
      <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );

  // Component for a date-based KPI card (Compliance)
  const DateKpiCard = ({ Icon, title, dateString, urgency }: { Icon: React.ElementType, title: string, dateString: string, urgency: ReturnType<typeof calculateUrgency> }) => {
    const DateIcon = urgency.icon;
    const date = new Date(dateString);
    const year = date.getFullYear();
    const formattedDate = formatDate(dateString, false);

    return (
      <div className={cn("flex flex-col items-start justify-start p-6 rounded-xl border text-left h-full", urgency.classes)}>
        {/* Icon: Large, colored, centered look */}
        <div className="mb-4">
          <DateIcon className="h-8 w-8" />
        </div>
        
        {/* Title */}
        <p className="text-sm text-muted-foreground">{title}</p>
        
        {/* Date Value: Large bold date, smaller year */}
        <div className="mt-1">
          <p className="text-2xl font-bold text-foreground leading-tight">{formattedDate}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{year}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card shadow-lg rounded-xl border border-border col-span-full">
      <CardHeader className="flex flex-row items-center space-x-3 pb-4">
        <div className="flex items-center space-x-1">
          <div className="h-3 w-3 bg-green-500 rounded-full" />
          <div className="h-3 w-3 bg-red-500 rounded-full" />
          <div className="h-3 w-3 bg-blue-500 rounded-full" />
        </div>
        <CardTitle className="text-xl font-bold text-foreground">Your Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Cases */}
        <KpiCard 
          emoji="💼" 
          title="Active Cases" 
          value={activeCasesCount} 
        />
        {/* Docs Awaiting Review */}
        <KpiCard 
          emoji="📝" 
          title="Docs Awaiting Review" 
          value={documentsAwaitingReviewCount} 
        />
        {/* Pending Consultations */}
        <KpiCard 
          emoji="📞" 
          title="Pending Consultations" 
          value={pendingConsultationsCount} 
        />
        {/* Next GST Filing (Urgent/Approaching) */}
        <DateKpiCard 
          Icon={Clock} 
          title="Next GST Filing" 
          dateString={nextGSTFilingDateStr} 
          urgency={gstUrgency}
        />
        {/* TDS Payment Due (Good/Completed) */}
        <DateKpiCard 
          Icon={CheckCircle} 
          title="TDS Payment Due" 
          dateString={tdsPaymentDueDateStr} 
          urgency={tdsUrgency}
        />
      </CardContent>
    </Card>
  );
};

export default DualKPISnapshot;