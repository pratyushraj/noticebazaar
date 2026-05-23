-- Create brand_messages table for creator-to-brand communication
-- This supports Option 2: Query Submission + Internal Routing

CREATE TABLE IF NOT EXISTS public.brand_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Core fields
  brand_id UUID, -- Brand identifier (can be from brand_deals or brands table)
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.brand_deals(id) ON DELETE SET NULL, -- Optional: link to specific deal
  
  -- Message content
  text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file URLs: [{"url": "...", "name": "...", "type": "..."}]
  
  -- Metadata
  source TEXT NOT NULL CHECK (source IN ('creator', 'brand', 'admin')) DEFAULT 'creator',
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'replied', 'resolved')) DEFAULT 'pending',
  type TEXT NOT NULL CHECK (type IN ('brand_message', 'deliverable_question', 'payment_question', 'general')) DEFAULT 'brand_message',
  
  -- Brand contact info (snapshot at time of message)
  brand_email TEXT,
  brand_name TEXT,
  contact_person TEXT,
  
  -- Reply tracking
  parent_message_id UUID REFERENCES public.brand_messages(id) ON DELETE SET NULL, -- For threading
  replied_at TIMESTAMPTZ,
  reply_text TEXT,
  
  -- Notification tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brand_messages_creator_id ON public.brand_messages(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_messages_brand_id ON public.brand_messages(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_messages_deal_id ON public.brand_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_brand_messages_status ON public.brand_messages(status);
CREATE INDEX IF NOT EXISTS idx_brand_messages_created_at ON public.brand_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_messages_parent_message_id ON public.brand_messages(parent_message_id);

-- Enable RLS
ALTER TABLE public.brand_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Creators can view and create their own messages
CREATE POLICY "Creators can view their own brand messages"
  ON public.brand_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create their own brand messages"
  ON public.brand_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Admins can view all messages (for managing brand replies)
CREATE POLICY "Admins can view all brand messages"
  ON public.brand_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update messages (for replying on behalf of brands)
CREATE POLICY "Admins can update brand messages"
  ON public.brand_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_brand_messages_updated_at
  BEFORE UPDATE ON public.brand_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_messages_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.brand_messages IS 'Messages from creators to brands (and replies). Supports query submission workflow where brands receive emails and can reply via admin dashboard.';

