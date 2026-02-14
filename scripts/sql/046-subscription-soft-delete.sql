-- 046: Add deleted_at column for soft-delete on subscriptions
-- Allows admin to "remove" a member while preserving subscription history
-- so the person correctly shows as "churned" (not "prospect") on contacten page.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Allow null user_id for soft-deleted subscriptions (auth user may be deleted)
ALTER TABLE subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- Index for filtering active (non-deleted) subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON subscriptions (deleted_at) WHERE deleted_at IS NULL;
