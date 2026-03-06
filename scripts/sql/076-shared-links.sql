-- Migration 076: shared_links table for V2.5 Publieke Deellinks
--
-- Stores the view state that a subscriber shares via "Deel" button.
-- Token-based public access at /s/{token} for non-subscribers.
--
-- Execute on Supabase BEFORE deploying code.

CREATE TABLE shared_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT replace(replace(replace(encode(gen_random_bytes(12), 'base64'), '+', '-'), '/', '_'), '=', ''),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  module TEXT NOT NULL,
  search TEXT,
  filters JSONB DEFAULT '{}',
  sort_by TEXT DEFAULT 'totaal',
  sort_order TEXT DEFAULT 'desc',
  columns TEXT[] DEFAULT '{}',
  expanded TEXT,
  expanded_grouping TEXT,
  expanded_columns TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Fast lookup by token (public GET)
CREATE INDEX idx_shared_links_token ON shared_links(token) WHERE deleted_at IS NULL;

-- Dedup: reuse existing link for same user + module + search + sort
CREATE INDEX idx_shared_links_dedup ON shared_links(created_by, module, search, sort_by, sort_order)
  WHERE deleted_at IS NULL;

-- RLS: subscribers can create their own links, public can read by token
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own links"
  ON shared_links FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can read own links"
  ON shared_links FOR SELECT
  USING ((SELECT auth.uid()) = created_by);

CREATE POLICY "Users can soft-delete own links"
  ON shared_links FOR UPDATE
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- Atomic view_count increment (called from BFF on public GET)
CREATE OR REPLACE FUNCTION increment_shared_link_views(link_token TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE shared_links
  SET view_count = view_count + 1
  WHERE token = link_token AND deleted_at IS NULL;
$$;
