-- =====================================================
-- Description: Security hardening - fix Supabase linter warnings
-- Created: 2026-01-31
-- Executed: 2026-01-31 on Supabase Production
-- =====================================================
--
-- Fixes:
-- 1. Function search_path (7 functions) - Add SET search_path = public
-- 2. Materialized views API access (7 views) - Revoke anon/authenticated
--
-- NOT fixing (documented decision):
-- - Extensions in public (postgis, vector, pg_trgm) - migration risk too high
-- =====================================================

-- ============================================
-- PART 1: Fix function search_path
-- ============================================
-- Recreate functions with SET search_path = public
-- This prevents search_path hijacking attacks

-- 1a. set_source_instrumenten
CREATE OR REPLACE FUNCTION public.set_source_instrumenten()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.source := 'instrumenten';
    RETURN NEW;
END;
$$;

-- 1b. set_source_apparaat
CREATE OR REPLACE FUNCTION public.set_source_apparaat()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.source := 'apparaat';
    RETURN NEW;
END;
$$;

-- 1c. set_source_inkoop
CREATE OR REPLACE FUNCTION public.set_source_inkoop()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.source := 'inkoop';
    RETURN NEW;
END;
$$;

-- 1d. set_source_provincie
CREATE OR REPLACE FUNCTION public.set_source_provincie()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.source := 'provincie';
    RETURN NEW;
END;
$$;

-- 1e. set_source_gemeente
CREATE OR REPLACE FUNCTION public.set_source_gemeente()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.source := 'gemeente';
    RETURN NEW;
END;
$$;

-- 1f. update_data_freshness_timestamp
CREATE OR REPLACE FUNCTION public.update_data_freshness_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE public.data_freshness
    SET last_updated = NOW()
    WHERE module = TG_TABLE_NAME;
    RETURN NEW;
END;
$$;

-- 1g. normalize_recipient
CREATE OR REPLACE FUNCTION public.normalize_recipient(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    result TEXT;
BEGIN
    IF name IS NULL THEN
        RETURN NULL;
    END IF;

    -- Uppercase for consistent grouping
    result := UPPER(TRIM(name));

    -- Normalize common variations
    result := REGEXP_REPLACE(result, '\s+', ' ', 'g');  -- Multiple spaces to single
    result := REGEXP_REPLACE(result, '\s*B\.?V\.?\s*$', ' B.V.', 'i');  -- Normalize B.V.
    result := REGEXP_REPLACE(result, '\s*N\.?V\.?\s*$', ' N.V.', 'i');  -- Normalize N.V.
    result := REGEXP_REPLACE(result, '\s*STICHTING\s+', 'STICHTING ', 'i');  -- Normalize Stichting
    result := REGEXP_REPLACE(result, '\s*GEMEENTE\s+', 'GEMEENTE ', 'i');  -- Normalize Gemeente
    result := REGEXP_REPLACE(result, '\s*PROVINCIE\s+', 'PROVINCIE ', 'i');  -- Normalize Provincie

    RETURN result;
END;
$$;

-- ============================================
-- PART 2: Revoke direct API access to materialized views
-- ============================================
-- Our FastAPI backend uses service role (still works)
-- This prevents direct PostgREST queries bypassing our API

REVOKE SELECT ON public.instrumenten_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.apparaat_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.inkoop_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.provincie_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.gemeente_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.publiek_aggregated FROM anon, authenticated;
REVOKE SELECT ON public.universal_search FROM anon, authenticated;

-- ============================================
-- PART 3: Extensions in public (NOT FIXING)
-- ============================================
-- postgis, vector, pg_trgm are in public schema.
-- Moving them requires:
-- 1. DROP EXTENSION ... CASCADE (destroys dependent objects)
-- 2. CREATE EXTENSION ... WITH SCHEMA extensions
-- 3. Recreate all dependent objects
--
-- Risk: High (can break geometry columns, indexes, functions)
-- Benefit: Low (theoretical security concern for standard extensions)
-- Decision: Accept warning, document as known limitation
-- ============================================
