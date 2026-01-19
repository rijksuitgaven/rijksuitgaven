---
name: wireframe
description: "Describe UI screens in structured text format. Use for designing interfaces without visual tools."
---

# Wireframe Mode

## Overview

Create detailed text-based wireframe descriptions for UI screens. Since we can't draw, we describe precisely using ASCII layouts, component lists, and interaction specs.

## The Process

**1. Understand the Screen**
Ask one question at a time:
- What screen/page are we designing?
- What's the primary user goal on this screen?
- What data needs to be displayed?
- What actions can users take?
- Any reference to current UI? (screenshots in `assets/`)

**2. Check Current UI (if exists)**
- Look at screenshots in `assets/screenshots/current-ui/`
- Note what works, what needs improvement
- Identify patterns to keep vs change

**3. Present Layout Options**
Propose 2-3 layout approaches:
- Describe each with ASCII sketch
- Note trade-offs
- Recommend one with reasoning

**4. Document Wireframe**
Write to `05-design/wireframes/XX-<screen-name>.md`:

```markdown
# Wireframe: [Screen Name]

**Date:** YYYY-MM-DD
**Status:** Draft | Review | Approved
**Related:** [links to requirements, user stories]

## Purpose
[What this screen does, user goal]

## Layout

### Desktop (1200px+)
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]     [Search Bar........................] [User] │
├─────────────────────────────────────────────────────────┤
│  [Module Tabs: Instrumenten | Apparaat | Inkoop | ...]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Filters ▾]                    Results: 1,234 found    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Ontvanger    │ Bedrag 2024 │ Module │ Actions  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ProRail B.V. │ €461,000,000│ Instr. │ [Detail] │   │
│  │ ...          │             │        │          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [< Prev]  Page 1 of 25  [Next >]                      │
└─────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
[Simplified layout description]

## Components

### 1. Search Bar
- **Type:** Text input with autocomplete
- **Placeholder:** "Zoek op ontvanger, regeling..."
- **Behavior:**
  - Autocomplete after 3 chars
  - Debounce 300ms
  - Show instant preview (top 5 results)

### 2. Filter Panel
- **Default state:** Collapsed
- **Toggle:** "Filters (X active)"
- **Contents:**
  - Year range slider (2016-2024)
  - Amount range (min/max inputs)
  - [Module-specific filters]
- **Behavior:** Real-time filtering or "Apply" button?

### 3. Results Table
[Component spec...]

## Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Search | Type 3+ chars | Show autocomplete |
| Filter | Change filter | Update results |
| Sort | Click column | Toggle asc/desc |
| Export | Click "Export" | Download CSV (500 rows) |

## States

- **Empty:** No search yet → Show prompt or popular searches
- **Loading:** Spinner in results area
- **No results:** "Geen resultaten. Probeer andere zoektermen."
- **Error:** "Er ging iets mis. Probeer opnieuw."

## Notes
[Design decisions, open questions]
```

**5. Validate**
Present wireframe in sections, ask:
- Does this layout make sense?
- Missing any components?
- Any interactions unclear?

## Key Principles

- **Mobile-aware** - Always consider mobile layout
- **State-complete** - Define empty, loading, error states
- **Interaction-clear** - What happens when user does X?
- **Reference requirements** - Link to search-requirements.md
- **Keep current UI patterns** - Don't change what works

## File Naming

`05-design/wireframes/01-search-results.md`
`05-design/wireframes/02-filter-panel.md`
`05-design/wireframes/03-recipient-detail.md`
