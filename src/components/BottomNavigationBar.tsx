"use client";

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Home, Briefcase, FileText, MessageSquare, PlusCircle, FileUp, CalendarDays, Bot, Zap, Paperclip, LayoutDashboard, DollarSign, ShieldCheck } from 'lucide-react'; // Added Paperclip, kept FileUp for upload form
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import DocumentUploadForm from '@/components/forms/DocumentUploadForm';
import ConsultationBookingForm from '@/components/forms/ConsultationBookingForm';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { useSession } from '@/contexts/SessionContext'; // Import useSession
import AIAssistant, { AIState, Message } from './AIAssistant'; // Import AI Assistant types

interface BottomNavigationBarProps {
  onDocumentUploadSuccess: () => void;
  onConsultationBookingSuccess: () => void;
}

const BottomNavigationBar = ({ onDocumentUploadSuccess, onConsultationBookingSuccess }: BottomNavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation
  const queryClient = useQueryClient(); // Initialize queryClient
  const { profile } = useSession(); // Get user profile to determine role

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<'upload' | 'book' | 'message' | 'ai' | null>(null); // Added 'ai'
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false); // State for AI Assistant modal
  const [aiInitialFlow, setAiInitialFlow] = useState<'onboarding' | 'document_upload' | 'book_consultation' | 'general'>('general');
  const [aiDocumentUploadCaseId, setAiDocumentUploadCaseId] = useState<string | null>(null);
  const [aiDocumentUploadCategoryId, setAiDocumentUploadCategoryId] = useState<string | null>(null);

  // State for AI Chat Persistence
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>({ type: 'idle' });
  const [aiCollectedData, setAiCollectedData] = useState<any>({});


  const handleQuickActionClick = (action: 'upload' | 'book' | 'message' | 'ai') => {
    setActiveQuickAction(action);
    if (action === 'ai') {
      setAiInitialFlow('general');
      setIsAIAssistantOpen(true);
    } else {
      setIsQuickActionsOpen(true);
    }
  };

  const handleCloseQuickActions = () => {
    setIsQuickActionsOpen(false);
    setActiveQuickAction(null);
  };

  const handleUploadSuccess = () => {
    onDocumentUploadSuccess();
    handleCloseQuickActions();
  };

  const handleConsultationBookingSuccess = () => {
    onConsultationBookingSuccess();
    handleCloseQuickActions();
  };

  // Callback for AI Assistant to trigger document upload form
  const handleAiTriggerDocumentUpload = (caseId: string | null, categoryId: string | null) => {
    setAiDocumentUploadCaseId(caseId);
    setAiDocumentUploadCategoryId(categoryId);
    setActiveQuickAction('upload'); // Re-use the upload dialog state
    setIsQuickActionsOpen(true); // Open the actual document upload form
    setIsAIAssistantOpen(false); // Close AI assistant temporarily
  };

  // Callback for AI Assistant to trigger consultation booking form (or just confirm)
  const handleAiTriggerConsultationBooking = (type: 'Legal Matter' | 'CA/Tax Question', slot: string) => {
    // The AI handles the booking directly. We just need to refetch data.
    onConsultationBookingSuccess(); // Trigger dashboard refetch
    // Do NOT close the AI assistant here, as it transitions to 'meeting_scheduling_complete' internally.
  };

  // Handle closing the AI Assistant modal
  const handleCloseAIAssistant = () => {
    setIsAIAssistantOpen(false);
    setAiInitialFlow('general'); // Reset flow for next open
  };

  // All users now use Creator Dashboard navigation
  const navItems = [
    { to: "/creator-dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/creator-contracts", icon: FileText, label: "Brand Deals" },
    { to: "/creator-payments", icon: DollarSign, label: "Payments & Recovery" },
    { to: "/creator-content-protection", icon: ShieldCheck, label: "Content Protection" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
        <nav className="flex justify-around h-14 items-center">
          {navItems.map((item) => (
            <Button
              key={item.to}
              variant="ghost"
              className={cn(
                "flex items-center justify-center h-full w-full text-muted-foreground hover:bg-accent hover:text-foreground",
                (item.to === location.pathname || (item.to === "quick-actions" && isQuickActionsOpen)) && "text-primary bg-accent hover:bg-accent"
              )}
              onClick={() => {
                if (item.to === "quick-actions") {
                  setIsQuickActionsOpen(true);
                } else {
                  navigate(item.to);
                }
              }}
              title={item.label}
            >
              <item.icon className={cn("h-6 w-6", item.to === "quick-actions" && "h-7 w-7")} />
            </Button>
          ))}
        </nav>
      </div>

      <Dialog open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="quick-actions-title"
          aria-describedby="quick-actions-description"
        >
          <DialogHeader>
            <DialogTitle id="quick-actions-title">Quick Actions</DialogTitle>
            <DialogDescription id="quick-actions-description" className="text-muted-foreground">
              Choose an action to perform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={() => { setAiInitialFlow('document_upload'); setIsAIAssistantOpen(true); handleCloseQuickActions(); }} // Open AI for document upload
            >
              <Paperclip className="h-5 w-5 text-foreground mb-1" /> {/* Changed FileUp to Paperclip */}
              <span className="text-sm">Upload a Document</span>
              <span className="text-xs text-muted-foreground mt-1">Securely share files with your advisor.</span>
            </Button>
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                handleCloseQuickActions();
                navigate('/messages');
              }}
            >
              <MessageSquare className="h-5 w-5 text-primary-foreground mb-1" />
              <span className="text-sm">Send a Secure Message</span>
              <span className="text-xs text-primary-foreground/80 mt-1">Directly communicate with your legal team.</span>
            </Button>
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-accent-gold text-accent-gold-foreground hover:bg-accent-gold/90"
              onClick={() => { setAiInitialFlow('book_consultation'); setIsAIAssistantOpen(true); handleCloseQuickActions(); }} // Open AI for consultation booking
            >
              <CalendarDays className="h-5 w-5 text-accent-gold-foreground mb-1" />
              <span className="text-sm">Book a Consultation</span>
              <span className="text-xs text-accent-gold-foreground/80 mt-1">Schedule a meeting with your legal advisor.</span>
            </Button>
            <Button
              className="w-full flex flex-col items-center justify-center p-4 h-auto text-lg bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => { setAiInitialFlow('general'); setIsAIAssistantOpen(true); handleCloseQuickActions(); }} // Open AI for general chat
            >
              <Bot className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-sm">Chat with AI Assistant</span>
              <span className="text-xs text-muted-foreground/80 mt-1">Your digital paralegal for administrative tasks.</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog (now triggered by AI Assistant) */}
      <Dialog open={activeQuickAction === 'upload' && isQuickActionsOpen} onOpenChange={(open) => !open && handleCloseQuickActions()}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="mobile-upload-doc-title"
          aria-describedby="mobile-upload-doc-description"
        >
          <DialogHeader>
            <DialogTitle id="mobile-upload-doc-title">Upload New Document</DialogTitle>
            <DialogDescription id="mobile-upload-doc-description" className="text-muted-foreground">
              Select a file from your device and give it a name to upload it securely.
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadForm
            onUploadSuccess={handleUploadSuccess}
            onClose={() => {
              handleCloseQuickActions();
              setAiInitialFlow('general'); // Reset AI flow
              setAiState({ type: 'document_filing_complete' }); // Set AI state to complete to show success message
              setIsAIAssistantOpen(true); // Re-open AI assistant after upload
            }}
            initialCaseId={aiDocumentUploadCaseId}
            initialCategoryId={aiDocumentUploadCategoryId}
          />
        </DialogContent>
      </Dialog>

      {/* Consultation Booking Dialog (now uses Calendly via AI Assistant) */}
      {/* We keep this dialog definition but it's only opened if the AI flow triggers it, 
          which now immediately opens Calendly and closes the dialog. */}
      <Dialog open={activeQuickAction === 'book' && isQuickActionsOpen} onOpenChange={(open) => !open && handleCloseQuickActions()}>
        <DialogContent 
          className="sm:max-w-[425px] bg-card text-foreground border-border"
          aria-labelledby="mobile-book-consultation-title"
          aria-describedby="mobile-book-consultation-description"
        >
          <DialogHeader>
            <DialogTitle id="mobile-book-consultation-title">Book a Consultation</DialogTitle>
            <DialogDescription id="mobile-book-consultation-description" className="text-muted-foreground">
              Please select your preferred date and time for the consultation.
            </DialogDescription>
          </DialogHeader>
          <ConsultationBookingForm onBookingSuccess={handleConsultationBookingSuccess} onClose={handleCloseQuickActions} />
        </DialogContent>
      </Dialog>

      {/* AI Assistant Dialog */}
      <Dialog open={isAIAssistantOpen} onOpenChange={handleCloseAIAssistant}>
        <DialogContent 
          className="sm:max-w-[425px] h-[80vh] flex flex-col bg-card text-foreground border-border"
          aria-labelledby="mobile-ai-assistant-title"
          aria-describedby="mobile-ai-assistant-description"
        >
          <DialogHeader>
            <DialogTitle id="mobile-ai-assistant-title">AI Assistant</DialogTitle>
            <DialogDescription id="mobile-ai-assistant-description">Your digital paralegal for administrative tasks.</DialogDescription>
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
    </>
  );
};

export default BottomNavigationBar;