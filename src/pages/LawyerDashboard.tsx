// Lawyer Dashboard - Inbox, conversation view, contract preview, quick replies
// Matches existing NoticeBazaar design (purple gradient, glass cards)

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Filter, FileText, CheckCircle, 
  AlertTriangle, Clock, Send, X, Eye, Download, Scale, ChevronLeft, LogOut, Loader2
} from 'lucide-react';
import { spacing, typography, iconSizes, radius, glass, shadows, animations } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { toast } from 'sonner';
import { useSignOut } from '@/lib/hooks/useAuth';

interface Conversation {
  id: string;
  title: string | null;
  risk_tag: string | null;
  unread_count_creator: number;
  unread_count_advisor: number;
  last_message_at: string | null;
  last_message: {
    content: string;
    sent_at: string;
  } | null;
  participants: Array<{
    user_id: string;
    role: string;
    email?: string | null;
    profiles: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      instagram_handle: string | null;
      youtube_channel_id: string | null;
      twitter_handle: string | null;
    } | null;
  }>;
  // Extended context (fetched separately)
  creatorDeals?: Array<{
    id: string;
    brand_name: string | null;
    status: string | null;
    deal_type: string | null;
    deal_amount: number | null;
  }>;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  is_read: boolean;
  attachments?: Array<{
    id: string;
    file_name: string;
    signed_download_url: string;
  }>;
}

const QUICK_REPLIES = [
  "I've reviewed the contract. Let's schedule a call to discuss.",
  "The contract terms look good. Proceeding with the deal.",
  "I need clarification on the exclusivity clause.",
  "There are some legal concerns that need to be addressed.",
  "The payment terms are acceptable from a legal standpoint."
];

// Helper function to get conversation display metadata
// Returns both title and subtitle with comprehensive fallback logic
const getConversationDisplayMeta = (conv: Conversation): { title: string; subtitle: string; meta?: string } => {
  // ========== TITLE LOGIC (Priority Order) ==========
  
  // 1️⃣ Creator email (preferred - most reliable)
  const creator = conv.participants.find(p => p.role === 'creator');
  if (creator?.email) {
    const title = creator.email;
    const { subtitle, meta } = getConversationSubtitle(conv);
    return { title, subtitle, meta };
  }
  
  // 2️⃣ Creator name (fallback if email not available)
  if (creator?.profiles) {
    const { first_name, last_name } = creator.profiles;
    const fullName = [first_name, last_name].filter(Boolean).join(' ').trim();
    
    if (fullName) {
      const title = fullName;
      const { subtitle, meta } = getConversationSubtitle(conv);
      return { title, subtitle, meta };
    }
  }
  
  // 3️⃣ User ID (fallback if no email or name)
  if (creator?.user_id) {
    const title = creator.user_id.substring(0, 8) + '...';
    const { subtitle, meta } = getConversationSubtitle(conv);
    return { title, subtitle, meta };
  }
  
  // 4️⃣ Brand name (fallback)
  if (conv.creatorDeals && conv.creatorDeals.length > 0) {
    const firstDeal = conv.creatorDeals[0];
    if (firstDeal.brand_name) {
      const title = `Brand: ${firstDeal.brand_name}`;
      const { subtitle, meta } = getConversationSubtitle(conv);
      return { title, subtitle, meta };
    }
  }
  
  // 5️⃣ Fallback: "New Contract Review"
  const title = 'New Contract Review';
  const { subtitle, meta } = getConversationSubtitle(conv);
  return { title, subtitle, meta };
};

// Helper function to get conversation subtitle and meta (used internally by getConversationDisplayMeta)
const getConversationSubtitle = (conv: Conversation): { subtitle: string; meta?: string } => {
  // Get issue type from risk_tag
  const issueTypeMap: Record<string, string> = {
    'legal': 'Contract Review',
    'payment': 'Payment Issue',
    'high_risk': 'High Risk Issue',
    'tax': 'Tax Issue',
  };
  const issueType = conv.risk_tag ? (issueTypeMap[conv.risk_tag] || `${conv.risk_tag.replace('_', ' ')} Issue`) : null;
  
  // Get deal context
  const firstDeal = conv.creatorDeals && conv.creatorDeals.length > 0 ? conv.creatorDeals[0] : null;
  
  // Build subtitle: Issue type + Deal context
  let subtitleParts: string[] = [];
  
  if (issueType) {
    subtitleParts.push(issueType);
  }
  
  // Add deal context (brand name, deal amount, or deal type)
  if (firstDeal) {
    if (firstDeal.brand_name) {
      // Use brand name as context
      subtitleParts.push(firstDeal.brand_name);
    } else if (firstDeal.deal_amount && firstDeal.deal_amount > 0) {
      // Format amount with rupee symbol
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(firstDeal.deal_amount));
      const dealTypeLabel = firstDeal.deal_type === 'barter' ? 'Barter' : 'Paid';
      subtitleParts.push(`${formattedAmount} ${dealTypeLabel} Deal`);
    } else if (firstDeal.deal_type === 'barter') {
      subtitleParts.push('Barter collaboration');
    }
  }
  
  // Determine meta chip (Paid/Barter/High Risk)
  let meta: string | undefined;
  if (conv.risk_tag === 'high_risk') {
    meta = 'High Risk';
  } else if (firstDeal?.deal_type) {
    meta = firstDeal.deal_type === 'barter' ? 'Barter' : 'Paid';
  }
  
  // Build subtitle string
  const subtitle = subtitleParts.length > 0 
    ? subtitleParts.join(' · ')
    : (conv.last_message?.content 
        ? (conv.last_message.content.length > 60 
            ? `${conv.last_message.content.substring(0, 60)}...` 
            : conv.last_message.content)
        : 'Awaiting first message');
  
  return { subtitle, meta };
};

export default function LawyerDashboard() {
  const { profile, user } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'high_risk' | 'payment' | 'legal'>('all');
  const [selectedAdvisor, setSelectedAdvisor] = useState<'all' | 'legal_advisor' | 'anjali_sharma'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const signOutMutation = useSignOut();
  
  // Mobile view state
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  
  // Ref to track current subscription to prevent premature cleanup
  const messageSubscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Ref to track selected conversation for use in callbacks (avoids stale closures)
  const selectedConversationRef = useRef<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Fetch conversations
  useEffect(() => {
    if (!user?.id) return;

    const fetchConversations = async () => {
      try {
        // Verify auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const authUserId = session?.user?.id;
        
        console.log('[LawyerDashboard] Auth session:', {
          hasSession: !!session,
          authUserId: authUserId,
          profileUserId: user.id,
          matches: authUserId === user.id,
        });
        
        if (sessionError) {
          console.error('[LawyerDashboard] Session error:', sessionError);
        }
        
        if (!authUserId) {
          console.error('[LawyerDashboard] No auth user ID found');
          setConversations([]);
          setIsLoading(false);
          return;
        }
        
        console.log('[LawyerDashboard] Fetching conversations for auth user:', authUserId);
        
        // First, get conversations where user is a participant
        // IMPORTANT: conversation_participants.user_id should match auth.uid() (not profile.id)
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .eq('user_id', authUserId);

        if (participantError) {
          console.error('[LawyerDashboard] Error fetching participants:', {
            error: participantError,
            message: participantError.message,
            code: participantError.code,
            details: participantError.details,
            hint: participantError.hint,
          });
          throw participantError;
        }

        console.log('[LawyerDashboard] Found participants:', participantData?.length || 0);
        console.log('[LawyerDashboard] Participant data:', participantData);
        console.log('[LawyerDashboard] Participant user_ids:', participantData?.map(p => p.user_id));
        console.log('[LawyerDashboard] Expected auth.uid():', authUserId);
        
        // Check if participant user_ids match auth.uid()
        const mismatchedParticipants = participantData?.filter(p => p.user_id !== authUserId) || [];
        if (mismatchedParticipants.length > 0) {
          console.warn('[LawyerDashboard] WARNING: Some participants have mismatched user_id:', mismatchedParticipants);
        }
        
        const participantConversationIds = participantData?.map(p => p.conversation_id).filter(Boolean) || [];
        
        if (participantConversationIds.length === 0) {
          console.log('[LawyerDashboard] No conversation IDs found from participants');
          setConversations([]);
          setIsLoading(false);
          return;
        }

        console.log('[LawyerDashboard] Conversation IDs to fetch:', participantConversationIds);

        // Try RPC function first (bypasses RLS issues)
        let conversationsData: any[] = [];
        let conversationsError: any = null;

        console.log('[LawyerDashboard] Trying RPC function first...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_conversations');
        
        console.log('[LawyerDashboard] RPC function result:', {
          dataCount: rpcData?.length || 0,
          error: rpcError,
          errorCode: rpcError?.code,
          errorMessage: rpcError?.message,
        });
        
        if (!rpcError && rpcData && rpcData.length > 0) {
          conversationsData = rpcData;
          console.log('[LawyerDashboard] Using RPC function results:', conversationsData.length);
        } else {
          // Fallback to direct query
          console.log('[LawyerDashboard] RPC failed, trying direct query...');
          const { data: batchData, error: batchError } = await supabase
            .from('conversations')
            .select('*')
            .in('id', participantConversationIds)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .order('updated_at', { ascending: false });
          
          console.log('[LawyerDashboard] Direct query result:', {
            dataCount: batchData?.length || 0,
            error: batchError,
            errorCode: batchError?.code,
            errorMessage: batchError?.message,
          });
          
          if (batchData) {
            conversationsData = batchData;
          }
          conversationsError = batchError;
          
          // If batch query failed, try individual queries as fallback
          if (batchError && (!batchData || batchData.length === 0)) {
            console.warn('[LawyerDashboard] Batch query failed, trying individual queries:', batchError);
            const individualResults: any[] = [];
            for (const convId of participantConversationIds) {
              const { data: singleData, error: singleError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', convId)
                .single();
              
              if (!singleError && singleData) {
                individualResults.push(singleData);
              } else {
                console.warn(`[LawyerDashboard] Failed to fetch conversation ${convId}:`, singleError);
              }
            }
            if (individualResults.length > 0) {
              conversationsData = individualResults;
            }
          }
        }

        if (conversationsError && conversationsData.length === 0) {
          console.error('[LawyerDashboard] Error fetching conversations:', {
            error: conversationsError,
            message: conversationsError.message,
            code: conversationsError.code,
            details: conversationsError.details,
            hint: conversationsError.hint,
          });
          // Don't throw - try to continue with empty array
        }

        console.log('[LawyerDashboard] Found conversations:', conversationsData.length);
        console.log('[LawyerDashboard] Conversations data:', conversationsData);
        
        // Use the conversations we fetched (they're already filtered by participant IDs)
        const filteredConversations = conversationsData;
        
        console.log('[LawyerDashboard] Filtered conversations:', filteredConversations.length);
        
        if (filteredConversations.length === 0) {
          console.log('[LawyerDashboard] No conversations found after filtering');
          setConversations([]);
          setIsLoading(false);
          return;
        }

        // Fetch all participants for these conversations
        const filteredConversationIds = filteredConversations.map(c => c.id);
        const { data: allParticipants, error: participantsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, role')
          .in('conversation_id', filteredConversationIds);

        if (participantsError) throw participantsError;

        // Get unique user IDs and fetch profiles + emails
        const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])];
        
        // Fetch profiles (basic fields only - no social handles)
        let profilesData: any[] = [];
        const { data: basicProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('[LawyerDashboard] Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        profilesData = basicProfiles || [];
        
        // Fetch emails from auth.users via RPC function
        const emailsMap = new Map<string, string>();
        if (userIds.length > 0) {
          try {
            const { data: emailsData, error: emailsError } = await supabase.rpc('get_user_emails', {
              user_ids: userIds
            });
            
            if (!emailsError && emailsData) {
              emailsData.forEach((item: any) => {
                if (item.user_id && item.email) {
                  emailsMap.set(item.user_id, item.email);
                }
              });
              console.log('[LawyerDashboard] Fetched emails:', emailsMap.size, 'out of', userIds.length);
            } else if (emailsError) {
              console.warn('[LawyerDashboard] RPC get_user_emails error:', emailsError.message);
              // RPC might not exist yet - that's okay, we'll use user_id as fallback
            }
          } catch (err) {
            // If RPC doesn't exist, that's okay - we'll use user_id as display name
            console.warn('[LawyerDashboard] RPC get_user_emails not available:', err);
          }
        }

        // Create a map of user_id (profile.id) -> profile
        // Note: profiles.id matches conversation_participants.user_id (both reference auth.users.id)
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Fetch last messages for each conversation
        const lastMessagesMap = new Map<string, { content: string; sent_at: string }>();
        const conversationIdsForMessages = filteredConversations.map(c => c.id);
        if (conversationIdsForMessages.length > 0) {
          for (const convId of conversationIdsForMessages) {
            const { data: lastMessage, error: msgError } = await supabase
              .from('messages')
              .select('content, sent_at')
              .eq('conversation_id', convId)
              .eq('is_deleted', false)
              .order('sent_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!msgError && lastMessage) {
              lastMessagesMap.set(convId, {
                content: lastMessage.content,
                sent_at: lastMessage.sent_at,
              });
            }
          }
        }

        // Get creator IDs from participants
        const creatorIds = new Set<string>();
        allParticipants?.forEach(p => {
          if (p.role === 'creator') {
            creatorIds.add(p.user_id);
          }
        });
        
        // Fetch deals for creators (to get brand names, deal type, and amount)
        const dealsMap = new Map<string, Array<{ id: string; brand_name: string | null; status: string | null; deal_type: string | null; deal_amount: number | null }>>();
        if (creatorIds.size > 0) {
          console.log('[LawyerDashboard] Fetching deals for creators:', Array.from(creatorIds));
          const { data: dealsData, error: dealsError } = await supabase
            .from('brand_deals')
            .select('id, creator_id, brand_name, status, deal_type, deal_amount')
            .in('creator_id', Array.from(creatorIds));
          
          if (dealsError) {
            console.error('[LawyerDashboard] Error fetching deals:', dealsError);
          } else {
            console.log('[LawyerDashboard] Fetched deals:', dealsData?.length || 0);
            if (dealsData && dealsData.length > 0) {
              dealsData.forEach((deal: any) => {
                if (deal.creator_id) {
                  if (!dealsMap.has(deal.creator_id)) {
                    dealsMap.set(deal.creator_id, []);
                  }
                  dealsMap.get(deal.creator_id)!.push({
                    id: deal.id,
                    brand_name: deal.brand_name,
                    status: deal.status,
                    deal_type: deal.deal_type || null,
                    deal_amount: deal.deal_amount || null,
                  });
                }
              });
              console.log('[LawyerDashboard] Deals map:', Array.from(dealsMap.entries()).map(([id, deals]) => ({ creatorId: id, dealCount: deals.length })));
            }
          }
        }
        
        // Join conversations with participants, profiles, last messages, and deals
        const conversationsWithParticipants = filteredConversations.map(conv => {
          const creatorParticipant = allParticipants?.find(
            p => p.conversation_id === conv.id && p.role === 'creator'
          );
          const creatorDeals = creatorParticipant?.user_id 
            ? dealsMap.get(creatorParticipant.user_id) || []
            : [];
          
          // Debug logging for first conversation
          if (conv.id === filteredConversations[0]?.id) {
            console.log('[LawyerDashboard] Sample conversation debug:', {
              convId: conv.id,
              creatorParticipant: creatorParticipant ? { userId: creatorParticipant.user_id, role: creatorParticipant.role } : null,
              creatorDealsCount: creatorDeals.length,
              creatorDeals: creatorDeals,
              hasCreatorProfile: creatorParticipant?.user_id ? !!profilesMap.get(creatorParticipant.user_id) : false,
            });
          }
          
          return {
          ...conv,
          last_message: lastMessagesMap.get(conv.id) || null,
            creatorDeals: creatorDeals.map((deal: any) => ({
              id: deal.id,
              brand_name: deal.brand_name,
              status: deal.status,
              deal_type: deal.deal_type,
              deal_amount: deal.deal_amount,
            })),
          participants: allParticipants
            ?.filter(p => p.conversation_id === conv.id)
              .map(p => {
                const profile = profilesMap.get(p.user_id);
                const email = emailsMap.get(p.user_id) || null;
                return {
              user_id: p.user_id,
              role: p.role,
                  email: email,
                  profiles: profile ? {
                    id: profile.id,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    avatar_url: profile.avatar_url,
                    instagram_handle: null,
                    youtube_channel_id: null,
                    twitter_handle: null,
                  } : null
                };
              }) || []
          };
        }) || [];

        // Sort conversations by last_message_at (most recent first), then by updated_at
        const sortedConversations = [...conversationsWithParticipants].sort((a, b) => {
          // First, sort by last_message_at (most recent first)
          if (a.last_message_at && b.last_message_at) {
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
          }
          if (a.last_message_at && !b.last_message_at) return -1;
          if (!a.last_message_at && b.last_message_at) return 1;
          // If both are null, sort by updated_at
          if (a.updated_at && b.updated_at) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          return 0;
        });
        
        console.log('[LawyerDashboard] Setting conversations:', sortedConversations.length);
        setConversations(sortedConversations);
        
        // Auto-select first conversation if none is selected
        // Use setTimeout to avoid state update during render
        if (!selectedConversation && conversationsWithParticipants.length > 0) {
          const firstConvId = conversationsWithParticipants[0].id;
          console.log('[LawyerDashboard] Auto-selecting first conversation:', firstConvId);
          // Use setTimeout to ensure this happens after state is set
          setTimeout(() => {
            setSelectedConversation(firstConvId);
          }, 0);
        }
      } catch (err: any) {
        console.error('[LawyerDashboard] Error in fetchConversations:', err);
        toast.error('Failed to load conversations', { description: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to realtime updates for conversations
    const conversationsChannel = supabase
      .channel('lawyer-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, (payload) => {
        console.log('[LawyerDashboard] 🔔 Conversation changed:', {
          event: payload.eventType,
          conversationId: payload.new?.id || payload.old?.id,
          table: payload.table
        });
        // Add small delay to ensure related participant records are committed
        setTimeout(() => {
          console.log('[LawyerDashboard] Refetching conversations after conversation change...');
        fetchConversations();
        }, 300);
      })
      .subscribe((status) => {
        console.log('[LawyerDashboard] Conversations subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[LawyerDashboard] ✅ Successfully subscribed to conversations table');
        }
      });

    // Subscribe to conversation_participants to catch when lawyer is added to a new conversation
    // Get authUserId for the filter - we'll listen to all inserts and filter in callback
    // (This avoids scope issues with authUserId)
    const participantsChannel = supabase
      .channel('lawyer-participants')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_participants'
      }, async (payload) => {
        const newParticipant = payload.new as any;
        console.log('[LawyerDashboard] 🔔 New participant inserted:', {
          conversationId: newParticipant?.conversation_id,
          userId: newParticipant?.user_id,
          role: newParticipant?.role
        });
        
        // Get current auth user ID to check if this participant is the lawyer
        const { data: { session } } = await supabase.auth.getSession();
        const currentAuthUserId = session?.user?.id;
        
        console.log('[LawyerDashboard] Checking if new participant is current lawyer:', {
          newParticipantUserId: newParticipant?.user_id,
          currentAuthUserId: currentAuthUserId,
          matches: newParticipant?.user_id === currentAuthUserId
        });
        
        // Only process if this participant is the current lawyer
        if (currentAuthUserId && newParticipant?.user_id === currentAuthUserId) {
          console.log('[LawyerDashboard] ✅ New conversation participant added (lawyer added to conversation):', {
            conversationId: newParticipant?.conversation_id,
            userId: newParticipant?.user_id
          });
          // Refetch conversations to show the new conversation
          // Add a small delay to ensure database has committed the change
          setTimeout(() => {
            console.log('[LawyerDashboard] Refetching conversations after new participant added...');
            fetchConversations();
          }, 500);
        } else {
          console.log('[LawyerDashboard] New participant is not the current lawyer, skipping...');
        }
      })
      .subscribe((status) => {
        console.log('[LawyerDashboard] Participants subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[LawyerDashboard] ✅ Successfully subscribed to conversation_participants');
        }
      });

    // Also subscribe to messages to catch new messages immediately
    // This ensures conversation list updates when new messages arrive
    const messagesChannel = supabase
      .channel('lawyer-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as any;
        console.log('[LawyerDashboard] New message inserted, refetching conversations...', {
          messageId: newMessage?.id,
          conversationId: newMessage?.conversation_id,
          selectedConversation: selectedConversationRef.current,
          matches: newMessage?.conversation_id === selectedConversationRef.current
        });
        
        // Refetch conversations to update last_message and unread counts
        fetchConversations();
        
        // If this message belongs to the currently selected conversation, also update messages state
        // This is a backup in case the per-conversation subscription doesn't fire
        // Use ref to avoid stale closure issues
        const currentSelectedConversation = selectedConversationRef.current;
        if (currentSelectedConversation && newMessage?.conversation_id === currentSelectedConversation) {
          console.log('[LawyerDashboard] 🔔 Global channel: Message belongs to selected conversation, updating messages state', {
            messageId: newMessage.id,
            conversationId: newMessage.conversation_id,
            selectedConversation: currentSelectedConversation
          });
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              console.log('[LawyerDashboard] Global channel: Message already exists, skipping duplicate');
              return prev;
            }
            console.log('[LawyerDashboard] Global channel: Adding new message to UI:', newMessage.id);
            return [...prev, {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              sent_at: newMessage.sent_at,
              is_read: newMessage.is_read || false,
              attachments: []
            }];
          });
        } else {
          console.log('[LawyerDashboard] Global channel: Message does not belong to selected conversation, skipping messages update', {
            messageConversationId: newMessage?.conversation_id,
            selectedConversation: currentSelectedConversation
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      if (participantsChannel) {
        supabase.removeChannel(participantsChannel);
      }
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id, selectedConversation]);

  // Fetch messages for selected conversation
  useEffect(() => {
    console.log('[LawyerDashboard] Message subscription effect running:', {
      selectedConversation,
      userId: user?.id,
      willSubscribe: !!(selectedConversation && user?.id)
    });
    
    if (!selectedConversation || !user?.id) {
      // Clear messages if no conversation selected
      console.log('[LawyerDashboard] No conversation selected or no user, clearing messages');
      setMessages([]);
      return;
    }

    let isMounted = true;

    const fetchMessages = async (retryCount = 0) => {
      try {
        console.log('[LawyerDashboard] Fetching messages for conversation:', selectedConversation, `(attempt ${retryCount + 1})`);
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            attachments:message_attachments(id, file_name, signed_download_url)
          `)
          .eq('conversation_id', selectedConversation)
          .eq('is_deleted', false)
          .order('sent_at', { ascending: true });

        if (error) {
          console.error('[LawyerDashboard] Supabase query error:', error);
          throw error;
        }
        
        console.log('[LawyerDashboard] Successfully fetched messages:', data?.length || 0);
        if (isMounted) {
        setMessages(data || []);
        }
      } catch (err: any) {
        console.error('[LawyerDashboard] Error fetching messages:', {
          error: err,
          message: err?.message,
          code: err?.code,
          details: err?.details,
          retryCount
        });
        
        // Retry on network errors (up to 2 retries)
        if (retryCount < 2 && (err?.message?.includes('Load failed') || err?.message?.includes('Failed to fetch'))) {
          console.log('[LawyerDashboard] Retrying message fetch in 1 second...');
          setTimeout(() => {
            if (isMounted) {
              fetchMessages(retryCount + 1);
            }
          }, 1000);
          return;
        }
        
        if (isMounted) {
          // Only show toast on final failure
          if (retryCount >= 2) {
            toast.error('Failed to load messages', { description: err?.message || 'Network error' });
          }
        }
      }
    };

    fetchMessages();

    // Clean up previous subscription if it exists
    if (messageSubscriptionRef.current) {
      console.log('[LawyerDashboard] Cleaning up previous message subscription');
      supabase.removeChannel(messageSubscriptionRef.current);
      messageSubscriptionRef.current = null;
    }

    // Subscribe to new messages (listen for INSERT, UPDATE, DELETE)
    // Note: Using separate event listeners for better compatibility with RLS
    const channel = supabase
      .channel(`lawyer-messages:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, (payload) => {
        console.log('[LawyerDashboard] 🔔 Real-time INSERT received:', {
          event: payload.eventType,
          messageId: payload.new?.id,
          conversationId: selectedConversation,
          payloadNew: payload.new,
          timestamp: new Date().toISOString(),
        });
        
        if (!isMounted) {
          console.log('[LawyerDashboard] ⚠️ Component unmounted, ignoring update');
          return;
        }
        
        // Process INSERT
        if (payload.new) {
          const newMessage = payload.new as any;
          // Double-check conversation_id matches (safety check)
          if (newMessage.conversation_id !== selectedConversation) {
            console.log('[LawyerDashboard] ⚠️ Message conversation_id mismatch, ignoring');
            return;
          }
          
          console.log('[LawyerDashboard] Processing INSERT event for message:', newMessage.id);
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              console.log('[LawyerDashboard] Message already exists, skipping duplicate');
              return prev;
            }
            console.log('[LawyerDashboard] Adding new message to UI:', newMessage.id);
            return [...prev, {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              sent_at: newMessage.sent_at,
              is_read: newMessage.is_read || false,
              attachments: []
            }];
          });
          
          // Refetch after a delay to get attachments if any
          setTimeout(() => {
            if (isMounted) {
              console.log('[LawyerDashboard] Refetching messages to get attachments...');
              fetchMessages();
            }
          }, 500);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, (payload) => {
        console.log('[LawyerDashboard] 🔔 Real-time UPDATE received:', {
          event: payload.eventType,
          messageId: payload.new?.id || payload.old?.id,
          conversationId: selectedConversation,
        });
        
        if (!isMounted) return;
        
        // For UPDATE, refetch to get latest state
        setTimeout(() => {
          if (isMounted) {
        fetchMessages();
          }
        }, 100);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`
      }, (payload) => {
        console.log('[LawyerDashboard] 🔔 Real-time DELETE received:', {
          event: payload.eventType,
          messageId: payload.old?.id,
          conversationId: selectedConversation,
        });
        
        if (!isMounted) return;
        
        // For DELETE, refetch to get latest state
        setTimeout(() => {
          if (isMounted) {
            fetchMessages();
          }
        }, 100);
      })
      .subscribe((status) => {
        console.log('[LawyerDashboard] Realtime subscription status for conversation:', selectedConversation, status);
        if (status === 'SUBSCRIBED') {
          console.log('[LawyerDashboard] ✅ Successfully subscribed to messages for conversation:', selectedConversation);
          messageSubscriptionRef.current = channel;
          
          // Test the subscription by checking channel state
          setTimeout(() => {
            const channelState = channel.state;
            console.log('[LawyerDashboard] Channel state after subscription:', channelState);
            if (channelState !== 'joined') {
              console.warn('[LawyerDashboard] ⚠️ Channel not in joined state:', channelState);
            }
          }, 500);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[LawyerDashboard] ❌ Channel error for conversation:', selectedConversation);
          messageSubscriptionRef.current = null;
          // Try to resubscribe after a delay
          if (isMounted) {
            setTimeout(() => {
              console.log('[LawyerDashboard] Attempting to resubscribe...');
              fetchMessages();
            }, 1000);
          }
        } else if (status === 'CLOSED') {
          console.warn('[LawyerDashboard] ⚠️ Channel closed for conversation:', selectedConversation, '- This should only happen on cleanup');
          messageSubscriptionRef.current = null;
        } else if (status === 'TIMED_OUT') {
          console.warn('[LawyerDashboard] ⚠️ Channel timed out for conversation:', selectedConversation);
          messageSubscriptionRef.current = null;
        } else {
          console.log('[LawyerDashboard] Subscription status:', status);
        }
      });
    
    // Fallback: Also listen to all messages and filter manually (in case filter doesn't work with RLS)
    const fallbackChannel = supabase
      .channel(`lawyer-messages-fallback:${selectedConversation}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (!isMounted) return;
        
        const newMessage = payload.new as any;
        // Filter by conversation_id in callback
        if (newMessage?.conversation_id === selectedConversation) {
          console.log('[LawyerDashboard] 🔔 Fallback subscription caught message:', newMessage.id);
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, {
              id: newMessage.id,
              content: newMessage.content,
              sender_id: newMessage.sender_id,
              sent_at: newMessage.sent_at,
              is_read: newMessage.is_read || false,
              attachments: []
            }];
          });
          setTimeout(() => {
            if (isMounted) fetchMessages();
          }, 500);
        }
      })
      .subscribe((status) => {
        console.log('[LawyerDashboard] Fallback subscription status:', status);
      });

    return () => {
      isMounted = false;
      console.log('[LawyerDashboard] Cleanup: Removing message subscription for conversation:', selectedConversation);
      if (messageSubscriptionRef.current) {
        supabase.removeChannel(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      } else if (channel) {
      supabase.removeChannel(channel);
      }
      if (fallbackChannel) {
        supabase.removeChannel(fallbackChannel);
      }
    };
  }, [selectedConversation, user?.id]);

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by risk tag
    if (filter !== 'all') {
      filtered = filtered.filter(c => c.risk_tag === filter);
    }

    // Filter by advisor
    if (selectedAdvisor !== 'all') {
      filtered = filtered.filter(c => {
        const titleLower = c.title?.toLowerCase() || '';
        
        if (selectedAdvisor === 'legal_advisor') {
          // Check if title includes "Legal Advisor"
          if (titleLower.includes('legal advisor')) {
            return true;
          }
          
          // Check if any advisor participant name equals "Legal Advisor"
          const advisorParticipants = c.participants.filter(p => p.role === 'advisor');
          for (const advisor of advisorParticipants) {
            if (advisor.profiles) {
              const fullName = `${advisor.profiles.first_name || ''} ${advisor.profiles.last_name || ''}`.trim();
              if (fullName.toLowerCase() === 'legal advisor') {
                return true;
              }
            }
          }
          return false;
        } else if (selectedAdvisor === 'anjali_sharma') {
          // Check if title includes "Anjali Sharma"
          if (titleLower.includes('anjali sharma') || titleLower.includes('anjali')) {
            return true;
          }
          
          // Check if any advisor participant name equals "Anjali Sharma"
          const advisorParticipants = c.participants.filter(p => p.role === 'advisor');
          for (const advisor of advisorParticipants) {
            if (advisor.profiles) {
              const fullName = `${advisor.profiles.first_name || ''} ${advisor.profiles.last_name || ''}`.trim();
              if (fullName.toLowerCase() === 'anjali sharma' || fullName.toLowerCase().includes('anjali')) {
                return true;
              }
            }
          }
          return false;
        }
        
        return false;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [conversations, filter, selectedAdvisor, searchQuery]);

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const creatorParticipant = selectedConv?.participants.find(p => p.role === 'creator');

  // Handle conversation selection
  const handleSelectConversation = (convId: string) => {
    console.log('[LawyerDashboard] Conversation selected:', convId);
    triggerHaptic(HapticPatterns.medium);
    setSelectedConversation(convId);
    // On mobile, hide list and show chat
    if (window.innerWidth < 768) {
      setShowListOnMobile(false);
      setShowChatOnMobile(true);
    }
  };

  // Handle back button
  const handleBack = () => {
    setShowChatOnMobile(false);
    setShowListOnMobile(true);
    setSelectedConversation(null);
  };

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white fixed inset-0">
      <div className="flex h-full">
        {/* Left Sidebar - Filters & Conversation List */}
        <aside className={cn(
          "w-full md:w-80 border-r border-white/10 bg-white/5 backdrop-blur-xl",
          "transition-transform duration-300 ease-in-out",
          showListOnMobile ? "block" : "hidden md:block"
        )}>
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                )}>
                  <Scale className={iconSizes.md} />
                </div>
                <div>
                  <div className="font-semibold">Legal Advisor</div>
                  <div className="text-xs text-white/60">Contract Review</div>
                </div>
              </div>
              <motion.button
                onClick={async () => {
                  triggerHaptic(HapticPatterns.medium);
                  try {
                    // Analytics tracking
                    if (typeof window !== 'undefined' && (window as any).gtag) {
                      (window as any).gtag('event', 'logout', {
                        event_category: 'engagement',
                        event_label: 'user_logout',
                        method: 'lawyer_dashboard'
                      });
                    }
                    await signOutMutation.mutateAsync();
                  } catch (error: any) {
                    console.error('Logout failed', error);
                  }
                }}
                disabled={signOutMutation.isPending}
                whileTap={animations.microTap}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "text-white/70 hover:text-white hover:bg-white/10",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label="Log out"
              >
                {signOutMutation.isPending ? (
                  <Loader2 className={iconSizes.sm} />
                ) : (
                  <LogOut className={iconSizes.sm} />
                )}
              </motion.button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className={cn(iconSizes.sm, "absolute left-3 top-1/2 -translate-y-1/2 text-white/40")} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-4 py-2 rounded-xl",
                  glass.appleSubtle,
                  "border border-white/10",
                  "text-white placeholder:text-white/40",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                )}
              />
            </div>

            {/* Risk Tag Filters */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'high_risk', 'payment', 'legal'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setFilter(f);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filter === f
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  )}
                >
                  {f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Advisor Filter Toggle */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'legal_advisor', 'anjali_sharma'] as const).map((advisor) => (
                <button
                  key={advisor}
                  onClick={() => {
                    triggerHaptic(HapticPatterns.light);
                    setSelectedAdvisor(advisor);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    selectedAdvisor === advisor
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/15"
                  )}
                >
                  {advisor === 'all' ? 'All' : advisor === 'legal_advisor' ? 'Legal Advisor' : 'Anjali Sharma'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto h-[calc(100dvh-200px)]">
            {isLoading ? (
              <div className="p-4 text-center text-white/50">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-white/50">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => (
                <motion.button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  whileTap={animations.microTap}
                  className={cn(
                    "w-full p-4 text-left border-b border-white/5",
                    "hover:bg-white/5 transition-colors",
                    selectedConversation === conv.id && "bg-white/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                    )}>
                      <MessageSquare className={iconSizes.md} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="font-semibold truncate flex-1">
                          {getConversationDisplayMeta(conv).title}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Meta chip (Paid/Barter/High Risk) */}
                          {getConversationDisplayMeta(conv).meta && (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              getConversationDisplayMeta(conv).meta === 'High Risk' && "bg-red-500/20 text-red-300",
                              getConversationDisplayMeta(conv).meta === 'Barter' && "bg-orange-500/20 text-orange-300",
                              getConversationDisplayMeta(conv).meta === 'Paid' && "bg-green-500/20 text-green-300"
                            )}>
                              {getConversationDisplayMeta(conv).meta}
                            </span>
                          )}
                          {/* Unread count */}
                        {conv.unread_count_advisor > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500 text-xs font-semibold">
                            {conv.unread_count_advisor}
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* Main Content - Conversation View */}
        <main className={cn(
          "flex-1 flex flex-col h-full",
          showChatOnMobile ? "flex" : "hidden md:flex"
        )}>
          {selectedConversation ? (
            <ConversationView
              conversation={selectedConv!}
              messages={messages}
              onBack={handleBack}
              onSendMessage={async (content) => {
                if (!user?.id) return;
                const { data, error } = await supabase
                  .from('messages')
                  .insert({
                    conversation_id: selectedConversation,
                    sender_id: user.id,
                    content: content.trim()
                  })
                  .select(`
                    *,
                    attachments:message_attachments(id, file_name, signed_download_url)
                  `)
                  .single();
                
                if (error) {
                  console.error('Failed to send message:', error);
                  throw error;
                }
                
                // Optimistically add message to UI immediately
                if (data) {
                  setMessages(prev => [...prev, data]);
                }
                
                // Also refetch to ensure we have the latest (triggers will update conversation metadata)
                setTimeout(() => {
                  const fetchMessages = async () => {
                    const { data: freshData } = await supabase
                      .from('messages')
                      .select(`
                        *,
                        attachments:message_attachments(id, file_name, signed_download_url)
                      `)
                      .eq('conversation_id', selectedConversation)
                      .eq('is_deleted', false)
                      .order('sent_at', { ascending: true });
                    if (freshData) setMessages(freshData);
                  };
                  fetchMessages();
                }, 500);
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50">
                <Scale className={cn(iconSizes.xl, "mx-auto mb-4 opacity-50")} />
                <p>Select a conversation to review contracts</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ConversationView({
  conversation,
  messages,
  onSendMessage,
  onBack
}: {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onBack?: () => void;
}) {
  const { user } = useSession();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll helper with fallbacks
  const scrollToLast = (smooth = true) => {
    const el = lastMessageRef.current;
    const container = messagesContainerRef.current;
    
    if (!container) return;
    
    // If we have a last message element, prefer scrollIntoView
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end', inline: 'nearest' });
        return;
      } catch (err) {
        // ignore and fall back
      }
    }
    
    // Fallback: adjust scrollTop
    container.scrollTop = container.scrollHeight - container.clientHeight;
  };

  // Auto-scroll when conversation changes (initial load)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Scroll to bottom immediately when conversation opens
    const t = setTimeout(() => {
      scrollToLast(false); // Use instant scroll for initial load
    }, 100);
    
    return () => clearTimeout(t);
  }, [conversation.id]); // Trigger when conversation changes

  // Auto-scroll when messages change (new messages arrive)
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const latestId = messages[messages.length - 1]?.id;
    if (!latestId) return;
    
    const changed = lastMessageIdRef.current !== latestId;
    lastMessageIdRef.current = latestId;
    
    // On mobile, keyboard may shift layout. Allow a tiny delay:
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const timeout = isMobile ? 120 : 40;
    
    const t = setTimeout(() => {
      scrollToLast(changed);
    }, timeout);
    
    return () => clearTimeout(t);
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      
      // Refocus input so keyboard stays up on mobile
      setTimeout(() => {
        inputRef.current?.focus();
        // Small delay then scroll to ensure new message is rendered
        setTimeout(() => {
          scrollToLast(true);
        }, 70);
      }, 30);
    } catch (err: any) {
      toast.error('Failed to send message', { description: err.message });
    } finally {
      setIsSending(false);
    }
  };

  // Removed unused creatorParticipant variable

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-4 border-b border-white/10 flex-shrink-0", glass.apple)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Back to conversations"
              >
                <ChevronLeft className={iconSizes.md} />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <Scale className={iconSizes.md} />
            </div>
            <div>
              <div className="font-semibold">
                {getConversationDisplayMeta(conversation).title}
              </div>
              <div className="text-sm text-white/60">
                {getConversationDisplayMeta(conversation).subtitle}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {QUICK_REPLIES.slice(0, 2).map((reply, i) => (
              <button
                key={i}
                onClick={() => setNewMessage(reply)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs",
                  "bg-white/10 hover:bg-white/15",
                  "transition-colors"
                )}
              >
                Quick Reply
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-0 p-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((msg, index) => {
          const isOwn = msg.sender_id === user?.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          
          // Improved grouping - group by sender and time (within same minute)
          const isFirstOfGroup = 
            index === 0 ||
            !prevMsg ||
            prevMsg.sender_id !== msg.sender_id ||
            new Date(msg.sent_at).getTime() - new Date(prevMsg.sent_at).getTime() > 60000;
          
          const isLastInGroup = !nextMsg || 
            nextMsg.sender_id !== msg.sender_id ||
            new Date(nextMsg.sent_at).getTime() - new Date(msg.sent_at).getTime() > 60000;
          
          const isGrouped = !isFirstOfGroup;
          const isLast = index === messages.length - 1;
          const showTail = isFirstOfGroup;
          
          return (
            <motion.div
              key={msg.id}
              ref={isLast ? lastMessageRef : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex mb-1",
                isOwn ? "justify-end" : "justify-start",
                isGrouped && "mt-0.5"
              )}
              aria-live={isLast ? 'polite' : undefined}
            >
              <div className={cn(
                "max-w-[80%] px-3 py-2 text-sm",
                // WhatsApp/iMessage style rounded corners
                isOwn
                  ? cn(
                      "bg-purple-600 text-white",
                      showTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                    )
                  : cn(
                      "bg-white/10 text-white",
                      showTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                    )
              )}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.signed_download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-white/80 hover:text-white"
                      >
                        <FileText className={iconSizes.sm} />
                        {att.file_name}
                        <Download className={iconSizes.sm} />
                      </a>
                    ))}
                  </div>
                )}
                <div className={cn(
                  "text-[10px] mt-1 flex items-center gap-1",
                  isOwn ? "text-white/70 justify-end" : "text-white/50"
                )}>
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className={cn("p-4 border-t border-white/10 flex-shrink-0", glass.apple)}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className={cn(
              "flex-1 px-4 py-2 rounded-xl",
              glass.appleSubtle,
              "border border-white/10",
              "text-white placeholder:text-white/40",
              "focus:outline-none focus:ring-2 focus:ring-purple-400/50"
            )}
          />
          <motion.button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            whileTap={animations.microTap}
            className={cn(
              "px-6 py-2 rounded-xl font-medium",
              "bg-purple-500 hover:bg-purple-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            <Send className={iconSizes.sm} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

