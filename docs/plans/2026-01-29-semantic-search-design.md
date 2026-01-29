# Semantic Search Design

**Date:** 2026-01-29
**Status:** Planned (not implemented)
**Priority:** V1.1 (word boundary) / V2.0 (embeddings)

---

## Problem Statement

Current keyword search uses `ILIKE '%term%'` which matches substrings without understanding meaning.

**Example: Search "politie"**

| Result | Current | Desired | Why |
|--------|---------|---------|-----|
| Politie | ✅ | ✅ | Exact match |
| Nationale Politie | ✅ | ✅ | Contains word |
| Politieacademie | ✅ | ✅ | Police compound |
| Politieke beweging DENK | ✅ | ❌ | "Politiek" = politics, NOT police |

The words "politie" (police) and "politiek" (politics) share a prefix but are completely different domains.

---

## Proposed Solutions

### Option A: Word Boundary Matching (Simple)

**Approach:** Match whole words only using PostgreSQL regex.

```sql
-- Current
WHERE ontvanger ILIKE '%politie%'

-- Proposed
WHERE ontvanger ~* '\mpolitie\M'
```

**Trade-off:** Loses compound word matches like "Politieacademie".

| Effort | Accuracy |
|--------|----------|
| 2-4 hours | ~85% |

**Status:** Not implemented - compounds would be lost.

---

### Option B: Dutch Language Rules (Medium)

**Approach:** Apply linguistic rules for Dutch word patterns.

**Rule:** For searches ending in "-ie", exclude matches continuing with "k" (which forms "-iek", a different word stem).

```sql
-- Search: "politie"
WHERE ontvanger ~* 'politie([^k]|$|\s)'
```

**Results:**
- "Politie" ✅ (ends)
- "Politieacademie" ✅ (continues with 'a')
- "Politieke" ❌ (continues with 'k')

**Known Dutch patterns:**
- politie/politiek (police/politics)
- academie/academiek (academy/academic)
- democratie/democratiek (democracy/democratic)

| Effort | Accuracy |
|--------|----------|
| 4-8 hours | ~90% |

**Status:** Designed, not implemented. Need to identify all relevant Dutch patterns first.

---

### Option C: Embeddings / Vector Search (Advanced)

**Approach:** Convert text to semantic vectors using AI models. Similar meanings = similar vectors.

```
"Politie"           → [0.82, 0.15, 0.93, 0.41, ...]
"Nationale Politie" → [0.80, 0.17, 0.91, 0.39, ...]  ← very similar!
"Politieke Partij"  → [0.23, 0.67, 0.12, 0.88, ...]  ← very different
```

**Components Required:**

| Component | Description |
|-----------|-------------|
| Embedding model | **Cohere embed-multilingual-v3** (decided) |
| Vector storage | pgvector in Supabase (already enabled) |
| Index | HNSW or IVFFlat for fast similarity search |
| Hybrid search | Combine keyword + semantic scores |

**Vendor Decision: Cohere embed-multilingual-v3**

| Reason | Details |
|--------|---------|
| Native multilingual | Built for non-English languages like Dutch |
| Price | $0.10 per 1M tokens |
| Quality | 1024 dimensions, excellent semantic similarity |
| API | Simple REST API, good documentation |

**Full Database Scope:**

| Data | Records | Tokens |
|------|---------|--------|
| All unique recipients | ~451K | 3.6M |
| Regelingen | ~50K | 0.75M |
| Omschrijvingen | ~200K | 4M |
| Leveranciers (inkoop) | ~95K | 0.8M |
| **Total** | | **~9M tokens** |

**Cost Estimate:**

| Item | One-time | Monthly |
|------|----------|---------|
| Generate embeddings (9M tokens) | **€0.90** | - |
| Vector storage (pgvector) | - | Included in Supabase Pro |
| Query embeddings (10K searches) | - | €0.05 |
| Re-index on data refresh | - | €0.90 |
| **Total** | **€0.90** | **~€1/month** |

| Effort | Accuracy |
|--------|----------|
| 2-3 days | ~95% |

**Status:** Planned for V2.0 with Cohere

---

## Decision

| Version | Implementation |
|---------|----------------|
| V1.0 | Keep current ILIKE (no change) |
| V1.1 | Option B: Dutch language rules |
| V2.0 | Option C: Embeddings with hybrid search |

---

## Additional Benefits of Embeddings (V2.0)

Beyond filtering false positives, embeddings enable:

1. **Entity clustering** - Group related entities (Politie + Nationale Politie + regional units)
2. **Semantic autocomplete** - "police" could find "Politie" even in English
3. **Similar recipients** - "Show me organizations like ProRail"
4. **Theme search** - "infrastructure" finds rail, road, water management entities

---

## Related Documents

- `02-requirements/research-mode-vision.md` - V2.0 AI features
- `08-decisions/ADR-013-search-semantic-architecture.md` - Search architecture
- `02-requirements/backlog.md` - Backlog items

---

## Open Questions

1. What other Dutch word patterns cause false matches? (Need linguistic review)
2. ~~Which embedding model works best for Dutch organization names?~~ → **Cohere embed-multilingual-v3**
3. How to handle hybrid ranking (keyword score + semantic score)?
