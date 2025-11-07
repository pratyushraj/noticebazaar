"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComplianceDeadline } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorImportantDeadlinesProps {
  deadlines: ComplianceDeadline[];
}

const CreatorImportantDeadlines: React.FC<CreatorImportantDeadlinesProps> = ({ deadlines }) => {
  const getUrgencyBadgeVariant = (urgency: ComplianceDeadline['urgency']) => {
    switch (urgency) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Important Deadlines</CardTitle>
        <CalendarDays className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-4">
          {deadlines.map((deadline, index) => (
            <li key={index} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{deadline.date}</p>
                <p className="text-sm text-muted-foreground">{deadline.task}</p>
              </div>
              <Badge variant={getUrgencyBadgeVariant(deadline.urgency)}>
                {deadline.urgency}
              </Badge>
            </li>
          ))}
        </ul>
        <Button variant="link" className="w-full p-0 text-primary hover:text-primary/80">
          View Full Compliance Calendar <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreatorImportantDeadlines;