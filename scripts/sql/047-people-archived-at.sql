-- 047: Add archived_at column to people table
-- Allows admin to archive prospects (non-destructive alternative to delete).
-- Archived prospects show as "Gearchiveerd" on contacten page.

ALTER TABLE people ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
