-- Saved Artifacts — general-purpose vault for resumes, roadmaps, interview transcripts, etc.
-- Replaces the resume-only vault with multi-type folder storage.
-- Referenced by: VaultPage.jsx, CareerRoadmap.jsx, ResumeBuilder.jsx, InterviewRoom.jsx

create table if not exists saved_artifacts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null default 'resume' check (type in ('resume','roadmap','interview','other')),
  title         text not null default 'Untitled',
  content_md    text,
  pdf_path      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_artifacts_user   on saved_artifacts(user_id);
create index if not exists idx_artifacts_type   on saved_artifacts(user_id, type);

alter table saved_artifacts enable row level security;

-- RLS: users can only see/edit their own artifacts
create policy "Users see own artifacts"   on saved_artifacts for select using (auth.uid() = user_id);
create policy "Users insert own artifacts" on saved_artifacts for insert with check (auth.uid() = user_id);
create policy "Users delete own artifacts" on saved_artifacts for delete using (auth.uid() = user_id);
create policy "Users update own artifacts" on saved_artifacts for update using (auth.uid() = user_id);
