"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { BrandDeal } from '@/types';
import { useNavigate } from 'react-router-dom';

interface UploadCenterProps {
  brandDeals?: BrandDeal[];
}

const UploadCenter: React.FC<UploadCenterProps> = ({ brandDeals = [] }) => {
  const navigate = useNavigate();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate uploaded contracts this month
  const uploadedThisMonth = React.useMemo(() => {
    return brandDeals.filter(deal => {
      if (!deal.contract_file_url) return false;
      const uploadedDate = new Date(deal.created_at);
      return uploadedDate.getMonth() === currentMonth && 
             uploadedDate.getFullYear() === currentYear;
    }).length;
  }, [brandDeals, currentMonth, currentYear]);

  // Calculate pending review (deals with contracts in Drafting status)
  const pendingReview = React.useMemo(() => {
    return brandDeals.filter(deal => 
      deal.status === 'Drafting' && deal.contract_file_url
    ).length;
  }, [brandDeals]);

  return (
    <Card className="bg-[#0F121A]/80 backdrop-blur-xl border border-white/5 rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-400" />
          Upload Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <FileText className="h-4 w-4" />
              <span>This Month</span>
            </div>
            <p className="text-2xl font-bold text-white">{uploadedThisMonth}</p>
            <p className="text-xs text-white/40">contracts</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Clock className="h-4 w-4 text-orange-400" />
              <span>Pending Review</span>
            </div>
            <p className="text-2xl font-bold text-white">{pendingReview}</p>
            <p className="text-xs text-white/40">files</p>
          </div>
        </div>

        <Button
          onClick={() => {
            // Navigate to deals page or trigger upload
            navigate('/creator-contracts');
            // You can also trigger upload dialog here
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
          size="lg"
        >
          <Upload className="h-5 w-5" />
          Upload Document
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadCenter;

