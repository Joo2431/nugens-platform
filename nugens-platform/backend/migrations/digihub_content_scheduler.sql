-- ============================================================
-- DigiHub Content Scheduler — schema migration
-- Run this in the Supabase SQL editor. The scheduler previously
-- had zero persistence (in-memory mock data, lost on refresh).
--
-- NOTE: this table stores and tracks scheduled posts. It does
-- NOT publish to Instagram/LinkedIn/Facebook/etc. Actually
-- posting to those platforms requires registering a developer
-- app with each platform (Meta for Business, LinkedIn, X/Twitter,
-- etc.), going through their app review, and storing per-business
-- OAuth tokens. That is an infrastructure/business step, not
-- something that can be wired up from inside the codebase alone.
-- This schema includes the fields needed to plug that in later
-- (platform_post_id, publish_error) without another migration.
-- ============================================================

create table if not exists digihub_scheduled_posts (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references profiles(id) on delete cascade,
  platform        text not null,                 -- Instagram | LinkedIn | Twitter/X | Facebook | YouTube | Pinterest | WhatsApp Business
  caption         text not null default '',
  hashtags        text default '',
  image_url       text,
  scheduled_for   timestamptz not null,
  status          text not null default 'scheduled', -- draft | scheduled | published | failed
  platform_post_id text,                          -- filled in once real publishing is wired up
  publish_error   text,                           -- filled in if a future publish attempt fails
  created_at      timestamptz not null default now()
);

create index if not exists idx_digihub_sched_business on digihub_scheduled_posts(business_id, scheduled_for desc);

alter table digihub_scheduled_posts enable row level security;

drop policy if exists "digihub_sched_select" on digihub_scheduled_posts;
create policy "digihub_sched_select" on digihub_scheduled_posts
  for select using (auth.uid() = business_id);

drop policy if exists "digihub_sched_insert" on digihub_scheduled_posts;
create policy "digihub_sched_insert" on digihub_scheduled_posts
  for insert with check (auth.uid() = business_id);

drop policy if exists "digihub_sched_update" on digihub_scheduled_posts;
create policy "digihub_sched_update" on digihub_scheduled_posts
  for update using (auth.uid() = business_id);

drop policy if exists "digihub_sched_delete" on digihub_scheduled_posts;
create policy "digihub_sched_delete" on digihub_scheduled_posts
  for delete using (auth.uid() = business_id);
