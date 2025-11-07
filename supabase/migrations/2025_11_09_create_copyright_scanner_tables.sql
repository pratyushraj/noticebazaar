-- Create table for original content registration
CREATE TABLE public.original_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    platform text NOT NULL,
    original_url text NOT NULL,
    watermark_text text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.original_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and insert their own original content"
ON public.original_content
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create table for scan jobs
CREATE TABLE public.copyright_scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid REFERENCES public.original_content(id) ON DELETE CASCADE NOT NULL,
    scan_status text NOT NULL DEFAULT 'pending', -- "pending", "processing", "completed"
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and insert their own scans"
ON public.copyright_scans
FOR ALL
USING (auth.uid() IN (SELECT user_id FROM public.original_content WHERE id = content_id))
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.original_content WHERE id = content_id));

-- Create table for matches found
CREATE TABLE public.copyright_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id uuid REFERENCES public.copyright_scans(id) ON DELETE CASCADE NOT NULL,
    matched_url text NOT NULL,
    platform text NOT NULL,
    similarity_score int NOT NULL,
    screenshot_url text,
    detected_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view matches related to their content"
ON public.copyright_matches
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.copyright_scans AS cs
        JOIN public.original_content AS oc ON cs.content_id = oc.id
        WHERE cs.id = scan_id AND oc.user_id = auth.uid()
    )
);

-- Create table for actions taken on matches
CREATE TABLE public.copyright_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES public.copyright_matches(id) ON DELETE CASCADE NOT NULL,
    action_type text NOT NULL, -- "takedown", "email", "ignored"
    status text NOT NULL DEFAULT 'sent', -- "sent", "pending", "failed"
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.copyright_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view and insert actions related to their matches"
ON public.copyright_actions
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.copyright_matches AS cm
        JOIN public.copyright_scans AS cs ON cm.scan_id = cs.id
        JOIN public.original_content AS oc ON cs.content_id = oc.id
        WHERE cm.id = match_id AND oc.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.copyright_matches AS cm
        JOIN public.copyright_scans AS cs ON cm.scan_id = cs.id
        JOIN public.original_content AS oc ON cs.content_id = oc.id
        WHERE cm.id = match_id AND oc.user_id = auth.uid()
    )
);