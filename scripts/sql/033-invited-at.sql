-- 033: Add invited_at column to subscriptions
-- Tracks when an invite email was sent to a member.
-- Status lifecycle: Aangemaakt (no invited_at) → Uitgenodigd (invited_at set) → Actief (first login)

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS invited_at timestamptz;
