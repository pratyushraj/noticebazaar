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
  // Helper function to determine the color class for the left bar
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
        <ul className="space-y-4"> {/* Increased vertical spacing */}
          {aiActions.map((action, index) => (
            <li 
              key={index} 
              className={cn(
                "flex items-center justify-between border-l-4 pl-3 py-2 rounded-r-md", // Left bar and padding
                getActionColorClass(action.icon) // Apply color based on icon
              )}
            >
              <div className="flex items-center">
                <action.icon className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-foreground text-sm">{action.description}</span>
              </div>
              {action.linkText === 'Send Reminder' ? (
                <Button variant="link" className="p-0 text-primary hover:text-primary/80" onClick={onSendPaymentReminder}>
                  Escalate to Legal Action <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80">
                  <Link to={action.linkHref}>
                    {action.linkText} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CreatorAIActionCenter;