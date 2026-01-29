# Search Bar Consolidation Design

**Date:** 2026-01-29
**Status:** Approved
**Author:** Claude (Senior UX/UI Specialist) + Founder

---

## Problem

Two search bars exist:
1. **Header search bar** - Global autocomplete with Ontvangers + Zoektermen
2. **Filter panel search bar** - Simple text input for module filtering

This is redundant and confusing for users.

---

## Solution

**Consolidate to one search bar** in the filter panel with full autocomplete functionality.

### Design Decisions

| Decision | Choice |
|----------|--------|
| Location | Filter panel (remove from header) |
| Functionality | Global autocomplete (Ontvangers + Zoektermen) |
| Behavior | Search globally, filter current module (Option B) |
| Integraal page | Same behavior as other modules |
| "Ook in" badges | Clickable - navigate to that module with search |
| Clear search | X button in input field (standard pattern) |
| Dropdown close | Immediately on selection (performance is fast enough) |

---

## Autocomplete Dropdown Design

**Trigger:** User types 2+ characters

```
┌─────────────────────────────────────────────────┐
│ Ontvangers                                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ ProRail B.V.                                │ │
│ │ Ook in: Instrumenten · Inkoop · Publiek     │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Prorail Infra Services B.V.                 │ │
│ │ Ook in: Inkoop                              │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ Zoektermen                                      │
│   prorail subsidie                              │
│   prorail infrastructuur                        │
└─────────────────────────────────────────────────┘
```

### Interactions

| Action | Result |
|--------|--------|
| Click recipient name | Filter current module, dropdown closes |
| Click module badge (e.g., "Publiek") | Navigate to `/publiek?q=ProRail` |
| Arrow keys | Navigate dropdown items |
| Enter | Select highlighted item |
| Escape | Close dropdown |
| Click outside | Close dropdown |

---

## Search Input Design

**Location:** Filter panel, same row as Year dropdown and Filters button

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ ┌──────────┐ ┌────────┐ │
│ │ 🔍 Zoek op ontvanger, regeling...        ✕  │ │Alle jaren│ │Filters │ │
│ └─────────────────────────────────────────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### States

| State | Display |
|-------|---------|
| Empty | Placeholder: "Zoek op ontvanger, regeling..." |
| Typing | Text visible, X button appears, dropdown opens |
| Active search | Text visible, X button visible, dropdown closed |
| Clear (click X) | Input clears, table resets to random results |

---

## Behavior: Global Search with Local Focus

When user searches "ProRail" on `/instrumenten`:

1. Dropdown shows global results (ProRail found in Instrumenten, Inkoop, Publiek)
2. User selects "ProRail B.V." → stays on Instrumenten, table filters to ProRail
3. User sees "Ook in: Inkoop, Publiek" in table row
4. OR user clicks "Publiek" badge in dropdown → navigates to `/publiek?q=ProRail`

**Same behavior on all pages including Integraal.**

---

## Implementation

### Remove

- Search bar from header component (`header.tsx`)
- Can delete `search-bar.tsx` after migrating logic

### Modify

**`filter-panel.tsx`:**
- Replace simple text input with autocomplete search
- Move Typesense integration from `search-bar.tsx`
- Add dropdown rendering (Ontvangers + Zoektermen sections)
- Add "Ook in" badge click handler: `router.push('/{module}?q={search}')`
- Add keyboard navigation (arrow keys, Enter, Escape)

### Keep

- Typesense autocomplete API endpoint (`/api/v1/search/autocomplete`)
- All existing search logic (relocate, don't rewrite)

### No Changes

- Backend API
- Typesense configuration

---

## Success Criteria

- [ ] One search bar only (in filter panel)
- [ ] Header has no search bar
- [ ] Autocomplete shows Ontvangers + Zoektermen
- [ ] "Ook in" badges are clickable and navigate correctly
- [ ] X button clears search and resets to random results
- [ ] Same behavior on all module pages including Integraal
- [ ] Keyboard navigation works (arrows, Enter, Escape)
- [ ] Performance maintained (<50ms autocomplete)
