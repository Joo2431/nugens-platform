-- ============================================================
-- The Units Database Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Content feed posts (business showcase)
CREATE TABLE IF NOT EXISTS units_feed_posts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_type     TEXT NOT NULL, -- 'Brand Reel', 'Behind the Scenes', etc.
  content       TEXT NOT NULL,
  media_url     TEXT,
  likes_count   INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count  INTEGER DEFAULT 0,
  is_business   BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Feed post likes
CREATE TABLE IF NOT EXISTS units_feed_likes (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id  UUID REFERENCES units_feed_posts(id) ON DELETE CASCADE,
  user_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Service bookings
CREATE TABLE IF NOT EXISTS units_bookings (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service_id     TEXT NOT NULL,  -- 'video-editing', 'content-strategy', etc.
  package_name   TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  status         TEXT DEFAULT 'pending', -- pending | paid | in_progress | delivered | cancelled
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  client_name    TEXT,
  client_email   TEXT,
  client_phone   TEXT,
  company        TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Live experience sessions (individual)
CREATE TABLE IF NOT EXISTS units_live_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id  TEXT NOT NULL,
  messages     JSONB DEFAULT '[]',
  status       TEXT DEFAULT 'active', -- active | completed
  team_requested BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Idea validations
CREATE TABLE IF NOT EXISTS units_ideas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  idea          TEXT NOT NULL,
  problem       TEXT,
  audience      TEXT,
  category      TEXT,
  revenue_model TEXT,
  competition   TEXT,
  score         INTEGER,
  verdict       TEXT,  -- 'Viable' | 'Needs Work' | 'Pivot Needed'
  ai_result     JSONB,
  consult_booked BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Premium consultation bookings
CREATE TABLE IF NOT EXISTS units_consultations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  idea_id     UUID REFERENCES units_ideas(id) ON DELETE SET NULL,
  amount      INTEGER DEFAULT 999,
  status      TEXT DEFAULT 'pending', -- pending | paid | scheduled | completed
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  scheduled_at TIMESTAMPTZ,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Guide progress (entrepreneur guide chapters)
CREATE TABLE IF NOT EXISTS units_guide_progress (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id INTEGER,
  section_idx INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id, section_idx)
);

-- RLS Policies
ALTER TABLE units_feed_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_feed_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_live_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_ideas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_consultations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_guide_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read feed"     ON units_feed_posts    FOR SELECT USING (true);
CREATE POLICY "Own insert feed"      ON units_feed_posts    FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Own delete feed"      ON units_feed_posts    FOR DELETE USING (auth.uid()=user_id);
CREATE POLICY "Own likes"            ON units_feed_likes    FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "Own bookings"         ON units_bookings      FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "Own sessions"         ON units_live_sessions FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "Own ideas"            ON units_ideas         FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "Own consultations"    ON units_consultations FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "Own guide progress"   ON units_guide_progress FOR ALL USING (auth.uid()=user_id);
