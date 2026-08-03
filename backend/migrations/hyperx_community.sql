-- ============================================================
-- HyperX Community — schema migration
-- Run this in the Supabase SQL editor. The Community page
-- previously had zero backend wiring (hardcoded mock posts,
-- "+ Post a question" button did nothing).
-- ============================================================

create table if not exists hyperx_community_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  tag         text not null default 'Career Advice',
  title       text not null,
  body        text default '',
  likes       integer not null default 0,
  pinned      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists hyperx_community_likes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references hyperx_community_posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists hyperx_community_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references hyperx_community_posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_hx_posts_created   on hyperx_community_posts(created_at desc);
create index if not exists idx_hx_replies_post     on hyperx_community_replies(post_id);

alter table hyperx_community_posts   enable row level security;
alter table hyperx_community_likes   enable row level security;
alter table hyperx_community_replies enable row level security;

drop policy if exists "hx_posts_select" on hyperx_community_posts;
create policy "hx_posts_select" on hyperx_community_posts for select using (auth.role() = 'authenticated');
drop policy if exists "hx_posts_insert" on hyperx_community_posts;
create policy "hx_posts_insert" on hyperx_community_posts for insert with check (auth.uid() = user_id);
drop policy if exists "hx_posts_delete" on hyperx_community_posts;
create policy "hx_posts_delete" on hyperx_community_posts for delete using (auth.uid() = user_id);

drop policy if exists "hx_likes_select" on hyperx_community_likes;
create policy "hx_likes_select" on hyperx_community_likes for select using (auth.role() = 'authenticated');
drop policy if exists "hx_likes_insert" on hyperx_community_likes;
create policy "hx_likes_insert" on hyperx_community_likes for insert with check (auth.uid() = user_id);
drop policy if exists "hx_likes_delete" on hyperx_community_likes;
create policy "hx_likes_delete" on hyperx_community_likes for delete using (auth.uid() = user_id);

drop policy if exists "hx_replies_select" on hyperx_community_replies;
create policy "hx_replies_select" on hyperx_community_replies for select using (auth.role() = 'authenticated');
drop policy if exists "hx_replies_insert" on hyperx_community_replies;
create policy "hx_replies_insert" on hyperx_community_replies for insert with check (auth.uid() = user_id);
