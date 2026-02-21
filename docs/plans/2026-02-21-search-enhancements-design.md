# Search Enhancements V1.0 — Design Document

**Date:** 2026-02-21
**Status:** Approved
**Session:** 5
**Scope:** Multi-word AND, exact phrase, wildcard stripping

---

## Problem

Search currently has three issues:

1. **Multi-word queries check the entire phrase as one unit.** `is_word_boundary_match("rode kruis", text)` builds regex `\brode kruis\b`, requiring words to be adjacent and in order. "kruis rode" does not match "Het Nederlandse Rode Kruis".
2. **Quotes break search.** Typing `"rode kruis"` sends literal quote characters to Typesense and PostgreSQL regex, producing zero or wrong results.
3. **Wildcards are ignored.** Typing `prorail*` sends the asterisk to Typesense, which silently ignores it. This works by accident (Typesense has `prefix: true`), but the intent is not parsed.

## Solution

Three changes, all in `backend/app/services/modules.py`. Zero frontend changes. Zero API changes.

### 1. New function: `parse_search_query()`

Parses raw user input into a structured object before any search logic runs.

```python
@dataclass
class ParsedQuery:
    phrases: list[str]   # From quoted segments
    words: list[str]     # From unquoted segments
    raw: str             # All terms joined, quotes/wildcards stripped (for Typesense)
```

**Parsing rules:**
- Extract quoted phrases (`"rode kruis"` → phrase "rode kruis")
- Strip trailing `*` from remaining text
- Split remaining text on whitespace → individual words
- Unmatched quote → strip it, treat contents as words
- Empty quotes `""` → ignore
- Only whitespace inside quotes → ignore

**Examples:**

| Input | phrases | words | raw |
|---|---|---|---|
| `prorail` | [] | ["prorail"] | "prorail" |
| `rode kruis` | [] | ["rode", "kruis"] | "rode kruis" |
| `"rode kruis"` | ["rode kruis"] | [] | "rode kruis" |
| `"van oord" bouw` | ["van oord"] | ["bouw"] | "van oord bouw" |
| `prorail*` | [] | ["prorail"] | "prorail" |
| `"rode kruis` | [] | ["rode", "kruis"] | "rode kruis" |
| `""` | [] | [] | "" |

### 2. Modified: `is_word_boundary_match()`

Same function signature `(search: str, text: str) -> bool`. Internal logic changes only. All 8 existing call sites get the fix automatically with zero refactoring.

```python
def is_word_boundary_match(search: str, text: str) -> bool:
    if not search or not text:
        return False
    parsed = parse_search_query(search)
    if not parsed.phrases and not parsed.words:
        return False
    for term in parsed.phrases + parsed.words:
        escaped = re.escape(term)
        if not re.search(rf'\b{escaped}\b', text, re.IGNORECASE):
            return False  # ALL terms must match
    return True
```

**Behavior change:**

| Search | Before | After |
|---|---|---|
| `rode kruis` | `\brode kruis\b` — adjacent only | `\brode\b` AND `\bkruis\b` — both present, any order |
| `kruis rode` | No match on "Rode Kruis" | Matches "Rode Kruis" |
| `"rode kruis"` | `\b"rode kruis"\b` — broken | `\brode kruis\b` — proper phrase match |
| `prorail` | `\bprorail\b` | `\bprorail\b` — identical, no change |

### 3. Quote/wildcard stripping before Typesense

In the 3 places where `search` is passed to Typesense as `"q": search`, use `parsed.raw` instead.

**Affected functions:**
- `_typesense_get_primary_keys_with_highlights()` — main search path
- `_typesense_search_recipient_keys()` — integraal search path
- `get_module_autocomplete()` — autocomplete path

```python
# Before:
params = {"q": search, ...}  # Quotes/wildcards sent verbatim

# After:
parsed = parse_search_query(search)
params = {"q": parsed.raw, ...}  # Clean input
```

## What we are NOT changing

| Item | Reason |
|---|---|
| `build_search_condition()` | PostgreSQL fallback path (<1% of searches), already broken for multi-word. Not a regression. |
| Autocomplete dropdown | Stays as single-entity picker. Multi-word enhancement is on Enter (committed search). |
| Relevance ranking | 3-tier scoring (exact → word boundary → secondary) unchanged. |
| "Ook in" column | Already works per-field via Typesense field-by-field search. |
| Frontend code | Zero changes needed. Parser is entirely backend. |
| Cross-field AND | Deferred. "defensie huisvesting" matching across different fields requires a different search architecture (multiple Typesense calls per word, result set intersection). Future enhancement. |

## Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Single-word regression | Low | `parse_search_query('prorail')` → `{words: ["prorail"]}` → same single `\b` check as today |
| Performance | None | `parse_search_query` is string splitting (microseconds). No extra Typesense calls. |
| Short common words ("van", "de") | Low | No stop-word filtering — these are meaningful in Dutch names (e.g., "Van Oord"). Typesense already handles common words. |
| Autocomplete confusion | None | No change to autocomplete behavior |
| Unmatched quotes | None | Parser strips unmatched quotes, falls back to word splitting |

## Scope

- **One file:** `backend/app/services/modules.py`
- **~40 lines of new code**
- **Zero frontend changes, zero API changes, zero migrations**

## Expert Panel

| Role | Validated |
|---|---|
| Search UX Lead | Google mental model: autocomplete = shortcut, Enter = full search |
| Information Retrieval Architect | Parse once internally, same signature, no refactor needed |
| Data Discovery Designer | Cross-field AND deferred — within-field multi-word is the safe win |
| Frontend Interaction Engineer | No frontend changes needed |
| Adversarial Strategist | Confirmed: single-word behavior identical, fallback path not a regression |
