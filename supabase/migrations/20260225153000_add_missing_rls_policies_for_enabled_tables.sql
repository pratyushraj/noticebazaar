-- Add missing RLS policies for tables where RLS is enabled but no policies exist.
-- Keeps behavior conservative: user-owned tables get ownership policies, internal tables get service_role policies.

BEGIN;

-- ---------------------------------------------------------------------------
-- collab_request_leads: internal ingestion/processing table
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'collab_request_leads'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'collab_request_leads'
        AND policyname = 'collab_request_leads_service_role_all'
    ) THEN
      CREATE POLICY collab_request_leads_service_role_all
        ON public.collab_request_leads
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- creators: legacy/internal table (directory API reads via backend service role)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'creators'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'creators'
        AND policyname = 'creators_service_role_all'
    ) THEN
      CREATE POLICY creators_service_role_all
        ON public.creators
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- issue_history: users can access history of their own issues
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'issue_history'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'issue_history'
        AND policyname = 'issue_history_select_own_issue'
    ) THEN
      CREATE POLICY issue_history_select_own_issue
        ON public.issue_history
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.issues i
            WHERE i.id = issue_history.issue_id
              AND i.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'issue_history'
        AND policyname = 'issue_history_insert_own_issue'
    ) THEN
      CREATE POLICY issue_history_insert_own_issue
        ON public.issue_history
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM public.issues i
            WHERE i.id = issue_history.issue_id
              AND i.user_id = auth.uid()
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'issue_history'
        AND policyname = 'issue_history_service_role_all'
    ) THEN
      CREATE POLICY issue_history_service_role_all
        ON public.issue_history
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- payment_reminders: creator-owned records + service role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payment_reminders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'payment_reminders'
        AND policyname = 'payment_reminders_select_own'
    ) THEN
      CREATE POLICY payment_reminders_select_own
        ON public.payment_reminders
        FOR SELECT
        TO authenticated
        USING (creator_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'payment_reminders'
        AND policyname = 'payment_reminders_insert_own'
    ) THEN
      CREATE POLICY payment_reminders_insert_own
        ON public.payment_reminders
        FOR INSERT
        TO authenticated
        WITH CHECK (creator_id = auth.uid());
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'payment_reminders'
        AND policyname = 'payment_reminders_service_role_all'
    ) THEN
      CREATE POLICY payment_reminders_service_role_all
        ON public.payment_reminders
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- protection_issues: creators can view their own report issues + service role write
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'protection_issues'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'protection_issues'
        AND policyname = 'protection_issues_select_creator'
    ) THEN
      CREATE POLICY protection_issues_select_creator
        ON public.protection_issues
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM public.protection_reports pr
            LEFT JOIN public.brand_deals bd ON bd.id = pr.deal_id
            WHERE pr.id = protection_issues.report_id
              AND (
                pr.user_id = auth.uid()
                OR bd.creator_id = auth.uid()
              )
          )
        );
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'protection_issues'
        AND policyname = 'protection_issues_service_role_all'
    ) THEN
      CREATE POLICY protection_issues_service_role_all
        ON public.protection_issues
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- social_accounts: support both modern schema (user_id) and legacy schema (creator_id)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  has_user_id boolean := false;
  has_creator_id boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_accounts'
  ) THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'social_accounts' AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'social_accounts' AND column_name = 'creator_id'
    ) INTO has_creator_id;

    IF has_user_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_select_own_user'
      ) THEN
        CREATE POLICY social_accounts_select_own_user
          ON public.social_accounts
          FOR SELECT
          TO authenticated
          USING (user_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_insert_own_user'
      ) THEN
        CREATE POLICY social_accounts_insert_own_user
          ON public.social_accounts
          FOR INSERT
          TO authenticated
          WITH CHECK (user_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_update_own_user'
      ) THEN
        CREATE POLICY social_accounts_update_own_user
          ON public.social_accounts
          FOR UPDATE
          TO authenticated
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_delete_own_user'
      ) THEN
        CREATE POLICY social_accounts_delete_own_user
          ON public.social_accounts
          FOR DELETE
          TO authenticated
          USING (user_id = auth.uid());
      END IF;
    ELSIF has_creator_id THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_select_own_creator'
      ) THEN
        CREATE POLICY social_accounts_select_own_creator
          ON public.social_accounts
          FOR SELECT
          TO authenticated
          USING (creator_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_insert_own_creator'
      ) THEN
        CREATE POLICY social_accounts_insert_own_creator
          ON public.social_accounts
          FOR INSERT
          TO authenticated
          WITH CHECK (creator_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_update_own_creator'
      ) THEN
        CREATE POLICY social_accounts_update_own_creator
          ON public.social_accounts
          FOR UPDATE
          TO authenticated
          USING (creator_id = auth.uid())
          WITH CHECK (creator_id = auth.uid());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'social_accounts'
          AND policyname = 'social_accounts_delete_own_creator'
      ) THEN
        CREATE POLICY social_accounts_delete_own_creator
          ON public.social_accounts
          FOR DELETE
          TO authenticated
          USING (creator_id = auth.uid());
      END IF;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'social_accounts'
        AND policyname = 'social_accounts_service_role_all'
    ) THEN
      CREATE POLICY social_accounts_service_role_all
        ON public.social_accounts
        FOR ALL
        TO service_role
        USING (auth.role() = 'service_role')
        WITH CHECK (auth.role() = 'service_role');
    END IF;
  END IF;
END $$;

COMMIT;
