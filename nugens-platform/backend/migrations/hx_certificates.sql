-- ============================================================
-- HyperX Certificates — schema migration
-- Run this in the Supabase SQL editor.
--
-- Certificates.jsx's issueCert() was a placeholder:
--   await new Promise(r => setTimeout(r, 1500)); // simulate
--   alert(`Certificate issued... In production, this would
--   generate a PDF.`)
-- Nothing was ever saved — "earn a certificate" (a core HyperX
-- value prop) didn't actually do anything. This table + the new
-- endpoints in server.js make issuance real and persistent, and
-- enforce the plan cert-limit server-side (the frontend limit
-- check is easy to bypass by calling the API directly).
-- ============================================================

create table if not exists hx_certificates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  course_id       uuid not null,
  course_title    text not null,
  course_category text,
  course_level    text,
  cert_number     text not null unique,
  issued_at       timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists idx_hx_certificates_user on hx_certificates(user_id, issued_at desc);

alter table hx_certificates enable row level security;

drop policy if exists "hx_certificates_select" on hx_certificates;
create policy "hx_certificates_select" on hx_certificates
  for select using (auth.uid() = user_id);

drop policy if exists "hx_certificates_insert" on hx_certificates;
create policy "hx_certificates_insert" on hx_certificates
  for insert with check (auth.uid() = user_id);
