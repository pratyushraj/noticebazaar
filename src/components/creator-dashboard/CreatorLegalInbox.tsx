"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ShieldAlert, 
  Copyright, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type InboxItemType = 'takedown_alert' | 'copyright_message' | 'payment_reminder' | 'legal_update';

interface InboxItem {
  id: string;
  type: InboxItemType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'medium' | 'low';
  link?: string;
  metadata?: {
    platform?: string;
    similarity_score?: number;
    amount?: string;
    due_date?: string;
  };
}

interface CreatorLegalInboxProps {
  takedownAlerts?: InboxItem[];
  copyrightMessages?: InboxItem[];
  paymentReminders?: InboxItem[];
  legalUpdates?: InboxItem[];
}

const CreatorLegalInbox: React.FC<CreatorLegalInboxProps> = ({
  takedownAlerts = [],
  copyrightMessages = [],
  paymentReminders = [],
  legalUpdates = [],
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'takedown_alert' | 'copyright_message' | 'payment_reminder' | 'legal_update'>('all');

  // Combine all items
  const allItems: InboxItem[] = [
    ...takedownAlerts,
    ...copyrightMessages,
    ...paymentReminders,
    ...legalUpdates,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter items based on selected tab
  const filteredItems = selectedTab === 'all' 
    ? allItems 
    : allItems.filter(item => item.type === selectedTab);

  // Get unread count for each type
  const unreadCounts = {
    all: allItems.filter(item => !item.isRead).length,
    takedown_alert: takedownAlerts.filter(item => !item.isRead).length,
    copyright_message: copyrightMessages.filter(item => !item.isRead).length,
    payment_reminder: paymentReminders.filter(item => !item.isRead).length,
    legal_update: legalUpdates.filter(item => !item.isRead).length,
  };

  const getItemIcon = (type: InboxItemType) => {
    switch (type) {
      case 'takedown_alert':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'copyright_message':
        return <Copyright className="h-5 w-5 text-purple-500" />;
      case 'payment_reminder':
        return <DollarSign className="h-5 w-5 text-yellow-500" />;
      case 'legal_update':
        return <FileText className="h-5 w-5 text-blue-500" />;
    }
  };

  const getItemColor = (type: InboxItemType, priority?: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'bg-red-500/10 border-red-500/30';
    if (type === 'takedown_alert') return 'bg-red-500/10 border-red-500/30';
    if (type === 'copyright_message') return 'bg-purple-500/10 border-purple-500/30';
    if (type === 'payment_reminder') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-card border-border';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Legal Inbox</h2>
        {unreadCounts.all > 0 && (
          <Badge variant="destructive" className="text-xs">
            {unreadCounts.all} unread
          </Badge>
        )}
      </div>

      <Card className="creator-card-base shadow-sm">
        <CardContent className="p-6">
          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all" className="text-xs">
                All {unreadCounts.all > 0 && `(${unreadCounts.all})`}
              </TabsTrigger>
              <TabsTrigger value="takedown_alert" className="text-xs">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Takedowns {unreadCounts.takedown_alert > 0 && `(${unreadCounts.takedown_alert})`}
              </TabsTrigger>
              <TabsTrigger value="copyright_message" className="text-xs">
                <Copyright className="h-3 w-3 mr-1" />
                Copyright {unreadCounts.copyright_message > 0 && `(${unreadCounts.copyright_message})`}
              </TabsTrigger>
              <TabsTrigger value="payment_reminder" className="text-xs">
                <DollarSign className="h-3 w-3 mr-1" />
                Payments {unreadCounts.payment_reminder > 0 && `(${unreadCounts.payment_reminder})`}
              </TabsTrigger>
              <TabsTrigger value="legal_update" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Updates {unreadCounts.legal_update > 0 && `(${unreadCounts.legal_update})`}
              </TabsTrigger>
            </TabsList>

            {/* Items List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all",
                      getItemColor(item.type, item.priority),
                      !item.isRead && "border-l-4 border-l-blue-500"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getItemIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1">
                            <h4 className={cn(
                              "font-semibold text-foreground",
                              !item.isRead && "font-bold"
                            )}>
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!item.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Metadata */}
                        {item.metadata && (
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {item.metadata.platform && (
                              <Badge variant="outline" className="text-xs">
                                {item.metadata.platform}
                              </Badge>
                            )}
                            {item.metadata.similarity_score && (
                              <Badge variant="destructive" className="text-xs">
                                {item.metadata.similarity_score}% match
                              </Badge>
                            )}
                            {item.metadata.amount && (
                              <Badge variant="secondary" className="text-xs">
                                ₹{item.metadata.amount}
                              </Badge>
                            )}
                            {item.metadata.due_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(item.metadata.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Button */}
                        {item.link && (
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              asChild
                            >
                              {item.type === 'takedown_alert' ? (
                                <Link to={item.link}>
                                  View Alert <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              ) : item.type === 'copyright_message' ? (
                                <Link to={item.link}>
                                  View Match <ExternalLink className="ml-1 h-3 w-3" />
                                </Link>
                              ) : item.type === 'payment_reminder' ? (
                                <Link to={item.link}>
                                  View Payment <DollarSign className="ml-1 h-3 w-3" />
                                </Link>
                              ) : (
                                <Link to={item.link}>
                                  Read More <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No items in this category</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatorLegalInbox;
