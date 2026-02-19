-- 061: Add pipeline_stage to people table for CRM tracking
-- Tracks sales process state independently from subscription lifecycle

ALTER TABLE people ADD COLUMN pipeline_stage text NOT NULL DEFAULT 'nieuw'
  CHECK (pipeline_stage IN ('nieuw','in_gesprek','gewonnen','afgesloten','verloren','ex_klant'));

ALTER TABLE people ADD COLUMN lost_reason text;

CREATE INDEX idx_people_pipeline_stage ON people (pipeline_stage);

-- Migrate existing data:

-- People with archived_at → afgesloten (was "gearchiveerd")
UPDATE people SET pipeline_stage = 'afgesloten' WHERE archived_at IS NOT NULL;

-- People with active subscription (not cancelled/deleted) → gewonnen
UPDATE people SET pipeline_stage = 'gewonnen'
  WHERE id IN (
    SELECT person_id FROM subscriptions
    WHERE deleted_at IS NULL AND cancelled_at IS NULL
  );

-- People with expired/cancelled subscription → ex_klant
-- (runs after gewonnen so active subs take precedence)
UPDATE people SET pipeline_stage = 'ex_klant'
  WHERE id IN (
    SELECT person_id FROM subscriptions
    WHERE deleted_at IS NOT NULL OR cancelled_at IS NOT NULL
  )
  AND pipeline_stage != 'gewonnen';
