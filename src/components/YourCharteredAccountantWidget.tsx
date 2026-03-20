"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, User as UserIcon, Star, Calculator, Phone } from 'lucide-react'; // Import Phone icon
import { Link } from 'react-router-dom';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { getInitials, DEFAULT_AVATAR_URL, generateAvatarUrl } from '@/lib/utils/avatar';
import { useSession } from '@/contexts/SessionContext';
import { Profile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface YourCharteredAccountantWidgetProps {
  onSendMessage: (receiverId: string, receiverName: string) => void;
}

const YourCharteredAccountantWidget = ({ onSendMessage }: YourCharteredAccountantWidgetProps) => {
  const { loading: sessionLoading, profile: currentProfile } = useSession();

  const isProfilesEnabled = React.useMemo(() => {
    return !sessionLoading && currentProfile?.role === 'client';
  }, [sessionLoading, currentProfile]);

  const { data: caProfilesData, isLoading, error } = useProfiles({
    role: 'chartered_accountant',
    enabled: isProfilesEnabled,
    disablePagination: true,
  });

  const caProfiles = caProfilesData?.data || [];

  const charteredAccountant: Profile | undefined = React.useMemo(() => {
    // Prioritize a specific CA if needed, otherwise take the first available
    return caProfiles[0];
  }, [caProfiles]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Loading CA details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive py-8">
        Error loading CA: {error.message}
      </div>
    );
  }

  if (!charteredAccountant) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No Chartered Accountant found.
      </div>
    );
  }

  const advisorName = `CA. ${charteredAccountant.first_name} ${charteredAccountant.last_name}`;
  const avatarSrc = charteredAccountant.avatar_url 
    ? charteredAccountant.avatar_url 
    : generateAvatarUrl(charteredAccountant.first_name, charteredAccountant.last_name);

  return (
    <div 
      className="flex flex-col space-y-6 rounded-xl p-6 bg-secondary border border-border shadow-lg" // Changed bg-card to bg-secondary
    >
      {/* Top Section: Avatar + Name/Title (Horizontal) */}
      <div className="flex items-center space-x-5">
        <Avatar className="h-16 w-16 flex-shrink-0"> {/* Increased Avatar size */}
          <AvatarImage src={avatarSrc} alt={`${charteredAccountant.first_name} ${charteredAccountant.last_name}`} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl"> {/* Increased fallback text size */}
            {getInitials(charteredAccountant.first_name, charteredAccountant.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-foreground truncate"> {/* Increased name font size */}
            {advisorName}
          </p>
          <p className="text-base text-muted-foreground truncate">Senior Tax Advisor</p> {/* Increased title font size */}
          <div className="flex items-center mt-2">
            <span className="relative flex h-2.5 w-2.5"> {/* Slightly larger online indicator */}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="ml-2 text-sm text-green-500 font-medium">Online</span> {/* Increased online text size */}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2"> {/* Increased gap */}
        <Button 
          variant="default" 
          size="lg" 
          className="flex-1 h-20 bg-primary hover:bg-primary/90 flex flex-col items-center justify-center rounded-xl" // Custom styling for vertical layout
          onClick={() => onSendMessage(charteredAccountant.id, advisorName)}
        >
          <MessageSquare className="h-7 w-7 mb-1" /> 
          <span className="text-lg font-semibold">Message</span>
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="flex-1 h-20 bg-secondary text-primary border-border hover:bg-secondary/80 flex flex-col items-center justify-center rounded-xl" // Custom styling for dark background, blue text
          asChild
        >
          <a href="tel:+919205376316" className="flex flex-col items-center justify-center h-full w-full">
            <Phone className="h-7 w-7 mb-1 text-muted-foreground" /> 
            <span className="text-lg font-semibold">Call</span>
          </a>
        </Button>
      </div>

      {/* Stats Section: Removed border-t border-border */}
      <div className="grid grid-cols-3 gap-4 w-full text-center pt-4">
        <div>
          <p className="text-xl font-bold text-foreground">200+</p> {/* Increased stat font size */}
          <p className="text-sm text-muted-foreground">Clients Served</p> {/* Increased label font size */}
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">2 Yrs</p> {/* Changed from 10 Yrs to 2 Yrs */}
          <p className="text-sm text-muted-foreground">Experience</p> {/* Increased label font size */}
        </div>
        <div>
          <p className="text-xl font-bold text-foreground flex items-center justify-center">4.8<Star className="h-5 w-5 text-yellow-500 ml-1" fill="currentColor" /></p> {/* Increased stat font size */}
          <p className="text-sm text-muted-foreground">Rating</p> {/* Increased label font size */}
        </div>
      </div>
    </div>
  );
};

export default YourCharteredAccountantWidget;