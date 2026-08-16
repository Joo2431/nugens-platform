-- HyperX Categories — admin-managed course categories.
-- Replaces the hardcoded ALL_CATS array in AdminPanel.jsx so categories can
-- be added/removed without a redeploy, and so the Dashboard can group and
-- filter courses by category.

create table if not exists hx_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_hx_categories_sort on hx_categories(sort_order);

alter table hx_categories enable row level security;

-- Anyone signed in can read categories (needed for course browsing/filtering);
-- only the backend (service role, bypasses RLS) performs writes via the
-- admin-gated /api/hyperx/categories endpoints.
drop policy if exists "hx_categories_select" on hx_categories;
create policy "hx_categories_select" on hx_categories for select using (auth.role() = 'authenticated');

-- Seed with the categories that were previously hardcoded, so existing
-- courses keep working immediately after this migration runs.
insert into hx_categories (name, sort_order) values
  ('Communication', 0), ('Career Strategy', 1), ('Mindset', 2), ('Interview Prep', 3),
  ('Personal Brand', 4), ('Leadership', 5), ('Productivity', 6), ('English for Work', 7),
  ('Soft Skills', 8), ('Time Management', 9), ('Finance & Investing', 10),
  ('Health & Wellness', 11), ('Business Strategy', 12), ('Marketing & Growth', 13),
  ('Sales', 14), ('HR & People', 15), ('Operations', 16), ('Startup & Entrepreneurship', 17),
  ('Management', 18), ('Digital Transformation', 19), ('Legal Basics', 20), ('Customer Success', 21)
on conflict (name) do nothing;
