-- HyperX Course Enrollments — tracks which individual courses a user has enrolled in.
-- This table was referenced by Courses.jsx but never had a migration file,
-- which caused "My Courses" to show all courses instead of just enrolled ones.

create table if not exists hx_enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   uuid not null,
  enrolled_at timestamptz not null default now(),
  progress    integer not null default 0 check (progress >= 0 and progress <= 100),
  completed_at timestamptz,
  unique(user_id, course_id)
);

create index if not exists idx_hx_enroll_user   on hx_enrollments(user_id);
create index if not exists idx_hx_enroll_course on hx_enrollments(course_id);

alter table hx_enrollments enable row level security;

create policy "Users see own enrollments"   on hx_enrollments for select using (auth.uid() = user_id);
create policy "Users enroll themselves"      on hx_enrollments for insert with check (auth.uid() = user_id);
create policy "Users update own enrollment" on hx_enrollments for update using (auth.uid() = user_id);
