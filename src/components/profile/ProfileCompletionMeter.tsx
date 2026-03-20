"use client";

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Profile } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileCompletionMeterProps {
  profile: Profile;
}

const ProfileCompletionMeter: React.FC<ProfileCompletionMeterProps> = ({ profile }) => {
  const requiredFields = [
    { key: 'first_name', label: 'First Name', value: profile.first_name },
    { key: 'last_name', label: 'Last Name', value: profile.last_name },
    { key: 'email', label: 'Email', value: profile.email },
  ];

  const importantFields = [
    { key: 'avatar_url', label: 'Profile Picture', value: profile.avatar_url },
    { key: 'creator_category', label: 'Category', value: profile.creator_category },
    { key: 'instagram_handle', label: 'Instagram', value: profile.instagram_handle },
    { key: 'youtube_channel_id', label: 'YouTube', value: profile.youtube_channel_id },
    { key: 'pricing_avg', label: 'Average Rate', value: profile.pricing_avg },
    { key: 'bank_account_number', label: 'Bank Account', value: profile.bank_account_number },
    { key: 'pan_number', label: 'PAN', value: profile.pan_number },
    { key: 'gst_number', label: 'GST', value: profile.gst_number },
  ];

  const allFields = [...requiredFields, ...importantFields];
  const filledCount = allFields.filter(field => field.value).length;
  const totalCount = allFields.length;
  const completionPercentage = Math.round((filledCount / totalCount) * 100);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-[#0A0F1C] border border-white/10 rounded-xl p-4 shadow-[0_0_20px_-4px_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={cn(
            "h-5 w-5",
            completionPercentage >= 80 ? "text-green-500" : completionPercentage >= 60 ? "text-yellow-500" : "text-orange-500"
          )} />
          <span className="text-sm font-semibold text-white">Profile Completion</span>
        </div>
        <span className={cn(
          "text-lg font-bold",
          completionPercentage >= 80 ? "text-green-400" : completionPercentage >= 60 ? "text-yellow-400" : "text-orange-400"
        )}>
          {completionPercentage}%
        </span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-500",
            getProgressColor(completionPercentage)
          )}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      <p className="text-xs text-white/60 mt-2">
        {filledCount} of {totalCount} fields completed
      </p>
    </div>
  );
};

export default ProfileCompletionMeter;

