"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreatorLegalWorkflowsProps {
  takedownAlerts: any[];
}

const CreatorLegalWorkflows: React.FC<CreatorLegalWorkflowsProps> = ({
  takedownAlerts,
}) => {
  // Calculate total videos reposted
  const totalVideos = takedownAlerts.length || 2; // Default to 2 if no alerts
  const platform = takedownAlerts.length > 0 ? takedownAlerts[0]?.platform || 'TikTok' : 'TikTok';

  return (
    <Card className="bg-red-500 text-white shadow-lg relative overflow-hidden min-h-[200px] flex flex-col justify-between p-6">
      {/* Warning icons in corners */}
      <div className="absolute top-4 left-4">
        <AlertTriangle className="h-5 w-5 text-white opacity-80" />
      </div>
      <div className="absolute top-4 right-4">
        <AlertTriangle className="h-5 w-5 text-white opacity-80" />
      </div>

      <CardHeader className="pb-2 px-0 pt-0 relative z-10">
        <CardTitle className="text-sm font-medium text-white">Takedown Alerts</CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0 flex-grow flex flex-col justify-center relative z-10">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">
            {totalVideos} Video{totalVideos !== 1 ? 's' : ''} Reposted on {platform}
          </h3>
          <p className="text-white/90 text-sm">
            Immediate action required to prevent revenue loss.
          </p>
        </div>
      </CardContent>

      <Button 
        asChild 
        variant="destructive" 
        className="w-full bg-white text-red-500 hover:bg-white/90 mt-4 relative z-10"
      >
        <Link to="/creator-content-protection">
          View Matches <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
};

export default CreatorLegalWorkflows;