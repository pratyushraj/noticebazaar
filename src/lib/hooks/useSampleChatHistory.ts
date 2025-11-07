import { Message } from '@/types'; // Import the Message type

// Define the sample conversation using plain strings with placeholders
const SAMPLE_CONVERSATION: Omit<Message, 'id' | 'timestamp'>[] = [
  {
    sender_id: 'advisor', // Placeholder for advisor ID
    receiver_id: 'client', // Placeholder for client ID
    content: "Hi [Client Name], I've reviewed the **SaaS MSA draft**. The liability clause needs clarification. I've uploaded my redlines to the 'Documents' section for your review. Let me know if you have time for a quick call tomorrow.",
    sent_at: new Date().toISOString(), // Will be overridden with specific timestamps
    is_read: false,
    case_id: null,
    sender: null, // Will be populated if needed
  },
  {
    sender_id: 'client',
    receiver_id: 'advisor',
    content: "Thanks, Prateek. Just checked the redlines, looks good. Could you please schedule a 15 min call for Friday morning to confirm? Also, can you check on the **Trademark filing status**?",
    sent_at: new Date().toISOString(),
    is_read: false,
    case_id: null,
    sender: null,
  },
  {
    sender_id: 'advisor',
    receiver_id: 'client',
    content: "Done. Call is booked for Friday at 10:00 AM (see 'Consultations'). Trademark is still 'Filing Submitted' (90% complete). I'll send an update if the registry provides one. Any other questions?",
    sent_at: new Date().toISOString(),
    is_read: false,
    case_id: null,
    sender: null,
  },
];

/**
 * Hook to provide a sample chat history for demo purposes when the chat is empty.
 * This returns plain string messages with placeholders.
 * The ChatWindow component will be responsible for converting these to JSX and applying timestamps.
 */
export const useSampleChatHistory = (clientFirstName: string | null) => {
  if (!clientFirstName) return [];

  // Create a deep copy of the sample conversation and personalize it
  const personalizedConversation = SAMPLE_CONVERSATION.map((msg, index) => {
    // Replace placeholder with actual client name
    const personalizedContent = typeof msg.content === 'string'
      ? msg.content.replace('[Client Name]', clientFirstName)
      : msg.content;

    // Assign specific, descending timestamps
    let timestamp;
    switch (index) {
      case 0: // 2 minutes ago
        timestamp = new Date(Date.now() - 120000);
        break;
      case 1: // 1 minute ago
        timestamp = new Date(Date.now() - 60000);
        break;
      case 2: // 10 seconds ago
        timestamp = new Date(Date.now() - 10000);
        break;
      default:
        timestamp = new Date();
    }

    return {
      ...msg,
      content: personalizedContent,
      sent_at: timestamp.toISOString(),
      // For display purposes in ChatWindow, we'll use a mock ID
      id: `sample-${index + 1}`,
    };
  });

  return personalizedConversation;
};