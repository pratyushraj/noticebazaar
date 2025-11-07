"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react'; // Import Lock icon
import ChatWindow from '@/components/ChatWindow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Profile } from '@/types';
import { useProfiles } from '@/lib/hooks/useProfiles';
import ClientChatList from '@/components/ClientChatList';
import ClientChatPartnerSelector from '@/components/ClientChatPartnerSelector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip
import { Button } from '@/components/ui/button'; // Import Button for mobile back button
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft

const MessagesPage = () => {
  const { session, loading: sessionLoading, profile, isAdmin } = useSession();
  const [selectedChatPartnerId, setSelectedChatPartnerId] = useState<string | null>(null);
  const [isChatViewActive, setIsChatViewActive] = useState(false); // New state for mobile view control

  // --- Admin View ---
  // Fetch client profiles for admins
  const { data: clientProfilesData, isLoading: isLoadingClientProfiles, error: clientProfilesError } = useProfiles({
    role: 'client', // Filter by role 'client'
    enabled: isAdmin && !!profile, // Only fetch if admin and profile is loaded
    disablePagination: true, // Fetch all clients for the chat list
  });
  const clientProfiles = clientProfilesData?.data || [];

  // --- Client View ---
  // Fetch Admin profile (Legal Advisor)
  const { data: adminProfilesData, isLoading: isLoadingAdminProfile, error: adminProfileError } = useProfiles({
    role: 'admin',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const adminProfile = adminProfilesData?.data?.[0] || null;

  // Fetch CA profile (Chartered Accountant)
  const { data: caProfilesData, isLoading: isLoadingCAProfile, error: caProfileError } = useProfiles({
    role: 'chartered_accountant',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const caProfile = caProfilesData?.data?.[0] || null;

  // Combine potential chat partners for client view with refined labels
  const clientChatPartners = [
    ...(adminProfile ? [{ 
      ...adminProfile, 
      chat_label: `Legal Team - ${adminProfile.first_name} ${adminProfile.last_name} (Advocate)` 
    }] : []),
    ...(caProfile ? [{ 
      ...caProfile, 
      chat_label: `Financial & Tax - ${caProfile.first_name} ${caProfile.last_name} (CA)` 
    }] : []),
  ];

  useEffect(() => {
    if (clientProfilesError) {
      toast.error('Error fetching client profiles', { description: clientProfilesError.message });
    }
    if (adminProfileError || caProfileError) {
      toast.error('Error fetching advisor profiles', { description: (adminProfileError || caProfileError)?.message });
    }
  }, [clientProfilesError, adminProfileError, caProfileError]);

  useEffect(() => {
    // For admins, automatically select the first client if available and none is selected
    if (isAdmin && clientProfiles.length > 0 && !selectedChatPartnerId) {
      setSelectedChatPartnerId(clientProfiles[0].id);
    }
    // For clients, automatically select the first available partner (Admin or CA)
    if (!isAdmin && clientChatPartners.length > 0 && !selectedChatPartnerId) {
      setSelectedChatPartnerId(clientChatPartners[0].id);
    }
  }, [isAdmin, clientProfiles, clientChatPartners, selectedChatPartnerId]);

  // Handle selection and mobile view transition
  const handleSelectPartner = (partnerId: string) => {
    setSelectedChatPartnerId(partnerId);
    setIsChatViewActive(true); // Activate chat view on mobile
  };

  const isLoadingPage = sessionLoading || isLoadingClientProfiles || isLoadingAdminProfile || isLoadingCAProfile;

  // Helper function to find the selected partner's details
  const getSelectedPartnerDetails = () => {
    if (isAdmin) {
      return clientProfiles.find(c => c.id === selectedChatPartnerId);
    } else {
      return clientChatPartners.find(p => p.id === selectedChatPartnerId);
    }
  };

  const selectedPartner = getSelectedPartnerDetails();
  const receiverName = selectedPartner ? `${selectedPartner.first_name} ${selectedPartner.last_name}` : '';
  const receiverAvatarUrl = selectedPartner?.avatar_url || undefined;

  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Loading messages page...</p>
      </div>
    );
  }

  // Determine if we are on a mobile screen and a chat is selected
  const isMobile = window.innerWidth < 768;
  const showChatWindowOnly = isMobile && isChatViewActive;
  const showSelectorOnly = isMobile && !isChatViewActive;

  return (
    <>
      <div className="flex items-center mb-6">
        {showChatWindowOnly && (
          <Button variant="ghost" size="icon" onClick={() => setIsChatViewActive(false)} className="mr-2 flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-3xl font-bold text-foreground mr-3">
          {showChatWindowOnly ? receiverName : 'Secure Messages'}
        </h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock className="h-5 w-5 text-green-500" />
          </TooltipTrigger>
          <TooltipContent className="bg-card text-foreground border-border">
            <p>End-to-End Encrypted. Your communications remain privileged and confidential.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 
        Height Calculation: 
        We use a responsive height calculation to ensure the chat container fills the screen 
        minus the fixed header, mobile nav (on mobile), and vertical padding from Layout.tsx.
        
        Mobile: 100vh - (Header 4rem + Bottom Nav 4rem + Layout Padding 7rem) = 15rem total subtraction
        Desktop: 100vh - (Header 4rem + Layout Padding 4rem) = 8rem total subtraction
      */}
      <div className="flex gap-6 h-[calc(100vh-15rem)] md:h-[calc(100vh-8rem)]">
        {/* Left Sidebar/Selector (Hidden on mobile if chat is active) */}
        <div className={`md:w-1/4 md:min-w-[200px] md:max-w-[300px] h-full ${showChatWindowOnly ? 'hidden' : 'w-full'}`}>
          {isAdmin ? (
            <ClientChatList
              clients={clientProfiles}
              selectedClientId={selectedChatPartnerId}
              onSelectClient={handleSelectPartner} // Use handleSelectPartner
              isLoading={isLoadingClientProfiles}
            />
          ) : (
            <ClientChatPartnerSelector
              partners={clientChatPartners}
              selectedPartnerId={selectedChatPartnerId}
              onSelectPartner={handleSelectPartner} // Use handleSelectPartner
              isLoading={isLoadingAdminProfile || isLoadingCAProfile}
            />
          )}
        </div>

        {/* Right Content: Chat Window (Hidden on mobile if selector is active) */}
        <div className={`md:flex-1 ${showSelectorOnly ? 'hidden' : 'flex-1'}`}>
          {selectedChatPartnerId && selectedPartner ? (
            <ChatWindow
              receiverId={selectedChatPartnerId}
              receiverName={receiverName}
              receiverAvatarUrl={receiverAvatarUrl}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-card rounded-lg shadow-sm border border-border">
              <p className="text-center text-muted-foreground py-8">
                {isAdmin ? 'Select a client to start chatting.' : 'Select an advisor to start chatting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MessagesPage;