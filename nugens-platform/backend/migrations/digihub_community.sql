-- ============================================================
-- DigiHub Community — schema migration
-- Run this in the Supabase SQL editor. Mirrors the same pattern
-- already working for HyperX Community. Previously DigiHub's
-- Community page used entirely mock/hardcoded posts with no
-- persistence at all.
-- ============================================================

create table if not exists digihub_community_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  post_type   text not null default 'General Update',
  content     text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists digihub_community_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references digihub_community_posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_dh_posts_created on digihub_community_posts(created_at desc);

alter table digihub_community_posts enable row level security;
alter table digihub_community_likes enable row level security;

drop policy if exists "dh_posts_select" on digihub_community_posts;
create policy "dh_posts_select" on digihub_community_posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "dh_posts_insert" on digihub_community_posts;
create policy "dh_posts_insert" on digihub_community_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "dh_likes_select" on digihub_community_likes;
create policy "dh_likes_select" on digihub_community_likes
  for select using (auth.role() = 'authenticated');

drop policy if exists "dh_likes_insert" on digihub_community_likes;
create policy "dh_likes_insert" on digihub_community_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "dh_likes_delete" on digihub_community_likes;
create policy "dh_likes_delete" on digihub_community_likes
  for delete using (auth.uid() = user_id);
