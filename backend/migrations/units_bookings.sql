-- ============================================================
-- Units Service Bookings — schema migration
-- Run this in the Supabase SQL editor.
--
-- CRITICAL BUG THIS FIXES: BookServices.jsx (the live /book route)
-- was sending a payment plan key like "units_video-editing_Full
-- Production" to /api/subscription/create-order, which only
-- recognises fixed keys like "units_pro_monthly". Every booking
-- payment was failing with "Unknown plan" — the core Units
-- monetisation flow was completely broken.
--
-- Separately, even if payment had gone through, the actual
-- booking details (service, package, contact info, project notes)
-- were only ever held in React state and never sent to the
-- backend — the business would get paid with zero record of what
-- was booked. This table + the new endpoints in server.js fix both.
-- ============================================================

create table if not exists units_bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete set null,
  service_id      text not null,
  service_title   text not null,
  package_name    text not null,
  amount          integer not null,        -- paise, server-validated
  name            text not null,
  email           text not null,
  phone           text,
  company         text,
  note            text,
  razorpay_payment_id text,
  status          text not null default 'paid',  -- paid | in_progress | delivered | refunded
  reschedule_note text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_units_bookings_user on units_bookings(user_id, created_at desc);

alter table units_bookings enable row level security;

drop policy if exists "units_bookings_select" on units_bookings;
create policy "units_bookings_select" on units_bookings
  for select using (auth.uid() = user_id);

drop policy if exists "units_bookings_insert" on units_bookings;
create policy "units_bookings_insert" on units_bookings
  for insert with check (auth.uid() = user_id);
