-- Fix: Add INSERT policy for conversations table (V3 - FINAL FIX)
-- This is the most explicit and robust version

-- Step 1: Drop ALL existing policies on conversations
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'conversations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', r.policyname);
  END LOOP;
END $$;

-- Step 2: Recreate SELECT policies (must exist first)
CREATE POLICY conversations_select_participants_only
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY conversations_select_admin
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Step 3: Create INSERT policy (THIS IS THE KEY FIX)
-- Allow ANY authenticated user to create conversations
CREATE POLICY conversations_insert_authenticated
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 4: Create UPDATE policy
CREATE POLICY conversations_update_participants
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id
        AND cp.user_id = auth.uid()
    )
  );

-- Step 5: Verify policies were created
DO $$
DECLARE
  insert_policy_count INTEGER;
  select_policy_count INTEGER;
  update_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND cmd = 'INSERT';
    
  SELECT COUNT(*) INTO select_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND cmd = 'SELECT';
    
  SELECT COUNT(*) INTO update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'conversations'
    AND cmd = 'UPDATE';

  IF insert_policy_count = 0 THEN
    RAISE EXCEPTION 'INSERT policy was not created!';
  END IF;
  
  IF select_policy_count = 0 THEN
    RAISE EXCEPTION 'SELECT policies were not created!';
  END IF;

  RAISE NOTICE 'Successfully created policies: % INSERT, % SELECT, % UPDATE', 
    insert_policy_count, select_policy_count, update_policy_count;
END $$;

