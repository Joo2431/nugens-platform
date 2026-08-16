-- ============================================================
-- Nugens Portal Contact Form — schema migration
-- Run this in the Supabase SQL editor.
--
-- CRITICAL BUG THIS FIXES: the main Contact page (nugens.in.net
-- /contact) — the platform's primary lead-capture form, including
-- the "Talk to us" and "Book a discovery call" CTAs across the
-- whole site — had a fake submit handler:
--   await new Promise(r => setTimeout(r, 1400));
-- It showed a "success" message but never sent the message
-- anywhere. Every visitor inquiry, partnership request, and
-- discovery-call booking was silently lost.
-- ============================================================

create table if not exists contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  reason      text,
  message     text not null,
  status      text not null default 'new',  -- new | replied | closed
  created_at  timestamptz not null default now()
);

create index if not exists idx_contact_submissions_created on contact_submissions(created_at desc);

-- No public RLS policies needed — this table is only ever written
-- to and read from the backend using the service role key (which
-- bypasses RLS). Enabling RLS with no policies still blocks any
-- accidental direct client access via the anon key.
alter table contact_submissions enable row level security;
