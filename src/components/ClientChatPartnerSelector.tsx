"use client";

import React from 'react';
import { Profile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageSquare, User, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials, DEFAULT_AVATAR_URL, generateAvatarUrl } from '@/lib/utils/avatar';

interface PartnerWithLabel extends Profile {
  chat_label: string;
}

interface ClientChatPartnerSelectorProps {
  partners: PartnerWithLabel[];
  selectedPartnerId: string | null;
  onSelectPartner: (partnerId: string) => void;
  isLoading: boolean;
}

const ClientChatPartnerSelector = ({ partners, selectedPartnerId, onSelectPartner, isLoading }: ClientChatPartnerSelectorProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-card rounded-lg shadow-sm border border-border p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Loading advisors...</p>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <Card className="bg-card p-4 rounded-lg shadow-sm border border-border text-center">
        <p className="text-destructive">No advisors available for chat.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Select Advisor</h3>
      {partners.map((partner) => {
        const isSelected = selectedPartnerId === partner.id;
        const Icon = partner.role === 'chartered_accountant' ? Calculator : User;
        
        const avatarSrc = partner.avatar_url 
          ? partner.avatar_url 
          : generateAvatarUrl(partner.first_name, partner.last_name);

        return (
          <Card
            key={partner.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              isSelected ? "border-2 border-primary shadow-md bg-secondary" : "border border-border bg-card hover:bg-secondary/50"
            )}
            onClick={() => onSelectPartner(partner.id)}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={avatarSrc} alt={`${partner.first_name} ${partner.last_name}`} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(partner.first_name, partner.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {partner.first_name} {partner.last_name}
                </p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Icon className="h-4 w-4 mr-1" />
                  {partner.role === 'admin' ? 'Legal Advisor' : 'Chartered Accountant'}
                </p>
              </div>
              <MessageSquare className={cn("h-5 w-5 flex-shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientChatPartnerSelector;