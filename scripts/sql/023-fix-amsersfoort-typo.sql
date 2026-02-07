-- 023: Fix "Amsersfoort" typo in gemeente table
-- Merges misspelled rows into correct "Amersfoort" entries

UPDATE gemeente SET gemeente = 'Amersfoort' WHERE gemeente = 'Amsersfoort';
