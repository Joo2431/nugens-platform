-- ============================================================
-- DigiHub Talent Hub — shortlist & introduction requests
-- Run this in the Supabase SQL editor.
--
-- NOTE: the talent profiles shown in Talent Hub are still a
-- curated showcase (not live candidate profiles pulled from real
-- individual accounts) — building a full opt-in talent marketplace
-- (where individuals mark themselves "open to work" with real
-- skills/portfolio data) is a bigger feature for later. This
-- migration fixes the part that was a straightforward bug: the
-- "Save to shortlist" and "Request introduction" buttons did
-- nothing at all when clicked. They now persist for real.
-- ============================================================

create table if not exists digihub_talent_shortlist (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references profiles(id) on delete cascade,
  talent_id   text not null,
  talent_name text not null,
  created_at  timestamptz not null default now(),
  unique (business_id, talent_id)
);

create table if not exists digihub_talent_requests (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references profiles(id) on delete cascade,
  talent_id   text not null,
  talent_name text not null,
  message     text default '',
  created_at  timestamptz not null default now()
);

alter table digihub_talent_shortlist enable row level security;
alter table digihub_talent_requests  enable row level security;

drop policy if exists "dh_talent_shortlist_select" on digihub_talent_shortlist;
create policy "dh_talent_shortlist_select" on digihub_talent_shortlist
  for select using (auth.uid() = business_id);

drop policy if exists "dh_talent_shortlist_insert" on digihub_talent_shortlist;
create policy "dh_talent_shortlist_insert" on digihub_talent_shortlist
  for insert with check (auth.uid() = business_id);

drop policy if exists "dh_talent_shortlist_delete" on digihub_talent_shortlist;
create policy "dh_talent_shortlist_delete" on digihub_talent_shortlist
  for delete using (auth.uid() = business_id);

drop policy if exists "dh_talent_requests_select" on digihub_talent_requests;
create policy "dh_talent_requests_select" on digihub_talent_requests
  for select using (auth.uid() = business_id);

drop policy if exists "dh_talent_requests_insert" on digihub_talent_requests;
create policy "dh_talent_requests_insert" on digihub_talent_requests
  for insert with check (auth.uid() = business_id);
