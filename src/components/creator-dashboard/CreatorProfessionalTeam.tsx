"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Calculator, Scale, Star, Phone } from 'lucide-react';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { generateAvatarUrl } from '@/lib/utils/avatar';
import { useSession } from '@/contexts/SessionContext';
import { Profile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils/avatar';

interface CreatorProfessionalTeamProps {
  onSendMessage: (receiverId: string, receiverName: string) => void;
}

const CreatorProfessionalTeam = ({ onSendMessage }: CreatorProfessionalTeamProps) => {
  const { loading: sessionLoading, profile: currentProfile } = useSession();

  const isProfilesEnabled = React.useMemo(() => {
    return !sessionLoading && currentProfile?.role === 'creator';
  }, [sessionLoading, currentProfile]);

  // Fetch CA profiles
  const { data: caProfilesData, isLoading: isLoadingCA, error: caError } = useProfiles({
    role: 'chartered_accountant',
    enabled: isProfilesEnabled,
    disablePagination: true,
  });

  // Fetch Legal Advisor (admin) profiles
  const { data: adminProfilesData, isLoading: isLoadingAdmin, error: adminError } = useProfiles({
    role: 'admin',
    enabled: isProfilesEnabled,
    disablePagination: true,
  });

  const caProfiles = caProfilesData?.data || [];
  const adminProfiles = adminProfilesData?.data || [];

  const charteredAccountant: Profile | undefined = React.useMemo(() => {
    return caProfiles[0];
  }, [caProfiles]);

  const legalAdvisor: Profile | undefined = React.useMemo(() => {
    const prateek = adminProfiles.find(
      (p) => p.first_name?.toLowerCase() === 'prateek' && p.role === 'admin'
    );
    return prateek || adminProfiles[0];
  }, [adminProfiles]);

  const isLoading = isLoadingCA || isLoadingAdmin;

  if (isLoading) {
    return (
      <Card className="bg-card shadow-lg rounded-xl border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Professional Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">Loading your team...</p>
        </CardContent>
      </Card>
    );
  }

  if (caError || adminError) {
    return (
      <Card className="bg-card shadow-lg rounded-xl border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Professional Team</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-destructive py-8">
          Error loading team members: {(caError || adminError)?.message}
        </CardContent>
      </Card>
    );
  }

  const caAvatarSrc = charteredAccountant?.avatar_url 
    ? charteredAccountant.avatar_url 
    : charteredAccountant 
      ? generateAvatarUrl(charteredAccountant.first_name, charteredAccountant.last_name)
      : undefined;

  const lawyerAvatarSrc = legalAdvisor?.avatar_url 
    ? legalAdvisor.avatar_url 
    : legalAdvisor 
      ? generateAvatarUrl(legalAdvisor.first_name, legalAdvisor.last_name)
      : undefined;

  const caName = charteredAccountant ? `CA. ${charteredAccountant.first_name} ${charteredAccountant.last_name}` : '';
  const lawyerName = legalAdvisor ? `Adv. ${legalAdvisor.first_name} ${legalAdvisor.last_name}` : '';

  return (
    <Card className="bg-card shadow-lg rounded-xl border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-400" />
          Chat with Your Professional Team
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CA Card */}
        {charteredAccountant ? (
          <div className="flex flex-col space-y-4 rounded-xl p-5 bg-secondary/50 border border-border shadow-[0_0_20px_-6px_rgba(59,130,246,0.15)]">
            <div className="flex items-center space-x-4">
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarImage src={caAvatarSrc} alt={caName} />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {getInitials(charteredAccountant.first_name, charteredAccountant.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{caName}</p>
                <p className="text-sm text-muted-foreground truncate">Tax & Accounting Advisor</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-500 font-medium">🟢 Online</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Replies in ~12 min</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-white/40">Available now</span>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              onClick={() => onSendMessage(charteredAccountant.id, caName)}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat with CA</span>
            </Button>

            <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-border">
              <div>
                <p className="text-lg font-bold text-foreground">200+</p>
                <p className="text-xs text-muted-foreground">Clients</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">2 Yrs</p>
                <p className="text-xs text-muted-foreground">Experience</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground flex items-center justify-center">4.8<Star className="h-4 w-4 text-yellow-500 ml-0.5" fill="currentColor" /></p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-xl p-5 bg-secondary/50 border border-border">
            <Calculator className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground text-center">No CA available</p>
          </div>
        )}

        {/* Lawyer Card */}
        {legalAdvisor ? (
          <div className="flex flex-col space-y-4 rounded-xl p-5 bg-secondary/50 border border-border shadow-[0_0_20px_-6px_rgba(168,85,247,0.15)]">
            <div className="flex items-center space-x-4">
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarImage src={lawyerAvatarSrc} alt={lawyerName} />
                <AvatarFallback className="bg-purple-600 text-white text-lg">
                  {getInitials(legalAdvisor.first_name, legalAdvisor.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-foreground truncate">{lawyerName}</p>
                <p className="text-sm text-muted-foreground truncate">Legal Advisor</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-500 font-medium">🟢 Online</span>
                </div>
                <p className="text-xs text-white/50 mt-1">Replies in ~8 min</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-white/40">Available now</span>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
              onClick={() => onSendMessage(legalAdvisor.id, lawyerName)}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat with Lawyer</span>
            </Button>

            <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-border">
              <div>
                <p className="text-lg font-bold text-foreground">156</p>
                <p className="text-xs text-muted-foreground">Cases Won</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">2 Yrs</p>
                <p className="text-xs text-muted-foreground">Experience</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground flex items-center justify-center">4.9<Star className="h-4 w-4 text-yellow-500 ml-0.5" fill="currentColor" /></p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-xl p-5 bg-secondary/50 border border-border">
            <Scale className="h-12 w-12 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground text-center">No Legal Advisor available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatorProfessionalTeam;

