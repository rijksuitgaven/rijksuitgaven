# Beleidsterrein → IBOS Mapping

**Project:** Rijksuitgaven.nl
**Version:** V3 - Theme Discovery
**Status:** Stub - To be populated
**Source Module:** Gemeente

---

## Overview

Maps `beleidsterrein` values from the Gemeente module to IBOS policy domains.

---

## Mapping Table

| Beleidsterrein (source) | IBOS Code | IBOS Name | Confidence | Notes |
|-------------------------|-----------|-----------|------------|-------|
| TBD | TBD | TBD | TBD | TBD |

> **TODO:**
> 1. Extract distinct `beleidsterrein` values from gemeente data
> 2. Map each to appropriate IBOS code
> 3. Assign confidence (1.0 for exact match, lower for ambiguous)

---

## Data Discovery

```sql
-- Run this to discover beleidsterrein values
SELECT DISTINCT beleidsterrein, COUNT(*) as cnt
FROM gemeente_data  -- adjust table name
GROUP BY beleidsterrein
ORDER BY cnt DESC;
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-03 | Stub created |

