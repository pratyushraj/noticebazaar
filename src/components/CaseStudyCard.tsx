"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseStudyCardProps {
  amount: string;
  days: number;
  client: string;
  issue: string;
  result: string;
  quote: string;
  author: string;
  delay?: number;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({
  amount,
  days,
  client,
  issue,
  result,
  quote,
  author,
  delay = 0,
}) => {
  return (
    <Card 
      className={cn(
        "card p-6 rounded-xl border-l-4 border-yellow-500 shadow-lg flex flex-col h-full transition-all duration-300 hover:scale-[1.02] hover:border-yellow-400",
        "bg-card/80" // Ensure it stands out
      )}
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <CardContent className="p-0 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-yellow-400 flex items-center">
            <IndianRupee className="h-6 w-6 mr-2" /> {amount} Recovered
          </h3>
          <span className="text-sm font-semibold text-white bg-blue-600 px-3 py-1 rounded-full">{days} Days</span>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-4">
          <p><span className="font-semibold text-white">Client:</span> {client}</p>
          <p><span className="font-semibold text-white">Issue:</span> {issue}</p>
          <p><span className="font-semibold text-white">Result:</span> {result}</p>
        </div>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex mb-2 text-yellow-400">
            <Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" /><Star className="h-5 w-5 fill-current" />
          </div>
          <p className="text-lg leading-relaxed italic text-white mb-2">"{quote}"</p>
          <p className="font-bold text-white">— {author}</p>
        </div>
        
      </CardContent>
    </Card>
  );
};

export default CaseStudyCard;