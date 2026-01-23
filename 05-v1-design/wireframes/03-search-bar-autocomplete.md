# Wireframe: Search Bar with Autocomplete

**Date:** 2026-01-23
**Status:** Approved
**Related:** [Search Requirements SR-002 to SR-006](../../02-requirements/search-requirements.md), [Main Search Page](./01-main-search-page.md)

---

## Purpose

The search bar is the primary way users find data. It provides:
- Instant autocomplete suggestions (after 3 characters)
- Preview of top results while typing
- Typo tolerance and "Did you mean" suggestions
- Keyboard navigation

---

## Layout

### Default State (Empty)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 Zoek op ontvanger, regeling, of bedrag...                            [⌘/]  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Focused State (No Input)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 |                                                                    [⌘/]  │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ RECENTE ZOEKOPDRACHTEN                                                          │
│                                                                                 │
│   🕐 prorail 2024                                                              │
│   🕐 rijkswaterstaat infrastructuur                                            │
│   🕐 ns reizigers                                                              │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ POPULAIR                                                                        │
│                                                                                 │
│   📈 ProRail B.V.                                                              │
│   📈 Rijkswaterstaat                                                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Typing State (< 3 characters)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 pr|                                                                  [⌘/]  │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Type minimaal 3 tekens om te zoeken...                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Autocomplete State (≥ 3 characters)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 pror|                                                                [⌘/]  │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ONTVANGERS                                                                      │
│                                                                                 │
│   ProRail B.V.                                              €461M (2024)       │
│   Prorail Holding B.V.                                       €23M (2024)       │
│   ProRail Stations B.V.                                      €12M (2024)       │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ REGELINGEN                                                                      │
│                                                                                 │
│   Programma Hoogfrequent Spoorvervoer (ProRail)                                │
│   ProRail Beheer en Onderhoud                                                  │
│                                                                                 │
│ ─────────────────────────────────────────────────────────────────────────────── │
│ RECENTE ZOEKOPDRACHTEN                                                          │
│                                                                                 │
│   🕐 prorail 2023                                                              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│   Druk Enter om alle resultaten te zien                            ↑↓ navigeer │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 prorail infrastructure|                                        [⟳ Laden]   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              ⟳ Zoeken...                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### No Results State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  🔍 proraill|                                                            [⌘/]  │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   Geen resultaten voor "proraill"                                              │
│                                                                                 │
│   Bedoelde u:                                                                  │
│   → ProRail B.V.                                                               │
│   → Prorail Holding B.V.                                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│ 🔍 Zoek...              [✕] │
├─────────────────────────────┤
│ ONTVANGERS                  │
│                             │
│ ProRail B.V.                │
│ €461M (2024)                │
│                             │
│ Prorail Holding B.V.        │
│ €23M (2024)                 │
│                             │
├─────────────────────────────┤
│ REGELINGEN                  │
│                             │
│ Programma Hoogfrequent...   │
│                             │
└─────────────────────────────┘
```

---

## Component Specifications

### Search Input

| Property | Value |
|----------|-------|
| Height | 48px |
| Border radius | 8px |
| Border | 1px solid #E0E0E0 |
| Border (focused) | 2px solid #E62D75 |
| Background | White (#FFFFFF) |
| Font size | 16px |
| Placeholder color | #999999 |
| Icon (left) | 🔍 magnifying glass |
| Shortcut hint (right) | ⌘/ (faded) |

### Autocomplete Dropdown

| Property | Value |
|----------|-------|
| Width | Same as input |
| Max height | 400px (scrollable) |
| Background | White (#FFFFFF) |
| Border | 1px solid #E0E0E0 |
| Box shadow | 0 4px 12px rgba(0,0,0,0.1) |
| Border radius | 0 0 8px 8px |

### Suggestion Item

| Property | Value |
|----------|-------|
| Height | 48px |
| Padding | 12px 16px |
| Hover background | #F5F5F5 |
| Selected background | #E8F4FD |
| Font size | 14px |
| Secondary text | 12px, #666666 |

---

## Behavior Specifications

### Timing

| Event | Timing |
|-------|--------|
| Debounce | 300ms after typing stops |
| Loading indicator | Show after 200ms |
| Autocomplete trigger | After 3 characters |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ↓ (Down) | Move to next suggestion |
| ↑ (Up) | Move to previous suggestion |
| Enter | Select highlighted suggestion OR execute search |
| Escape | Close dropdown, keep text |
| Tab | Move to next focusable element |
| ⌘/ or Ctrl+/ | Focus search bar (global) |

### Mouse Interaction

| Action | Result |
|--------|--------|
| Click input | Focus, show recent/popular |
| Click suggestion | Select and execute search |
| Click outside | Close dropdown |
| Hover suggestion | Highlight |

---

## Autocomplete Logic

### Suggestion Groups (in order)

1. **ONTVANGERS** (Recipients)
   - Max 5 suggestions
   - Show amount from most recent year
   - Exact matches first, then partial, then fuzzy

2. **REGELINGEN** (Regulations)
   - Max 3 suggestions
   - Only if query matches regulation names

3. **RECENTE ZOEKOPDRACHTEN** (Recent searches)
   - Max 3 suggestions
   - Only for logged-in users
   - Only if query matches previous searches

**Maximum total:** 8 suggestions (per SR-004)

### Matching Algorithm

| Match Type | Priority | Example |
|------------|----------|---------|
| Exact start | 1 (highest) | "pro" → "ProRail" |
| Word start | 2 | "rail" → "ProRail" |
| Contains | 3 | "orai" → "ProRail" |
| Fuzzy (typo) | 4 | "proraill" → "ProRail" |

### Typo Tolerance

- Allow up to 2 character edits (Levenshtein distance)
- Show "Bedoelde u:" for no exact matches
- Auto-correct obvious typos

---

## States

| State | Visual | Trigger |
|-------|--------|---------|
| Empty | Placeholder text | No input |
| Focused | Blue border, show recent | Click/Tab into |
| Typing (<3) | "Type minimaal 3 tekens" | 1-2 characters |
| Loading | Spinner icon | Waiting for response >200ms |
| Results | Suggestion dropdown | ≥3 chars, results found |
| No results | "Geen resultaten" + suggestions | ≥3 chars, no matches |
| Error | "Er ging iets mis" | API error |

---

## Search Execution

### When to Execute Full Search

| Trigger | Action |
|---------|--------|
| Press Enter (no selection) | Search with current text |
| Press Enter (with selection) | Navigate to selected item |
| Click suggestion | Navigate to selected item |

### Navigation After Selection

| Suggestion Type | Navigation |
|-----------------|------------|
| Ontvanger | Filter results to that recipient |
| Regeling | Filter results to that regulation |
| Recent search | Execute that search query |

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| ARIA role | combobox with listbox |
| aria-expanded | true when dropdown open |
| aria-activedescendant | ID of selected suggestion |
| aria-label | "Zoeken in Rijksuitgaven" |
| Screen reader | Announce number of suggestions |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Autocomplete response | <50ms |
| Full search response | <100ms |
| Debounce delay | 300ms |
| Max concurrent requests | 1 (cancel previous) |

---

## Design Tokens

**Reference:** `02-requirements/brand-identity.md` (authoritative source)

### Colors (Brand Identity)
| Token | Value | Usage |
|-------|-------|-------|
| Input border | #E0E0E0 | Default state |
| Input border focus | #E62D75 | Focused state (Pink) |
| Suggestion hover | #E1EAF2 | Hover background (Gray Light) |
| Suggestion selected | #8DBADC | Keyboard selected (Blue Light) |
| Section header | #436FA3 | "ONTVANGERS" etc. (Navy Medium) |
| Amount text | #436FA3 | Secondary info (Navy Medium) |

### Typography (Brand Identity)
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Input text | IBM Plex Sans Condensed | 16px | Regular | #0E3261 |
| Placeholder | IBM Plex Sans Condensed | 16px | Regular | #436FA3 |
| Suggestion primary | IBM Plex Sans Condensed | 14px | Medium | #0E3261 |
| Suggestion secondary | IBM Plex Sans Condensed | 12px | Regular | #436FA3 |
| Section header | IBM Plex Sans Condensed | 11px | Bold | #436FA3 |

---

## Open Questions

None - specifications align with requirements document.

---

## Next Steps

1. Review and approve
2. Proceed to Filter Panel wireframe

---

**Document Status:** Draft - Awaiting Review
