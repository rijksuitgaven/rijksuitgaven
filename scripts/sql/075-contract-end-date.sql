-- Migration 075: Add contract_end_date to subscriptions
-- Temporary field for tracking legacy WordPress contract expiry dates.
-- Currently stored as free text in notes. Needed as a proper DATE for sorting.
-- Can be dropped once all legacy contracts are renewed/migrated.

ALTER TABLE subscriptions ADD COLUMN contract_end_date DATE;
