// @ts-nocheck
// Attachments API routes - Signed URL generation and virus scan

import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { generateSignedUploadUrl, generateSignedDownloadUrl } from '../services/storage.js';
import { scanFileForVirus } from '../services/virusScan.js';

const router = Router();
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain'
]);
const MAX_SIZE = 5 * 1024 * 1024;

// POST /conversations/:id/attachments/request-upload - Get signed upload URL
router.post('/:conversationId/attachments/request-upload', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { file_name, file_size, file_type } = req.body;

    if (!file_name || !file_size || !file_type) {
      return res.status(400).json({ error: 'file_name, file_size, file_type required' });
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate file size (5MB default)
    if (file_size > MAX_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    if (!ALLOWED_MIME.has(file_type)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Generate storage path
    const sanitizedFileName = file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `conversations/${conversationId}/${userId}/${Date.now()}_${sanitizedFileName}`;

    // Generate signed upload URL
    const { signedUrl, path } = await generateSignedUploadUrl(storagePath, file_type);

    // Create attachment record (pending)
    const { data: attachment, error } = await supabase
      .from('message_attachments')
      .insert({
        file_name: sanitizedFileName,
        file_size,
        file_type,
        storage_path: path,
        virus_scan_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      data: {
        attachment_id: attachment.id,
        signed_upload_url: signedUrl,
        expires_in: 3600 // 1 hour
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /conversations/:id/attachments/confirm - Confirm upload and trigger virus scan
router.post('/:conversationId/attachments/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId } = req.params;
    const { attachment_id } = req.body;

    if (!attachment_id) {
      return res.status(400).json({ error: 'attachment_id required' });
    }

    // Get attachment
    const { data: attachment, error: attError } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('id', attachment_id)
      .single();

    if (attError || !attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Verify user has access (through message if linked, or conversation)
    // For now, allow if user is participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Trigger virus scan (async)
    scanFileForVirus(attachment.id, attachment.storage_path)
      .then((result) => {
        if (result.status === 'clean') {
          return generateSignedDownloadUrl(attachment.storage_path)
            .then((downloadUrl) => {
              return supabase
                .from('message_attachments')
                .update({
                  virus_scan_status: result.status,
                  virus_scan_result: result.result,
                  scanned_at: new Date().toISOString(),
                  signed_download_url: downloadUrl
                })
                .eq('id', attachment.id);
            });
        }
        return supabase
          .from('message_attachments')
          .update({
            virus_scan_status: result.status,
            virus_scan_result: result.result,
            scanned_at: new Date().toISOString()
          })
          .eq('id', attachment.id);
      })
      .catch((err) => {
        console.error('Virus scan error:', err);
        supabase
          .from('message_attachments')
          .update({
            virus_scan_status: 'error',
            virus_scan_result: err.message
          })
          .eq('id', attachment.id);
      });

    res.json({
      data: {
        attachment_id: attachment.id,
        scan_status: 'pending'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /conversations/:id/attachments/:attachmentId/status - Get scan status and download URL if clean
router.get('/:conversationId/attachments/:attachmentId/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { conversationId, attachmentId } = req.params;

    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: attachment, error: attError } = await supabase
      .from('message_attachments')
      .select('id, virus_scan_status, signed_download_url')
      .eq('id', attachmentId)
      .single();

    if (attError || !attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json({
      data: {
        attachment_id: attachment.id,
        scan_status: attachment.virus_scan_status,
        download_url: attachment.signed_download_url || null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
