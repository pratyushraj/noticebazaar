create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  creator_id uuid null references public.profiles(id) on delete set null,
  brand_id uuid null references public.profiles(id) on delete set null,
  deal_id uuid null references public.brand_deals(id) on delete set null,
  request_id uuid null references public.collab_requests(id) on delete set null,
  event_name text not null,
  event_category text not null default 'general',
  metadata jsonb not null default '{}'::jsonb,
  page_url text null,
  user_agent text null,
  ip_address text null,
  referer text null,
  language text null,
  request_hash text null,
  is_anomaly boolean not null default false,
  anomaly_reason text null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_name_idx on public.analytics_events(event_name);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_creator_id_idx on public.analytics_events(creator_id);
create index if not exists analytics_events_deal_id_idx on public.analytics_events(deal_id);
create index if not exists analytics_events_request_id_idx on public.analytics_events(request_id);

create table if not exists public.daily_metrics (
  metric_date date primary key,
  offers_sent bigint not null default 0,
  deals_started bigint not null default 0,
  deals_completed bigint not null default 0,
  content_submitted bigint not null default 0,
  content_approved bigint not null default 0,
  payments_marked bigint not null default 0,
  payments_confirmed bigint not null default 0,
  invoices_generated bigint not null default 0,
  total_deal_value numeric(12,2) not null default 0,
  average_deal_value numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_funnel_metrics (
  creator_id uuid primary key references public.profiles(id) on delete cascade,
  signed_up_at timestamptz null,
  instagram_added_at timestamptz null,
  reel_price_set_at timestamptz null,
  collab_link_copied_at timestamptz null,
  collab_link_shared_at timestamptz null,
  first_offer_received_at timestamptz null,
  first_offer_opened_at timestamptz null,
  first_offer_accepted_at timestamptz null,
  first_deal_started_at timestamptz null,
  first_content_submitted_at timestamptz null,
  first_content_approved_at timestamptz null,
  first_payment_confirmed_at timestamptz null,
  first_deal_completed_at timestamptz null,
  offers_received_count integer not null default 0,
  offers_opened_count integer not null default 0,
  offers_accepted_count integer not null default 0,
  deals_started_count integer not null default 0,
  deals_completed_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.deal_metrics (
  metric_key text primary key,
  request_id uuid null references public.collab_requests(id) on delete set null,
  deal_id uuid null references public.brand_deals(id) on delete set null,
  creator_id uuid null references public.profiles(id) on delete set null,
  brand_id uuid null references public.profiles(id) on delete set null,
  offer_received_at timestamptz null,
  offer_opened_at timestamptz null,
  offer_accepted_at timestamptz null,
  deal_started_at timestamptz null,
  content_submitted_at timestamptz null,
  content_approved_at timestamptz null,
  payment_marked_at timestamptz null,
  payment_confirmed_at timestamptz null,
  invoice_generated_at timestamptz null,
  deal_completed_at timestamptz null,
  deal_value numeric(12,2) not null default 0,
  current_stage text null,
  updated_at timestamptz not null default now()
);

create index if not exists deal_metrics_request_id_idx on public.deal_metrics(request_id);
create index if not exists deal_metrics_deal_id_idx on public.deal_metrics(deal_id);
create index if not exists deal_metrics_creator_id_idx on public.deal_metrics(creator_id);

create or replace function public.rollup_marketplace_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_date date := timezone('Asia/Kolkata', new.created_at)::date;
  creator_metric_id uuid := coalesce(new.creator_id, nullif(new.metadata->>'creator_id', '')::uuid, new.user_id);
  request_metric_id uuid := nullif(new.metadata->>'request_id', '')::uuid;
  deal_metric_id uuid := coalesce(new.deal_id, nullif(new.metadata->>'deal_id', '')::uuid);
  metric_key_value text := coalesce(deal_metric_id::text, request_metric_id::text, nullif(new.metadata->>'metric_key', ''), new.id::text);
  metric_value numeric(12,2) := coalesce(nullif(new.metadata->>'deal_value', '')::numeric, nullif(new.metadata->>'amount', '')::numeric, 0);
begin
  insert into public.daily_metrics (metric_date)
  values (event_date)
  on conflict (metric_date) do nothing;

  update public.daily_metrics
  set
    offers_sent = offers_sent + case when new.event_name = 'offer_received' then 1 else 0 end,
    deals_started = deals_started + case when new.event_name = 'deal_started' then 1 else 0 end,
    deals_completed = deals_completed + case when new.event_name = 'deal_completed' then 1 else 0 end,
    content_submitted = content_submitted + case when new.event_name = 'content_submitted' then 1 else 0 end,
    content_approved = content_approved + case when new.event_name = 'content_approved' then 1 else 0 end,
    payments_marked = payments_marked + case when new.event_name = 'payment_marked' then 1 else 0 end,
    payments_confirmed = payments_confirmed + case when new.event_name = 'payment_confirmed' then 1 else 0 end,
    invoices_generated = invoices_generated + case when new.event_name = 'invoice_generated' then 1 else 0 end,
    total_deal_value = total_deal_value + case when new.event_name = 'deal_started' then metric_value else 0 end,
    average_deal_value = case
      when (deals_started + case when new.event_name = 'deal_started' then 1 else 0 end) > 0
      then round(
        (total_deal_value + case when new.event_name = 'deal_started' then metric_value else 0 end)
        / (deals_started + case when new.event_name = 'deal_started' then 1 else 0 end),
        2
      )
      else average_deal_value
    end,
    updated_at = now()
  where metric_date = event_date;

  if creator_metric_id is not null then
    insert into public.creator_funnel_metrics (creator_id)
    values (creator_metric_id)
    on conflict (creator_id) do nothing;

    update public.creator_funnel_metrics
    set
      signed_up_at = case when new.event_name = 'creator_signed_up' and signed_up_at is null then new.created_at else signed_up_at end,
      instagram_added_at = case when new.event_name = 'instagram_added' and instagram_added_at is null then new.created_at else instagram_added_at end,
      reel_price_set_at = case when new.event_name = 'reel_price_set' and reel_price_set_at is null then new.created_at else reel_price_set_at end,
      collab_link_copied_at = case when new.event_name = 'collab_link_copied' and collab_link_copied_at is null then new.created_at else collab_link_copied_at end,
      collab_link_shared_at = case when new.event_name = 'collab_link_shared' and collab_link_shared_at is null then new.created_at else collab_link_shared_at end,
      first_offer_received_at = case when new.event_name = 'offer_received' and first_offer_received_at is null then new.created_at else first_offer_received_at end,
      first_offer_opened_at = case when new.event_name = 'offer_opened' and first_offer_opened_at is null then new.created_at else first_offer_opened_at end,
      first_offer_accepted_at = case when new.event_name = 'offer_accepted' and first_offer_accepted_at is null then new.created_at else first_offer_accepted_at end,
      first_deal_started_at = case when new.event_name = 'deal_started' and first_deal_started_at is null then new.created_at else first_deal_started_at end,
      first_content_submitted_at = case when new.event_name = 'content_submitted' and first_content_submitted_at is null then new.created_at else first_content_submitted_at end,
      first_content_approved_at = case when new.event_name = 'content_approved' and first_content_approved_at is null then new.created_at else first_content_approved_at end,
      first_payment_confirmed_at = case when new.event_name = 'payment_confirmed' and first_payment_confirmed_at is null then new.created_at else first_payment_confirmed_at end,
      first_deal_completed_at = case when new.event_name = 'deal_completed' and first_deal_completed_at is null then new.created_at else first_deal_completed_at end,
      offers_received_count = offers_received_count + case when new.event_name = 'offer_received' then 1 else 0 end,
      offers_opened_count = offers_opened_count + case when new.event_name = 'offer_opened' then 1 else 0 end,
      offers_accepted_count = offers_accepted_count + case when new.event_name = 'offer_accepted' then 1 else 0 end,
      deals_started_count = deals_started_count + case when new.event_name = 'deal_started' then 1 else 0 end,
      deals_completed_count = deals_completed_count + case when new.event_name = 'deal_completed' then 1 else 0 end,
      updated_at = now()
    where creator_id = creator_metric_id;
  end if;

  if metric_key_value is not null then
    insert into public.deal_metrics (metric_key, request_id, deal_id, creator_id, brand_id, deal_value, current_stage)
    values (
      metric_key_value,
      request_metric_id,
      deal_metric_id,
      creator_metric_id,
      coalesce(new.brand_id, nullif(new.metadata->>'brand_id', '')::uuid),
      metric_value,
      new.event_name
    )
    on conflict (metric_key) do nothing;

    update public.deal_metrics
    set
      request_id = coalesce(public.deal_metrics.request_id, request_metric_id),
      deal_id = coalesce(public.deal_metrics.deal_id, deal_metric_id),
      creator_id = coalesce(public.deal_metrics.creator_id, creator_metric_id),
      brand_id = coalesce(public.deal_metrics.brand_id, new.brand_id, nullif(new.metadata->>'brand_id', '')::uuid),
      offer_received_at = case when new.event_name = 'offer_received' and offer_received_at is null then new.created_at else offer_received_at end,
      offer_opened_at = case when new.event_name = 'offer_opened' and offer_opened_at is null then new.created_at else offer_opened_at end,
      offer_accepted_at = case when new.event_name = 'offer_accepted' and offer_accepted_at is null then new.created_at else offer_accepted_at end,
      deal_started_at = case when new.event_name = 'deal_started' and deal_started_at is null then new.created_at else deal_started_at end,
      content_submitted_at = case when new.event_name = 'content_submitted' and content_submitted_at is null then new.created_at else content_submitted_at end,
      content_approved_at = case when new.event_name = 'content_approved' and content_approved_at is null then new.created_at else content_approved_at end,
      payment_marked_at = case when new.event_name = 'payment_marked' and payment_marked_at is null then new.created_at else payment_marked_at end,
      payment_confirmed_at = case when new.event_name = 'payment_confirmed' and payment_confirmed_at is null then new.created_at else payment_confirmed_at end,
      invoice_generated_at = case when new.event_name = 'invoice_generated' and invoice_generated_at is null then new.created_at else invoice_generated_at end,
      deal_completed_at = case when new.event_name = 'deal_completed' and deal_completed_at is null then new.created_at else deal_completed_at end,
      deal_value = case when metric_value > 0 then metric_value else public.deal_metrics.deal_value end,
      current_stage = new.event_name,
      updated_at = now()
    where metric_key = metric_key_value;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rollup_marketplace_analytics_event on public.analytics_events;
create trigger trg_rollup_marketplace_analytics_event
after insert on public.analytics_events
for each row execute function public.rollup_marketplace_analytics_event();
