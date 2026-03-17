-- Support requests table (for Support page ticket form)
CREATE TABLE IF NOT EXISTS support_requests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  topic      TEXT DEFAULT 'General',
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'open',  -- open | in_progress | resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit support" ON support_requests FOR INSERT WITH CHECK (true);
-- Only service role can read (admin only)
CREATE POLICY "Service role reads support" ON support_requests FOR SELECT USING (false);
