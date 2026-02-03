# Sectoren → IBOS Mapping

**Project:** Rijksuitgaven.nl
**Version:** V3 - Theme Discovery
**Status:** Stub - To be populated
**Source Module:** Publiek

---

## Overview

Maps `sectoren` values from the Publiek module to IBOS policy domains.

---

## Mapping Table

| Sector (source) | IBOS Code | IBOS Name | Confidence | Notes |
|-----------------|-----------|-----------|------------|-------|
| TBD | TBD | TBD | TBD | TBD |

> **TODO:**
> 1. Extract distinct `sectoren` values from publiek data
> 2. Map each to appropriate IBOS code
> 3. Assign confidence (1.0 for exact match, lower for ambiguous)

---

## Data Discovery

```sql
-- Run this to discover sectoren values
SELECT DISTINCT sectoren, COUNT(*) as cnt
FROM publiek_data  -- adjust table name
GROUP BY sectoren
ORDER BY cnt DESC;
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-03 | Stub created |

