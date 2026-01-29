# Search Relevance Ranking Design

**Date:** 2026-01-29
**Status:** Approved
**Author:** Claude (Senior UX Specialist) + Founder

---

## Problem

When searching "politie", results are not ranked by relevance:
- "Politiehonddresseervereniging De Trouwe Vriend" appears before "Politie"
- Exact match "Politie" (€6.5B) buried in middle of list
- Users expect best matches at top (Google-like behavior)

---

## Solution

**Relevance-based ranking with amount tiebreaker**

### Ranking Priority

| Priority | Match Type | Description | Example for "politie" |
|----------|-----------|-------------|----------------------|
| 1 | Exact match | Search term equals Ontvanger | "Politie" |
| 2 | Starts with | Ontvanger starts with search term | "Politieacademie" |
| 3 | Word boundary | Search term as separate word | "VTS POLITIE NEDERLAND" |
| 4 | Contains | Search term anywhere in Ontvanger | "Het Oude Politiebureau" |

### Tiebreaker

Within each relevance tier: **sort by amount (descending)**

Rationale: Users typically care about biggest money flows first.

### Expected Results for "politie"

| Rank | Ontvanger | Amount | Match Type |
|------|-----------|--------|------------|
| 1 | Politie | €6.595.395.000 | Exact |
| 2 | Politieacademie | €121.046.000 | Starts with |
| 3 | Politie Rotterdam-Rijnmond | €3.364.000 | Starts with |
| 4 | Politievakbond ANPV | €50.000 | Starts with |
| 5 | Politie Zeeland | €32.000 | Starts with |
| ... | Het Oude Politiebureau | €6.000 | Contains |

---

## Implementation

### Option A: PostgreSQL Relevance Scoring (Recommended)

Add `relevance_score` to ORDER BY:

```sql
SELECT *,
  CASE
    WHEN UPPER(ontvanger) = UPPER($search) THEN 1           -- Exact match
    WHEN UPPER(ontvanger) LIKE UPPER($search) || '%' THEN 2 -- Starts with
    WHEN UPPER(ontvanger) LIKE '% ' || UPPER($search) || '%' THEN 3 -- Word boundary
    ELSE 4                                                   -- Contains
  END AS relevance_score
FROM ...
WHERE UPPER(ontvanger) LIKE '%' || UPPER($search) || '%'
ORDER BY relevance_score ASC, totaal DESC
```

**Pros:** Works with existing PostgreSQL setup, no new dependencies
**Cons:** Slightly more complex query

### Option B: Typesense for Table Results

Use Typesense (already deployed for autocomplete) for table results too.

**Pros:** Built-in relevance ranking, typo tolerance
**Cons:** Need to sync all data to Typesense, adds complexity

### Recommendation

**Option A (PostgreSQL)** - simpler, uses existing infrastructure, sufficient for V1.0.

---

## Deferred to UI/UX Sprint

### Search on Other Fields

When search matches on Regeling/Omschrijving (not Ontvanger), current UI can't show why result matched.

**Example problem:**
- Search: "politie"
- Match: Regeling "Subsidieregeling Politiewerk"
- Ontvanger shown: "Gemeente Amsterdam"
- User confusion: "Why is Amsterdam in my politie search?"

**Solutions to explore:**
1. Show "Matched on: Regeling" indicator
2. Show snippet of matched field
3. Separate section for "Also found in Regelingen"
4. Highlight matched terms in expandable row

**Ticket:** Add to UI/UX sprint backlog

---

## Success Criteria

- [ ] Exact matches appear first
- [ ] "Politie" search shows "Politie" as result #1
- [ ] Within same match type, higher amounts rank higher
- [ ] Performance maintained (<500ms)
