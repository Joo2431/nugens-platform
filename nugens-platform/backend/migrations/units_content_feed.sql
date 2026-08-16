-- ============================================================
-- Units Content Feed — schema migration
-- Run this in the Supabase SQL editor.
--
-- ContentFeed.jsx (the /feed route) queries units_feed_posts and
-- units_feed_likes, and calls increment_feed_likes/decrement_feed_likes
-- RPC functions — none of which had a migration anywhere in this
-- codebase. The code even self-documents the gap: its error handler
-- says "Run fix_units_columns.sql in Supabase first" — a file that
-- was referenced but never actually created. Without this, every
-- post submission and like on the Content Feed fails.
-- ============================================================

create table if not exists units_feed_posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  user_name       text not null,
  user_plan       text default 'free',
  post_type       text not null,
  content         text not null,
  media_url       text,
  likes_count     integer not null default 0,
  comments_count  integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_units_feed_posts_created on units_feed_posts(created_at desc);
create index if not exists idx_units_feed_posts_type    on units_feed_posts(post_type);

create table if not exists units_feed_likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references units_feed_posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

-- RPC functions used by ContentFeed.jsx's like/unlike toggle
create or replace function increment_feed_likes(p_post_id uuid)
returns void as $$
  update units_feed_posts set likes_count = likes_count + 1 where id = p_post_id;
$$ language sql;

create or replace function decrement_feed_likes(p_post_id uuid)
returns void as $$
  update units_feed_posts set likes_count = greatest(0, likes_count - 1) where id = p_post_id;
$$ language sql;

alter table units_feed_posts enable row level security;
alter table units_feed_likes enable row level security;

-- Feed posts: anyone signed in can read; only the author can insert/delete their own
drop policy if exists "units_feed_posts_select" on units_feed_posts;
create policy "units_feed_posts_select" on units_feed_posts
  for select using (auth.role() = 'authenticated');

drop policy if exists "units_feed_posts_insert" on units_feed_posts;
create policy "units_feed_posts_insert" on units_feed_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "units_feed_posts_delete" on units_feed_posts;
create policy "units_feed_posts_delete" on units_feed_posts
  for delete using (auth.uid() = user_id);

-- Likes: anyone signed in can read; users manage only their own likes
drop policy if exists "units_feed_likes_select" on units_feed_likes;
create policy "units_feed_likes_select" on units_feed_likes
  for select using (auth.role() = 'authenticated');

drop policy if exists "units_feed_likes_insert" on units_feed_likes;
create policy "units_feed_likes_insert" on units_feed_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "units_feed_likes_delete" on units_feed_likes;
create policy "units_feed_likes_delete" on units_feed_likes
  for delete using (auth.uid() = user_id);
