-- ============================================================
-- NUGENS PLATFORM — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
-- One row per user, created automatically on signup via trigger
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT,
  full_name           TEXT,
  avatar_url          TEXT,
  plan                TEXT DEFAULT 'free' CHECK (plan IN ('free','monthly','yearly')),
  questions_used      INTEGER DEFAULT 0,
  subscription_id     TEXT,
  subscription_start  TIMESTAMPTZ,
  subscription_end    TIMESTAMPTZ,
  nudge_opt_out       BOOLEAN DEFAULT false,
  last_active         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment questions_used safely
CREATE OR REPLACE FUNCTION increment_questions_used(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET questions_used = questions_used + 1,
      last_active = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── CHAT LOGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  role        TEXT CHECK (role IN ('user','assistant')),
  message     TEXT,
  mode        TEXT DEFAULT 'CAREER',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESUMES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT DEFAULT 'My Resume',
  content_md      TEXT,
  target_role     TEXT,
  target_company  TEXT,
  word_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOB APPLICATIONS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company       TEXT NOT NULL,
  role          TEXT NOT NULL,
  url           TEXT,
  status        TEXT DEFAULT 'applied' CHECK (status IN ('applied','interview','offer','rejected','ghosted')),
  notes         TEXT,
  applied_date  DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBSCRIPTION LOGS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan                TEXT,
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  amount              INTEGER,
  currency            TEXT DEFAULT 'INR',
  status              TEXT DEFAULT 'active',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── NUDGE LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nudge_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nudge_type  TEXT DEFAULT 'weekly',
  sent_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_log          ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "own profile"        ON profiles          FOR ALL USING (auth.uid() = id);
CREATE POLICY "own chat logs"      ON chat_logs         FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own resumes"        ON resumes           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own job apps"       ON job_applications  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own sub logs"       ON subscription_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own nudge log"      ON nudge_log         FOR ALL USING (auth.uid() = user_id);

-- ── HYPERX COURSES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hx_courses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL,
  level        TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner','Intermediate','Advanced')),
  thumbnail_url TEXT,
  is_free      BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  total_lessons INTEGER DEFAULT 0,
  duration_mins INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── HYPERX LESSONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hx_lessons (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  video_url    TEXT,
  duration_mins INTEGER DEFAULT 0,
  sort_order   INTEGER DEFAULT 0,
  is_free      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── HYPERX ENROLLMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS hx_enrollments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES hx_courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ── HYPERX PROGRESS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS hx_progress (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   UUID REFERENCES hx_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- RLS
ALTER TABLE hx_courses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_lessons     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hx_progress    ENABLE ROW LEVEL SECURITY;

-- Anyone can view published courses/lessons
CREATE POLICY "view published courses" ON hx_courses FOR SELECT USING (is_published = true);
CREATE POLICY "view lessons"           ON hx_lessons FOR SELECT USING (true);
-- Users manage their own data
CREATE POLICY "own enrollments" ON hx_enrollments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own progress"    ON hx_progress    FOR ALL USING (auth.uid() = user_id);
-- Admin full access (service role bypasses RLS anyway)
CREATE POLICY "admin courses" ON hx_courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
);
CREATE POLICY "admin lessons" ON hx_lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan = 'admin')
);

-- Storage bucket for HyperX videos
INSERT INTO storage.buckets (id, name, public) VALUES ('hx-videos', 'hx-videos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "public read videos" ON storage.objects FOR SELECT USING (bucket_id = 'hx-videos');
CREATE POLICY "admin upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'hx-videos');
