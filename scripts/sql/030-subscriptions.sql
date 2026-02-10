-- 030: Subscriptions table for membership management
-- Tracks plan type, dates, and role. Status is computed from dates (no status column).

CREATE TABLE IF NOT EXISTS subscriptions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  organization    text,
  plan            text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  grace_ends_at   date NOT NULL,
  cancelled_at    timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for middleware lookups (every page request)
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Index for admin dashboard queries
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- RLS: users can read their own subscription, service_role can do everything
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Allow service_role full access (used by admin API routes)
-- No INSERT/UPDATE/DELETE policy for anon key — admin operations go through service_role
