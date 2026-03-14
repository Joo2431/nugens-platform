-- ============================================================
-- DigiHub Database Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- DigiHub posts (community feed)
CREATE TABLE IF NOT EXISTS dh_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_type     TEXT NOT NULL, -- 'Hiring Now', 'Business Offer', 'General Update', etc.
  content       TEXT NOT NULL,
  tags          TEXT[],
  platform      TEXT,
  likes_count   INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_business   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Post likes
CREATE TABLE IF NOT EXISTS dh_post_likes (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id  UUID REFERENCES dh_posts(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Prompt history
CREATE TABLE IF NOT EXISTS dh_prompts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category    TEXT,
  platform    TEXT,
  style       TEXT,
  topic       TEXT,
  generated   TEXT,
  is_public   BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled posts
CREATE TABLE IF NOT EXISTS dh_scheduled_posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  caption        TEXT NOT NULL,
  hashtags       TEXT,
  scheduled_for  TIMESTAMPTZ NOT NULL,
  status         TEXT DEFAULT 'scheduled', -- scheduled | published | draft | failed
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Content calendar entries
CREATE TABLE IF NOT EXISTS dh_calendar (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  platform    TEXT,
  post_type   TEXT,
  caption     TEXT,
  hashtags    TEXT,
  status      TEXT DEFAULT 'planned',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS dh_projects (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  platform    TEXT,
  description TEXT,
  status      TEXT DEFAULT 'active', -- active | paused | completed | draft
  deadline    DATE,
  tasks_total INTEGER DEFAULT 0,
  tasks_done  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Job listings (posted by business accounts)
CREATE TABLE IF NOT EXISTS dh_jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  location     TEXT,
  job_type     TEXT, -- Full-time | Part-time | Contract
  salary       TEXT,
  description  TEXT,
  skills       TEXT[],
  is_urgent    BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT true,
  applicants   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications
CREATE TABLE IF NOT EXISTS dh_job_applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID REFERENCES dh_jobs(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter  TEXT,
  status        TEXT DEFAULT 'pending', -- pending | reviewed | rejected | hired
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- RLS Policies
ALTER TABLE dh_posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_post_likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_prompts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_scheduled_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_calendar           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE dh_job_applications   ENABLE ROW LEVEL SECURITY;

-- Posts: anyone logged in can view, own user can insert/delete
CREATE POLICY "Public read posts" ON dh_posts FOR SELECT USING (true);
CREATE POLICY "Own insert posts" ON dh_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own delete posts" ON dh_posts FOR DELETE USING (auth.uid() = user_id);

-- Likes: own rows only
CREATE POLICY "Own likes" ON dh_post_likes FOR ALL USING (auth.uid() = user_id);

-- Prompts: own rows + public ones
CREATE POLICY "Public read prompts" ON dh_prompts FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Own insert prompts" ON dh_prompts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scheduled posts: own rows only
CREATE POLICY "Own scheduled posts" ON dh_scheduled_posts FOR ALL USING (auth.uid() = user_id);

-- Calendar: own rows only
CREATE POLICY "Own calendar" ON dh_calendar FOR ALL USING (auth.uid() = user_id);

-- Projects: own rows only
CREATE POLICY "Own projects" ON dh_projects FOR ALL USING (auth.uid() = user_id);

-- Jobs: all can view active, own user can insert/update
CREATE POLICY "Public read jobs" ON dh_jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Own insert jobs" ON dh_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own update jobs" ON dh_jobs FOR UPDATE USING (auth.uid() = user_id);

-- Applications: own rows + job owner can view
CREATE POLICY "Own applications" ON dh_job_applications FOR ALL USING (auth.uid() = user_id);
