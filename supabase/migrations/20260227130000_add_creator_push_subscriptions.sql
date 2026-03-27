-- Creator push subscriptions + collab notification dedupe timestamp

CREATE TABLE IF NOT EXISTS public.creator_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_creator_push_subscriptions_creator_id
  ON public.creator_push_subscriptions (creator_id);

ALTER TABLE public.creator_push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'creator_push_subscriptions'
      AND policyname = 'Creators can view own push subscriptions'
  ) THEN
    CREATE POLICY "Creators can view own push subscriptions"
      ON public.creator_push_subscriptions
      FOR SELECT
      TO authenticated
      USING (creator_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'creator_push_subscriptions'
      AND policyname = 'Creators can insert own push subscriptions'
  ) THEN
    CREATE POLICY "Creators can insert own push subscriptions"
      ON public.creator_push_subscriptions
      FOR INSERT
      TO authenticated
      WITH CHECK (creator_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'creator_push_subscriptions'
      AND policyname = 'Creators can update own push subscriptions'
  ) THEN
    CREATE POLICY "Creators can update own push subscriptions"
      ON public.creator_push_subscriptions
      FOR UPDATE
      TO authenticated
      USING (creator_id = auth.uid())
      WITH CHECK (creator_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'creator_push_subscriptions'
      AND policyname = 'Creators can delete own push subscriptions'
  ) THEN
    CREATE POLICY "Creators can delete own push subscriptions"
      ON public.creator_push_subscriptions
      FOR DELETE
      TO authenticated
      USING (creator_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'creator_push_subscriptions'
      AND policyname = 'Service role can manage push subscriptions'
  ) THEN
    CREATE POLICY "Service role can manage push subscriptions"
      ON public.creator_push_subscriptions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.collab_requests
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

COMMENT ON COLUMN public.collab_requests.last_notified_at IS 'Last time creator was notified about this collab request (push/email dedupe).';
