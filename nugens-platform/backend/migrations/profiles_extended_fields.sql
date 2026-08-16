-- ============================================================
-- Gen-E AI — extended profile columns
-- Run this in the Supabase SQL editor.
--
-- MyCareerProfile.jsx saved target_role, skills, experience, and
-- location to localStorage instead of the profiles table (the
-- code comment literally says "not in DB schema yet"). This meant
-- that data never synced across devices/browsers and vanished if
-- the user cleared their browser data. This adds the missing
-- columns so the form can save everything to the database like
-- the rest of the profile fields already do.
-- ============================================================

alter table profiles add column if not exists target_role text;
alter table profiles add column if not exists skills       text;
alter table profiles add column if not exists experience   text;
alter table profiles add column if not exists location     text;
