# V3 Theme Classification - Decisions

**Project:** Rijksuitgaven.nl
**Version:** V3 - Theme Discovery

---

## Decision Log

Architecture decisions specific to V3 theme classification.

---

### ADR-V3-001: Row-Level vs Recipient-Level Classification

**Date:** 2026-02-03
**Status:** Decided

**Context:**
Should we classify recipients once and apply everywhere, or classify each row with its context?

**Decision:**
Row-level classification with context fields.

**Rationale:**
Same recipient (e.g., "Heijmans Infra") can receive money for different purposes:
- In Gemeente for "Infrastructuur" (beleidsterrein: wegen)
- In Gemeente for "Milieu" (beleidsterrein: groenvoorziening)

Context fields (beleidsterrein, sectoren, ministerie) provide classification hints.

**Consequences:**
- More classifications to store (~450K rows vs ~500K recipients)
- Higher accuracy
- Can aggregate by recipient across classifications

---

### ADR-V3-002: Hybrid Classification Layers

**Date:** 2026-02-03
**Status:** Decided

**Context:**
How to classify rows without IBOS codes?

**Decision:**
6-layer hybrid approach:
1. Direct IBOS (instrumenten only)
2. Field mapping (beleidsterrein, sectoren)
3. AI + context (name + surrounding fields)
4. AI name-only (fallback)
5. Recipient inheritance (last resort)
6. Unclassified bucket

**Rationale:**
- Cheapest/most accurate methods first
- AI only for gaps
- Always track confidence

**Consequences:**
- Need mapping tables for Layer 2
- AI costs only for ~20-30% of rows
- Unclassified is acceptable (honest about limits)

---

### ADR-V3-003: Confidence Score Schema

**Date:** 2026-02-03
**Status:** Decided

**Context:**
How to track classification reliability?

**Decision:**
Store `confidence` (0.00-1.00) and `classification_method` per classification.

**Schema:**
```sql
confidence DECIMAL(3,2) NOT NULL,
classification_method TEXT NOT NULL
```

**Confidence by method:**
| Method | Typical Confidence |
|--------|-------------------|
| direct_ibos | 1.00 |
| field_mapping | 0.90-0.95 |
| ai_with_context | 0.70-0.85 |
| ai_name_only | 0.50-0.70 |

**Consequences:**
- Can filter/sort by confidence
- Can build review queue (< 0.7)
- Transparent about data quality

---

## Pending Decisions

| ID | Question | Options | Status |
|----|----------|---------|--------|
| ADR-V3-004 | Multi-domain recipients? | A) Primary only / B) Multiple allowed | Pending |
| ADR-V3-005 | Classification refresh frequency? | A) Once / B) On data update / C) Scheduled | Pending |

---

## Last Updated

- **Date:** 2026-02-03
- **By:** Initial decisions from brainstorm session

