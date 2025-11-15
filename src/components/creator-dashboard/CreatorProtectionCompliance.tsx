"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface CreatorProtectionComplianceProps {
  protectionCompliance: {
    healthScore: number;
    categories: { name: string; status: string }[];
  };
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

  const healthScore = protectionCompliance.healthScore || 72;
  const circumference = 2 * Math.PI * 36; // radius = 36
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white shadow-lg min-h-[200px] flex flex-col justify-between p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 pt-0 relative">
        <CardTitle className="text-sm font-medium text-white">Protection & Compliance</CardTitle>
        <ShieldCheck className="h-5 w-5 text-white" />
      </CardHeader>

      <CardContent className="px-0 pb-0 flex-grow flex items-center gap-6">
        {/* Circular Progress Indicator */}
        <div className="relative flex-shrink-0">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{healthScore}</span>
            <span className="text-xs text-white/80">Health Score</span>
          </div>
        </div>

        {/* Category List */}
        <ul className="space-y-3 flex-1">
          {protectionCompliance.categories.map((category, index) => {
            let dotColor = 'bg-blue-500';
            if (category.name === 'Copyright') dotColor = 'bg-green-500';
            if (category.name === 'Taxes') dotColor = 'bg-yellow-500';
            
            return (
              <li key={index} className="flex items-center">
                <span className={cn("h-2.5 w-2.5 rounded-full mr-3", dotColor)}></span>
                <span className="text-white text-sm">{category.name}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <Button 
        asChild 
        variant="default" 
        className="w-full bg-gray-800 text-white hover:bg-gray-700 mt-4"
      >
        <Link to="/creator-content-protection">
          Fix Issues <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </Card>
  );
};

export default CreatorProtectionCompliance;