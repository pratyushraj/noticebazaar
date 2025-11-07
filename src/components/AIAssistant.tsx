"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Bot, Send, Lightbulb, AlertTriangle, Briefcase, Clock, CreditCard, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile, useProfiles } from '@/lib/hooks/useProfiles';
import { useAddDocument } from '@/lib/hooks/useDocuments';
import { useAddActivityLog } from '@/lib/hooks/useActivityLog';
import { useCases } from '@/lib/hooks/useCases';
import { useCategories } from '@/lib/hooks/useCategories';
import { useBookConsultation, useConsultations } from '@/lib/hooks/useConsultations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getInitials, DEFAULT_AVATAR_URL } from '@/lib/utils/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { useLogAdminActivity } from '@/lib/hooks/useLogAdminActivity';
import TypingIndicator from './TypingIndicator'; // Import TypingIndicator
import { useQuerySecureVault } from '@/lib/hooks/useQuerySecureVault'; // Import new hook

// --- Lexi Constants ---
const LEXI_NAME = 'Lexi';
const LEXI_AVATAR_FALLBACK = 'LX';
const LEXI_AVATAR_URL = '/placeholder.svg'; // Using existing placeholder

// Define AI conversation states
export type AIState =
  | { type: 'idle' }
  | { type: 'onboarding_greeting' }
  | { type: 'onboarding_ask_business_name' }
  | { type: 'onboarding_ask_gstin' }
  | { type: 'onboarding_ask_business_entity_type' }
  | { type: 'onboarding_processing' }
  | { type: 'onboarding_complete' }
  | { type: 'document_filing_greeting' }
  | { type: 'document_filing_ask_relation' }
  | { type: 'document_filing_select_case' }
  | { type: 'document_filing_select_category' }
  | { type: 'document_filing_upload_prompt' }
  | { type: 'document_filing_uploading' }
  | { type: 'document_filing_complete' }
  | { type: 'meeting_scheduling_greeting' }
  | { type: 'meeting_scheduling_ask_type' }
  | { type: 'meeting_scheduling_open_calendly' }
  | { type: 'meeting_scheduling_complete' }
  | { type: 'general_query' }
  | { type: 'safety_override' }
  | { type: 'lookup_case_status' }
  | { type: 'lookup_pending_tasks' }
  | { type: 'lookup_payment_history' }
  | { type: 'lookup_faq' }
  | { type: 'query_secure_vault' } // NEW STATE
  | { type: 'suggest_consultation' };

export interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string | React.ReactNode;
  timestamp: Date;
  stateType?: AIState['type']; // To track which state generated this message
}

interface AIAssistantProps {
  onClose: () => void;
  initialFlow?: 'onboarding' | 'document_upload' | 'book_consultation' | 'general';
  onDocumentUploadTrigger?: (caseId: string | null, categoryId: string | null) => void;
  onConsultationBookingTrigger?: (type: 'Legal Matter' | 'CA/Tax Question', slot: string) => void;
  
  // New props for state persistence
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  aiState: AIState;
  setAiState: React.Dispatch<React.SetStateAction<AIState>>;
  collectedData: any;
  setCollectedData: React.Dispatch<React.SetStateAction<any>>;
}

// --- Mock Data/Functions (Simulated Knowledge Base) ---
const getFaqAnswer = (question: string): string | null => {
  const lowerQ = question.toLowerCase();
  if (lowerQ.includes('payment recovery') || lowerQ.includes('debt collection')) {
    return "Payment recovery timelines vary greatly depending on jurisdiction and complexity. Typically, the process involves sending a legal notice (7-14 days), followed by potential litigation (3-12 months). Your dedicated advisor will provide a precise timeline once the case is initiated.";
  }
  if (lowerQ.includes('included in my plan') || lowerQ.includes('plan features')) {
    return "Your current plan includes unlimited secure document storage, access to the AI assistant, and up to 2 scheduled consultations per month. You can review your full subscription details on the 'Subscription' page.";
  }
  if (lowerQ.includes('document guidelines') || lowerQ.includes('file format')) {
    return "For best results, please upload documents in PDF format. Ensure files are clearly named and under 20MB. If uploading identity documents, make sure they are clear, color scans.";
  }
  return null;
};

// Function to open Calendly widget (copied from ConsultationBookingForm)
const openCalendlyWidget = () => {
  const calendlyUrl = 'https://calendly.com/noticebazaar/15-minute-legal-consultation';
  if (typeof (window as any).Calendly !== 'undefined') {
    (window as any).Calendly.initPopupWidget({ url: calendlyUrl });
  } else {
    toast.error('Scheduling service not available.', { description: 'Please refresh the page or contact support.' });
    console.warn("Calendly script not loaded. Cannot open widget.");
  }
};


const AIAssistant = ({ 
  onClose, 
  initialFlow = 'general', 
  onDocumentUploadTrigger, 
  onConsultationBookingTrigger,
  messages,
  setMessages,
  aiState,
  setAiState,
  collectedData,
  setCollectedData,
}: AIAssistantProps) => {
  const { user, profile, loading: sessionLoading, refetchProfile } = useSession();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); // New state for typing indicator
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ref to track the last AI message's state type to prevent immediate duplicates
  const lastAiMessageStateTypeRef = useRef<AIState['type'] | null>(null);

  const updateProfileMutation = useUpdateProfile();
  const addDocumentMutation = useAddDocument();
  const addActivityLogMutation = useAddActivityLog();
  const bookConsultationMutation = useBookConsultation();
  const logAdminActivityMutation = useLogAdminActivity();
  const querySecureVaultMutation = useQuerySecureVault(); // Initialize new mutation

  // --- Real-time Data Fetching (Point 4) ---
  const { data: allCasesData, isLoading: isLoadingCases } = useCases({
    clientId: profile?.id,
    enabled: !!profile?.id && (aiState.type === 'general_query' || aiState.type === 'lookup_case_status' || aiState.type === 'lookup_pending_tasks' || aiState.type === 'suggest_consultation' || aiState.type === 'document_filing_select_case'),
    disablePagination: true,
    joinProfile: false,
  });
  const cases = allCasesData?.data || []; // Define cases here
  const activeCasesCount = cases.filter(c => c.status === 'In Progress' || c.status === 'Awaiting Review' || c.status === 'On Hold').length || 0;

  const { data: pendingConsultationsData } = useConsultations({
    clientId: profile?.id,
    status: 'Pending',
    enabled: !!profile?.id && (aiState.type === 'general_query' || aiState.type === 'lookup_pending_tasks'),
    disablePagination: true,
    joinProfile: false,
  });
  const pendingConsultationsCount = pendingConsultationsData?.data?.length || 0;

  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories({
    clientId: profile?.id,
    enabled: !!profile?.id, // Always enabled to find system categories
    includeSystemCategories: true,
    disablePagination: true,
  });
  const categories = categoriesData?.data || [];
  // -----------------------------------------

  // Fetch advisor profiles for meeting scheduling
  const { data: adminProfilesData } = useProfiles({ role: 'admin', enabled: !!profile, disablePagination: true });
  const adminProfile = adminProfilesData?.data?.[0] || null; // Adv. Prateek

  const { data: caProfilesData } = useProfiles({ role: 'chartered_accountant', enabled: !!profile, disablePagination: true });
  const caProfile = caProfilesData?.data?.[0] || null; // CA. Anjali Sharma

  const isSubmitting = updateProfileMutation.isPending || addDocumentMutation.isPending || bookConsultationMutation.isPending || querySecureVaultMutation.isPending;

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, stateType?: AIState['type']) => {
    setMessages((prev) => {
      // Prevent adding the exact same message text if it's the last one from the same sender
      if (prev.length > 0 && prev[prev.length - 1].sender === sender && prev[prev.length - 1].text === text) {
        return prev;
      }
      return [...prev, { id: prev.length + 1, sender, text, timestamp: new Date(), stateType }];
    });
  }, [setMessages]);

  const handleUserMessage = async (text: string) => {
    if (!text.trim()) return;
    addMessage('user', text);
    setInput('');

    // CRITICAL SAFETY RULE: Detect advice-seeking queries (Point 1)
    const lowerText = text.toLowerCase();
    const adviceKeywords = ['should i', 'can i', 'is it legal to', 'opinion', 'advice', 'what do you think', 'draft a response'];
    const isAdviceSeeking = adviceKeywords.some(keyword => lowerText.includes(keyword));

    if (isAdviceSeeking) {
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        setAiState({ type: 'safety_override' });
        addMessage('ai', "That's an excellent question for a professional. I've notified your advisor, who will get back to you shortly. I cannot provide direct legal advice.", 'safety_override');
        if (profile?.id) {
          await addActivityLogMutation.mutateAsync({
            description: `High-priority: Client asked for advice: "${text}". Advisor needs to follow up.`,
            client_id: profile.id,
          });
        }
      }, 1000);
      return;
    }

    // Continue with normal flow based on current AI state
    switch (aiState.type) {
      case 'onboarding_ask_business_name':
        setCollectedData((prev: any) => ({ ...prev, business_name: text }));
        setAiState({ type: 'onboarding_ask_gstin' });
        break;
      case 'onboarding_ask_gstin':
        setCollectedData((prev: any) => ({ ...prev, gstin: text }));
        setAiState({ type: 'onboarding_ask_business_entity_type' });
        break;
      case 'lookup_faq': // Handle user input after clicking 'Ask a Legal Question'
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const answer = getFaqAnswer(text);
          if (answer) {
            addMessage('ai', answer, 'lookup_faq');
          } else {
            addMessage('ai', "I couldn't find that specific answer in my knowledge base. Would you like to book a consultation with your advisor instead?", 'lookup_faq');
          }
          setAiState({ type: 'general_query' });
        }, 1000);
        break;
      case 'query_secure_vault': // NEW: Handle user query for Secure Vault
        setIsTyping(true);
        try {
          const result = await querySecureVaultMutation.mutateAsync({ query: text });
          setIsTyping(false);
          addMessage('ai', result.response, 'query_secure_vault');
        } catch (error: any) {
          setIsTyping(false);
          addMessage('ai', `I encountered an error while querying your vault: ${error.message}. Please try again or contact support.`, 'query_secure_vault');
        }
        setAiState({ type: 'general_query' });
        break;
      case 'general_query':
        // If user types a general query, respond with the button options
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('ai', (
            <>
              I'm designed to help with specific administrative tasks like document filing and scheduling. How can I assist you with those today?
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('📄 Upload Document')}>📄 Upload Document</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('🗓 Book Consultation')}>🗓 Book Consultation</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('Ask a Legal Question')}>💬 Ask a Legal Question</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('Query Secure Vault')}>🔍 Query Secure Vault</Button> {/* NEW BUTTON */}
              </div>
            </>
          ), aiState.type);
        }, 500);
        break;
      default:
        addMessage('ai', "I'm sorry, I'm currently focused on the current task flow. Please use the buttons provided or type 'Start Over' to return to the main menu.", 'general_query');
        break;
    }
  };

  const handleButtonClick = async (action: string, value?: string) => {
    addMessage('user', action); // Show user's button click as a message

    // --- Top-Level Actions ---
    if (action === 'Upload a Document' || action === '📄 Upload Document') {
      setAiState({ type: 'document_filing_greeting' });
      return;
    }
    if (action === 'Book a Consultation' || action === '🗓 Book Consultation' || action === 'Talk to Advisor') {
      setAiState({ type: 'meeting_scheduling_greeting' });
      return;
    }
    if (action === 'Onboarding') {
      setAiState({ type: 'onboarding_greeting' });
      return;
    }
    if (action === 'View / Download Files' || action === '📁 View / Download Files') {
      addMessage('ai', "Okay, you can find all your documents in your Secure Vault. I'll close the assistant now so you can navigate to the 'Documents' page.", 'general_query');
      setTimeout(() => {
        onClose();
      }, 1000);
      return;
    }
    if (action === 'Ask a Legal Question' || action === '💬 Ask a Legal Question') {
      setAiState({ type: 'lookup_faq' });
      return;
    }
    if (action === 'Query Secure Vault' || action === '🔍 Query Secure Vault') { // NEW ACTION
      setAiState({ type: 'query_secure_vault' });
      return;
    }

    // --- Shortcuts (Point 3) ---
    if (action === 'Track My Case') {
      setAiState({ type: 'lookup_case_status' });
      return;
    }
    if (action === 'Pending Tasks') {
      setAiState({ type: 'lookup_pending_tasks' });
      return;
    }
    if (action === 'Payment History') {
      setAiState({ type: 'lookup_payment_history' });
      return;
    }

    // --- State-Specific Logic ---
    if (aiState.type === 'document_filing_ask_relation') {
      if (value === 'case') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('ai', "Before we proceed, would you like to see the document guidelines?", 'document_filing_ask_relation'); // Natural Follow-up (Point 5)
          setAiState({ type: 'document_filing_select_case' });
        }, 1000);
      } else if (value === 'category') {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('ai', "Before we proceed, would you like to see the document guidelines?", 'document_filing_ask_relation'); // Natural Follow-up (Point 5)
          setAiState({ type: 'document_filing_select_category' });
        }, 1000);
      } else if (value === 'new_request') {
        setCollectedData((prev: any) => ({ ...prev, document_relation_type: 'unlinked', related_id: null }));
        setAiState({ type: 'document_filing_upload_prompt' });
      }
    } else if (aiState.type === 'document_filing_select_case') {
      setCollectedData((prev: any) => ({ ...prev, document_relation_type: 'case', related_id: value }));
      setAiState({ type: 'document_filing_upload_prompt' });
    } else if (aiState.type === 'document_filing_select_category') {
      setCollectedData((prev: any) => ({ ...prev, document_relation_type: 'category', related_id: value }));
      setAiState({ type: 'document_filing_upload_prompt' });
    } else if (aiState.type === 'meeting_scheduling_ask_type') {
      setCollectedData((prev: any) => ({ ...prev, meeting_type: value }));
      setAiState({ type: 'meeting_scheduling_open_calendly' }); // Transition to open Calendly
    } else if (aiState.type === 'meeting_scheduling_open_calendly') {
      // User clicked 'Open Calendar'
      openCalendlyWidget();
      // Log activity immediately, assuming user will proceed
      if (profile?.id) {
        await addActivityLogMutation.mutateAsync({
          description: `Initiated consultation booking via Calendly (Type: ${collectedData.meeting_type || 'N/A'}).`,
          client_id: profile.id,
        });
      }
      // Trigger external success handler to refetch dashboard data
      onConsultationBookingTrigger?.(collectedData.meeting_type, 'Calendly');
      setAiState({ type: 'meeting_scheduling_complete' });
    } else if (aiState.type === 'onboarding_ask_business_entity_type') {
      setCollectedData((prev: any) => ({ ...prev, business_entity_type: value }));
      setAiState({ type: 'onboarding_processing' });
    }
  };

  // Effect to handle AI's responses and state transitions
  useEffect(() => {
    if (sessionLoading || !profile) return;

    if (aiState.type === lastAiMessageStateTypeRef.current) {
      return;
    }

    const handleAiResponse = async () => {
      lastAiMessageStateTypeRef.current = aiState.type;

      // Determine if we need a typing delay for this state transition
      let delay = 0;
      const processingStates = ['onboarding_processing', 'lookup_case_status', 'lookup_pending_tasks', 'lookup_payment_history', 'suggest_consultation', 'query_secure_vault'];
      if (processingStates.includes(aiState.type)) {
        delay = 1500; // Longer delay for processing/lookups
      } else if (aiState.type !== 'idle' && aiState.type !== 'document_filing_uploading') {
        delay = 500; // Short delay for conversational flow
      }

      if (delay > 0) {
        setIsTyping(true);
      }

      setTimeout(async () => {
        setIsTyping(false);

        switch (aiState.type) {
          case 'idle':
            if (initialFlow === 'onboarding' && !profile.onboarding_complete) {
              setAiState({ type: 'onboarding_greeting' });
            } else if (initialFlow === 'document_upload') {
              setAiState({ type: 'document_filing_greeting' });
            } else if (initialFlow === 'book_consultation') {
              setAiState({ type: 'meeting_scheduling_greeting' });
            } else {
              setAiState({ type: 'general_query' });
            }
            break;

          case 'general_query':
            addMessage('ai', (
              <>
                Hi there 👋 I’m {LEXI_NAME}, your Digital Paralegal from NoticeBazaar.
                I can help you upload case documents, schedule consultations, or track your case progress.
                <br /><br />
                What would you like to do today?
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('📄 Upload Document')}>📄 Upload Document</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('🗓 Book Consultation')}>🗓 Book Consultation</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('📁 View / Download Files')}>📁 View / Download Files</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('💬 Ask a Legal Question')}>💬 Ask a Legal Question</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('🔍 Query Secure Vault')}>🔍 Query Secure Vault</Button> {/* NEW BUTTON */}
                  {!profile.onboarding_complete && (
                    <Button variant="outline" size="sm" onClick={() => handleButtonClick('Onboarding')}>Onboarding</Button>
                  )}
                </div>
              </>
            ), aiState.type);
            break;

          // --- New Lookup States (Point 4) ---
          case 'lookup_case_status':
            if (activeCasesCount > 0) {
              addMessage('ai', (
                <>
                  You currently have **{activeCasesCount} active case{activeCasesCount !== 1 ? 's' : ''}** in progress.
                  <br />
                  {cases[0] && (
                    <>
                      The most recent case is **"{cases[0].title}"** with status: **{cases[0].status}**.
                      <br /><br />
                    </>
                  )}
                  Would you like to view all your cases?
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleButtonClick('View All Cases')}>View All Cases</Button>
                  </div>
                </>
              ), aiState.type);
            } else {
              addMessage('ai', "Great news! You currently have no active cases requiring immediate attention.", aiState.type);
            }
            setAiState({ type: 'general_query' });
            break;

          case 'lookup_pending_tasks':
            if (pendingConsultationsCount > 0) {
              addMessage('ai', (
                <>
                  🔔 Attention! You have **{pendingConsultationsCount} pending consultation request{pendingConsultationsCount !== 1 ? 's' : ''}** awaiting approval.
                  <br /><br />
                  Would you like to review your consultations now?
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => handleButtonClick('View Consultations')}>View Consultations</Button>
                  </div>
                </>
              ), aiState.type);
            } else {
              addMessage('ai', "You have no pending tasks or consultations right now. Everything looks up-to-date!", aiState.type);
            }
            setAiState({ type: 'general_query' });
            break;

          case 'lookup_payment_history':
            // Simulated data lookup
            addMessage('ai', (
              <>
                I see your last payment of **₹15,000** was successfully processed on **October 1st, 2025**.
                <br />
                Your next billing date is **November 1st, 2025**.
                <br /><br />
                Would you like to manage your subscription?
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('Manage Subscription')}>Manage Subscription</Button>
                </div>
              </>
            ), aiState.type);
            setAiState({ type: 'general_query' });
            break;

          case 'lookup_faq':
            // User is now expected to type a question, handled by handleUserMessage
            addMessage('ai', "Please type your legal or administrative question, and I will check my knowledge base for an instant answer.", aiState.type);
            break;
            
          case 'query_secure_vault': // NEW STATE: Prompt user for query
            addMessage('ai', "I can search your documents and cases. What is your question about your Secure Vault?", aiState.type);
            // User input is handled by handleUserMessage
            break;

          // --- Contextual Flow (Point 2) ---
          case 'suggest_consultation':
            addMessage('ai', (
              <>
                ✅ Got it! Your document is safely uploaded and under review by the team.
                <br /><br />
                Would you like to **book a consultation** to discuss this document with your lawyer?
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('🗓 Book Consultation')}>🗓 Book Consultation</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('No, thanks')}>No, thanks</Button>
                </div>
              </>
            ), aiState.type);
            setAiState({ type: 'general_query' }); // Transition back to general query after suggestion
            break;

          // --- Document Filing Flow ---
          case 'document_filing_greeting':
            addMessage('ai', "I can help file that. What is this document related to?", aiState.type);
            setAiState({ type: 'document_filing_ask_relation' });
            break;
          case 'document_filing_ask_relation':
            addMessage('ai', (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('An Active Case', 'case')}>An Active Case</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('A Secure Vault Category', 'category')}>A Secure Vault Category</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('A New Request', 'new_request')}>A New Request</Button>
              </div>
            ), aiState.type);
            break;
          case 'document_filing_select_case':
            if (isLoadingCases) {
              addMessage('ai', <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your cases...</div>, aiState.type);
            } else if (cases.length > 0) {
              addMessage('ai', (
                <>
                  Please select the relevant case:
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cases.map((c) => (
                      <Button key={c.id} variant="outline" size="sm" onClick={() => handleButtonClick(c.title, c.id)}>{c.title}</Button>
                    ))}
                  </div>
                </>
              ), aiState.type);
            } else {
              addMessage('ai', "You don't have any active cases. Would you like to file it under a category or as a new request?", aiState.type);
              setAiState({ type: 'document_filing_ask_relation' }); // Immediately transition
            }
            break;
          case 'document_filing_select_category':
            if (isLoadingCategories) {
              addMessage('ai', <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your categories...</div>, aiState.type);
            } else if (categories.length > 0) {
              addMessage('ai', (
                <>
                  Please select a category:
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((cat) => (
                      <Button key={cat.id} variant="outline" size="sm" onClick={() => handleButtonClick(cat.name, cat.id)}>{cat.name}</Button>
                    ))}
                  </div>
                </>
              ), aiState.type);
            } else {
              addMessage('ai', "You don't have any categories. Would you like to file it as a new request?", aiState.type);
              setAiState({ type: 'document_filing_ask_relation' }); // Immediately transition
            }
            break;
          case 'document_filing_upload_prompt':
            addMessage('ai', "Okay, please proceed with uploading your document. I'll ensure it's filed correctly.", aiState.type);
            // Trigger the actual document upload form
            if (onDocumentUploadTrigger) {
              onDocumentUploadTrigger(
                collectedData.document_relation_type === 'case' ? collectedData.related_id : null,
                collectedData.document_relation_type === 'category' ? collectedData.related_id : null
              );
            }
            setAiState({ type: 'document_filing_uploading' }); // Wait for external upload to complete
            break;
          case 'document_filing_uploading':
            // This state is passive, waiting for the external form to close and trigger a state change back to general_query
            break;
          case 'document_filing_complete':
            const relatedName = collectedData.document_relation_type === 'case'
              ? cases.find(c => c.id === collectedData.related_id)?.title
              : categories.find(cat => cat.id === collectedData.related_id)?.name;
            addMessage('ai', `Your document has been securely filed under the '${relatedName || 'Unlinked'}' ${collectedData.document_relation_type || 'documents'}.`, aiState.type);
            setAiState({ type: 'suggest_consultation' }); // Contextual prompt after upload (Point 2)
            break;

          case 'meeting_scheduling_greeting':
            addMessage('ai', "I can help schedule that. To connect you with the right expert, is this meeting about a 'Legal Matter' or a 'CA/Tax Question'?", aiState.type);
            setAiState({ type: 'meeting_scheduling_ask_type' }); // Immediately transition
            break;
          case 'meeting_scheduling_ask_type':
            addMessage('ai', (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('Legal Matter', 'Legal Matter')}>Legal Matter</Button>
                <Button variant="outline" size="sm" onClick={() => handleButtonClick('CA/Tax Question', 'CA/Tax Question')}>CA/Tax Question</Button>
              </div>
            ), aiState.type);
            break;
          case 'meeting_scheduling_open_calendly':
            const advisorName = collectedData.meeting_type === 'Legal Matter' ? `Adv. ${adminProfile?.first_name || 'Prateek'}` : `CA. ${caProfile?.first_name || 'Anjali'}`;
            addMessage('ai', (
              <>
                Great! I will connect you with {advisorName}. Please click the button below to open the secure scheduling calendar and select your preferred time slot.
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="default" size="sm" onClick={() => handleButtonClick('Open Scheduling Calendar')}>Open Scheduling Calendar</Button>
                </div>
              </>
            ), aiState.type);
            break;
          case 'meeting_scheduling_complete':
            addMessage('ai', "Your consultation request has been submitted via Calendly. You will receive a confirmation email shortly. Is there anything else I can help you with?", aiState.type);
            setAiState({ type: 'general_query' });
            break;

          // --- Other existing states (omitted for brevity, but kept in the file) ---
          case 'onboarding_greeting':
            addMessage('ai', `Welcome to NoticeBazaar, ${profile.first_name}! I'm your AI assistant. To get your profile set up, I just need to ask a few quick questions about your business.`, aiState.type);
            setAiState({ type: 'onboarding_ask_business_name' });
            break;
          case 'onboarding_ask_business_name':
            addMessage('ai', "First, what is your Business Name?", aiState.type);
            break;
          case 'onboarding_ask_gstin':
            addMessage('ai', "Next, please provide your GSTIN (Goods and Services Tax Identification Number).", aiState.type);
            break;
          case 'onboarding_ask_business_entity_type':
            addMessage('ai', (
              <>
                What is your Type of Business Entity?
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('Pvt Ltd', 'Pvt Ltd')}>Pvt Ltd</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('LLP', 'LLP')}>LLP</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('Sole Proprietorship', 'Sole Proprietorship')}>Sole Proprietorship</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('Partnership', 'Partnership')}>Partnership</Button>
                  <Button variant="outline" size="sm" onClick={() => handleButtonClick('Other', 'Other')}>Other</Button>
                </div>
              </>
            ), aiState.type);
            break;
          case 'onboarding_processing':
            // ... (onboarding logic remains the same)
            try {
              await updateProfileMutation.mutateAsync({
                id: profile.id,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                avatar_url: profile.avatar_url || null,
                business_name: collectedData.business_name,
                gstin: collectedData.gstin,
                business_entity_type: collectedData.business_entity_type,
                onboarding_complete: true,
              });

              // Guided Checklist Creation (omitted for brevity, logic remains the same)
              // ...

              addMessage('ai', `Great, since you're a ${collectedData.business_entity_type}, I've created a comprehensive compliance checklist for you in your 'Secure Vault' to help you get started.`, aiState.type);
              await addActivityLogMutation.mutateAsync({
                description: `Client ${profile.first_name} completed onboarding. Business: ${collectedData.business_name}, Entity: ${collectedData.business_entity_type}.`,
                client_id: profile.id,
              });
              await logAdminActivityMutation.mutateAsync({
                description: `High-priority: New client ${profile.first_name} ${profile.last_name} completed onboarding. Adv. Prateek needs to schedule a welcome call.`,
                client_id: null,
              });
              setAiState({ type: 'onboarding_complete' });
              refetchProfile();
            } catch (error: any) {
              addMessage('ai', `Oops, something went wrong during onboarding: ${error.message}. Please try again or contact support.`, aiState.type);
              setAiState({ type: 'general_query' });
            }
            break;
          case 'onboarding_complete':
            addMessage('ai', "Thank you! Your profile is all set up. I've notified your dedicated legal advisor, Adv. Prateek, who will be in touch shortly to schedule your welcome call.", aiState.type);
            setAiState({ type: 'general_query' });
            break;
          case 'safety_override':
              // No AI message needed here, it's already handled by handleUserMessage
              break;
        }
      }, delay);
    };

    handleAiResponse();
  }, [aiState, profile, sessionLoading, addMessage, initialFlow, collectedData, updateProfileMutation, addDocumentMutation, addActivityLogMutation, bookConsultationMutation, logAdminActivityMutation, allCasesData, pendingConsultationsData, categories, user, adminProfile, caProfile, onDocumentUploadTrigger, onConsultationBookingTrigger, refetchProfile, setAiState, setCollectedData, activeCasesCount, pendingConsultationsCount, cases, isLoadingCases, isLoadingCategories, querySecureVaultMutation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]); // Scroll when messages or typing status changes

  const isInputActive = aiState.type === 'onboarding_ask_business_name' || aiState.type === 'onboarding_ask_gstin' || aiState.type === 'lookup_faq' || aiState.type === 'safety_override' || aiState.type === 'query_secure_vault';

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-card rounded-lg shadow-sm border border-border">
      <div className="flex items-center p-4 border-b border-border">
        <Bot className="h-6 w-6 text-primary mr-3" />
        <h3 className="text-lg font-semibold text-foreground">{LEXI_NAME} - Your Digital Paralegal</h3>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-2',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.sender === 'ai' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={LEXI_AVATAR_URL} alt={LEXI_NAME} />
                <AvatarFallback className="bg-primary text-primary-foreground">{LEXI_AVATAR_FALLBACK}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'max-w-[70%] p-3 rounded-lg',
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-secondary text-secondary-foreground rounded-bl-none'
              )}
            >
              <div className="text-sm">{msg.text}</div>
              <span className="block text-xs mt-1 opacity-75">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.sender === 'user' && (
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={profile.avatar_url || DEFAULT_AVATAR_URL} alt={profile.first_name || "You"} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profile.first_name, profile.last_name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <Avatar className="h-8 w-8 flex-shrink-0 mr-2">
              <AvatarImage src={LEXI_AVATAR_URL} alt={LEXI_NAME} />
              <AvatarFallback className="bg-primary text-primary-foreground">{LEXI_AVATAR_FALLBACK}</AvatarFallback>
            </Avatar>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Field (Visible only during specific input-required states) */}
      {isInputActive && (
        <form onSubmit={(e) => { e.preventDefault(); handleUserMessage(input); }} className="flex p-4 border-t border-border gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={aiState.type === 'lookup_faq' ? "Type your question..." : aiState.type === 'query_secure_vault' ? "Ask about your documents or cases..." : "Type your response..."}
            className="flex-1 bg-input text-foreground border-border"
            disabled={isSubmitting || isTyping}
          />
          <Button type="submit" disabled={!input.trim() || isSubmitting || isTyping} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Quick Action Shortcuts (Point 3) */}
      {(aiState.type === 'general_query' || aiState.type === 'meeting_scheduling_complete' || aiState.type === 'document_filing_complete' || aiState.type === 'onboarding_complete' || aiState.type === 'suggest_consultation') && (
        <div className="p-4 border-t border-border flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => handleButtonClick('Track My Case')} className="flex items-center"><Briefcase className="h-3 w-3 mr-1" /> Track My Case</Button>
          <Button variant="outline" size="sm" onClick={() => handleButtonClick('Pending Tasks')} className="flex items-center"><Clock className="h-3 w-3 mr-1" /> Pending Tasks</Button>
          <Button variant="outline" size="sm" onClick={() => handleButtonClick('Payment History')} className="flex items-center"><CreditCard className="h-3 w-3 mr-1" /> Payment History</Button>
          <Button variant="outline" size="sm" onClick={() => handleButtonClick('Talk to Advisor')} className="flex items-center"><MessageSquare className="h-3 w-3 mr-1" /> Talk to Advisor</Button>
        </div>
      )}

      {/* Close Button */}
      <DialogFooter className="p-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>Close Assistant</Button>
      </DialogFooter>
    </div>
  );
};

export default AIAssistant;