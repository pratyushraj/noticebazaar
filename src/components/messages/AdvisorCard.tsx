"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, User, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials, generateAvatarUrl } from '@/lib/utils/avatar';
import { Profile } from '@/types';

interface AdvisorCardProps {
  advisor: Profile & { chat_label?: string };
  isSelected: boolean;
  onClick: () => void;
}

const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor, isSelected, onClick }) => {
  const Icon = advisor.role === 'chartered_accountant' ? Calculator : User;
  const roleLabel = advisor.role === 'admin' ? 'Legal Advisor' : advisor.role === 'chartered_accountant' ? 'Chartered Accountant' : advisor.role;
  
  const avatarSrc = advisor.avatar_url 
    ? advisor.avatar_url 
    : generateAvatarUrl(advisor.first_name, advisor.last_name);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-200 rounded-xl border hover:shadow-md",
        isSelected 
          ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/20" 
          : "border-border/40 bg-card hover:bg-accent/5 hover:border-border"
      )}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarSrc} alt={`${advisor.first_name} ${advisor.last_name}`} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(advisor.first_name, advisor.last_name)}
            </AvatarFallback>
          </Avatar>
          {/* Optional online indicator - can be added later */}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {advisor.first_name} {advisor.last_name}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Icon className="h-3.5 w-3.5" />
            {roleLabel}
          </p>
        </div>
        
        <MessageSquare 
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isSelected ? "text-primary" : "text-muted-foreground/50"
          )} 
        />
      </CardContent>
    </Card>
  );
};

export default AdvisorCard;

