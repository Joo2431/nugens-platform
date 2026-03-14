-- ============================================
-- NuGens Gene App: Run these in Supabase SQL Editor
-- ============================================

-- 1. chat_sessions table (required for GenEChat to save conversations)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT DEFAULT 'New Chat',
  mode         TEXT DEFAULT 'CAREER',
  messages     JSONB DEFAULT '[]',
  history      JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON chat_sessions(user_id, updated_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-level security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chat sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 2. Fix your account: set as business + admin
UPDATE profiles
SET user_type = 'business', onboarding_done = true, plan = 'admin'
WHERE email = 'jeromjoshep.23@gmail.com';

-- 3. Onboarding columns (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'individual';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS situation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_need TEXT;

-- 4. RPC for incrementing questions (used by backend)
CREATE OR REPLACE FUNCTION increment_questions_used(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET questions_used = COALESCE(questions_used, 0) + 1
  WHERE id = user_id AND plan = 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
