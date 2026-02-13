create extension if not exists "pgcrypto";

create table if not exists public.ai_pitch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('pitch', 'notice')),
  tone text,
  input text not null,
  output text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_pitch_history_user_id_idx on public.ai_pitch_history (user_id);
create index if not exists ai_pitch_history_created_at_idx on public.ai_pitch_history (created_at desc);

alter table public.ai_pitch_history enable row level security;

create policy "ai_pitch_history_select_own"
  on public.ai_pitch_history
  for select
  using (auth.uid() = user_id);

create policy "ai_pitch_history_insert_own"
  on public.ai_pitch_history
  for insert
  with check (auth.uid() = user_id);
