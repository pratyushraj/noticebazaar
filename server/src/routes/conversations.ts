// Conversations API routes

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /conversations - List user's conversations
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants!inner(
          user_id,
          role,
          last_read_at
        ),
        last_message:messages!last_message_id(
          id,
          content,
          sent_at,
          sender_id
        )
      `)
      .eq('conversation_participants.user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ data: conversations, limit, offset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /conversations - Create new conversation
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { participant_ids, title, type = 'direct', risk_tag } = req.body;

    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ error: 'participant_ids required' });
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        title,
        type,
        risk_tag
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    const participants = [
      { conversation_id: conversation.id, user_id: userId, role: req.user!.role || 'creator' },
      ...participant_ids.map((pid: string) => ({
        conversation_id: conversation.id,
        user_id: pid,
        role: 'advisor' // Default, should be determined from profile
      }))
    ];

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) throw partError;

    res.status(201).json({ data: conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /conversations/:id - Get conversation details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          role,
          profiles:user_id(first_name, last_name, avatar_url, role)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (p: any) => p.user_id === userId
    );

    if (!isParticipant && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

