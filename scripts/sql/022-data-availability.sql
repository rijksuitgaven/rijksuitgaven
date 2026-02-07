-- 022: Data Availability Indicators
-- Tracks which years have data per module/entity
-- Enables frontend to distinguish "no data" (em-dash) from "real zero" (0)
--
-- Module-level: instrumenten, inkoop, apparaat (all entities share same year range)
-- Entity-level: gemeente (per gemeente), provincie (per provincie), publiek (per source)

CREATE TABLE IF NOT EXISTS data_availability (
  id SERIAL PRIMARY KEY,
  module TEXT NOT NULL,
  entity_type TEXT,        -- NULL for module-level, 'gemeente'/'provincie'/'source' for entity-level
  entity_name TEXT,        -- NULL for module-level, entity value for entity-level
  year_from INT NOT NULL,
  year_to INT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module, entity_type, entity_name)
);

-- RLS: Public read access (data availability is not sensitive)
ALTER TABLE data_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON data_availability FOR SELECT USING (true);

-- Index for fast lookups by module
CREATE INDEX idx_data_availability_module ON data_availability(module);
-- Index for entity-level lookups
CREATE INDEX idx_data_availability_entity ON data_availability(module, entity_type, entity_name);

-- ============================================================================
-- Initial data (curated year ranges)
-- Default: 2016-2024 for entities without known start year
-- Refine year_from per entity via Supabase Studio
-- ============================================================================

-- Module-level
INSERT INTO data_availability (module, entity_type, entity_name, year_from, year_to) VALUES
  ('instrumenten', NULL, NULL, 2016, 2024),
  ('inkoop', NULL, NULL, 2016, 2024),
  ('apparaat', NULL, NULL, 2016, 2024);

-- Entity-level: gemeente (per gemeente)
-- Note: "Amsersfoort" typo excluded - tracked as data quality issue in backlog
INSERT INTO data_availability (module, entity_type, entity_name, year_from, year_to) VALUES
  ('gemeente', 'gemeente', 'Almere', 2016, 2024),
  ('gemeente', 'gemeente', 'Amersfoort', 2020, 2024),
  ('gemeente', 'gemeente', 'Amsterdam', 2016, 2024),
  ('gemeente', 'gemeente', 'Arnhem', 2016, 2024),
  ('gemeente', 'gemeente', 'Barendrecht', 2016, 2024),
  ('gemeente', 'gemeente', 'Breda', 2016, 2024),
  ('gemeente', 'gemeente', 'De Ronde Venen', 2016, 2024),
  ('gemeente', 'gemeente', 'Den Haag', 2016, 2024),
  ('gemeente', 'gemeente', 'Groningen', 2016, 2024),
  ('gemeente', 'gemeente', 'Haarlem', 2016, 2024),
  ('gemeente', 'gemeente', 'Tilburg', 2016, 2024),
  ('gemeente', 'gemeente', 'Utrecht', 2016, 2024);

-- Entity-level: provincie (per provincie)
INSERT INTO data_availability (module, entity_type, entity_name, year_from, year_to) VALUES
  ('provincie', 'provincie', 'Drenthe', 2016, 2024),
  ('provincie', 'provincie', 'Friesland', 2016, 2024),
  ('provincie', 'provincie', 'Gelderland', 2019, 2024),
  ('provincie', 'provincie', 'Limburg', 2016, 2024),
  ('provincie', 'provincie', 'Noord-Brabant', 2016, 2024),
  ('provincie', 'provincie', 'Noord-Holland', 2016, 2024),
  ('provincie', 'provincie', 'Overijssel', 2016, 2024),
  ('provincie', 'provincie', 'Utrecht', 2017, 2024),
  ('provincie', 'provincie', 'Zeeland', 2016, 2024),
  ('provincie', 'provincie', 'Zuid-Holland', 2016, 2024);

-- Entity-level: publiek (per source/organisatie)
INSERT INTO data_availability (module, entity_type, entity_name, year_from, year_to) VALUES
  ('publiek', 'source', 'COA', 2018, 2024),
  ('publiek', 'source', 'NWO', 2016, 2024),
  ('publiek', 'source', 'RVO', 2016, 2024),
  ('publiek', 'source', 'ZonMW', 2016, 2024);
