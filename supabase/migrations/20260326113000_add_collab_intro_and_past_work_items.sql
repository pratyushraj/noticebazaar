alter table public.profiles
add column if not exists collab_intro_line text,
add column if not exists collab_past_work_items jsonb not null default '[]'::jsonb;
