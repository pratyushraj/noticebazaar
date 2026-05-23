-- 1. Table for Creator's Original Content
CREATE TABLE public.original_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform text NOT NULL,
    original_url text NOT NULL,
    watermark_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.original_content ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can see and manage their own content
CREATE POLICY "Creators can view and manage their own original content"
ON public.original_content
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- 2. Table for Copyright Scans (Logs when a scan is run)
CREATE TABLE public.copyright_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid REFERENCES public.original_content(id) ON DELETE CASCADE NOT NULL,
    scan_status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Only the owner of the original content can see the scans
CREATE POLICY "Creators can view scans for their content"
ON public.copyright_scans
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.original_content
        WHERE original_content.id = content_id AND original_content.user_id = auth.uid()
    )
);


-- 3. Table for Copyright Matches (Infringing content found)
CREATE TABLE public.copyright_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id uuid REFERENCES public.copyright_scans(id) ON DELETE CASCADE NOT NULL,
    matched_url text NOT NULL,
    platform text NOT NULL,
    similarity_score numeric NOT NULL,
    screenshot_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_matches ENABLE ROW LEVEL SECURITY;

-- Policy: Only the owner of the original content can see the matches
CREATE POLICY "Creators can view matches for their content"
ON public.copyright_matches
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.copyright_scans
        JOIN public.original_content ON copyright_scans.content_id = original_content.id
        WHERE copyright_scans.id = scan_id AND original_content.user_id = auth.uid()
    )
);


-- 4. Table for Copyright Actions (Takedown, Email, Ignore)
CREATE TABLE public.copyright_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES public.copyright_matches(id) ON DELETE CASCADE NOT NULL,
    action_type text NOT NULL, -- 'takedown', 'email', 'ignored'
    status text NOT NULL DEFAULT 'sent', -- 'sent', 'ignored', 'resolved'
    document_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only the owner of the original content can see the actions
CREATE POLICY "Creators can view actions for their matches"
ON public.copyright_actions
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.copyright_matches
        JOIN public.copyright_scans ON copyright_matches.scan_id = copyright_scans.id
        JOIN public.original_content ON copyright_scans.content_id = original_content.id
        WHERE copyright_matches.id = match_id AND original_content.user_id = auth.uid()
    )
);