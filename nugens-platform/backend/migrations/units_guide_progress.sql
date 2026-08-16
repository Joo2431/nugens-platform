-- ============================================================
-- Units Entrepreneur Guide Progress — schema migration
-- Run this in the Supabase SQL editor.
--
-- EntrepreneurGuide.jsx tracked chapter/section completion in
-- `useState([])` only — pure in-memory React state. The progress
-- bar looked real, but every visit reset to 0% since nothing was
-- ever saved. This adds one row per user storing their completed
-- section keys (e.g. "1-0", "1-1", "3-2").
-- ============================================================

create table if not exists units_guide_progress (
  user_id     uuid primary key references profiles(id) on delete cascade,
  completed   text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table units_guide_progress enable row level security;

drop policy if exists "units_guide_progress_select" on units_guide_progress;
create policy "units_guide_progress_select" on units_guide_progress
  for select using (auth.uid() = user_id);

drop policy if exists "units_guide_progress_upsert" on units_guide_progress;
create policy "units_guide_progress_upsert" on units_guide_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "units_guide_progress_update" on units_guide_progress;
create policy "units_guide_progress_update" on units_guide_progress
  for update using (auth.uid() = user_id);
