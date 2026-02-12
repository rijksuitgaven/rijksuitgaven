-- 037: Add last_active_at to subscriptions
-- Tracks real user activity (updated by middleware on each page request, throttled to 5 min)

ALTER TABLE subscriptions ADD COLUMN last_active_at timestamptz;

-- Backfill from auth.users last_sign_in_at as starting point
UPDATE subscriptions s
SET last_active_at = u.last_sign_in_at
FROM auth.users u
WHERE s.user_id = u.id
  AND u.last_sign_in_at IS NOT NULL;
