-- ============================================================
-- HyperX Updated Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Add new columns to existing hx_courses table
ALTER TABLE hx_courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'individual'; -- 'individual' | 'business'
ALTER TABLE hx_courses ADD COLUMN IF NOT EXISTS price       INTEGER DEFAULT 0;
ALTER TABLE hx_courses ADD COLUMN IF NOT EXISTS offer_percent INTEGER DEFAULT 0;
ALTER TABLE hx_courses ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;

-- Add course_id to progress table for easier querying
ALTER TABLE hx_progress ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES hx_courses(id) ON DELETE CASCADE;

-- Certificates table
CREATE TABLE IF NOT EXISTS hx_certificates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  issued_at   TIMESTAMPTZ DEFAULT NOW(),
  cert_url    TEXT,
  UNIQUE(user_id, course_id)
);

ALTER TABLE hx_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own certs" ON hx_certificates FOR ALL USING (auth.uid() = user_id);

-- Create base tables if they don't exist yet (for fresh installs)
CREATE TABLE IF NOT EXISTS hx_courses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL,
  course_type     TEXT DEFAULT 'individual',
  level           TEXT DEFAULT 'Beginner',
  thumbnail_url   TEXT,
  is_free         BOOLEAN DEFAULT false,
  price           INTEGER DEFAULT 0,
  offer_percent   INTEGER DEFAULT 0,
  is_published    BOOLEAN DEFAULT false,
  is_exclusive    BOOLEAN DEFAULT false,
  total_lessons   INTEGER DEFAULT 0,
  duration_mins   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hx_lessons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id     UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  video_url     TEXT,
  duration_mins INTEGER DEFAULT 0,
  sort_order    INTEGER DEFAULT 0,
  is_free       BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS hx_enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS hx_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id    UUID REFERENCES hx_lessons(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- RLS
ALTER TABLE hx_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_lessons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_progress    ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies safely
DROP POLICY IF EXISTS "Public read courses" ON hx_courses;
DROP POLICY IF EXISTS "Admin courses"       ON hx_courses;
DROP POLICY IF EXISTS "Public read lessons" ON hx_lessons;
DROP POLICY IF EXISTS "Own enrollments"     ON hx_enrollments;
DROP POLICY IF EXISTS "Own progress"        ON hx_progress;

CREATE POLICY "Public read courses" ON hx_courses  FOR SELECT USING (is_published = true);
CREATE POLICY "Admin courses"       ON hx_courses  FOR ALL   USING ((SELECT plan FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Public read lessons" ON hx_lessons  FOR SELECT USING (true);
CREATE POLICY "Admin lessons"       ON hx_lessons  FOR ALL   USING ((SELECT plan FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Own enrollments"     ON hx_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own progress"        ON hx_progress    FOR ALL USING (auth.uid() = user_id);

-- Supabase Storage: hx-videos bucket
-- Go to: Supabase → Storage → New bucket → Name: hx-videos → Public: ON
-- Add CORS policy to allow video streaming from your domain

-- Make yourself admin (replace email):
-- UPDATE profiles SET plan = 'admin' WHERE email = 'jeromjoshep.23@gmail.com';

-- Sample seed data (optional — uncomment to add test courses):
/*
INSERT INTO hx_courses (title, description, category, course_type, level, is_free, is_published, total_lessons, duration_mins) VALUES
('Communication Mastery for Professionals', 'Learn to communicate with clarity and confidence in the workplace.', 'Communication', 'individual', 'Beginner', true, true, 8, 120),
('Career Strategy: From Fresher to Senior', 'The complete roadmap from your first job to leadership roles.', 'Career Strategy', 'individual', 'Intermediate', false, true, 12, 180),
('Business Strategy for Founders', 'Build a winning business strategy for your startup.', 'Business Strategy', 'business', 'Intermediate', false, true, 10, 150),
('Sales Fundamentals for B2B Teams', 'Modern B2B sales frameworks, objection handling, and closing.', 'Sales', 'business', 'Beginner', true, true, 6, 90);
*/
