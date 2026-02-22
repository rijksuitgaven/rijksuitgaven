-- 065-email-media.sql
-- Email Media Library: track uploaded images for campaign emails
--
-- Run on Supabase BEFORE deploying code that references this table.

CREATE TABLE email_media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      TEXT NOT NULL,              -- storage key in email-images bucket
  original_name TEXT NOT NULL,              -- user's original filename
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,           -- optimized file size
  width         INTEGER,                    -- image dimensions (after processing)
  height        INTEGER,
  alt_text      TEXT DEFAULT '',
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ                 -- soft delete
);

-- Active media ordered by newest first
CREATE INDEX idx_email_media_created ON email_media(created_at DESC) WHERE deleted_at IS NULL;

-- Lookup by uploader
CREATE INDEX idx_email_media_uploaded_by ON email_media(uploaded_by) WHERE deleted_at IS NULL;

-- Lookup by storage filename (for draft image restoration)
CREATE INDEX idx_email_media_filename ON email_media(filename) WHERE deleted_at IS NULL;
