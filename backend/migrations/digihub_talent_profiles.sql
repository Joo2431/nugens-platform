-- ============================================================
-- DigiHub Talent Hub — REAL opt-in candidate directory
--
-- Follow-up to digihub_talent_hub.sql, which fixed shortlist/request
-- persistence but explicitly left the underlying problem documented:
-- the profiles shown were a hardcoded array of 8 fictional people
-- (fake names, fake bios, fake "match scores") presented as if they
-- were real candidates. This migration adds the real, opt-in table —
-- only people who explicitly list themselves appear here.
-- ============================================================

create table if not exists digihub_talent_profiles (
  user_id       uuid primary key references profiles(id) on delete cascade,
  full_name     text not null,
  skill         text not null,
  experience    text not null default 'Fresher',
  location      text default '',
  bio           text default '',
  tags          text[] default '{}',
  status        text not null default 'Available' check (status in ('Available','Interview','Placed')),
  is_listed     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_dh_talent_profiles_listed on digihub_talent_profiles(is_listed, skill);

alter table digihub_talent_profiles enable row level security;

-- Any signed-in user can browse listed profiles — that's the point of a directory.
drop policy if exists "dh_talent_profiles_select" on digihub_talent_profiles;
create policy "dh_talent_profiles_select" on digihub_talent_profiles
  for select using (auth.role() = 'authenticated');

-- A user can only create, edit, or unlist their own profile.
drop policy if exists "dh_talent_profiles_insert" on digihub_talent_profiles;
create policy "dh_talent_profiles_insert" on digihub_talent_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "dh_talent_profiles_update" on digihub_talent_profiles;
create policy "dh_talent_profiles_update" on digihub_talent_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "dh_talent_profiles_delete" on digihub_talent_profiles;
create policy "dh_talent_profiles_delete" on digihub_talent_profiles
  for delete using (auth.uid() = user_id);
