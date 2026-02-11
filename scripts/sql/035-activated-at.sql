-- 035: Add activated_at to subscriptions
-- Tracks when a member first logged in (set once, never overwritten)

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Backfill from auth.users.last_sign_in_at for existing active users
UPDATE subscriptions s
SET activated_at = u.last_sign_in_at
FROM auth.users u
WHERE s.user_id = u.id
  AND u.last_sign_in_at IS NOT NULL
  AND s.activated_at IS NULL;
