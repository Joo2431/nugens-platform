-- ============================================================
-- Units Event & Shoot Quote Requests — schema migration
-- Run this in the Supabase SQL editor.
--
-- This is separate from units_bookings (which is for the fixed-
-- price digital service packages in BookServices.jsx). Events and
-- live shoots are priced per-project based on duration, location,
-- and crew size, so this is a quote-REQUEST flow, not a payment
-- flow — it captures the request and notifies the team to follow
-- up with a custom quote.
-- ============================================================

create table if not exists units_event_requests (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete set null,
  event_type      text not null,         -- Wedding | Corporate Event | Brand Shoot | Product Launch | Other
  event_date      date,
  venue           text,
  guest_count     text,
  name            text not null,
  email           text not null,
  phone           text,
  notes           text,
  status          text not null default 'new',  -- new | quoted | confirmed | closed
  created_at      timestamptz not null default now()
);

create index if not exists idx_units_events_user on units_event_requests(user_id, created_at desc);

alter table units_event_requests enable row level security;

drop policy if exists "units_events_select" on units_event_requests;
create policy "units_events_select" on units_event_requests
  for select using (auth.uid() = user_id);

drop policy if exists "units_events_insert" on units_event_requests;
create policy "units_events_insert" on units_event_requests
  for insert with check (auth.uid() = user_id);
