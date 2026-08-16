-- DigiHub Brand Voice — was previously stored almost entirely in the
-- browser's localStorage (only `industry` reached the profiles table),
-- which meant no backend tool could ever read it. This table makes Brand
-- Voice a real, server-readable record so Image Generator, Bulk Generator,
-- Content Planner, and Hashtag suggestions can all use it automatically.

create table if not exists dh_brand_voice (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  brand_name      text not null default '',
  industry        text default '',
  usp             text default '',
  tone            text default '',
  audience        text default '',
  platforms       text[] default '{}',
  avoid_words     text default '',
  brand_keywords  text default '',
  emoji_style     text default '',
  post_freq       text default '',
  updated_at      timestamptz not null default now()
);

alter table dh_brand_voice enable row level security;

drop policy if exists "dh_brand_voice_select" on dh_brand_voice;
create policy "dh_brand_voice_select" on dh_brand_voice for select using (auth.uid() = user_id);
drop policy if exists "dh_brand_voice_upsert" on dh_brand_voice;
create policy "dh_brand_voice_upsert" on dh_brand_voice for insert with check (auth.uid() = user_id);
drop policy if exists "dh_brand_voice_update" on dh_brand_voice;
create policy "dh_brand_voice_update" on dh_brand_voice for update using (auth.uid() = user_id);
