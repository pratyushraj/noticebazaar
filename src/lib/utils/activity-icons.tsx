import { FileUp, MessageSquare, CalendarDays, User as UserIcon, Activity as ActivityIcon, CreditCard } from 'lucide-react';
import React from 'react';

export const getActivityIcon = (description: string) => {
  const lowerDescription = description.toLowerCase();
  if (lowerDescription.includes('uploaded') || lowerDescription.includes('document')) return <FileUp className="h-4 w-4 text-blue-500" />;
  if (lowerDescription.includes('consultation') || lowerDescription.includes('booked')) return <CalendarDays className="h-4 w-4 text-yellow-500" />;
  if (lowerDescription.includes('message') || lowerDescription.includes('sent') || lowerDescription.includes('received')) return <MessageSquare className="h-4 w-4 text-purple-500" />;
  if (lowerDescription.includes('profile') || lowerDescription.includes('updated')) return <UserIcon className="h-4 w-4 text-green-500" />;
  if (lowerDescription.includes('subscription') || lowerDescription.includes('plan') || lowerDescription.includes('billing')) return <CreditCard className="h-4 w-4 text-red-500" />;
  return <ActivityIcon className="h-4 w-4 text-gray-500" />;
};