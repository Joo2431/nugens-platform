-- ============================================================
-- DigiHub Job Board — schema migration
-- Run this in the Supabase SQL editor before the Job Board
-- endpoints in server.js will work. The Job Board previously
-- had zero backend wiring (frontend-only mock data).
-- ============================================================

-- 1. Job postings (created by business accounts)
create table if not exists digihub_jobs (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references profiles(id) on delete cascade,
  company         text not null,
  role            text not null,
  location        text not null default 'Remote',
  type            text not null default 'Full-time',   -- Full-time | Part-time | Contract
  salary          text,
  skills          text[] not null default '{}',
  description     text not null default '',
  urgent          boolean not null default false,
  status          text not null default 'open',         -- open | closed
  created_at      timestamptz not null default now()
);

create index if not exists idx_digihub_jobs_business on digihub_jobs(business_id);
create index if not exists idx_digihub_jobs_status   on digihub_jobs(status, created_at desc);

-- 2. Applications submitted by individuals
create table if not exists digihub_job_applications (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references digihub_jobs(id) on delete cascade,
  applicant_id    uuid not null references profiles(id) on delete cascade,
  cover_letter    text default '',
  status          text not null default 'submitted',     -- submitted | reviewed | rejected | hired
  created_at      timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists idx_digihub_apps_job       on digihub_job_applications(job_id);
create index if not exists idx_digihub_apps_applicant on digihub_job_applications(applicant_id);

-- 3. Saved / bookmarked jobs
create table if not exists digihub_saved_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  job_id          uuid not null references digihub_jobs(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (user_id, job_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table digihub_jobs             enable row level security;
alter table digihub_job_applications enable row level security;
alter table digihub_saved_jobs       enable row level security;

-- Anyone signed in can read open job postings
drop policy if exists "digihub_jobs_select" on digihub_jobs;
create policy "digihub_jobs_select" on digihub_jobs
  for select using (auth.role() = 'authenticated');

-- Only the owning business can insert/update/delete their own postings
-- (the backend also re-checks profiles.user_type = 'business' before insert)
drop policy if exists "digihub_jobs_insert" on digihub_jobs;
create policy "digihub_jobs_insert" on digihub_jobs
  for insert with check (auth.uid() = business_id);

drop policy if exists "digihub_jobs_update" on digihub_jobs;
create policy "digihub_jobs_update" on digihub_jobs
  for update using (auth.uid() = business_id);

drop policy if exists "digihub_jobs_delete" on digihub_jobs;
create policy "digihub_jobs_delete" on digihub_jobs
  for delete using (auth.uid() = business_id);

-- Applications: applicant can see/insert their own; business owner can see
-- applications to their own postings
drop policy if exists "digihub_apps_select" on digihub_job_applications;
create policy "digihub_apps_select" on digihub_job_applications
  for select using (
    auth.uid() = applicant_id
    or auth.uid() in (select business_id from digihub_jobs where id = job_id)
  );

drop policy if exists "digihub_apps_insert" on digihub_job_applications;
create policy "digihub_apps_insert" on digihub_job_applications
  for insert with check (auth.uid() = applicant_id);

drop policy if exists "digihub_apps_update" on digihub_job_applications;
create policy "digihub_apps_update" on digihub_job_applications
  for update using (
    auth.uid() in (select business_id from digihub_jobs where id = job_id)
  );

-- Saved jobs: fully private to the saving user
drop policy if exists "digihub_saved_select" on digihub_saved_jobs;
create policy "digihub_saved_select" on digihub_saved_jobs
  for select using (auth.uid() = user_id);

drop policy if exists "digihub_saved_insert" on digihub_saved_jobs;
create policy "digihub_saved_insert" on digihub_saved_jobs
  for insert with check (auth.uid() = user_id);

drop policy if exists "digihub_saved_delete" on digihub_saved_jobs;
create policy "digihub_saved_delete" on digihub_saved_jobs
  for delete using (auth.uid() = user_id);
