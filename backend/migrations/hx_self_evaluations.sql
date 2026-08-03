-- HyperX Self-Evaluations — lets students rate their own proficiency across
-- skill areas (1-5 scale) so the Dashboard can show a simple self-assessment
-- and track how it changes as they complete courses.

create table if not exists hx_self_evaluations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  scores      jsonb not null default '{}'::jsonb,  -- { "Communication": 3, "Leadership": 2, ... }
  created_at  timestamptz not null default now()
);

create index if not exists idx_hx_selfeval_user on hx_self_evaluations(user_id, created_at desc);

alter table hx_self_evaluations enable row level security;

create policy "Users see own self-evaluations"   on hx_self_evaluations for select using (auth.uid() = user_id);
create policy "Users insert own self-evaluations" on hx_self_evaluations for insert with check (auth.uid() = user_id);
