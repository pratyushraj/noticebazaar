-- Create notice_requests table for legal notice flow
CREATE TABLE IF NOT EXISTS notice_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES brand_deals(id) ON DELETE SET NULL,
  copyright_match_id UUID REFERENCES copyright_matches(id) ON DELETE SET NULL,
  
  -- Notice details
  draft_text TEXT NOT NULL,
  final_text TEXT,
  notice_type TEXT NOT NULL DEFAULT 'payment_recovery', -- payment_recovery, copyright_takedown, defamation, etc.
  
  -- Payment & lawyer workflow
  payment_id TEXT, -- Razorpay payment/order ID
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_amount DECIMAL(10, 2),
  payment_currency TEXT DEFAULT 'INR',
  
  -- Lawyer review workflow
  status TEXT NOT NULL DEFAULT 'draft', -- draft, paid, under_review, approved, sent, failed
  lawyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Assigned lawyer/CA
  lawyer_notes TEXT,
  lawyer_approved_at TIMESTAMPTZ,
  
  -- Sending details
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- email, registered_post, courier
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_address TEXT,
  delivery_receipt_url TEXT,
  
  -- Evidence & attachments
  evidence_urls TEXT[], -- Array of Supabase Storage URLs
  contract_reference TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notice_requests_profile_id ON notice_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_notice_requests_status ON notice_requests(status);
CREATE INDEX IF NOT EXISTS idx_notice_requests_deal_id ON notice_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_notice_requests_payment_status ON notice_requests(payment_status);

-- Enable RLS
ALTER TABLE notice_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notices
CREATE POLICY "Users can view their own notices"
  ON notice_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can create their own notices
CREATE POLICY "Users can create their own notices"
  ON notice_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own notices (before payment)
CREATE POLICY "Users can update their own draft notices"
  ON notice_requests FOR UPDATE
  USING (auth.uid() = profile_id AND status = 'draft');

-- Lawyers/admins can view and update notices assigned to them
CREATE POLICY "Lawyers can view assigned notices"
  ON notice_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'chartered_accountant')
    )
  );

CREATE POLICY "Lawyers can update assigned notices"
  ON notice_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'chartered_accountant')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notice_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notice_requests_updated_at
  BEFORE UPDATE ON notice_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_notice_requests_updated_at();

