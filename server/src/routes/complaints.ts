// @ts-nocheck
// Consumer Complaints API routes

import { Router, Response } from 'express';
import { supabase } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { sendLawyerComplaintNotification } from '../services/lawyerNotificationService.js';
import { classifyComplaintSeverity } from '../services/complaintSeverityClassifier.js';

const router = Router();

// GET /complaints - List complaints (filtered by role)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Check if user is lawyer/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    let query = supabase
      .from('consumer_complaints')
      .select('*')
      .order('created_at', { ascending: false });

    // If not lawyer/admin, only show own complaints
    if (profile?.role !== 'lawyer' && profile?.role !== 'admin') {
      query = query.eq('creator_id', userId);
    }

    const { data: complaints, error } = await query;

    if (error) {
      console.error('Error fetching complaints:', error);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }

    res.json({ complaints: complaints || [] });
  } catch (error: any) {
    console.error('Error in GET /complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /complaints/:id - Get single complaint
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const complaintId = req.params.id;

    const { data: complaint, error } = await supabase
      .from('consumer_complaints')
      .select('*')
      .eq('id', complaintId)
      .single();

    if (error) {
      console.error('Error fetching complaint:', error);
      return res.status(500).json({ error: 'Failed to fetch complaint' });
    }

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check access: creator or lawyer/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (complaint.creator_id !== userId && profile?.role !== 'lawyer' && profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ complaint });
  } catch (error: any) {
    console.error('Error in GET /complaints/:id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /complaints - Create a new consumer complaint
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      category,
      category_name,
      company_name,
      issue_type,
      description,
      amount,
      proof_file_url,
      wants_lawyer_review,
      wants_notice_draft,
    } = req.body;

    // Validation
    if (!company_name || !issue_type || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine initial status
    let initialStatus = 'draft_created';
    if (wants_lawyer_review && wants_notice_draft) {
      initialStatus = 'lawyer_review_requested';
    } else if (wants_lawyer_review) {
      initialStatus = 'lawyer_review_requested';
    } else if (wants_notice_draft) {
      initialStatus = 'notice_generated';
    }

    // Create complaint
    const { data: complaintData, error: complaintError } = await supabase
      .from('consumer_complaints')
      .insert({
        creator_id: userId,
        category: category || 'others',
        category_name: category_name || '',
        company_name,
        issue_type,
        description,
        amount: amount ? parseFloat(amount) : null,
        proof_file_url: proof_file_url || null,
        wants_lawyer_review: wants_lawyer_review || false,
        wants_notice_draft: wants_notice_draft || false,
        status: initialStatus,
      } as any)
      .select()
      .single();

    if (complaintError) {
      console.error('Error creating complaint:', complaintError);
      return res.status(500).json({ error: 'Failed to create complaint' });
    }

    if (!complaintData || !('id' in complaintData)) {
      return res.status(500).json({ error: 'Invalid complaint data returned' });
    }

    const complaintId = complaintData.id as string;

    // AI Severity Classification (non-blocking)
    try {
      const classification = await classifyComplaintSeverity(
        description,
        category || 'others',
        category_name || null,
        amount ? parseFloat(amount) : null,
        issue_type
      );

      // Update complaint with severity (non-blocking - don't fail if update fails)
      await supabase
        .from('consumer_complaints')
        .update({
          severity: classification.severity,
          confidence_score: classification.confidence_score,
        } as any)
        .eq('id', complaintId);
    } catch (classificationError: any) {
      console.error('[Complaints] AI severity classification failed (non-blocking):', classificationError);
      // Don't fail the request - just log and continue with default severity (medium)
    }

    // Create notifications for lawyers if review or notice draft is requested
    if (wants_lawyer_review || wants_notice_draft) {
      try {
        // Get all lawyers and admins
        const { data: lawyers, error: lawyersError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('role', ['lawyer', 'admin']);

        if (!lawyersError && lawyers && lawyers.length > 0) {
          // Get user emails for lawyers
          const lawyerIds = lawyers.map(l => l.id);
          const { data: emails, error: emailsError } = await supabase.rpc('get_user_emails', {
            user_ids: lawyerIds,
          } as any);

          const emailMap = new Map<string, string>();
          if (!emailsError && emails && Array.isArray(emails)) {
            emails.forEach((e: any) => {
              emailMap.set(e.user_id, e.email);
            });
          }

          // Create in-app notifications for all lawyers
          const notificationInserts = lawyers.map(lawyer => ({
            user_id: lawyer.id,
            type: 'consumer_complaint',
            category: 'complaint_needs_review',
            title: 'New Consumer Complaint',
            message: 'A consumer complaint requires lawyer review.',
            entity_id: complaintId,
            link: '/lawyer/consumer-complaints',
            priority: 'high',
            data: {
              complaint_id: complaintId,
              company_name,
              category: category_name || category,
            },
          }));

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notificationInserts as any);

          if (notificationError) {
            console.error('[Complaints] Error creating notifications:', notificationError);
            // Don't fail the request if notifications fail
          }

          // Send email notifications (non-blocking)
          const emailPromises = lawyers.map(async (lawyer) => {
            const email = emailMap.get(lawyer.id);
            if (email) {
              try {
                await sendLawyerComplaintNotification(email, {
                  companyName: company_name,
                  category: category || 'others',
                  categoryName: category_name,
                  complaintId,
                });
              } catch (emailError) {
                console.error(`[Complaints] Failed to send email to ${email}:`, emailError);
                // Email failures don't block complaint creation
              }
            }
          });

          // Send emails in background (don't await)
          Promise.all(emailPromises).catch(err => {
            console.error('[Complaints] Error sending email notifications:', err);
          });
        }
      } catch (notificationError: any) {
        console.error('[Complaints] Error in notification flow:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    res.status(201).json({ complaint: complaintData });
  } catch (error: any) {
    console.error('Error in POST /complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /complaints/:id/status - Update complaint status
// Can be called by creator (to finalize with pre-filing actions) or lawyer/admin (to update status)
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const complaintId = req.params.id;
    const { status, lawyer_review_notes, lawyer_review_suggestions, notice_draft_url, wants_lawyer_review, wants_notice_draft } = req.body;

    // Get current complaint to check ownership
    const { data: currentComplaint, error: fetchError } = await supabase
      .from('consumer_complaints')
      .select('creator_id, company_name, category, category_name, status')
      .eq('id', complaintId)
      .single();

    if (fetchError || !currentComplaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check if user is lawyer/admin or the creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isLawyerOrAdmin = profile?.role === 'lawyer' || profile?.role === 'admin';
    const isCreator = currentComplaint.creator_id === userId;

    if (!isLawyerOrAdmin && !isCreator) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If creator is updating, they can only set wants_lawyer_review/wants_notice_draft and status
    // If lawyer/admin is updating, they can update status and review fields
    const updateData: any = {};
    
    if (isCreator) {
      // Creator is finalizing the complaint with pre-filing actions
      if (status) updateData.status = status;
      if (wants_lawyer_review !== undefined) updateData.wants_lawyer_review = wants_lawyer_review;
      if (wants_notice_draft !== undefined) updateData.wants_notice_draft = wants_notice_draft;
    } else {
      // Lawyer/admin is updating status
      if (status) updateData.status = status;
      
      if (status === 'lawyer_review_completed') {
        updateData.lawyer_reviewed_at = new Date().toISOString();
        updateData.lawyer_reviewed_by = userId;
        if (lawyer_review_notes) updateData.lawyer_review_notes = lawyer_review_notes;
        if (lawyer_review_suggestions) updateData.lawyer_review_suggestions = lawyer_review_suggestions;
      }

      if (status === 'notice_generated' && notice_draft_url) {
        updateData.notice_draft_url = notice_draft_url;
        updateData.notice_generated_at = new Date().toISOString();
        updateData.notice_generated_by = userId;
      }
    }

    const { data: complaint, error } = await supabase
      .from('consumer_complaints')
      .update(updateData)
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error('Error updating complaint:', error);
      return res.status(500).json({ error: 'Failed to update complaint' });
    }

    // Create notifications if creator just requested lawyer review or notice draft
    if (isCreator && (wants_lawyer_review || wants_notice_draft)) {
      try {
        // Get all lawyers and admins
        const { data: lawyers, error: lawyersError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('role', ['lawyer', 'admin']);

        if (!lawyersError && lawyers && lawyers.length > 0) {
          // Get user emails for lawyers
          const lawyerIds = lawyers.map(l => l.id);
          const { data: emails, error: emailsError } = await supabase.rpc('get_user_emails', {
            user_ids: lawyerIds,
          } as any);

          const emailMap = new Map<string, string>();
          if (!emailsError && emails && Array.isArray(emails)) {
            emails.forEach((e: any) => {
              emailMap.set(e.user_id, e.email);
            });
          }

          // Create in-app notifications for all lawyers
          const notificationInserts = lawyers.map(lawyer => ({
            user_id: lawyer.id,
            type: 'consumer_complaint',
            category: 'complaint_needs_review',
            title: 'New Consumer Complaint',
            message: 'A consumer complaint requires lawyer review.',
            entity_id: complaintId,
            link: '/lawyer/consumer-complaints',
            priority: 'high',
            data: {
              complaint_id: complaintId,
              company_name: currentComplaint.company_name,
              category: currentComplaint.category_name || currentComplaint.category,
            },
          }));

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notificationInserts as any);

          if (notificationError) {
            console.error('[Complaints] Error creating notifications:', notificationError);
            // Don't fail the request if notifications fail
          }

          // Send email notifications (non-blocking)
          const emailPromises = lawyers.map(async (lawyer) => {
            const email = emailMap.get(lawyer.id);
            if (email) {
              try {
                await sendLawyerComplaintNotification(email, {
                  companyName: currentComplaint.company_name,
                  category: currentComplaint.category || 'others',
                  categoryName: currentComplaint.category_name,
                  complaintId,
                });
              } catch (emailError) {
                console.error(`[Complaints] Failed to send email to ${email}:`, emailError);
                // Email failures don't block complaint update
              }
            }
          });

          // Send emails in background (don't await)
          Promise.all(emailPromises).catch(err => {
            console.error('[Complaints] Error sending email notifications:', err);
          });
        }
      } catch (notificationError: any) {
        console.error('[Complaints] Error in notification flow:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    res.json({ complaint });
  } catch (error: any) {
    console.error('Error in PATCH /complaints/:id/status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

