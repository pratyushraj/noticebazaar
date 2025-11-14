"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CopyrightScannerCardProps {
  onClick?: () => void;
}

const CopyrightScannerCard: React.FC<CopyrightScannerCardProps> = ({
  onClick,
}) => {
  return (
    <Card className="creator-card-base shadow-sm p-6 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-0 pt-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="absolute inset-0 rounded-full opacity-30 blur-sm bg-purple-500"></span>
          </div>
          <CardTitle className="text-base font-semibold text-foreground">AI Copyright Scanner</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <p className="text-sm text-muted-foreground mb-4">
          Scan videos & posts for copyright issues.
        </p>
        <Button
          asChild
          variant="default"
          className="w-full"
          onClick={onClick}
        >
          <Link to="/creator-content-protection">
            Start Scan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CopyrightScannerCard;
