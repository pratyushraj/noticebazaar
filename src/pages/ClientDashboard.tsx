import React, { useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/card';
import { FolderOpen, Paperclip, MessageSquare, CalendarDays, Plus, CheckCircle, Bot, LogOut, Loader2 } from 'lucide-react'; // Changed FileUp to Paperclip
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useCases } from '@/lib/hooks/useCases';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import DocumentUploadForm from '@/components/forms/DocumentUploadForm';
import ConsultationBookingForm from '@/components/forms/ConsultationBookingForm';
import { useQueryClient } from '@tanstack/react-query';
import DualKPISnapshot from '@/components/client-dashboard/DualKPISnapshot'; // Import new DualKPISnapshot
import YourProfessionalTeamWidget from '@/components/client-dashboard/YourProfessionalTeamWidget'; // Import new YourProfessionalTeamWidget
import ActivityHub from '@/components/client-dashboard/ActivityHub'; // Keep ActivityHub
import ChatWindow from '@/components/ChatWindow'; // Import ChatWindow
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components
import AIAssistant, { AIState, Message } from '@/components/AIAssistant'; // Import AIAssistant types
import QuickActionCard from '@/components/QuickActionCard'; // Import QuickActionCard
import PortalGuideWidget from '@/components/PortalGuideWidget'; // Import the new widget

const ClientDashboard = () => {
  const { profile } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOutMutation = useSignOut();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isConsultationBookingDialogOpen, setIsConsultationBookingDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageReceiverId, setMessageReceiverId] = useState<string | null>(null);
  const [messageReceiverName, setMessageReceiverName] = useState<string>('');

  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false); // State for AI Assistant modal
  const [aiInitialFlow, setAiInitialFlow] = useState<'onboarding' | 'document_upload' | 'book_consultation' | 'general'>('general');
  const [aiDocumentUploadCaseId, setAiDocumentUploadCaseId] = useState<string | null>(null);
  const [aiDocumentUploadCategoryId, setAiDocumentUploadCategoryId] = useState<string | null>(null);

  // State for AI Chat Persistence
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>({ type: 'idle' });
  const [aiCollectedData, setAiCollectedData] = useState<any>({});


  // Check if onboarding is complete to trigger AI automatically
  useEffect(() => {
    if (profile && !profile.onboarding_complete) {
      setAiInitialFlow('onboarding');
      setIsAIAssistantOpen(true);
    }
  }, [profile]);

  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['documents', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['activity_log', profile?.id] });
  };

  const handleConsultationBookingSuccess = () => {
    setIsConsultationBookingDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['consultations', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['activity_log', profile?.id] });
  };

  const handleOpenMessageDialog = (receiverId: string, receiverName: string) => {
    setMessageReceiverId(receiverId);
    setMessageReceiverName(receiverName);
    setIsMessageDialogOpen(true);
  };

  const handleCloseMessageDialog = () => {
    setIsMessageDialogOpen(false);
    setMessageReceiverId(null);
    setMessageReceiverName('');
  };

  // Callback for AI Assistant to trigger document upload form
  const handleAiTriggerDocumentUpload = (caseId: string | null, categoryId: string | null) => {
    setAiDocumentUploadCaseId(caseId);
    setAiDocumentUploadCategoryId(categoryId);
    setIsUploadDialogOpen(true); // Open the actual document upload form
    setIsAIAssistantOpen(false); // Close AI assistant temporarily
  };

  // Callback for AI Assistant to trigger consultation booking form (or just confirm)
  const handleAiTriggerConsultationBooking = (type: 'Legal Matter' | 'CA/Tax Question', slot: string) => {
    // The AI handles the booking directly. We just need to refetch data.
    queryClient.invalidateQueries({ queryKey: ['consultations', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['activity_log', profile?.id] });
    // Do NOT close the AI assistant here, as it transitions to 'meeting_scheduling_complete' internally.
  };

  // Handle closing the AI Assistant modal
  const handleCloseAIAssistant = () => {
    setIsAIAssistantOpen(false);
    setAiInitialFlow('general'); // Reset flow for next open
  };

  return (
    <div className="flex flex-col gap-8 p-6 rounded-xl relative overflow-hidden" style={{ 
      background: 'linear-gradient(120deg, rgba(59,130,246,0.07), rgba(167,139,250,0.04))',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.03)',
      boxShadow: '0 6px 18px rgba(3,7,18,0.6)',
      marginBottom: '2rem' // Add margin bottom to separate from footer/nav
    }}>
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Welcome back, {profile?.first_name || 'Client'} 👋
      </h1>
      <p className="text-muted-foreground -mt-8">Here's what's happening with your legal and financial matters today.</p>

      {/* Quick Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <QuickActionCard
              icon={<span className="text-3xl">📄</span>}
              title="Upload a Document"
              description="Securely share files with your advisor."
              onClick={() => { setAiInitialFlow('document_upload'); setIsAIAssistantOpen(true); }}
              iconContainerClassName="bg-transparent"
            />
          </TooltipTrigger>
          <TooltipContent className="bg-card text-foreground border-border">
            <p>Upload important documents to your secure vault.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <QuickActionCard
              icon={<span className="text-3xl">💬</span>}
              title="Send a Secure Message"
              description="Directly communicate with your legal team."
              onClick={() => navigate('/messages')}
              iconContainerClassName="bg-transparent"
            />
          </TooltipTrigger>
          <TooltipContent className="bg-card text-foreground border-border">
            <p>Chat directly with your legal and financial advisors.</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <QuickActionCard
              icon={<span className="text-3xl">📅</span>}
              title="Book a Consultation"
              description="Schedule a meeting with your legal advisor."
              onClick={() => { setAiInitialFlow('book_consultation'); setIsAIAssistantOpen(true); }}
              className="border-accent-gold hover:border-accent-gold/80" // Highlight border with gold
              iconContainerClassName="bg-transparent"
            />
          </TooltipTrigger>
          <TooltipContent className="bg-card text-foreground border-border">
            <p>Request a consultation with your legal advisor.</p>
          </TooltipContent>
        </Tooltip>
      </section>

      {/* Dual KPI Snapshot Row */}
      <section>
        <DualKPISnapshot />
      </section>
      
      {/* NEW: Portal Guide Widget with Mockup Image */}
      <section>
        <PortalGuideWidget />
      </section>

      {/* Your Professional Team Widget */}
      <section>
        <YourProfessionalTeamWidget onSendMessage={handleOpenMessageDialog} />
      </section>

      {/* Activity Hub - Centralized tabbed section */}
      <section>
        <ActivityHub />
      </section>

      {/* Floating Action Button for AI Assistant */}
      <Button
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 p-4 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50"
        size="icon"
        onClick={() => { setAiInitialFlow('general'); setIsAIAssistantOpen(true); }}
      >
        <Bot className="h-6 w-6" />
      </Button>

      {/* Document Upload Dialog (now triggered by AI Assistant) */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="upload-doc-title"
          aria-describedby="upload-doc-description"
        >
          <DialogHeader>
            <DialogTitle id="upload-doc-title">Upload New Document</DialogTitle>
            <DialogDescription id="upload-doc-description" className="text-muted-foreground">
              Select a file from your device and give it a name to upload it securely.
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadForm
            onUploadSuccess={handleUploadSuccess}
            onClose={() => {
              setIsUploadDialogOpen(false);
              setAiInitialFlow('general'); // Reset AI flow
              setAiState({ type: 'document_filing_complete' }); // Set AI state to complete to show success message
              setIsAIAssistantOpen(true); // Re-open AI assistant after upload
            }}
            initialCaseId={aiDocumentUploadCaseId}
            initialCategoryId={aiDocumentUploadCategoryId}
          />
        </DialogContent>
      </Dialog>

      {/* Consultation Booking Dialog (now handled by AI Assistant) */}
      {/* This dialog is now largely unused as AI handles the booking directly */}
      <Dialog open={isConsultationBookingDialogOpen} onOpenChange={setIsConsultationBookingDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="book-consultation-title"
          aria-describedby="book-consultation-description"
        >
          <DialogHeader>
            <DialogTitle id="book-consultation-title">Book a Consultation</DialogTitle>
            <DialogDescription id="book-consultation-description" className="text-muted-foreground">
              Please select your preferred date and time for the consultation.
            </DialogDescription>
          </DialogHeader>
          <ConsultationBookingForm onBookingSuccess={handleConsultationBookingSuccess} onClose={() => setIsConsultationBookingDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={handleCloseMessageDialog}>
        <DialogContent 
          className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card text-foreground border-border"
          aria-labelledby="send-message-title"
          aria-describedby="send-message-description"
        >
          <DialogHeader>
            <DialogTitle id="send-message-title">Send Message</DialogTitle>
            <DialogDescription id="send-message-description" className="text-muted-foreground">
              Start a secure conversation with {messageReceiverName}.
            </DialogDescription>
          </DialogHeader>
          {messageReceiverId && (
            <div className="flex-1 overflow-hidden">
              <ChatWindow
                receiverId={messageReceiverId}
                receiverName={messageReceiverName}
                // receiverAvatarUrl can be passed if available from the profile data
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={isAIAssistantOpen} onOpenChange={handleCloseAIAssistant}>
        <DialogContent 
          className="sm:max-w-[425px] h-[80vh] flex flex-col bg-card text-foreground border-border"
          aria-labelledby="ai-assistant-title"
          aria-describedby="ai-assistant-description"
        >
          <DialogHeader>
            <DialogTitle id="ai-assistant-title">AI Assistant</DialogTitle>
            <DialogDescription id="ai-assistant-description">Your digital paralegal for administrative tasks.</DialogDescription>
          </DialogHeader>
          <AIAssistant
            onClose={handleCloseAIAssistant}
            initialFlow={aiInitialFlow}
            onDocumentUploadTrigger={handleAiTriggerDocumentUpload}
            onConsultationBookingTrigger={handleAiTriggerConsultationBooking}
            
            // Pass persistent state
            messages={aiMessages}
            setMessages={setAiMessages}
            aiState={aiState}
            setAiState={setAiState}
            collectedData={aiCollectedData}
            setCollectedData={setAiCollectedData}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDashboard;