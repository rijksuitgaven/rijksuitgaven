-- Migration 056: Prevent duplicate active subscriptions per person
-- Race condition: two concurrent requests both pass "check active sub" and both INSERT.
-- This unique partial index makes the second INSERT fail with 23505 (unique_violation).
-- Only active subscriptions (not cancelled/deleted) are constrained.

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_active_person
  ON subscriptions (person_id)
  WHERE cancelled_at IS NULL AND deleted_at IS NULL;
