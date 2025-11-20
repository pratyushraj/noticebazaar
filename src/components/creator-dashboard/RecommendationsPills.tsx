"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertCircle, Users, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Recommendation {
  id: string;
  text: string;
  type: 'improvement' | 'warning' | 'action' | 'info';
  icon?: React.ReactNode;
}

const RecommendationsPills: React.FC = () => {
  const recommendations: Recommendation[] = [
    {
      id: '1',
      text: 'Improve onboarding',
      type: 'improvement',
      icon: <TrendingDown className="h-3 w-3" />,
    },
    {
      id: '2',
      text: 'Client average ticket ↓',
      type: 'warning',
      icon: <TrendingDown className="h-3 w-3" />,
    },
    {
      id: '3',
      text: 'Add missing KYC',
      type: 'action',
      icon: <FileText className="h-3 w-3" />,
    },
    {
      id: '4',
      text: '3 clients waiting for update',
      type: 'info',
      icon: <Users className="h-3 w-3" />,
    },
    {
      id: '5',
      text: 'Review contract terms',
      type: 'action',
      icon: <AlertCircle className="h-3 w-3" />,
    },
  ];

  const getBadgeVariant = (type: Recommendation['type']) => {
    switch (type) {
      case 'improvement':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'action':
        return 'secondary';
      case 'info':
        return 'outline';
    }
  };

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white mb-1">Recommendations</h3>
          <p className="text-xs text-white/50">Quick insights and learnings</p>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {recommendations.map((rec) => (
              <Badge
                key={rec.id}
                variant={getBadgeVariant(rec.type)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity bg-white/10 text-white border border-white/20"
              >
                {rec.icon}
                {rec.text}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecommendationsPills;

