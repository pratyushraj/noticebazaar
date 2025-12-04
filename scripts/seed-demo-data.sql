-- Demo Seed Data for NoticeBazaar
-- Creates 2 creators, 2 advisors, demo conversations, messages, and contracts

-- ============================================================================
-- CREATE DEMO USERS (if not exists)
-- ============================================================================

-- Creator 1: pratyushraj@outlook.com (existing)
-- Creator 2: demo.creator@noticebazaar.com
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo.creator@noticebazaar.com', crypt('demo123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Advisor 1: Prateek Sharma (Legal)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'prateek.sharma@noticebazaar.com', crypt('advisor123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Advisor 2: Anjali Sharma (CA)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'anjali.sharma@noticebazaar.com', crypt('advisor123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE PROFILES
-- ============================================================================

INSERT INTO public.profiles (id, first_name, last_name, role, onboarding_complete, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo', 'Creator', 'creator', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Prateek', 'Sharma', 'admin', true, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Anjali', 'Sharma', 'chartered_accountant', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role;

-- ============================================================================
-- CREATE DEMO CONVERSATIONS
-- ============================================================================

-- Conversation 1: High Risk Contract
INSERT INTO public.conversations (id, title, type, risk_tag, created_at, updated_at)
VALUES 
  ('conv-001', 'SaaS MSA Draft Review', 'direct', 'high_risk', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Conversation 2: Payment Question
INSERT INTO public.conversations (id, title, type, risk_tag, created_at, updated_at)
VALUES 
  ('conv-002', 'Payment Terms Clarification', 'direct', 'payment', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ADD PARTICIPANTS
-- ============================================================================

-- Conv 1: Creator 1 + Prateek (Legal)
INSERT INTO public.conversation_participants (conversation_id, user_id, role, joined_at)
VALUES
  ('conv-001', (SELECT id FROM auth.users WHERE email = 'pratyushraj@outlook.com' LIMIT 1), 'creator', NOW()),
  ('conv-001', '00000000-0000-0000-0000-000000000002', 'advisor', NOW())
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Conv 2: Creator 1 + Anjali (CA)
INSERT INTO public.conversation_participants (conversation_id, user_id, role, joined_at)
VALUES
  ('conv-002', (SELECT id FROM auth.users WHERE email = 'pratyushraj@outlook.com' LIMIT 1), 'creator', NOW()),
  ('conv-002', '00000000-0000-0000-0000-000000000003', 'advisor', NOW())
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- ============================================================================
-- CREATE DEMO MESSAGES
-- ============================================================================

-- Messages for Conv 1
INSERT INTO public.messages (id, conversation_id, sender_id, content, sent_at, created_at)
SELECT
  gen_random_uuid(),
  'conv-001',
  '00000000-0000-0000-0000-000000000002',
  'Hi, I''ve reviewed the **SaaS MSA draft**. The liability clause needs clarification. I''ve uploaded my redlines to the ''Documents'' section for your review. Let me know if you have time for a quick call tomorrow.',
  NOW() - INTERVAL '2 minutes',
  NOW() - INTERVAL '2 minutes'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE DEMO PROTECTION REPORT
-- ============================================================================

INSERT INTO public.protection_reports (
  id,
  deal_id,
  contract_file_url,
  protection_score,
  overall_risk,
  analysis_json,
  analyzed_at,
  created_at
)
SELECT
  'report-001',
  (SELECT id FROM public.brand_deals LIMIT 1),
  'https://example.com/contract.pdf',
  85,
  'low',
  '{"protectionScore": 85, "overallRisk": "low", "issues": [], "verified": []}'::jsonb,
  NOW(),
  NOW()
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.conversations IS 'Demo conversations seeded for testing';
COMMENT ON TABLE public.messages IS 'Demo messages for testing realtime functionality';

