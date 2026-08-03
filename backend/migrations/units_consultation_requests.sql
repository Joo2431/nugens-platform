-- ============================================================
-- Units — Idea Validation premium consultation requests
--
-- BUG FIX: the "Book Premium Consultation — ₹999" button previously
-- called `setBooked(true)` only — a local React state flip with no
-- backend call at all. It showed "✓ Consultation Booked! Our team
-- will reach out within 24 hours" while creating no record anywhere,
-- so no team could ever actually reach out. This table + the new
-- POST /api/units/consultation-requests endpoint make it real.
-- ============================================================

create table if not exists units_consultation_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  idea_summary  text not null,
  score         integer,
  contact_note  text default '',
  status        text not null default 'pending' check (status in ('pending','contacted','completed','cancelled')),
  created_at    timestamptz not null default now()
);

create index if not exists idx_units_consult_user on units_consultation_requests(user_id, created_at desc);
create index if not exists idx_units_consult_status on units_consultation_requests(status);

alter table units_consultation_requests enable row level security;

drop policy if exists "units_consult_select" on units_consultation_requests;
create policy "units_consult_select" on units_consultation_requests
  for select using (auth.uid() = user_id);

drop policy if exists "units_consult_insert" on units_consultation_requests;
create policy "units_consult_insert" on units_consultation_requests
  for insert with check (auth.uid() = user_id);
