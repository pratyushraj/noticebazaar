"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { MOCK_PROTECTION_COMPLIANCE } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorProtectionComplianceProps {
  protectionCompliance: typeof MOCK_PROTECTION_COMPLIANCE;
}

const CreatorProtectionCompliance: React.FC<CreatorProtectionComplianceProps> = ({ protectionCompliance }) => {
  const getCategoryColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Protection & Compliance</CardTitle>
        <ShieldCheck className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-4xl font-bold text-foreground">{protectionCompliance.healthScore}</div>
          <div className="text-sm text-muted-foreground">Health Score</div>
        </div>
        <ul className="space-y-2 mb-4">
          {protectionCompliance.categories.map((category, index) => (
            <li key={index} className="flex items-center">
              <span className={cn("h-2.5 w-2.5 rounded-full mr-2", getCategoryColor(category.status))}></span>
              <span className="text-foreground">{category.name}</span>
            </li>
          ))}
        </ul>
        <Button variant="default" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Fix Issues <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreatorProtectionCompliance;