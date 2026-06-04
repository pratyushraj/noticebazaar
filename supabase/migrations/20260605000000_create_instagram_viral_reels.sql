-- Create instagram_viral_reels table for caching scraped high-performing Instagram Reels
create table if not exists public.instagram_viral_reels (
  id text primary key,
  topic text not null,
  category text not null,
  hook text not null,
  views integer not null default 0,
  difficulty text not null default 'Easy',
  shoot_time text not null default '10 mins',
  format text not null default 'Talking Head',
  generated_appointments integer not null default 0,
  source text not null,
  engagement_score numeric(3,1) not null default 0.0,
  why_it_worked text[] not null default '{}',
  source_creator text not null,
  last_seen text not null,
  industry text not null default 'dental',
  video_url text not null,
  scraped_at timestamp with time zone not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.instagram_viral_reels enable row level security;

-- Create policy to allow read access for all authenticated users (or anyone)
create policy "Allow read access to all users"
  on public.instagram_viral_reels for select
  using (true);

-- Create policy to allow service_role to manage (insert/update/delete)
create policy "Allow service_role full access"
  on public.instagram_viral_reels for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
