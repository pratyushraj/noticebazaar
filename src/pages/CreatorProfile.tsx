"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Loader2, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import CreatorProfileForm from '@/components/forms/CreatorProfileForm';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const CreatorProfile = () => {
  const { session, loading, profile, isCreator } = useSession();
  const addActivityLogMutation = useAddActivityLog();
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Track scroll position to show/hide sticky save bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowStickyBar(scrollPosition > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSaveSuccess = async () => {
    if (profile) {
      await addActivityLogMutation.mutateAsync({
        description: `Creator updated profile information`,
        client_id: profile.id,
      });
    }
    // Scroll to top when saved
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowStickyBar(false);
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">Profile data not found. Please contact support.</p>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-background">
        <p className="text-destructive">Access denied. This page is only for creators.</p>
      </div>
    );
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.avatar_url,
      profile.creator_category,
      profile.pricing_avg,
      profile.instagram_handle,
      profile.youtube_channel_id,
      profile.bank_account_number,
      profile.bank_ifsc,
      profile.pan_number,
      profile.gst_number,
    ];
    const completed = fields.filter(field => field && field.toString().trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-[#0A0F1A] pb-24">
      {/* Premium Profile Header */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-8">
        <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 border-white/10 rounded-2xl shadow-[0_0_30px_-8px_rgba(59,130,246,0.3)] p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with Progress Ring */}
            <div className="relative flex-shrink-0">
              <div className="relative">
                {/* Progress Ring */}
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(completionPercentage / 100) * 339.3} 339.3`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="w-20 h-20 border-4 border-[#0A0F1A] ring-2 ring-blue-500/30">
                    <AvatarImage src={profile.avatar_url || ''} alt={`${profile.first_name} ${profile.last_name}`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl font-bold">
                      {getInitials(profile.first_name || '', profile.last_name || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Completion Badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#0A0F1A]">
                {completionPercentage}%
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {profile.first_name || 'Creator'} {profile.last_name || ''}
                </h1>
                {profile.creator_category && (
                  <p className="text-sm text-white/60 mt-1">
                    {profile.creator_category}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                {profile.instagram_handle && (
                  <span className="px-3 py-1 bg-white/5 rounded-full text-white/70 border border-white/10">
                    @{profile.instagram_handle.replace('@', '')}
                  </span>
                )}
                {profile.youtube_channel_id && (
                  <span className="px-3 py-1 bg-white/5 rounded-full text-white/70 border border-white/10">
                    YouTube
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Form with Collapsible Sections */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <CreatorProfileForm 
          initialProfile={profile} 
          onSaveSuccess={handleSaveSuccess}
          completionPercentage={completionPercentage}
        />
      </div>

      {/* Sticky Bottom Save Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
          showStickyBar
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-4">
          <Card className="bg-[#0A0F1A]/95 backdrop-blur-xl border-white/20 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Unsaved changes</p>
                <p className="text-xs text-white/60">Scroll down to save your profile</p>
              </div>
              <button
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) {
                      submitButton.click();
                    }
                  }
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
