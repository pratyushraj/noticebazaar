// Messages API routes

import { Router } from 'express';
import { supabase } from '../index';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /conversations/:id/messages - Get messages with pagination
router.get('/:conversationId/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 40;
    const before = req.query.before as string;

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(first_name, last_name, avatar_url),
        attachments:message_attachments(*)
      `)
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('id', before);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    res.json({ data: messages.reverse() }); // Reverse to show oldest first
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /conversations/:id/messages - Send message
router.post('/:conversationId/messages', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { content, message_type = 'text', attachment_ids } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content required' });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this conversation' });
    }

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
        message_type
      })
      .select()
      .single();

    if (msgError) throw msgError;

    // Link attachments if provided
    if (attachment_ids && Array.isArray(attachment_ids) && attachment_ids.length > 0) {
      await supabase
        .from('message_attachments')
        .update({ message_id: message.id })
        .in('id', attachment_ids);
    }

    res.status(201).json({ data: message });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /messages/:id/read - Mark message as read
router.patch('/messages/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Verify user can read this message
    const { data: message } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark as read
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('conversation_id', message.conversation_id);

    if (error) throw error;

    // Update participant's last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', userId);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

