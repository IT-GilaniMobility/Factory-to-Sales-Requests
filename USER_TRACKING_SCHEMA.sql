-- ============================================================
-- USER TRACKING & ACTIVE USERS SYSTEM
-- ============================================================

-- Table: user_sessions
-- Tracks all user sessions with login/logout times
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT,
  login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  user_agent TEXT,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_daily_summary
-- Daily aggregated time spent per user
CREATE TABLE IF NOT EXISTS user_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT,
  total_seconds INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_email ON user_sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON user_sessions(last_seen);
CREATE INDEX IF NOT EXISTS idx_sessions_login_time ON user_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_daily_date ON user_daily_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_email ON user_daily_summary(email);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_sessions;
CREATE POLICY "Users can insert own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.email() = email);

DROP POLICY IF EXISTS "Users can update own sessions" ON user_sessions;
CREATE POLICY "Users can update own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.email() = email)
  WITH CHECK (auth.email() = email);

DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  USING (
    auth.email() IN (
      'it@gilanimobility.ae',
      'eng@gilanimobility.ae',
      'eng1@gilanimobility.ae'
    )
  );

DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.email() = email);

-- RLS Policies for user_daily_summary
DROP POLICY IF EXISTS "Admins can view all summaries" ON user_daily_summary;
CREATE POLICY "Admins can view all summaries"
  ON user_daily_summary FOR SELECT
  USING (
    auth.email() IN (
      'it@gilanimobility.ae',
      'eng@gilanimobility.ae',
      'eng1@gilanimobility.ae'
    )
  );

DROP POLICY IF EXISTS "Users can view own summaries" ON user_daily_summary;
CREATE POLICY "Users can view own summaries"
  ON user_daily_summary FOR SELECT
  USING (auth.email() = email);

DROP POLICY IF EXISTS "System can insert summaries" ON user_daily_summary;
CREATE POLICY "System can insert summaries"
  ON user_daily_summary FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update summaries" ON user_daily_summary;
CREATE POLICY "System can update summaries"
  ON user_daily_summary FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to cleanup stale sessions (last_seen > 5 min ago)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET 
    logout_time = last_seen,
    duration_seconds = EXTRACT(EPOCH FROM (last_seen - login_time))::INTEGER
  WHERE 
    logout_time IS NULL 
    AND last_seen < NOW() - INTERVAL '5 minutes'
    AND duration_seconds IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate daily summaries
CREATE OR REPLACE FUNCTION update_daily_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_daily_summary (date, email, name, role, total_seconds, sessions_count)
  SELECT 
    target_date,
    email,
    name,
    role,
    SUM(COALESCE(duration_seconds, 0))::INTEGER,
    COUNT(*)::INTEGER
  FROM user_sessions
  WHERE DATE(login_time) = target_date
    AND duration_seconds IS NOT NULL
  GROUP BY email, name, role
  ON CONFLICT (date, email) 
  DO UPDATE SET
    total_seconds = EXCLUDED.total_seconds,
    sessions_count = EXCLUDED.sessions_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
