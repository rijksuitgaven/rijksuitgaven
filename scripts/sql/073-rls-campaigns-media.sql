-- 073: Enable RLS on campaigns, campaign_events, email_media
-- These tables are admin-only, accessed via service role client.
-- RLS with no policies = deny all via anon/authenticated.
-- Service role bypasses RLS automatically.

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_media ENABLE ROW LEVEL SECURITY;
