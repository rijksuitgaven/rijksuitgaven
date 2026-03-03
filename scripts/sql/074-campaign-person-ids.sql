-- 074: Add person_ids column to campaigns for specific recipient targeting
-- Run BEFORE deploying code that references this column

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS person_ids JSONB DEFAULT NULL;
COMMENT ON COLUMN campaigns.person_ids IS 'Optional array of specific person UUIDs for targeted sends';
