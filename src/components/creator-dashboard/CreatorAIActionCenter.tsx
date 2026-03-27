"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ArrowRight, FileText, IndianRupee, Clock, MessageSquare, LucideIcon } from 'lucide-react'; // Import specific icons for color logic
import { AIAction } from '@/data/creatorDashboardData';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom'; // Import Link

interface CreatorAIActionCenterProps {
  aiActions: AIAction[];
  onSendPaymentReminder: () => void; // NEW: Handler for 'Send Reminder'
}

const CreatorAIActionCenter: React.FC<CreatorAIActionCenterProps> = ({ aiActions, onSendPaymentReminder }) => {
  // Helper function to determine the color class based on severity
  const getSeverityColorClass = (severity?: 'urgent' | 'warning' | 'info') => {
    switch (severity) {
      case 'urgent': return 'border-red-500 bg-red-500/5';
      case 'warning': return 'border-yellow-500 bg-yellow-500/5';
      case 'info': return 'border-blue-500 bg-blue-500/5';
      default: return 'border-gray-500';
    }
  };

  // Helper function to determine the color class for the left bar (fallback)
  const getActionColorClass = (icon: LucideIcon) => {
    if (icon === FileText) return 'border-blue-500'; // Contracts
    if (icon === IndianRupee) return 'border-yellow-500'; // Taxes
    if (icon === Clock) return 'border-red-500'; // Overdue
    if (icon === MessageSquare) return 'border-purple-500'; // Messages
    return 'border-gray-500'; // Default
  };

  return (
    <Card className="creator-card-base shadow-sm"> {/* Applied new base card class */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">AI Action Center</CardTitle>
        <Bot className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3"> {/* Increased vertical spacing */}
          {aiActions.map((action, index) => (
            <li 
              key={index} 
              className={cn(
                "flex items-center justify-between border-l-4 pl-3 py-2.5 rounded-r-md transition-all hover:shadow-sm", // Left bar and padding
                action.severity ? getSeverityColorClass(action.severity) : getActionColorClass(action.icon) // Apply color based on severity or icon
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <action.icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  action.severity === 'urgent' ? 'text-red-500' :
                  action.severity === 'warning' ? 'text-yellow-500' :
                  action.severity === 'info' ? 'text-blue-500' :
                  'text-muted-foreground'
                )} />
                <div className="flex-1 min-w-0">
                  <span className="text-foreground text-sm block">{action.description}</span>
                  {action.estimatedTime && (
                    <span className="text-xs text-muted-foreground mt-0.5">Est. {action.estimatedTime}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {action.linkText === 'Send Reminder' ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={onSendPaymentReminder}
                  >
                    Quick Action
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="text-xs h-7 px-2">
                    <Link to={action.linkHref}>
                      {action.linkText} <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CreatorAIActionCenter;