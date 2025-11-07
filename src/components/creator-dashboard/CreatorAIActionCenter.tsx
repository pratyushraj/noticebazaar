"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ArrowRight } from 'lucide-react';
import { AIAction } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';

interface CreatorAIActionCenterProps {
  aiActions: AIAction[];
}

const CreatorAIActionCenter: React.FC<CreatorAIActionCenterProps> = ({ aiActions }) => {
  return (
    <Card className="bg-card shadow-sm border border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">AI Action Center</CardTitle>
        <Bot className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {aiActions.map((action, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <action.icon className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-foreground text-sm">{action.description}</span>
              </div>
              <Button variant="link" className="p-0 text-primary hover:text-primary/80">
                {action.linkText} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CreatorAIActionCenter;