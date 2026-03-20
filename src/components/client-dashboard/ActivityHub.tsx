"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Briefcase, File, MessageSquare, CalendarDays, Activity as ActivityIcon, Eye, Star } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useActivityLog } from '@/lib/hooks/useActivityLog';
import { useCases } from '@/lib/hooks/useCases';
import { useDocuments, useUpdateDocument } from '@/lib/hooks/useDocuments';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { useMessages } from '@/lib/hooks/useMessages';
import { useProfiles } from '@/lib/hooks/useProfiles';
import { getActivityIcon } from '@/lib/utils/activity-icons';
import { toast } from 'sonner';
import { Case, Document, Consultation, Message } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';

const statusToProgress: { [key: string]: number } = {
  'On Hold': 25,
  'In Progress': 50,
  'Awaiting Review': 75,
  'Completed': 100,
};

const getCaseProgressBar = (status: string) => {
  let width = '0%';
  let bgColor = 'bg-gray-400';
  switch (status) {
    case 'In Progress': width = '50%'; bgColor = 'bg-blue-500'; break;
    case 'Awaiting Review': width = '75%'; bgColor = 'bg-orange-500'; break;
    case 'Completed': width = '100%'; bgColor = 'bg-green-500'; break;
    case 'On Hold': width = '25%'; bgColor = 'bg-gray-500'; break;
  }
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5">
      <div className={`${bgColor} h-2.5 rounded-full`} style={{ width }}></div>
    </div>
  );
};

// Helper function to determine activity origin and return a pill-shaped tag
const getActivityOriginTag = (description: string) => {
  const lowerDescription = description.toLowerCase();
  if (lowerDescription.includes('document') || lowerDescription.includes('case') || lowerDescription.includes('consultation') || lowerDescription.includes('legal')) {
    return <Badge className="rounded-full px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">Legal</Badge>;
  }
  if (lowerDescription.includes('profile') || lowerDescription.includes('account')) {
    return <Badge className="rounded-full px-2 py-0.5 text-xs bg-green-500/20 text-green-400 border-green-500/30">Account</Badge>;
  }
  if (lowerDescription.includes('message') || lowerDescription.includes('chat')) {
    return <Badge className="rounded-full px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">Communication</Badge>;
  }
  if (lowerDescription.includes('subscription') || lowerDescription.includes('plan') || lowerDescription.includes('billing')) {
    return <Badge className="rounded-full px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border-red-500/30">Billing</Badge>;
  }
  return <Badge className="rounded-full px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 border-gray-500/30">General</Badge>;
};

const ActivityHub = () => {
  const { profile } = useSession();
  const updateDocumentMutation = useUpdateDocument();

  const { data: activityLogData, isLoading: isLoadingActivity } = useActivityLog({ clientId: profile?.id, limit: 10, enabled: !!profile?.id, joinProfile: false });
  const { data: casesData, isLoading: isLoadingCases } = useCases({ clientId: profile?.id, limit: 5, enabled: !!profile?.id, joinProfile: false });
  const { data: documentsData, isLoading: isLoadingDocuments } = useDocuments({ clientId: profile?.id, limit: 5, enabled: !!profile?.id, joinProfile: false });
  const { data: consultationsData, isLoading: isLoadingConsultations } = useConsultations({ clientId: profile?.id, limit: 5, enabled: !!profile?.id, joinProfile: false });
  
  const { data: adminProfilesData } = useProfiles({ role: 'admin', enabled: !!profile, disablePagination: true });
  const adminProfile = adminProfilesData?.data?.[0];
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages({ currentUserId: profile?.id, receiverId: adminProfile?.id, enabled: !!profile?.id && !!adminProfile?.id });

  const handleToggleFavorite = async (documentId: string, currentStatus: boolean) => {
    try {
      await updateDocumentMutation.mutateAsync({ id: documentId, is_favorite: !currentStatus });
      toast.success(`Document ${!currentStatus ? 'added to' : 'removed from'} favorites!`);
    } catch (error: any) {
      toast.error('Failed to update favorite status', { description: error.message });
    }
  };

  const renderEmptyState = (message: string, link: string, linkText: string) => (
    <Card className="bg-secondary p-6 rounded-lg shadow-sm border border-border text-center">
      <p className="text-muted-foreground mb-4">{message}</p>
      <Button asChild>
        <Link to={link}>{linkText}</Link>
      </Button>
    </Card>
  );

  return (
    <Card className="bg-card p-6 rounded-lg shadow-lg border border-border">
      <Tabs defaultValue="activity" className="w-full"> {/* Removed relative from Tabs */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-4">
          <TabsTrigger value="activity">All Activity</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
        </TabsList>
        
        <div className="min-h-[200px]"> {/* Removed relative from this div */}
          <TabsContent value="activity" className="mt-4 data-[state=inactive]:hidden"> {/* Removed absolute inset-0 */}
            {isLoadingActivity ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : activityLogData?.data && activityLogData.data.length > 0 ? (
              <Card className="p-4 border border-border shadow-sm bg-secondary overflow-hidden">
                <div className="grid grid-cols-1 gap-3">
                  {activityLogData.data.map((activity) => (
                    <Link to="/client-activity-log" key={activity.id} className="block hover:bg-accent rounded-lg transition-colors">
                      <div className="bg-transparent p-3 shadow-none border-none flex flex-col sm:flex-row sm:items-center sm:justify-between"> {/* Added flex-col/sm:flex-row */}
                        <div className="flex items-center gap-3 mb-2 sm:mb-0 flex-1 min-w-0"> {/* Made flex-1 */}
                          {getActivityIcon(activity.description)}
                          {getActivityOriginTag(activity.description)}
                          <p className="text-sm text-foreground flex-1"> {/* Made flex-1 */}
                            {activity.description}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground text-right flex-shrink-0">
                          {new Date(activity.created_at).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ) : renderEmptyState("No recent activity found.", "/client-activity-log", "View All Activity")}
          </TabsContent>

          <TabsContent value="cases" className="mt-4 data-[state=inactive]:hidden"> {/* Removed absolute inset-0 */}
            {isLoadingCases ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : casesData?.data && casesData.data.length > 0 ? (
              <Card className="p-4 border border-border shadow-sm bg-secondary overflow-hidden">
                <div className="grid grid-cols-1 gap-4">
                  {casesData.data.map((_case) => {
                    const progress = statusToProgress[_case.status] || 0;
                    return (
                      <Card key={_case.id} className="bg-card p-4 rounded-lg shadow-sm border border-border">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center"><Briefcase className="h-5 w-5 text-muted-foreground mr-2" /><h3 className="font-medium text-foreground text-lg">{_case.title}</h3></div>
                            <Badge variant={_case.status === 'Completed' ? 'success' : _case.status === 'In Progress' ? 'default' : 'secondary'}>{_case.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>{progress}% Complete</span>
                            <span>Due: {_case.deadline ? new Date(_case.deadline).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="mt-2">{getCaseProgressBar(_case.status)}</div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ) : renderEmptyState("No cases found.", "/client-cases", "View All Cases")}
          </TabsContent>

          <TabsContent value="documents" className="mt-4 data-[state=inactive]:hidden"> {/* Removed absolute inset-0 */}
            {isLoadingDocuments ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : documentsData?.data && documentsData.data.length > 0 ? (
              <Card className="p-4 border border-border shadow-sm bg-secondary overflow-hidden">
                <div className="grid grid-cols-1 gap-4">
                  {documentsData.data.map((doc) => (
                    <Card key={doc.id} className="bg-card p-4 rounded-lg shadow-sm border border-border flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <File className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Uploaded On: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(doc.id, doc.is_favorite)}><Star className={`h-4 w-4 ${doc.is_favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} /></Button>
                        <Button variant="outline" size="sm" asChild className="text-primary border-border hover:bg-accent hover:text-foreground"><a href={doc.url} target="_blank" rel="noopener noreferrer"><span><Eye className="h-4 w-4 mr-1" /> View</span></a></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : renderEmptyState("No documents found.", "/client-documents", "View All Documents")}
          </TabsContent>

          <TabsContent value="messages" className="mt-4 data-[state=inactive]:hidden"> {/* Removed absolute inset-0 */}
            {isLoadingMessages ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : messagesData && messagesData.length > 0 ? (
              <Card className="p-4 border border-border shadow-sm bg-secondary overflow-hidden">
                <div className="space-y-4">
                  {messagesData.slice(-5).map((msg) => (
                    <div key={msg.id} className={cn('flex items-end gap-2', msg.sender_id === profile?.id ? 'justify-end' : 'justify-start')}>
                      {msg.sender_id !== profile?.id && <Avatar className="h-8 w-8"><AvatarImage src={adminProfile?.avatar_url || DEFAULT_AVATAR_URL} /><AvatarFallback className="bg-secondary text-secondary-foreground">{getInitials(adminProfile?.first_name, adminProfile?.last_name)}</AvatarFallback></Avatar>}
                      <div className={cn('max-w-[70%] p-3 rounded-lg', msg.sender_id === profile?.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground')}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <Button asChild className="w-full mt-4"><Link to="/messages"><span>View Full Conversation</span></Link></Button>
                </div>
              </Card>
            ) : renderEmptyState("No messages yet.", "/messages", "Send a Message")}
          </TabsContent>

          <TabsContent value="consultations" className="mt-4 data-[state=inactive]:hidden"> {/* Removed absolute inset-0 */}
            {isLoadingConsultations ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" /> : consultationsData?.data && consultationsData.data.length > 0 ? (
              <Card className="p-4 border border-border shadow-sm bg-secondary overflow-hidden">
                <div className="grid grid-cols-1 gap-4">
                  {consultationsData.data.map((consultation) => (
                    <Card key={consultation.id} className="bg-card p-4 rounded-lg shadow-sm border border-border flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{new Date(consultation.preferred_date).toLocaleDateString()} at {consultation.preferred_time}</p>
                        <p className="text-sm text-muted-foreground">Topic: {consultation.topic || 'N/A'}</p>
                        <Badge variant={consultation.status === 'Approved' ? 'success' : 'secondary'} className="mt-1">{consultation.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild className="ml-4 text-primary border-border hover:bg-accent hover:text-foreground"><Link to="/client-consultations"><span><Eye className="h-4 w-4 mr-1" /> Details</span></Link></Button>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : renderEmptyState("No consultations found.", "/client-consultations", "Book a Consultation")}
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

export default ActivityHub;