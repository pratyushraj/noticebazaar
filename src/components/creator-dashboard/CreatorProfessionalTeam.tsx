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
        {/* CA Card - Premium Blue Theme */}
        {charteredAccountant ? (
          <div className="relative flex flex-col space-y-4 rounded-[14px] p-5 
                          bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-blue-500/5 
                          border border-blue-500/30 backdrop-blur-xl shadow-inner
                          hover:border-blue-500/40 hover:from-blue-500/25 hover:via-blue-500/15 
                          transition-all duration-200 group overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity" />
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-blue-500/30 group-hover:ring-blue-500/50 transition-all">
                  <AvatarImage src={caAvatarSrc} alt={caName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-lg">
                    {getInitials(charteredAccountant.first_name, charteredAccountant.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-blue-500/20"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{caName}</p>
                <p className="text-sm text-white/70 truncate">Tax & Accounting Advisor</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400 font-semibold">Online</span>
                </div>
                <p className="text-xs text-white/60 mt-1">Replies in ~12 min</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-400/80 font-medium">Available now</span>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="relative z-10 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 
                         text-white font-semibold flex items-center justify-center gap-2
                         shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.5)]
                         border border-blue-500/30 active:scale-[0.98] transition-all duration-150"
              onClick={() => onSendMessage(charteredAccountant.id, caName)}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat with CA</span>
            </Button>

            <div className="relative z-10 grid grid-cols-3 gap-3 text-center pt-3 border-t border-white/10">
              <div>
                <p className="text-lg font-bold text-white">200+</p>
                <p className="text-xs text-white/60">Clients</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">2 Yrs</p>
                <p className="text-xs text-white/60">Experience</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white flex items-center justify-center">4.8<Star className="h-4 w-4 text-yellow-400 ml-0.5" fill="currentColor" /></p>
                <p className="text-xs text-white/60">Rating</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-[14px] p-5 
                          bg-gradient-to-br from-blue-500/10 to-blue-500/5 
                          border border-white/10 backdrop-blur-xl shadow-inner">
            <Calculator className="h-12 w-12 text-white/30 mb-2" />
            <p className="text-sm text-white/60 text-center">No CA available</p>
          </div>
        )}

        {/* Lawyer Card - Premium Purple Theme */}
        {legalAdvisor ? (
          <div className="relative flex flex-col space-y-4 rounded-[14px] p-5 
                          bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 
                          border border-purple-500/30 backdrop-blur-xl shadow-inner
                          hover:border-purple-500/40 hover:from-purple-500/25 hover:via-purple-500/15 
                          transition-all duration-200 group overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-75 transition-opacity" />
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all">
                  <AvatarImage src={lawyerAvatarSrc} alt={lawyerName} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white text-lg">
                    {getInitials(legalAdvisor.first_name, legalAdvisor.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-purple-500/20"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{lawyerName}</p>
                <p className="text-sm text-white/70 truncate">Legal Advisor</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400 font-semibold">Online</span>
                </div>
                <p className="text-xs text-white/60 mt-1">Replies in ~8 min</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-green-400/80 font-medium">Available now</span>
                </div>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="relative z-10 w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 
                         text-white font-semibold flex items-center justify-center gap-2
                         shadow-[0_4px_12px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_16px_rgba(168,85,247,0.5)]
                         border border-purple-500/30 active:scale-[0.98] transition-all duration-150"
              onClick={() => onSendMessage(legalAdvisor.id, lawyerName)}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat with Lawyer</span>
            </Button>

            <div className="relative z-10 grid grid-cols-3 gap-3 text-center pt-3 border-t border-white/10">
              <div>
                <p className="text-lg font-bold text-white">156</p>
                <p className="text-xs text-white/60">Cases Won</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">2 Yrs</p>
                <p className="text-xs text-white/60">Experience</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white flex items-center justify-center">4.9<Star className="h-4 w-4 text-yellow-400 ml-0.5" fill="currentColor" /></p>
                <p className="text-xs text-white/60">Rating</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-[14px] p-5 
                          bg-gradient-to-br from-purple-500/10 to-purple-500/5 
                          border border-white/10 backdrop-blur-xl shadow-inner">
            <Scale className="h-12 w-12 text-white/30 mb-2" />
            <p className="text-sm text-white/60 text-center">No Legal Advisor available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreatorProfessionalTeam;

