"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { Loader2, Lock, Menu } from 'lucide-react';
import { Profile } from '@/types';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AdvisorList from '@/components/messages/AdvisorList';
import ChatWindow from '@/components/messages/ChatWindow';

const MessagesPage = () => {
  const { session, loading: sessionLoading, profile, isAdmin } = useSession();
  const [selectedChatPartnerId, setSelectedChatPartnerId] = useState<string | null>(null);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Admin View ---
  const { data: clientProfilesData, isLoading: isLoadingClientProfiles, error: clientProfilesError } = useProfiles({
    role: 'client',
    enabled: isAdmin && !!profile,
    disablePagination: true,
  });
  const clientProfiles = clientProfilesData?.data || [];

  // --- Client View ---
  const { data: adminProfilesData, isLoading: isLoadingAdminProfile, error: adminProfileError } = useProfiles({
    role: 'admin',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const adminProfile = adminProfilesData?.data?.[0] || null;

  const { data: caProfilesData, isLoading: isLoadingCAProfile, error: caProfileError } = useProfiles({
    role: 'chartered_accountant',
    enabled: !isAdmin && !!profile,
    disablePagination: true,
  });
  const caProfile = caProfilesData?.data?.[0] || null;

  // Combine potential chat partners for client view
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
    // Auto-select first available partner
    if (isAdmin && clientProfiles.length > 0 && !selectedChatPartnerId) {
      setSelectedChatPartnerId(clientProfiles[0].id);
    }
    if (!isAdmin && clientChatPartners.length > 0 && !selectedChatPartnerId) {
      setSelectedChatPartnerId(clientChatPartners[0].id);
    }
  }, [isAdmin, clientProfiles, clientChatPartners, selectedChatPartnerId]);

  const handleSelectPartner = (partnerId: string) => {
    setSelectedChatPartnerId(partnerId);
    if (isMobile) {
      setIsMobileSheetOpen(false); // Close sheet on mobile after selection
    }
  };

  const isLoadingPage = sessionLoading || isLoadingClientProfiles || isLoadingAdminProfile || isLoadingCAProfile;

  const getSelectedPartnerDetails = () => {
    if (isAdmin) {
      return clientProfiles.find(c => c.id === selectedChatPartnerId);
    } else {
      return clientChatPartners.find(p => p.id === selectedChatPartnerId);
    }
  };

  const selectedPartner = getSelectedPartnerDetails();
  const receiverName = selectedPartner ? `${selectedPartner.first_name} ${selectedPartner.last_name}` : '';
  const receiverRole = selectedPartner 
    ? selectedPartner.role === 'admin' 
      ? 'Legal Advisor' 
      : selectedPartner.role === 'chartered_accountant' 
        ? 'Chartered Accountant' 
        : selectedPartner.role
    : '';
  const receiverAvatarUrl = selectedPartner?.avatar_url || undefined;

  // Determine which advisors to show
  const advisors = isAdmin ? clientProfiles : clientChatPartners;
  const isLoadingAdvisors = isAdmin ? isLoadingClientProfiles : (isLoadingAdminProfile || isLoadingCAProfile);
  const advisorTitle = isAdmin ? 'Clients' : 'Select Advisor';

  if (isLoadingPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Loading messages page...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col antialiased">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[380px] p-0">
                <div className="h-full">
                  <AdvisorList
                    advisors={advisors}
                    selectedAdvisorId={selectedChatPartnerId}
                    onSelectAdvisor={handleSelectPartner}
                    isLoading={isLoadingAdvisors}
                    title={advisorTitle}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Secure Messages</h1>
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
        {/* Left Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="w-1/4 min-w-[280px] max-w-[320px] h-full">
            <AdvisorList
              advisors={advisors}
              selectedAdvisorId={selectedChatPartnerId}
              onSelectAdvisor={handleSelectPartner}
              isLoading={isLoadingAdvisors}
              title={advisorTitle}
            />
          </div>
        )}

        {/* Right Content: Chat Window */}
        <div className="flex-1 min-w-0 h-full">
          {selectedChatPartnerId && selectedPartner ? (
            <ChatWindow
              receiverId={selectedChatPartnerId}
              receiverName={receiverName}
              receiverRole={receiverRole}
              receiverAvatarUrl={receiverAvatarUrl}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-card rounded-xl border border-border/40 shadow-sm">
              <p className="text-sm text-muted-foreground text-center px-4">
                {isAdmin ? 'Select a client to start chatting.' : 'Select an advisor to start chatting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
