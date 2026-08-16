-- ============================================================
-- HyperX Learning Path enrollments
-- Run this in the Supabase SQL editor. Previously "Enroll in
-- path" had no onClick handler at all — clicking it did nothing,
-- and the "enrolled"/"progress" shown were hardcoded per path
-- regardless of which user was looking at the page.
-- ============================================================

create table if not exists hyperx_path_enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  path_id     text not null,
  progress    integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, path_id)
);

alter table hyperx_path_enrollments enable row level security;

drop policy if exists "hx_path_enroll_select" on hyperx_path_enrollments;
create policy "hx_path_enroll_select" on hyperx_path_enrollments for select using (auth.uid() = user_id);
drop policy if exists "hx_path_enroll_insert" on hyperx_path_enrollments;
create policy "hx_path_enroll_insert" on hyperx_path_enrollments for insert with check (auth.uid() = user_id);
drop policy if exists "hx_path_enroll_update" on hyperx_path_enrollments;
create policy "hx_path_enroll_update" on hyperx_path_enrollments for update using (auth.uid() = user_id);
