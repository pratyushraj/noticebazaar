-- Create shoot_workspaces table
CREATE TABLE IF NOT EXISTS public.shoot_workspaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'treatment'::text NOT NULL,
    song_option text DEFAULT ''::text NOT NULL,
    song_option_2 text DEFAULT ''::text NOT NULL,
    script text DEFAULT ''::text,
    hook_option text DEFAULT ''::text NOT NULL,
    hook_option_2 text DEFAULT ''::text NOT NULL,
    caption_option text DEFAULT ''::text NOT NULL,
    creator_script text DEFAULT ''::text NOT NULL,
    creator_song text DEFAULT ''::text NOT NULL,
    creator_song_2 text DEFAULT ''::text NOT NULL,
    creator_hook text DEFAULT ''::text NOT NULL,
    creator_hook_2 text DEFAULT ''::text NOT NULL,
    creator_caption text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'uploading'::text NOT NULL,
    brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
    creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create shoot_videos table
CREATE TABLE IF NOT EXISTS public.shoot_videos (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    workspace_id uuid NOT NULL REFERENCES public.shoot_workspaces(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_name text NOT NULL,
    category text DEFAULT 'treatment'::text NOT NULL,
    is_selected boolean DEFAULT false NOT NULL,
    uploaded_by text DEFAULT 'influencer'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.shoot_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoot_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public access based on workspace ID knowledge (since it's a shared link)
CREATE POLICY "Public read access for shoot workspaces"
    ON public.shoot_workspaces FOR SELECT
    USING (true);

CREATE POLICY "Public update access for shoot workspaces"
    ON public.shoot_workspaces FOR UPDATE
    USING (true);

CREATE POLICY "Public insert access for shoot workspaces"
    ON public.shoot_workspaces FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public read access for shoot videos"
    ON public.shoot_videos FOR SELECT
    USING (true);

CREATE POLICY "Public insert access for shoot videos"
    ON public.shoot_videos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public update access for shoot videos"
    ON public.shoot_videos FOR UPDATE
    USING (true);

CREATE POLICY "Public delete access for shoot videos"
    ON public.shoot_videos FOR DELETE
    USING (true);
