-- Per-user business profile storage for the ஞானி coaching suite.
-- One row per authenticated user; the entire BusinessProfile is held as JSON.

CREATE TABLE IF NOT EXISTS business_profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row-level security: every user can only read/write their own row.
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile_select" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_profile_insert" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_profile_update" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_profile_delete" ON business_profiles
  FOR DELETE USING (auth.uid() = user_id);
