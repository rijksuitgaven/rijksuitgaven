# V2.5 Share Trigger UI — Design Document

**Date:** 2026-03-05
**Status:** Approved (brainstorm session)
**Related:** `docs/designs/v25-shared-view.html` (visual prototype from Mar 4)

---

## What the User Shares

The user shares **exactly what they see** — a pixel-perfect snapshot of their current module view state.

### Stored State (JSONB)

```json
{
  "module": "instrumenten",
  "search": "veehouderij",
  "filters": {
    "jaar": 2024,
    "min_bedrag": null,
    "max_bedrag": null,
    "regeling": ["Subsidieregeling natuur en landschap"]
  },
  "sort_by": "totaal",
  "sort_order": "desc",
  "columns": ["total", "year-2024", "year-2023", "year-2022"],
  "expanded": "Wageningen University",
  "expanded_grouping": "regeling",
  "expanded_columns": ["begrotingsnaam", "year-2024", "year-2023"]
}
```

### Included vs. Excluded

| Element | Stored | Reason |
|---------|--------|--------|
| Module | ✅ | Core context |
| Search query | ✅ | What the user searched for |
| All filters (jaar, bedrag, multiselect) | ✅ | Exact result set |
| Sort field + direction | ✅ | Row ordering |
| Main table columns | ✅ | What columns are visible |
| Expanded row (which row) | ✅ | Highlighted entity |
| Expanded grouping tab | ✅ | Detail view context |
| Expanded row columns | ✅ | Detail column selection |
| Page number | ❌ | Always starts at page 1 |
| Pinned rows | ❌ | Session-specific |

---

## Share Trigger UI

### Button Placement

"Deel" button in the **DataTable toolbar row**, left of the export button.

Order: `[Kolommen] [Deel] [Exporteer ▼]`

### Button States

1. **Disabled** (default view — no search, no filters):
   - Greyed out, `opacity-40 cursor-not-allowed`
   - Tooltip: "Zoek eerst om te delen"
   - Visible but non-interactive

2. **Active** (search or filters active):
   - Ghost button, navy text, matching toolbar style
   - Icon: `Share2` from lucide-react
   - Label: "Deel"

### Click Flow (One Click)

1. User clicks "Deel"
2. Button shows brief loading spinner (~200ms)
3. `POST /api/v1/share` sends current state
4. Backend creates `shared_links` row (or reuses existing token for same state)
5. Clipboard receives `https://rijksuitgaven.nl/s/{token}`
6. Toast: "Link gekopieerd!" (auto-dismiss ~3s)

### Deduplication

Before creating a new link, check if this user already has an active link with the same `module + search + filters + sort`. If yes, return the existing token. Columns and expanded state excluded from dedup — the link is reused.

---

## Shared View Behavior

### Non-subscribers (`/s/{token}`)

Read-only module page with frozen state:

- **Share context bar** (navy): "Gedeelde weergave — Instrumenten" + search/filter chips
- **Conversion strip** (pink-soft): "Nog X resultaten" + CTA
- **Data table**: 25 rows max, expanded row pre-opened, no pagination/sort/filter controls
- **Bottom upsell**: Feature checklist, signup CTA

### Subscribers (`/s/{token}`)

Redirect to full module page with state reconstructed:
`/instrumenten?q=veehouderij&sort=totaal&order=desc&cols=total,year-2024,...&expand=Wageningen+University&group=regeling`

Full interactive experience, all subscription features available.

---

## Implementation Phases

### Phase 1: H8 Lab Prototype
- `/team/lab/h8` — static shared view with hardcoded mock data
- Validates visual design before backend work

### Phase 2: Database + Backend
- Migration 075: `shared_links` table
- BFF routes: POST create, GET public, DELETE soft-delete

### Phase 3: Share Button
- "Deel" button in DataTable toolbar
- State capture, POST, clipboard copy, toast

### Phase 4: Public Shared View
- `/s/[token]` page — real version replacing H8
- Auth check → redirect or read-only view
- Middleware update for public `/s/` paths
