-- 057: Data Availability Corrections
-- Fixes incorrect year ranges in data_availability table
-- Verified against actual source table data on 2026-02-18
--
-- Rule: year_from = first year with meaningful data (rows > 0, total > 0)
--       year_to   = last year with data (within platform scope 2016-2024)
--       Entities with pending data (e.g. Friesland 2024) will be updated when loaded
--
-- EXECUTED on production: 2026-02-18

BEGIN;

-- Module-level
UPDATE data_availability SET year_from = 2017 WHERE module = 'inkoop' AND entity_type IS NULL;

-- Provincie
UPDATE data_availability SET year_from = 2020, year_to = 2023 WHERE module = 'provincie' AND entity_name = 'Friesland';
UPDATE data_availability SET year_from = 2016 WHERE module = 'provincie' AND entity_name = 'Gelderland';
UPDATE data_availability SET year_from = 2018 WHERE module = 'provincie' AND entity_name = 'Limburg';
UPDATE data_availability SET year_from = 2018 WHERE module = 'provincie' AND entity_name = 'Overijssel';
UPDATE data_availability SET year_from = 2022 WHERE module = 'provincie' AND entity_name = 'Utrecht';
UPDATE data_availability SET year_from = 2019 WHERE module = 'provincie' AND entity_name = 'Zuid-Holland';

-- Gemeente
UPDATE data_availability SET year_from = 2018 WHERE module = 'gemeente' AND entity_name = 'Almere';
UPDATE data_availability SET year_from = 2018 WHERE module = 'gemeente' AND entity_name = 'Amersfoort';
UPDATE data_availability SET year_from = 2020 WHERE module = 'gemeente' AND entity_name = 'Arnhem';
UPDATE data_availability SET year_from = 2022 WHERE module = 'gemeente' AND entity_name = 'Barendrecht';
UPDATE data_availability SET year_from = 2018 WHERE module = 'gemeente' AND entity_name = 'Breda';
UPDATE data_availability SET year_from = 2021 WHERE module = 'gemeente' AND entity_name = 'De Ronde Venen';
UPDATE data_availability SET year_from = 2017 WHERE module = 'gemeente' AND entity_name = 'Den Haag';
UPDATE data_availability SET year_to = 2023 WHERE module = 'gemeente' AND entity_name = 'Groningen';
UPDATE data_availability SET year_from = 2018, year_to = 2023 WHERE module = 'gemeente' AND entity_name = 'Haarlem';
UPDATE data_availability SET year_from = 2018 WHERE module = 'gemeente' AND entity_name = 'Tilburg';
UPDATE data_availability SET year_from = 2023 WHERE module = 'gemeente' AND entity_name = 'Utrecht';

-- Publiek
UPDATE data_availability SET year_from = 2018 WHERE module = 'publiek' AND entity_name = 'NWO';
UPDATE data_availability SET year_from = 2018 WHERE module = 'publiek' AND entity_name = 'ZonMW';

COMMIT;
