-- ============================================================
-- Nugens Portal Support Requests — schema migration
-- Run this in the Supabase SQL editor.
--
-- Support.jsx writes directly to this table from the frontend
-- using the Supabase anon key (no backend endpoint involved).
-- Without this table existing, every submission silently falls
-- back to opening the visitor's email client instead — which
-- works, but means nothing is ever recorded, and it depends on
-- the visitor having a configured mail client (often broken on
-- mobile/work browsers).
-- ============================================================

create table if not exists support_requests (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  topic       text,
  message     text not null,
  status      text not null default 'open',  -- open | replied | closed
  created_at  timestamptz not null default now()
);

create index if not exists idx_support_requests_created on support_requests(created_at desc);

alter table support_requests enable row level security;

-- Public insert allowed — the Support page is reachable by visitors
-- who aren't signed in, and submits using the anon key directly.
drop policy if exists "support_requests_insert" on support_requests;
create policy "support_requests_insert" on support_requests
  for insert with check (true);

-- No public select/update/delete — only readable via the Supabase
-- dashboard or a future admin-only backend endpoint.
