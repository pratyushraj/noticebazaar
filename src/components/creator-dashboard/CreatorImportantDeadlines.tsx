"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Import CardFooter
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ComplianceDeadline } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom'; // Import Link

interface CreatorImportantDeadlinesProps {
  deadlines: ComplianceDeadline[];
}

const CreatorImportantDeadlines: React.FC<CreatorImportantDeadlinesProps> = ({ deadlines }) => {
  const getUrgencyBadgeVariant = (urgency: ComplianceDeadline['urgency']) => {
    switch (urgency) {
      case 'High': return 'destructive'; // Red
      case 'Medium': return 'secondary'; // Yellowish
      case 'Low': return 'success'; // Green
      default: return 'outline';
    }
  };

  return (
    <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between min-h-[200px]"> {/* Applied new base card class */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0"> {/* Minimal padding */}
        <CardTitle className="text-sm font-medium text-muted-foreground">Important Deadlines</CardTitle>
        <CalendarDays className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-grow"> {/* Minimal padding, added flex-grow */}
        <ul className="space-y-3 mb-4">
          {deadlines.map((deadline, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" /> {/* Calendar icon */}
                <div>
                  <p className="font-semibold text-foreground">{deadline.date}</p>
                  <p className="text-sm text-muted-foreground">{deadline.task}</p>
                </div>
              </div>
              <Badge variant={getUrgencyBadgeVariant(deadline.urgency)}>
                {deadline.urgency}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-4"> {/* Added CardFooter */}
        <Button asChild variant="link" className="w-full p-0 text-primary hover:text-primary/80">
          <Link to="/creator-tax-compliance">
            View Full Compliance Calendar <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreatorImportantDeadlines;