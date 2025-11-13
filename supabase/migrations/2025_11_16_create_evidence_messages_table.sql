-- Create evidence_messages table for WhatsApp Vault
CREATE TABLE IF NOT EXISTS evidence_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message details
  message_id TEXT NOT NULL, -- WhatsApp message ID
  sender_number TEXT NOT NULL,
  recipient_number TEXT NOT NULL, -- NoticeBazaar WhatsApp number
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, video, document, audio
  
  -- Media URLs (stored in Supabase Storage)
  media_url TEXT,
  media_mime_type TEXT,
  media_size_bytes BIGINT,
  
  -- Timestamping & hashing for legal validity
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_timestamp TIMESTAMPTZ, -- Original message timestamp from WhatsApp
  content_hash TEXT NOT NULL, -- SHA256 hash of message content
  chain_of_custody_hash TEXT NOT NULL, -- HMAC signature for chain of custody
  
  -- Metadata
  is_forwarded BOOLEAN DEFAULT false,
  original_message_id TEXT, -- If forwarded
  context TEXT, -- User-provided context/notes
  
  -- Storage reference
  storage_path TEXT, -- Path in Supabase Storage
  
  -- Linked to cases/deals
  deal_id UUID REFERENCES brand_deals(id) ON DELETE SET NULL,
  notice_id UUID REFERENCES notice_requests(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evidence_messages_profile_id ON evidence_messages(profile_id);
CREATE INDEX IF NOT EXISTS idx_evidence_messages_deal_id ON evidence_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_evidence_messages_notice_id ON evidence_messages(notice_id);
CREATE INDEX IF NOT EXISTS idx_evidence_messages_content_hash ON evidence_messages(content_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_messages_received_at ON evidence_messages(received_at);

-- Enable RLS
ALTER TABLE evidence_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own evidence messages
CREATE POLICY "Users can view their own evidence"
  ON evidence_messages FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can create their own evidence (via WhatsApp forwarding)
CREATE POLICY "Users can create their own evidence"
  ON evidence_messages FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own evidence (add context/notes)
CREATE POLICY "Users can update their own evidence"
  ON evidence_messages FOR UPDATE
  USING (auth.uid() = profile_id);

-- Admins and lawyers can view evidence for cases they're assigned to
CREATE POLICY "Lawyers can view case evidence"
  ON evidence_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'chartered_accountant')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_evidence_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evidence_messages_updated_at
  BEFORE UPDATE ON evidence_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_messages_updated_at();

