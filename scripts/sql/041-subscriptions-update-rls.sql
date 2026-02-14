-- Allow authenticated users to update their own last_active_at
-- Fixes: middleware fire-and-forget update was silently blocked by RLS
CREATE POLICY "Users can update own last_active_at" ON subscriptions
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
