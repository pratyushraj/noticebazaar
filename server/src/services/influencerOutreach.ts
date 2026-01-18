// Influencer Outreach Message Generator
// Production-ready service for generating personalized outreach messages
// Includes rate limiting and multiple message templates

import { callLLM } from './aiContractAnalysis.js';
import type { InfluencerResult } from './influencerFinder.js';
import { supabase } from '../index.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OutreachMessage {
  message: string;
  template_type: 'default' | 'founding_creator' | 'follow_up';
  personalized: boolean;
  content_type?: string; // Type of content mentioned (e.g., "fitness post", "fashion reel")
}

export type MessageTemplate = 'default' | 'founding_creator' | 'follow_up';

// ============================================================================
// RATE LIMITING
// ============================================================================

const RATE_LIMIT_DAILY_MAX = 30; // Max 30 messages/day per creator

/**
 * Check if we can send a message to an influencer (rate limit check)
 */
async function checkRateLimit(instagramHandle: string): Promise<{ allowed: boolean; reason?: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('influencers')
    .select('last_dm_sent_at, contacted_at')
    .eq('instagram_handle', instagramHandle)
    .single();

  if (error || !data) {
    return { allowed: true }; // Allow if no record found
  }

  // Check if already contacted today
  if (data.last_dm_sent_at) {
    const lastSent = new Date(data.last_dm_sent_at);
    if (lastSent >= today) {
      // Count messages sent today
      const { count } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('instagram_handle', instagramHandle)
        .gte('last_dm_sent_at', today.toISOString());

      if (count && count >= RATE_LIMIT_DAILY_MAX) {
        return { allowed: false, reason: `Rate limit exceeded: ${RATE_LIMIT_DAILY_MAX} messages/day` };
      }
    }
  }

  return { allowed: true };
}

// ============================================================================
// MESSAGE TEMPLATES
// ============================================================================

/**
 * Default outreach template
 */
function getDefaultTemplate(influencer: InfluencerResult): string {
  const name = influencer.creator_name.split(' ')[0]; // First name only
  const niche = influencer.niche || 'content';
  
  return `Hey ${name}, loved your recent ${niche} content! We're building Creator Armour — a platform that protects creators with contracts and payments. Would you like early access as a Founding Creator? 🚀`;
}

/**
 * Founding Creator template (more exclusive)
 */
function getFoundingCreatorTemplate(influencer: InfluencerResult): string {
  const name = influencer.creator_name.split(' ')[0];
  const niche = influencer.niche || 'content';
  
  return `Hey ${name}! Your ${niche} content is 🔥 We're launching Creator Armour — the platform that protects creators with smart contracts and secure payments. We'd love to have you as a Founding Creator with exclusive benefits. Interested?`;
}

/**
 * Follow-up template (48 hours later)
 */
function getFollowUpTemplate(influencer: InfluencerResult): string {
  const name = influencer.creator_name.split(' ')[0];
  
  return `Hey ${name}, just following up on my message about Creator Armour. We're helping creators protect their work and get paid fairly. Would love to chat if you're interested!`;
}

// ============================================================================
// MESSAGE GENERATION
// ============================================================================

/**
 * Generate personalized outreach message for an influencer
 * Uses AI to personalize based on their content
 */
export async function generateOutreachMessage(
  influencer: InfluencerResult,
  template: MessageTemplate = 'default'
): Promise<OutreachMessage> {
  // Check rate limit
  const rateLimitCheck = await checkRateLimit(influencer.instagram_handle);
  if (!rateLimitCheck.allowed) {
    throw new Error(rateLimitCheck.reason || 'Rate limit exceeded');
  }

  // Use template-based generation for consistency
  let baseMessage: string;
  
  switch (template) {
    case 'founding_creator':
      baseMessage = getFoundingCreatorTemplate(influencer);
      break;
    case 'follow_up':
      baseMessage = getFollowUpTemplate(influencer);
      break;
    default:
      baseMessage = getDefaultTemplate(influencer);
  }

  // Try to personalize with AI (optional enhancement)
  try {
    const personalized = await personalizeMessageWithAI(influencer, baseMessage, template);
    return personalized;
  } catch (error) {
    // Fallback to template
    return {
      message: baseMessage,
      template_type: template,
      personalized: false
    };
  }
}

/**
 * Personalize message using AI (optional enhancement)
 */
async function personalizeMessageWithAI(
  influencer: InfluencerResult,
  baseMessage: string,
  template: MessageTemplate
): Promise<OutreachMessage> {
  const prompt = `You are helping Creator Armour reach out to influencers.

Influencer Details:
- Name: ${influencer.creator_name}
- Instagram: @${influencer.instagram_handle}
- Niche: ${influencer.niche}
- Bio: ${influencer.bio || 'Not provided'}
- Followers: ${influencer.followers.toLocaleString()}

Template Type: ${template}

Base Message:
${baseMessage}

Personalize this message (max 200 characters) to:
1. Mention their specific content type if possible
2. Keep it friendly and authentic
3. Maintain the core message about Creator Armour
4. Include a clear call-to-action

Return ONLY a valid JSON object:
{
  "message": "<the personalized DM message text>",
  "personalized": true,
  "content_type": "<type of content mentioned>"
}`;

  try {
    const response = await callLLM(prompt);
    
    // Extract JSON from response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const outreach = JSON.parse(jsonMatch[0]) as OutreachMessage;
    
    // Ensure message is valid
    if (!outreach.message || outreach.message.length > 200) {
      throw new Error('Invalid message length');
    }
    
    return {
      ...outreach,
      template_type: template
    };
  } catch (error: any) {
    throw error;
  }
}

/**
 * Generate batch outreach messages for multiple influencers
 */
export async function generateBatchOutreachMessages(
  influencers: InfluencerResult[],
  template: MessageTemplate = 'default'
): Promise<Map<string, OutreachMessage>> {
  const messages = new Map<string, OutreachMessage>();
  
  // Generate messages in parallel (with rate limiting consideration)
  const batchSize = 5; // Process 5 at a time to avoid rate limits
  
  for (let i = 0; i < influencers.length; i += batchSize) {
    const batch = influencers.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (influencer) => {
        try {
          // Check rate limit before generating
          const rateLimitCheck = await checkRateLimit(influencer.instagram_handle);
          if (!rateLimitCheck.allowed) {
            console.warn(`[InfluencerOutreach] Rate limit for @${influencer.instagram_handle}: ${rateLimitCheck.reason}`);
            return;
          }

          const message = await generateOutreachMessage(influencer, template);
          messages.set(influencer.instagram_handle, message);
        } catch (error: any) {
          console.error(`[InfluencerOutreach] Error generating message for @${influencer.instagram_handle}:`, error.message);
          // Use fallback template
          messages.set(influencer.instagram_handle, {
            message: getDefaultTemplate(influencer),
            template_type: template,
            personalized: false
          });
        }
      })
    );
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < influencers.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return messages;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Mark influencer as contacted in database
 */
export async function markAsContacted(
  instagramHandle: string,
  dmSentAt: Date,
  followUpDueAt?: Date,
  responseStatus?: string
): Promise<void> {
  const { error } = await supabase
    .from('influencers')
    .update({
      status: 'contacted',
      already_contacted: true,
      contacted_at: dmSentAt.toISOString(),
      last_dm_sent_at: dmSentAt.toISOString(),
      follow_up_due_at: followUpDueAt?.toISOString(),
      response_status: responseStatus || 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('instagram_handle', instagramHandle);

  if (error) {
    throw error;
  }
}

/**
 * Update influencer status
 */
export async function updateInfluencerStatus(
  instagramHandle: string,
  status: 'new' | 'contacted' | 'replied' | 'not_interested' | 'converted',
  responseStatus?: string
): Promise<void> {
  const { error } = await supabase
    .from('influencers')
    .update({
      status,
      response_status: responseStatus,
      updated_at: new Date().toISOString()
    })
    .eq('instagram_handle', instagramHandle);

  if (error) {
    throw error;
  }
}

/**
 * Get influencers due for follow-up
 */
export async function getInfluencersDueForFollowUp(): Promise<InfluencerResult[]> {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('status', 'contacted')
    .not('follow_up_due_at', 'is', null)
    .lte('follow_up_due_at', new Date().toISOString())
    .order('follow_up_due_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as InfluencerResult[];
}

/**
 * Get influencers who haven't been contacted yet
 */
export async function getUncontactedInfluencers(limit: number = 50): Promise<InfluencerResult[]> {
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .eq('status', 'new')
    .eq('already_contacted', false)
    .order('fit_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []) as InfluencerResult[];
}
