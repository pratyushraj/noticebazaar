"use client";

import React from 'react';
import { Profile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar'; // Import DEFAULT_AVATAR_URL

interface ClientChatListProps {
  clients: Profile[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  isLoading: boolean;
}

const ClientChatList = ({ clients, selectedClientId, onSelectClient, isLoading }: ClientChatListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-card rounded-lg shadow-sm border border-border p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground text-sm">Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-card rounded-lg shadow-sm border border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Clients</h3>
      </div>
      <ScrollArea className="flex-1">
        {clients.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No clients found.</div>
        ) : (
          <div className="p-2">
            {clients.map((client) => (
              <div
                key={client.id}
                className={cn(
                  "flex items-center p-3 rounded-md cursor-pointer hover:bg-accent transition-colors",
                  selectedClientId === client.id && "bg-accent hover:bg-accent"
                )}
                onClick={() => onSelectClient(client.id)}
              >
                <Avatar className="h-9 w-9 mr-3">
                  <AvatarImage src={client.avatar_url || DEFAULT_AVATAR_URL} alt={`${client.first_name} ${client.last_name}`} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(client.first_name, client.last_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {client.first_name} {client.last_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ClientChatList;