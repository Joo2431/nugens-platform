-- DigiHub feature usage tracking — makes the "Prompt Space (10/month)"
-- style quotas on the pricing page real instead of just marketing copy.
-- Previously nothing tracked or enforced these limits at all; a free-tier
-- user could generate unlimited prompts today despite the pricing page
-- promising a cap.

create table if not exists dh_feature_usage (
  user_id    uuid not null references profiles(id) on delete cascade,
  feature    text not null,          -- 'prompt_space' (extend to others later)
  period     text not null,         -- 'YYYY-MM', resets naturally each month
  count      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature, period)
);

alter table dh_feature_usage enable row level security;

drop policy if exists "dh_usage_select" on dh_feature_usage;
create policy "dh_usage_select" on dh_feature_usage for select using (auth.uid() = user_id);
-- Inserts/updates happen only via the backend's service-role key (bypasses RLS),
-- so no insert/update policy is needed for the client.
