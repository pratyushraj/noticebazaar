-- Prevent brand-collab double counting when creators seed a manual base value.
alter table public.profiles
  add column if not exists collab_brands_base_set_at timestamptz;

create index if not exists profiles_collab_brands_base_set_at_idx
  on public.profiles (collab_brands_base_set_at);
