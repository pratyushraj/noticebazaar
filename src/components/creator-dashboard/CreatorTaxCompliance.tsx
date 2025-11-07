"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Import CardFooter
import { Button } from '@/components/ui/button';
import { IndianRupee, Calculator, ArrowRight } from 'lucide-react'; // Changed AlertTriangle to Calculator
import { MOCK_TAX_COMPLIANCE_STATUS } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom'; // Import Link

interface CreatorTaxComplianceProps {
  taxComplianceStatus: typeof MOCK_TAX_COMPLIANCE_STATUS;
}

const CreatorTaxCompliance: React.FC<CreatorTaxComplianceProps> = ({ taxComplianceStatus }) => {
  return (
    <Card className="creator-card-base shadow-sm p-6 flex flex-col justify-between min-h-[200px]"> {/* Applied new base card class */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0"> {/* Minimal padding */}
        <CardTitle className="text-sm font-medium text-muted-foreground">Tax Compliance Status</CardTitle>
        <Calculator className="h-4 w-4 text-yellow-500" /> {/* Changed to Calculator icon */}
      </CardHeader>
      <CardContent className="px-0 pb-0 flex-grow"> {/* Minimal padding, added flex-grow */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl font-bold text-foreground">{taxComplianceStatus.amount}</div> {/* Increased font size */}
          <div className="text-sm text-muted-foreground">{taxComplianceStatus.deals}</div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Next Due: <span className="font-bold text-foreground">{taxComplianceStatus.nextDue}</span></p>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-4"> {/* Added CardFooter */}
        <Button asChild variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/creator-tax-compliance">
            File Now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreatorTaxCompliance;